import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrintTicketRequest {
  ligne: string;
  reference: string;
  quantity: number;
  matricule: string;
  printDate?: string;
  codeFournisseur?: string;
  notes?: string;
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
      matricule: string;
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
  dataMatrixSize: number;   // ✅ Renommé
  serialNumberX: number;
  serialNumberY: number;
  serialNumberFontSize?: number;
  productCodeX: number;
  productCodeY: number;
  productCodeFontSize?: number;
  matriculeX?: number;
  matriculeY?: number;
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
  status: string;
  isDefault: boolean;
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
export class PrintService {
  private apiUrl = 'http://localhost:3000';

  // CONSTANTES DE CONVERSION - TSC 203 DPI
  private readonly PIXELS_PER_MM = 8; // 8 dots/mm pour imprimantes TSC 203 DPI

  // NOUVELLE CONFIGURATION - 4 tickets par ligne, 104mm total
  private printConfig: PrintConfig = {
    printerName: 'TSC_TE210',
    labelWidth: 15,       // 15mm par étiquette
    labelHeight: 10,      // 10mm de hauteur
    gap:2.8,               // 2mm entre étiquettes
    speed: 6,
    density: 8,
    lineWidth: 75,       // 104mm ligne complète (4 tickets × 15mm + 3 espaces × 2mm = 60 + 6 = 66mm + marges)
    lineHeight: 14,       // 14mm de hauteur totale
    lineGap: 50,           // 4mm entre lignes
    labelsPerLine: 4      // 4 étiquettes par ligne
  };

  // POSITIONS EN PIXELS - Adaptées pour le nouveau format
  private printPositionConfig: PrintPositionConfig = {
    // QR Code - Position centrale
    dataMatrixX: 2,              // Très près du bord gauche
    dataMatrixY: 2,              
  dataMatrixSize: 3,           // Taille moyenne du QR
  
  // Numéro progressif - En haut à droite du QR
  serialNumberX: 48,       // À droite (6mm = 48px)
  serialNumberY: 4,        // En haut
  serialNumberFontSize: 2, // Police moyenne
  
  // Date - Sous le numéro progressif
  dateX: 48,               // Aligné avec le numéro
  dateY: 20,               // 2.5mm plus bas
  dateFontSize: 1,         // Police plus petite
  
  // Code produit complet - Tout en bas, centré
  fullProductNumberX: 2,   // Près du bord gauche
  fullProductNumberY: 60,  // Tout en bas (7.5mm = 60px)
  fullProductNumberFontSize: 1, // Police petite pour tenir
  
  // Code produit (non utilisé sur l'image)
  productCodeX: 40,
  productCodeY: 16,
  productCodeFontSize: 1,
  
  // Matricule (non utilisé sur l'image)
  matriculeX: 40,
  matriculeY: 28,
  matriculeFontSize: 1
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
   * IMPRESSION TSPL POUR FORMAT LIGNE CONTINUE - 4 TICKETS PAR LIGNE
   */
  printWithLineTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL ligne pour ${tickets.length} tickets (4 par ligne)`);
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
   * GÉNÉRATION TSPL POUR FORMAT LIGNE CONTINUE - 4 TICKETS
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
      `DIRECTION 0`
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
        
        console.log(`  Étiquette ${positionInLine + 1}: offset ${offsetXMm}mm`);
        
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
   * CALCUL OFFSET X POUR 4 TICKETS PAR LIGNE
   */
  private calculateTicketOffsetX(positionInLine: number): number {
    switch(positionInLine) {
      case 0: return 1;     // Premier ticket: 1mm du début
      case 1: return 18;    // Deuxième ticket: 1 + 15 + 2 = 18mm
      case 2: return 35;    // Troisième ticket: 1 + 15 + 2 + 15 + 2 = 35mm
      case 3: return 52;    // Quatrième ticket: 1 + 15 + 2 + 15 + 2 + 15 + 2 = 52mm
      default: return 0;
    }
  }

  /**
   * GÉNÉRATION COMMANDES AVEC OFFSET EN PIXELS
   */
  private generateSingleTicketCommandsWithPixelOffset(ticket: any, offsetXMm: number): string[] {
  const offsetXPx = this.mmToPixels(offsetXMm);
  const commands: string[] = [];

  // QR Code avec offset en pixels
  if (ticket.fullProductNumber) {
    const qrX = this.printPositionConfig.dataMatrixX + offsetXPx;
    const qrY = this.printPositionConfig.dataMatrixY;
    commands.push(`QRCODE ${qrX},${qrY},H,${this.printPositionConfig.dataMatrixSize},A,0,"${ticket.fullProductNumber}"`);
  }

  // Numéro progressif - en haut à droite
  if (ticket.progressiveNumber) {
    const textX = this.printPositionConfig.serialNumberX + offsetXPx;
    const textY = this.printPositionConfig.serialNumberY;
    commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"${ticket.progressiveNumber}"`);
  }

  // Date - sous le numéro progressif
  if (ticket.printDate) {
    const formattedDate = this.formatPrintDate(ticket.printDate);
    const textY = this.printPositionConfig.dateY;
    commands.push(`TEXT ,${textY},"${this.printPositionConfig.dateFontSize}",0,1,1,"${formattedDate}"`);
  }

  // Code produit complet - tout en bas
  if (ticket.fullProductNumber) {
    const textX = this.printPositionConfig.fullProductNumberX + offsetXPx;
    const textY = this.printPositionConfig.fullProductNumberY;
    commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.fullProductNumberFontSize}",0,1,1,"${ticket.fullProductNumber}"`);
  }

  return commands;
}

  /**
   * MÉTHODE ALTERNATIVE - IMPRESSION INDIVIDUELLE
   */
  printWithTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL pour ${tickets.length} tickets individuels`);
        
        const tsplCommands = this.generateIndividualTicketsTSPL(tickets, copies);
        console.log('Commandes TSPL générées:', tsplCommands);
        
        this.sendToPrintServer(tsplCommands).then(resolve).catch(reject);
      } catch (error) {
        console.error('Erreur lors de la génération TSPL:', error);
        reject({ success: false, message: 'Erreur lors de la génération des commandes d\'impression' });
      }
    });
  }

  /**
   * GÉNÉRATION TSPL - TICKETS INDIVIDUELS
   */
  private generateIndividualTicketsTSPL(tickets: any[], copies: number = 1): string {
    const { labelWidth, labelHeight, gap, speed, density } = this.printConfig;
    
    let commands = [
      `SIZE ${labelWidth} mm, ${labelHeight} mm`,
      `GAP ${gap} mm, 0`,
      `SPEED ${speed}`,
      `DENSITY ${density}`,
      `REFERENCE 0,0`,
      `SET TEAR ON`,
    ];

    tickets.forEach((ticket, index) => {
      console.log(`Génération ticket ${index + 1}/${tickets.length}:`, ticket.progressiveNumber);
      
      commands.push('CLS');
      
      // QR Code
      if (ticket.fullProductNumber) {
        commands.push(`QRCODE ${this.printPositionConfig.dataMatrixX},${this.printPositionConfig.dataMatrixY},H,${this.printPositionConfig.dataMatrixSize},A,0,"${ticket.fullProductNumber}"`);
      }
      
      // Code produit complet sous le QR code
     if (ticket.fullProductNumber) {
        const displayText = ticket.fullProductNumber.length > 16 ? 
          ticket.fullProductNumber.substring(0, 16) : ticket.fullProductNumber;
        commands.push(`TEXT ${this.printPositionConfig.fullProductNumberX},${this.printPositionConfig.fullProductNumberY},"${this.printPositionConfig.fullProductNumberFontSize}",3,1,1,"${displayText}"`);
      }
      
      if (ticket.progressiveNumber) {
        commands.push(`TEXT ${this.printPositionConfig.serialNumberX},${this.printPositionConfig.serialNumberY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"${ticket.progressiveNumber}"`);
      }
      
      if (ticket.ligne && ticket.reference) {
        const productCode = `${ticket.ligne}-${ticket.reference}`;
        commands.push(`TEXT ${this.printPositionConfig.productCodeX},${this.printPositionConfig.productCodeY},"${this.printPositionConfig.productCodeFontSize}",0,1,1,"${productCode}"`);
      }
      
      if (ticket.matricule) {
        commands.push(`TEXT ${this.printPositionConfig.matriculeX},${this.printPositionConfig.matriculeY},"${this.printPositionConfig.matriculeFontSize}",0,1,1,"${ticket.matricule}"`);
      }
      
      if (ticket.printDate) {
        const formattedDate = this.formatPrintDate(ticket.printDate);
        commands.push(`TEXT ${this.printPositionConfig.dateX},${this.printPositionConfig.dateY},"${this.printPositionConfig.dateFontSize}",0,1,1,"${formattedDate}"`);
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
   * DÉBOGAGE POSITIONS EN PIXELS
   */
  debugPixelPositions(tickets: any[]): void {
    console.group('DÉBOGAGE POSITIONS PIXELS - FORMAT 4 TICKETS');
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
        
        console.group(`Ticket ${positionInLine + 1}`);
        console.log(`Offset: ${offsetXMm}mm = ${offsetXPx}px`);
        console.log(`QR Code: (${this.printPositionConfig.dataMatrixX + offsetXPx}, ${this.printPositionConfig.dataMatrixY})px`);
        console.log(`Code Produit Complet: (${this.printPositionConfig.fullProductNumberX + offsetXPx}, ${this.printPositionConfig.fullProductNumberY})px`);
        console.log(`Numéro: (${this.printPositionConfig.serialNumberX + offsetXPx}, ${this.printPositionConfig.serialNumberY})px`);
        console.log(`Produit: (${this.printPositionConfig.productCodeX + offsetXPx}, ${this.printPositionConfig.productCodeY})px`);
        console.groupEnd();
      }
      
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * TEST AVEC DÉBOGAGE PIXELS
   */
  testLinePrintWithPixelDebug(): Promise<{ success: boolean; message: string }> {
    const testTickets = [
      {
        fullProductNumber: "F3724157295M0114",
        progressiveNumber: "1360",
        ligne: "F372",
        reference: "4157295",
        matricule: "M0114",
        printDate: new Date().toISOString()
      },
      {
        fullProductNumber: "F3724157295M0115",
        progressiveNumber: "1361",
        ligne: "F372",
        reference: "4157295",
        matricule: "M0115",
        printDate: new Date().toISOString()
      },
      {
        fullProductNumber: "F3724157295M0116",
        progressiveNumber: "1362",
        ligne: "F372",
        reference: "4157295",
        matricule: "M0116",
        printDate: new Date().toISOString()
      },
      {
        fullProductNumber: "F3724157295M0117",
        progressiveNumber: "1363",
        ligne: "F372",
        reference: "4157295",
        matricule: "M0117",
        printDate: new Date().toISOString()
      }
    ];
    
    console.log('Test impression ligne avec positions en pixels (4 tickets)');
    this.debugPixelPositions(testTickets);
    
    return this.printWithLineTSPL(testTickets, 1);
  }

  /**
   * GÉNÉRATION HTML POUR APERÇU
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
          <title>Étiquettes TSC - Format Ligne 104x14mm (4 tickets)</title>
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
            }
            
            .ticket-label.empty-slot {
              background: transparent;
            }
            
           .qr-section {
              width: 6.5mm;
              height: 6.5mm;
              flex-shrink: 0;
              margin-bottom:2mm;
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
            
            .progressive-number {
              font-size: 0px;
              font-weight: bold;
              color: #000;
              line-height: 1;
              margin-bottom: 0.5mm;
            }
            
            .product-code {
              font-size: 0px;
              color: #000;
              line-height: 1;
              margin-bottom: 0.5mm;
            }
            
            .matricule-info {
              font-size: 8px;
              color: #000;
              line-height: 1;
              margin-bottom: 0.5mm;
            }
            
            .date-info {
              font-size: 6px;
              color: #000;
              font-weight: bold;
              line-height: 2;
            }
            
                      .full-product-number {
  font-size: 5px;
  color: #000;
  font-family: Arial Black, Arial Bold, sans-serif;
  line-height: 1;
  margin-left: -0.1mm;
  margin-top: 0.5mm;
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
    const formattedDate = ticket.printDate ? this.formatPrintDate(ticket.printDate) : '';
        const codeImage = ticket.codeImage || ticket.qrCode || '';

    
    return `
      <div class="ticket-label" data-ticket="${ticketNumber}">
        <div class="qr-section">
          <img src="${codeImage}" class="qr-code">
          <div class="full-product-number">${ticket.fullProductNumber || ''}</div>
        </div>
        <div class="info-section">
          <div class="matricule-info">${ticket.matricule || ''}</div>
          <div class="date-info">${formattedDate}</div>
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

  previewTSPLCommands(tickets: any[], copies: number = 1): string {
    return this.generateLineTSPL(tickets, copies);
  }

  debugPrintSettings(): void {
    console.group('Configuration d\'impression avec pixels - FORMAT 4 TICKETS');
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

  getPrintHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/print/history`);
  }

  getPrintStats(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.matricule) params = params.set('matricule', filters.matricule);
    if (filters.ligne) params = params.set('ligne', filters.ligne);

    return this.http.get(`${this.apiUrl}/print/stats`, { params });
  }

  getPrintJob(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/print/job/${id}`);
  }

  deletePrintJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/print/job/${id}`);
  }

  getTicketQRCode(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/print/ticket/${id}/qrcode`);
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
}
}