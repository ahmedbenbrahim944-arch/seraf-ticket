import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrintTicketRequest {
  ligne: string;
  reference: string;
  quantity: number;
  printDate?: string;
  codeFournisseur?: string;
  notes?: string;
  codeType?: string;
}

export interface PrintTicketResponse {
  success: boolean;
  message: string;
  data: {
    printJobId: number;
    tickets: Array<{
      fullProductNumber: string;
      codeImage: string;  // ✅ Changer de dataMatrix à codeImage
      codeType: string;
      printDate: string;
      progressiveNumber: string;
      ligne: string;
      reference: string;
      indice: string;
      codeFournisseur: string;
    }>;
    summary: {
      totalTickets: number;
      progressiveRange: string;
      productInfo: {
        ligne: string;
        reference: string;
        uniqueProductId: number;
      };
      codeType?: string;
      weekInfo?: {
        changed: boolean;
        currentWeek?: string;
        newWeek?: string;
        message?: string;
      };
    };
  };
}

export interface PrintConfig {
  printerName: string;
  labelWidth: number;
  labelHeight: number;
  gap: number;
  speed: number;
  density: number;
  lineWidth: number;
  lineHeight: number;
  lineGap: number;
  labelsPerLine: number;
}

export interface PrintPositionConfig {
  dataMatrixX: number;      // ✅ Renommé
  dataMatrixY: number;      // ✅ Renommé
  dataMatrixSize: number;
  referenceX: number;
  referenceY: number;
  referenceFontSize?: number;
  serialNumberX: number;
  serialNumberY: number;
  serialNumberFontSize?: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  status: string;
  isDefault: boolean;
  isTSC: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private apiUrl = 'http://localhost:3000';

  // CONSTANTES - TSC 203 DPI
  private readonly PIXELS_PER_MM = 8;

  // Configuration d'impression pour XT2
  private printConfig: PrintConfig = {
    printerName: 'TSC_TE210',
    labelWidth: 30,       // 30mm par étiquette
    labelHeight: 15,      // 15mm de hauteur
    gap: 4,               // 4mm entre étiquettes
    speed: 6,
    density: 8,
    lineWidth: 104,       // 104mm ligne complète
    lineHeight: 15,       // 15mm de hauteur
    lineGap: 4,           // 4mm entre lignes
    labelsPerLine: 3      // 3 étiquettes par ligne
  };

  // POSITIONS EN PIXELS pour XT2 - MODIFIÉES
  private printPositionConfig: PrintPositionConfig = {
    // QR Code - À gauche
    dataMatrixX: 8,              // 1mm = 8px
    dataMatrixY: 8,              // 1mm = 8px
    dataMatrixSize: 5,           // Taille TSPL (plus grand)
    
    // Référence produit - À droite du QR (ex: RA5398817)
    referenceX: 80,          // 10mm = 80px
    referenceY: 32,          // 4mm = 32px (centré verticalement)
    referenceFontSize: 3,
    
    // Numéro de série - SOUS LE QR CODE, centré horizontalement sur toute la largeur
    serialNumberX: 120,       // 15mm = 120px (centre de l'étiquette de 30mm)
    serialNumberY: 96,        // 12mm = 96px (sous le QR)
    serialNumberFontSize: 3  // Police plus petite pour s'adapter à la largeur
  };

  private lastPrintResult: any = null;
  private printedTickets: any[] = [];

  constructor(private http: HttpClient) {}

  /**
   * CONVERSION MM VERS PIXELS
   */
  private mmToPixels(mm: number): number {
    return Math.round(mm * this.PIXELS_PER_MM);
  }

