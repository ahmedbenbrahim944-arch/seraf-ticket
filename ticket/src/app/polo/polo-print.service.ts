import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrintTicketRequest {
  ligne: string;
  reference: string;
  champS: string;
  quantity: number;
  matricule: string;
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
       codeImage: string;      // ✅ CHANGÉ de "qrCode" à "codeImage" (générique)
      codeType: string;       // ✅ AJOUTÉ : Type du code (QRCODE, DATAMATRIX)
      matricule: string;
      printDate: string;
      progressiveNumber: string;
      ligne: string;
      reference: string;
      champS: string;
      indice: string;
      codeFournisseur: string;
    }>;
    summary: {
      totalTickets: number;
      progressiveRange: string;
      productInfo: {
        ligne: string;
        reference: string;
        champS: string;
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
  qrCodeX: number;
  qrCodeY: number;
  qrCodeSize: number;
  serialNumberX: number;
  serialNumberY: number;
  serialNumberFontSize?: number;
  productCodeX: number;
  productCodeY: number;
  productCodeFontSize?: number;
  champSX: number;
  champSY: number;
  champSFontSize?: number;
  matriculeX: number;
  matriculeY: number;
  matriculeFontSize?: number;
  dateX?: number;
  dateY?: number;
  dateFontSize?: number;
  fullProductNumberX: number;
  fullProductNumberY: number;
  fullProductNumberFontSize?: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
  status: string;
  isTSC: boolean;
}

export interface DirectPrintConfig {
  labelsPerLine: number;
  labelGap: number;
  showPreviewBorders: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PoloPrintService {
  private apiUrl = 'http://localhost:3000';

  // CONSTANTES - TSC 203 DPI pour tickets Polo
  private readonly PIXELS_PER_MM = 8; // 8 dots/mm pour imprimantes TSC 203 DPI

  // NOUVELLE CONFIGURATION - 4 tickets par ligne pour Polo
  private printConfig: PrintConfig = {
    printerName: 'TSC_TE210',
    labelWidth: 15,       // 17mm par étiquette Polo
    labelHeight: 10,       // 7mm de hauteur Polo
    gap: 3,               // 2mm entre étiquettes
    speed: 6,
    density: 2,
    lineWidth: 75,        // Largeur totale de la ligne
    lineHeight: 14,       // Hauteur totale de la ligne
    lineGap: 3,           // Espace entre lignes
    labelsPerLine: 4      // 4 étiquettes par ligne
  };

  // POSITIONS EN PIXELS - Adaptées pour le format 4 tickets Polo
  private printPositionConfig: PrintPositionConfig = {
    // QR Code - Position optimisée
    qrCodeX: 2,
    qrCodeY: 2,
    qrCodeSize: 2,
    
    // Numéro progressif
    serialNumberX: 50,
    serialNumberY: 4,
    serialNumberFontSize: 2,
    
    // ChampS (S400, S600, S630)
    champSX: 50,
    champSY: 18,
    champSFontSize: 1,

    // Matricule avec préfixe RQ
    matriculeX: 50,
    matriculeY: 32,
    matriculeFontSize: 1,

    // Code produit
    productCodeX: 50,
    productCodeY: 46,
    productCodeFontSize: 1,

    // Date
    dateX: 2,
    dateY: 50,
    dateFontSize: 1,

    // Code produit complet
    fullProductNumberX: 2,
    fullProductNumberY: 50,
    fullProductNumberFontSize: 1
  };

  // Configuration pour impression directe
  private directPrintConfig: DirectPrintConfig = {
    labelsPerLine: 4,
    labelGap: 2,
    showPreviewBorders: true
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

  private pixelsToMm(pixels: number): number {
    return Math.round((pixels / this.PIXELS_PER_MM) * 100) / 100;
  }

  /**
   * IMPRESSION TSPL POUR FORMAT LIGNE CONTINUE - 4 TICKETS POLO PAR LIGNE
   */
  printWithLineTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL ligne pour ${tickets.length} tickets Polo (4 par ligne)`);
        console.log(`Format: ${this.printConfig.labelsPerLine} étiquettes par ligne de ${this.printConfig.lineWidth}mm`);
        console.log(`Résolution: ${this.PIXELS_PER_MM} pixels/mm`);
        
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
   * GÉNÉRATION TSPL POUR FORMAT LIGNE CONTINUE - 4 TICKETS POLO
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
      `DIRECTION 1`
    ];

    const totalLines = Math.ceil(tickets.length / labelsPerLine);
    
    for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
      const startIndex = lineIndex * labelsPerLine;
      const endIndex = Math.min(startIndex + labelsPerLine, tickets.length);
      
      console.log(`Génération ligne ${lineIndex + 1}/${totalLines}: tickets ${startIndex + 1} à ${endIndex}`);
      
      commands.push('CLS');
      
      // Placer chaque étiquette sur la ligne avec calcul précis
      for (let i = startIndex; i < endIndex; i++) {
        const ticket = tickets[i];
        const positionInLine = i - startIndex;
        
        const offsetXMm = this.calculateTicketOffsetX(positionInLine);
        
        console.log(`  Étiquette Polo ${positionInLine + 1}: offset ${offsetXMm}mm`);
        
        commands = commands.concat(this.generateSingleTicketCommandsWithPixelOffset(ticket, offsetXMm));
      }
      
      commands.push(`PRINT ${copies},1`);
      
      if (lineIndex < totalLines - 1) {
        commands.push('');
      }
    }

    return commands.join('\n');
  }

  /**
   * CALCUL OFFSET X POUR 4 TICKETS POLO PAR LIGNE
   */
  private calculateTicketOffsetX(positionInLine: number): number {
    switch(positionInLine) {
      case 0: return 1;     // Premier ticket: 1mm du début
      case 1: return 20;    // Deuxième ticket: 1 + 17 + 2 = 20mm
      case 2: return 39;    // Troisième ticket: 1 + 17 + 2 + 17 + 2 = 39mm
      case 3: return 58;    // Quatrième ticket: 1 + 17 + 2 + 17 + 2 + 17 + 2 = 58mm
      default: return 0;
    }
  }

  /**
   * GÉNÉRATION COMMANDES AVEC OFFSET EN PIXELS POUR POLO
   */
  private generateSingleTicketCommandsWithPixelOffset(ticket: any, offsetXMm: number): string[] {
  const offsetXPx = this.mmToPixels(offsetXMm);
  const commands: string[] = [];

  // ✅ QR Code - DÉJÀ BON (QRCODE en TSPL)
  if (ticket.fullProductNumber) {
    const qrX = this.printPositionConfig.qrCodeX + offsetXPx;
    const qrY = this.printPositionConfig.qrCodeY;
    
    // Format TSPL pour QR Code
    // QRCODE x,y,level,size,rotation,model"data"
    // level : L, M, Q, H (correction d'erreur)
    // size : 2-8 (taille du module)
    commands.push(`QRCODE ${qrX},${qrY},H,${this.printPositionConfig.qrCodeSize},A,0,"${ticket.fullProductNumber}"`);
  }

  // Reste inchangé...
  if (ticket.progressiveNumber) {
    const textX = this.printPositionConfig.serialNumberX + offsetXPx;
    const textY = this.printPositionConfig.serialNumberY;
    commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"${ticket.progressiveNumber}"`);
  }

  if (ticket.champS) {
    const textX = this.printPositionConfig.champSX + offsetXPx;
    const textY = this.printPositionConfig.champSY;
    commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.champSFontSize}",0,1,1,"${ticket.champS}"`);
  }

  if (ticket.matricule) {
    const textX = this.printPositionConfig.matriculeX + offsetXPx;
    const textY = this.printPositionConfig.matriculeY;
    commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.matriculeFontSize}",0,1,1,"${ticket.matricule}"`);
  }

  if (ticket.ligne && ticket.reference) {
    const textX = this.printPositionConfig.productCodeX + offsetXPx;
    const textY = this.printPositionConfig.productCodeY;
    const productCode = `${ticket.ligne}-${ticket.reference}`;
    commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.productCodeFontSize}",0,1,1,"${productCode}"`);
  }

  return commands;
}

  /**
   * MÉTHODE ALTERNATIVE - IMPRESSION INDIVIDUELLE POLO
   */
  printSuccessiveTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL successive pour ${tickets.length} tickets Polo (17x7mm)`);
        
        const tsplCommands = this.generateSuccessiveTSPL(tickets, copies);
        console.log('Commandes TSPL générées:', tsplCommands);
        
        this.sendToPrintServer(tsplCommands).then(resolve).catch(reject);
      } catch (error) {
        console.error('Erreur lors de la génération TSPL:', error);
        reject({ success: false, message: 'Erreur lors de la génération des commandes d\'impression' });
      }
    });
  }

  /**
   * GÉNÉRATION TSPL - IMPRESSION SUCCESSIVE (UN PAR UN)
   */
  private generateSuccessiveTSPL(tickets: any[], copies: number = 1): string {
  const { labelWidth, labelHeight, gap, speed, density } = this.printConfig;
  
  let commands = [
    `SIZE ${labelWidth} mm, ${labelHeight} mm`,
    `GAP ${gap} mm, 0`,
    `SPEED ${speed}`,
    `DENSITY ${density}`,
    `REFERENCE 0,0`,
    `SET TEAR ON`,
    `DIRECTION 1`
  ];

  tickets.forEach((ticket, index) => {
    console.log(`Génération ticket Polo ${index + 1}/${tickets.length}:`, ticket.progressiveNumber);
    
    commands.push('CLS');
    
    // ✅ QR Code - Déjà au format QRCODE (pas DATAMATRIX)
    if (ticket.fullProductNumber) {
      const qrX = this.printPositionConfig.qrCodeX;
      const qrY = this.printPositionConfig.qrCodeY;
      // Format TSPL : QRCODE x,y,level,size,rotation,model"data"
      commands.push(`QRCODE ${qrX},${qrY},H,4,A,0,"${ticket.fullProductNumber}"`);
    }
    
    // Reste du code inchangé...
    if (ticket.progressiveNumber) {
      const textX = this.printPositionConfig.serialNumberX;
      const textY = this.printPositionConfig.serialNumberY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"${ticket.progressiveNumber}"`);
    }
    
    if (ticket.champS) {
      const textX = this.printPositionConfig.champSX;
      const textY = this.printPositionConfig.champSY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.champSFontSize}",0,1,1,"${ticket.champS}"`);
    }
    
    if (ticket.matricule) {
      const textX = this.printPositionConfig.matriculeX;
      const textY = this.printPositionConfig.matriculeY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.matriculeFontSize}",0,1,1,"${ticket.matricule}"`);
    }
    
    if (ticket.ligne && ticket.reference) {
      const textX = this.printPositionConfig.productCodeX;
      const textY = this.printPositionConfig.productCodeY;
      const productCode = `${ticket.ligne}-${ticket.reference}`;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.productCodeFontSize}",0,1,1,"${productCode}"`);
    }
    
    commands.push(`PRINT ${copies},1`);
    
    if (index < tickets.length - 1) {
      commands.push('');
    }
  });

  return commands.join('\n');
}

  private formatPrintDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  }

  /**
   * DÉBOGAGE POSITIONS EN PIXELS POUR POLO
   */
  debugPixelPositions(tickets: any[]): void {
    console.group('DÉBOGAGE POSITIONS PIXELS - FORMAT 4 TICKETS POLO');
    console.log(`Résolution: ${this.PIXELS_PER_MM} pixels/mm`);
    console.log(`Étiquette: ${this.mmToPixels(this.printConfig.labelWidth)}x${this.mmToPixels(this.printConfig.labelHeight)}px`);
    console.log(`Gap: ${this.mmToPixels(this.printConfig.gap)}px`);
    
    const totalLines = Math.ceil(tickets.length / this.printConfig.labelsPerLine);
    
    for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
      const startIndex = lineIndex * this.printConfig.labelsPerLine;
      const endIndex = Math.min(startIndex + this.printConfig.labelsPerLine, tickets.length);
      
      console.group(`Ligne ${lineIndex + 1}`);
      
      for (let i = startIndex; i < endIndex; i++) {
        const positionInLine = i - startIndex;
        const offsetXMm = this.calculateTicketOffsetX(positionInLine);
        const offsetXPx = this.mmToPixels(offsetXMm);
        
        console.group(`Ticket Polo ${positionInLine + 1}`);
        console.log(`Offset: ${offsetXMm}mm = ${offsetXPx}px`);
        console.log(`QR Code: (${this.printPositionConfig.qrCodeX + offsetXPx}, ${this.printPositionConfig.qrCodeY})px`);
        console.log(`ChampS: (${this.printPositionConfig.champSX + offsetXPx}, ${this.printPositionConfig.champSY})px`);
        console.log(`Matricule: (${this.printPositionConfig.matriculeX + offsetXPx}, ${this.printPositionConfig.matriculeY})px`);
        console.log(`Numéro: (${this.printPositionConfig.serialNumberX + offsetXPx}, ${this.printPositionConfig.serialNumberY})px`);
        console.groupEnd();
      }
      
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * TEST AVEC DÉBOGAGE PIXELS POUR POLO
   */
  testLinePrintWithPixelDebug(): Promise<{ success: boolean; message: string }> {
    const testTickets = [
      {
        fullProductNumber: "POLO123456789M001",
        progressiveNumber: "1001",
        ligne: "POLO",
        reference: "123456",
        champS: "S400",
        matricule: "RQM001",
        printDate: new Date().toISOString()
      },
      {
        fullProductNumber: "POLO123456789M002",
        progressiveNumber: "1002",
        ligne: "POLO",
        reference: "123456",
        champS: "S400",
        matricule: "RQM002",
        printDate: new Date().toISOString()
      },
      {
        fullProductNumber: "POLO123456789M003",
        progressiveNumber: "1003",
        ligne: "POLO",
        reference: "123456",
        champS: "S600",
        matricule: "RQM003",
        printDate: new Date().toISOString()
      },
      {
        fullProductNumber: "POLO123456789M004",
        progressiveNumber: "1004",
        ligne: "POLO",
        reference: "123456",
        champS: "S630",
        matricule: "RQM004",
        printDate: new Date().toISOString()
      }
    ];
    
    console.log('Test impression ligne Polo avec positions en pixels (4 tickets)');
    this.debugPixelPositions(testTickets);
    
    return this.printWithLineTSPL(testTickets, 1);
  }

  /**
   * GÉNÉRATION HTML POUR APERÇU POLO
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
          <title>Étiquettes Polo - Format Ligne 75x10mm (4 tickets)</title>
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
            
            .ticket-line:last-child {
              page-break-after: avoid;
            }
            
            .ticket-label {
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              position: relative;
              background: white;
              display: flex;
              align-items: center;
              flex-shrink: 0;
              overflow: hidden;
              border: 1px solid #ddd;
            }
            
            .ticket-label.empty-slot {
              background: transparent;
              border: 1px dashed #ccc;
            }
            
            .qr-section {
              width: 7mm;
              height: 7mm;
              flex-shrink: 0;
              margin: 0.5mm;
            }
            
            .qr-code { 
              width: 100%;
              height: 100%;
              display: block;
            }
            
            .info-section {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100%;
              padding: 0.5mm;
            }
            
            .ticket-champS {  
              font-size: 8px;
              font-weight: bold;
              color: #000;
              line-height: 1;
              margin-bottom: 0.5mm;
            }
            
            .ticket-matricule {
              font-size: 8px;
              color: #000;
              font-weight: bold;
              line-height: 1;
              margin-bottom: 0.5mm;
            }
            
            .ticket-progressive {
              font-size: 7px;
              color: #000;
              line-height: 1;
            }
            
            @media print {
              body { 
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .ticket-line {
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .ticket-label {
                border: none !important;
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
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  // ✅ Utiliser codeImage au lieu de qrCode
  const codeImage = ticket.codeImage || ticket.qrCode || ''; // Rétro-compatible
  
  return `
    <div class="ticket-label" data-ticket="${ticketNumber}">
      <div class="qr-section">
        <img src="${codeImage}" alt="QR-${ticket.progressiveNumber}" class="qr-code">
      </div>
      <div class="info-section">
        <div class="ticket-champS">${ticket.champS || ''}</div>
        <div class="ticket-matricule">${ticket.matricule}</div>
      </div>
    </div>
  `;
}

  private generateEmptyPrintHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aucun ticket Polo à imprimer</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
            }
          </style>
        </head>
        <body>
          <h1>Aucun ticket Polo à imprimer</h1>
          <p>Veuillez générer des tickets avant d'imprimer.</p>
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
            this.showSuccessMessage(response.message);
            resolve({ success: true, message: response.message });
          } else {
            this.showWarningMessage(response.message);
            if (response.filePath) {
              this.showWarningMessage(`Fichier sauvegardé: ${response.filePath}`);
            }
            resolve({ success: false, message: response.message });
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi à l\'imprimante:', error);
          const errorMessage = error.error?.message || 'Erreur de communication avec l\'imprimante';
          this.showErrorMessage(errorMessage);
          
          this.fallbackPrint();
          reject({ success: false, message: errorMessage });
        }
      });
    });
  }

  private fallbackPrint(): void {
    console.log('Fallback: ouverture du dialogue d\'impression HTML');
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const htmlContent = this.generatePrintableHTML();
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          this.showWarningMessage('Impression HTML fallback activée. Utilisez le dialogue d\'impression du navigateur.');
        }, 1000);
      };
    } else {
      this.showErrorMessage('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les bloqueurs de popup.');
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

  updatePrintPositions(config: Partial<PrintPositionConfig>): void {
    this.printPositionConfig = { ...this.printPositionConfig, ...config };
  }

  getPrintPositions(): PrintPositionConfig {
    return { ...this.printPositionConfig };
  }

  updateDirectPrintConfig(config: Partial<DirectPrintConfig>): void {
    this.directPrintConfig = { ...this.directPrintConfig, ...config };
  }

  getDirectPrintConfig(): DirectPrintConfig {
    return { ...this.directPrintConfig };
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

  clearPrintResults(): void {
    this.lastPrintResult = null;
    this.printedTickets = [];
  }

  previewTSPLCommands(tickets: any[], copies: number = 1): string {
    return this.generateLineTSPL(tickets, copies);
  }

  debugPrintSettings(): void {
    console.group('Configuration d\'impression Polo - FORMAT 4 TICKETS');
    console.log('Résolution:', `${this.PIXELS_PER_MM} pixels/mm`);
    console.log('Configuration de base:', this.printConfig);
    console.log('Positions en pixels:', this.printPositionConfig);
    console.log(`Format ligne: ${this.printConfig.lineWidth}x${this.printConfig.lineHeight}mm`);
    console.log(`Étiquette: ${this.printConfig.labelWidth}x${this.printConfig.labelHeight}mm`);
    console.log(`En pixels: ${this.mmToPixels(this.printConfig.labelWidth)}x${this.mmToPixels(this.printConfig.labelHeight)}px`);
    console.groupEnd();
  }

  private showSuccessMessage(message: string): void {
    console.log('SUCCESS:', message);
  }

  private showWarningMessage(message: string): void {
    console.log('WARNING:', message);
  }

  private showErrorMessage(message: string): void {
    console.error('ERROR:', message);
  }

  /**
   * MÉTHODES API EXISTANTES
   */
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

  printTickets(request: PrintTicketRequest): Observable<PrintTicketResponse> {
    return this.http.post<PrintTicketResponse>(`${this.apiUrl}/print/tickets`, request);
  }

  getPrintHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/print/history`);
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
  }
}