  /**
   * IMPRESSION TSPL POUR FORMAT LIGNE CONTINUE XT2
   */
  printWithLineTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL ligne XT2 pour ${tickets.length} tickets`);
        console.log(`Format: ${this.printConfig.labelsPerLine} étiquettes par ligne de ${this.printConfig.lineWidth}mm`);
        
        const tsplCommands = this.generateLineTSPL(tickets, copies);
        console.log('Commandes TSPL générées:', tsplCommands);
        
        this.sendToPrintServer(tsplCommands).then(resolve).catch(reject);
      } catch (error) {
        console.error('Erreur lors de la génération TSPL ligne:', error);
        reject({ success: false, message: 'Erreur lors de la génération des commandes d\'impression' });
      }
    });
  }

  /**
   * GÉNÉRATION TSPL POUR FORMAT LIGNE CONTINUE XT2
   */
  private generateLineTSPL(tickets: any[], copies: number = 1): string {
    const { lineWidth, lineHeight, lineGap, speed, density, labelsPerLine } = this.printConfig;
    
    let commands = [
      `SIZE ${lineWidth} mm, ${lineHeight} mm`,
      `GAP ${lineGap} mm, 0`,
      `SPEED ${speed}`,
      `DENSITY ${density}`,
      `REFERENCE 0,0`,
      `SET TEAR ON`,
    ];

    const totalLines = Math.ceil(tickets.length / labelsPerLine);
    
    for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
      const startIndex = lineIndex * labelsPerLine;
      const endIndex = Math.min(startIndex + labelsPerLine, tickets.length);
      
      console.log(`Génération ligne ${lineIndex + 1}/${totalLines}: tickets ${startIndex + 1} à ${endIndex}`);
      
      commands.push('CLS');
      
      for (let i = startIndex; i < endIndex; i++) {
        const ticket = tickets[i];
        const positionInLine = i - startIndex;
        const offsetXMm = this.calculateTicketOffsetX(positionInLine);
        
        console.log(`  Étiquette ${positionInLine + 1}: offset ${offsetXMm}mm`);
        
        commands = commands.concat(this.generateSingleTicketCommands(ticket, offsetXMm));
      }
      
      commands.push(`PRINT ${copies},1`);
      
      if (lineIndex < totalLines - 1) {
        commands.push('');
      }
    }

    return commands.join('\n');
  }

  /**
   * GÉNÉRATION COMMANDES AVEC OFFSET - MODIFIÉ POUR NOUVEAU LAYOUT
   */
  private generateSingleTicketCommands(ticket: any, offsetXMm: number): string[] {
    const offsetXPx = this.mmToPixels(offsetXMm);
    const commands: string[] = [];

    // QR Code à gauche
    if (ticket.fullProductNumber) {
      const qrX = this.printPositionConfig.dataMatrixX + offsetXPx;
      const qrY = this.printPositionConfig.dataMatrixY;
      commands.push(`QRCODE ${qrX},${qrY},H,${this.printPositionConfig.dataMatrixSize},A,0,"${ticket.fullProductNumber}"`);
    }

    // Référence produit à droite du QR (ex: RA5398817)
    if (ticket.ligne && ticket.reference) {
      const textX = this.printPositionConfig.referenceX + offsetXPx;
      const textY = this.printPositionConfig.referenceY;
      const reference = `${ticket.ligne}${ticket.reference}`;
      
      // Texte en gras par duplication
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.referenceFontSize}",0,1,1,"${reference}"`);
      commands.push(`TEXT ${textX+1},${textY},"${this.printPositionConfig.referenceFontSize}",0,1,1,"${reference}"`);
    }

    // Numéro de série SOUS LE QR CODE, centré sur toute la largeur
    if (ticket.fullProductNumber) {
      // Position centrée horizontalement dans l'étiquette
      const textX = this.printPositionConfig.serialNumberX + offsetXPx;
      const textY = this.printPositionConfig.serialNumberY;
      
      // Utilisation de l'alignement centré (2 = centré)
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,2,"${ticket.fullProductNumber}"`);
    }

    return commands;
  }

  /**
   * CALCUL OFFSET POUR 3 TICKETS (30mm + 4mm gap)
   */
  private calculateTicketOffsetX(positionInLine: number): number {
    switch(positionInLine) {
      case 0: return 2;      // Premier ticket: 2mm du début
      case 1: return 36;     // Deuxième ticket: 2 + 30 + 4 = 36mm
      case 2: return 70;     // Troisième ticket: 2 + 30 + 4 + 30 + 4 = 70mm
      default: return 0;
    }
  }

  /**
   * GÉNÉRATION HTML POUR APERÇU - MODIFIÉ POUR NOUVEAU LAYOUT
   */
  private generatePrintableHTML(): string {
    const tickets = this.getPrintedTickets();
    const { lineWidth, lineHeight, labelWidth, labelHeight, labelsPerLine, gap } = this.printConfig;
    
    if (!tickets || tickets.length === 0) {
      return this.generateEmptyPrintHTML();
    }
    
    const totalLines = Math.ceil(tickets.length / labelsPerLine);
    let allLinesHTML = '';
    
    for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
      const startIndex = lineIndex * labelsPerLine;
      const endIndex = Math.min(startIndex + labelsPerLine, tickets.length);
      
      let lineHTML = '';
      
      for (let i = startIndex; i < endIndex; i++) {
        const ticket = tickets[i];
        lineHTML += this.generateSingleTicketHTML(ticket, i + 1);
      }
      
      const emptySlots = labelsPerLine - (endIndex - startIndex);
      for (let j = 0; j < emptySlots; j++) {
        lineHTML += '<div class="ticket-label empty-slot"></div>';
      }
      
      allLinesHTML += `<div class="ticket-line" data-line="${lineIndex + 1}">${lineHTML}</div>`;
    }
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquettes XT2 - Format Ligne 104x15mm</title>
          <style>
            @page { 
              size: ${lineWidth}mm ${lineHeight}mm;
              margin: 0mm; 
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .ticket-line {
              width: ${lineWidth}mm;
              height: ${lineHeight}mm;
              display: flex;
              justify-content: flex-start;
              align-items: center;
              gap: ${gap}mm;
              page-break-after: always;
              background: white;
              position: relative;
            }
            
            .ticket-label {
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              position: relative;
              background: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
              padding: 1mm;
            }
            
            .ticket-label.empty-slot {
              background: transparent;
            }
            
            .top-section {
              display: flex;
              width: 100%;
              align-items: center;
              margin-bottom: 1mm;
            }
            
            .qr-section {
              width: 9mm;
              height: 9mm;
              flex-shrink: 0;
            }
            
            .qr-code { 
              width: 100%;
              height: 100%;
              display: block;
            }
            
            .reference-section {
              flex-grow: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              
            }
            
            .reference-code {
              font-size: 8px;
              font-weight: bold;
              color: #000;
              line-height: 1;
            }
            
            .serial-section {
              width: 100%;
              text-align: center;
              margin-top: auto;
            }
            
            .serial-number { 
              font-size: 10px;
              font-weight: bold;
              font-weight: normal;
              color: #000;
              line-height: 1;
              letter-spacing: 0.3px;
            }
            
            @media print {
              body { 
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            
            @media screen {
              body {
                padding: 10px;
                background: #f5f5f5;
              }
              
              .ticket-line {
                margin-bottom: 5mm;
                border: 1px solid #ccc;
              }
              
              .ticket-label {
                border: 1px dashed #999;
              }
            }
          </style>
        </head>
        <body>
          ${allLinesHTML}
        </body>
      </html>
    `;
  }

  private generateSingleTicketHTML(ticket: any, ticketNumber: number): string {
    const reference = `${ticket.reference || ''}`;

    const codeImage = ticket.codeImage || ticket.qrCode || '';
    
    return `
      <div class="ticket-label" data-ticket="${ticketNumber}">
        <div class="top-section">
          <div class="qr-section">
            <img src="${codeImage}"  class="qr-code">
          </div>
          <div class="reference-section">
            <div class="reference-code">${reference}</div>
          </div>
        </div>
        <div class="serial-section">
          <div class="serial-number">${ticket.fullProductNumber || ''}</div>
        </div>
      </div>
    `;
  }

  private generateEmptyPrintHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Aucune étiquette à imprimer</title></head>
        <body style="padding: 20px; text-align: center; color: #666;">
          Aucune étiquette à imprimer
        </body>
      </html>
    `;
  }

  /**
   * ENVOI AU SERVEUR D'IMPRESSION
   */
  private sendToPrintServer(tsplCommands: string): Promise<{ success: boolean; message: string }> {
    const printData = {
      tsplCommands: tsplCommands,
      printerName: this.printConfig.printerName
    };

    return new Promise((resolve, reject) => {
      this.http.post<{ success: boolean; message: string; filePath?: string }>(`${this.apiUrl}/print/direct`, printData).subscribe({
        next: (response) => {
          console.log('Réponse du serveur d\'impression:', response);
          
          if (response.success) {
            resolve({ success: true, message: response.message });
          } else {
            if (response.filePath) {
              console.log(`Fichier sauvegardé: ${response.filePath}`);
            }
            resolve({ success: false, message: response.message });
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi à l\'imprimante:', error);
          const errorMessage = error.error?.message || 'Erreur de communication avec l\'imprimante';
          this.fallbackPrint(tsplCommands);
          reject({ success: false, message: errorMessage });
        }
      });
    });
  }

  private fallbackPrint(tsplCommands: string): void {
    console.log('Fallback: ouverture du dialogue d\'impression');
    
    const printWindow = window.open('', '_blank', 'width=0,height=0');
    if (printWindow) {
      const htmlContent = this.generatePrintableHTML();
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      };
    }
  }

  /**
   * MÉTHODES DE CONFIGURATION
   */
  updatePrintConfig(config: Partial<PrintConfig>): void {
    this.printConfig = { ...this.printConfig, ...config };
  }

  getPrintConfig(): PrintConfig {
    return { ...this.printConfig };
  }

  updatePrintPosition(config: Partial<PrintPositionConfig>): void {
    this.printPositionConfig = { ...this.printPositionConfig, ...config };
  }

  getPrintPositionConfig(): PrintPositionConfig {
    return { ...this.printPositionConfig };
  }

  /**
   * MÉTHODES UTILITAIRES
   */
  setLastPrintResult(result: any): void {
    this.lastPrintResult = result;
    this.printedTickets = result?.data?.tickets || [];
  }

  getLastPrintResult(): any {
    return this.lastPrintResult;
  }

  getPrintedTickets(): any[] {
    return this.printedTickets;
  }

  /**
   * MÉTHODES API
   */
  printTickets(request: PrintTicketRequest): Observable<PrintTicketResponse> {
    return this.http.post<PrintTicketResponse>(`${this.apiUrl}/print/tickets`, request);
  }

  getAvailablePrinters(): Observable<{ success: boolean; data: PrinterInfo[] }> {
    return this.http.get<{ success: boolean; data: PrinterInfo[] }>(`${this.apiUrl}/print/printers`);
  }

  testPrinter(printerName?: string): Observable<{ success: boolean; message: string }> {
    const body = printerName ? { printerName } : {};
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/print/test`, body);
  }

  getAvailableLignes(): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/print/lignes`);
  }

  getReferencesByLigne(ligne: string): Observable<{ success: boolean; data: string[] }> {
    return this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/print/lignes/${ligne}/references`);
  }

  getProductDetails(ligne: string, reference: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/print/product-details/${ligne}/${reference}`);
  }
previewProductNumber(
  ligne: string,
  reference: string,
  codeFournisseur?: string,
  printDate?: string
): Observable<{
  success: boolean;
  data: {
    fullProductNumber: string;
    codeFournisseur: string;
    nextProgressiveNumber: string;
    annee: string;
    semaine: string;
    weekWillChange: boolean;
    currentWeek: string;
    newWeek: string | null;
    warning: string | null;
  };
}> {
  let params = new HttpParams();
  if (printDate) params = params.set('printDate', printDate);
  if (codeFournisseur) params = params.set('codeFournisseur', codeFournisseur);

  return this.http.get<{
    success: boolean;
    data: {
      fullProductNumber: string;
      codeFournisseur: string;
      nextProgressiveNumber: string;
      annee: string;
      semaine: string;
      weekWillChange: boolean;
      currentWeek: string;
      newWeek: string | null;
      warning: string | null;
    };
  }>(
    `${this.apiUrl}/print/preview/${ligne}/${reference}`,
    { params }
  );
}}