import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrintTicketRequest {
  ligne: string;
  reference: string;
  quantity: number;
  matricule?: string;
  printDate?: string;
  codeFournisseur?: string;
  codeType?: string;
}

export interface PrintTicketResponse {
  success: boolean;
  message: string;
  data: {
    printJobId: number;
    tickets: Array<{
      fullProductNumber: string;
      codeImage: string;
      codeType: string;
      matricule?: string;
      printDate: string;
      progressiveNumber: string;
      ligne: string;
      reference: string;
      indice: string;
      codeFournisseur: string;
      simpleNum?: string;
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
  simpleNumX: number;
  simpleNumY: number;
  simpleNumFontSize: number;
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
  private readonly PIXELS_PER_MM = 8;

  private printConfig: PrintConfig = {
    printerName: 'TSC_TE210',
    labelWidth: 17,
    labelHeight: 10,
    gap: 4,
    speed: 6,
    density: 8,
    lineWidth: 65,
    lineHeight: 10,
    lineGap: 4,
    labelsPerLine: 3
  };

  private printPositionConfig: PrintPositionConfig = {
    simpleNumX: 4,
    simpleNumY: 8,
    simpleNumFontSize: 3,
    serialNumberX: 56,
    serialNumberY: 8,
    serialNumberFontSize: 2,
    productCodeX: 56,
    productCodeY: 24,
    productCodeFontSize: 1,
    matriculeX: 56,
    matriculeY: 40,
    matriculeFontSize: 1,
    dateX: 55,
    dateY: 55,
    dateFontSize: 1
  };

  private directPrintConfig: DirectPrintConfig = {
    labelsPerLine: 3,
    labelGap: 4,
    showPreviewBorders: true
  };

  private lastPrintResult: any = null;
  private printedTickets: any[] = [];

  constructor(private http: HttpClient) {}

  private mmToPixels(mm: number): number {
    return Math.round(mm * this.PIXELS_PER_MM);
  }

  /**
   * ✅ IMPRESSION AVEC LIGNE - VERSION SIMPLENUM
   */
  printWithLineTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL SimpleNum pour ${tickets.length} tickets`);
        
        const tsplCommands = this.generateLineTSPL(tickets, copies);
        console.log('Commandes TSPL générées:', tsplCommands);
        
        this.sendToPrintServer(tsplCommands).then(resolve).catch(reject);
      } catch (error) {
        console.error('Erreur génération TSPL:', error);
        reject({ success: false, message: 'Erreur lors de la génération des commandes d\'impression' });
      }
    });
  }

  /**
   * ✅ GÉNÉRATION LIGNE PAR LIGNE AVEC SIMPLENUM
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
   * ✅ GÉNÉRATION D'UN TICKET AVEC OFFSET (SIMPLENUM)
   */
  private generateSingleTicketCommandsWithPixelOffset(ticket: any, offsetXMm: number): string[] {
    const offsetXPx = this.mmToPixels(offsetXMm);
    const commands: string[] = [];

    // SimpleNum (remplace le DataMatrix)
    const simpleNum = this.extractSimpleNumFromTicket(ticket);
    if (simpleNum) {
      const textX = this.printPositionConfig.simpleNumX + offsetXPx;
      const textY = this.printPositionConfig.simpleNumY;
      // Double impression pour plus d'épaisseur
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.simpleNumFontSize}",0,1,1,"${simpleNum}"`);
      commands.push(`TEXT ${textX+1},${textY},"${this.printPositionConfig.simpleNumFontSize}",0,1,1,"${simpleNum}"`);
    }

    // Numéro progressif
    if (ticket.progressiveNumber) {
      const textX = this.printPositionConfig.serialNumberX + offsetXPx;
      const textY = this.printPositionConfig.serialNumberY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"${ticket.progressiveNumber}"`);
    }

    // Code produit
    if (ticket.ligne && ticket.reference) {
      const textX = this.printPositionConfig.productCodeX + offsetXPx;
      const textY = this.printPositionConfig.productCodeY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.productCodeFontSize}",0,1,1,"${ticket.ligne}-${ticket.reference}"`);
    }

    // Matricule
    if (ticket.matricule) {
      const textX = (this.printPositionConfig.matriculeX || 56) + offsetXPx;
      const textY = this.printPositionConfig.matriculeY || 40;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.matriculeFontSize}",0,1,1,"${ticket.matricule}"`);
    }

    // Date
    if (ticket.printDate) {
      const textX = (this.printPositionConfig.dateX || 56) + offsetXPx;
      const textY = this.printPositionConfig.dateY || 56;
      const formattedDate = this.formatPrintDate(ticket.printDate);
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.dateFontSize}",0,1,1,"${formattedDate}"`);
    }

    return commands;
  }

  private calculateTicketOffsetX(positionInLine: number): number {
    switch(positionInLine) {
      case 0: return 1;
      case 1: return 22;
      case 2: return 44;
      default: return 0;
    }
  }

  /**
   * ✅ CORRECTION: Extraction du SimpleNum d'un ticket
   * Le SimpleNum est encodé en base64 dans codeImage
   */
  /**
 * ✅ CORRECTION: Extraction du SimpleNum d'un ticket
 */
private extractSimpleNumFromTicket(ticket: any): string {
  console.log('🔍 Extraction SimpleNum du ticket:', ticket);
  
  // Cas 1: SimpleNum déjà disponible en texte clair
  if (ticket.simpleNum && ticket.simpleNum !== 'ERREUR_DECODE') {
    console.log('✅ SimpleNum trouvé directement:', ticket.simpleNum);
    return ticket.simpleNum;
  }
  
  // Cas 2: Décoder depuis codeImage (base64)
  if (ticket.codeImage && ticket.codeType === 'SIMPLENUM') {
    try {
      console.log('🔍 Décodage depuis codeImage:', ticket.codeImage.substring(0, 50) + '...');
      
      // CORRECTION: Le format est data:text/plain;charset=utf-8, pas base64 !
      if (ticket.codeImage.startsWith('data:text/plain;charset=utf-8,')) {
        // C'est déjà du texte URL-encoded, pas du base64
        const encodedText = ticket.codeImage.replace('data:text/plain;charset=utf-8,', '');
        const decoded = decodeURIComponent(encodedText);
        console.log('✅ SimpleNum décodé depuis URL:', decoded);
        return decoded;
      } 
      // Ancien format base64 (au cas où)
      else if (ticket.codeImage.startsWith('data:text/plain;base64,')) {
        const base64Data = ticket.codeImage.replace('data:text/plain;base64,', '');
        const decoded = atob(base64Data);
        console.log('✅ SimpleNum décodé depuis base64:', decoded);
        return decoded;
      }
      // Format inconnu
      else {
        console.warn('⚠️ Format codeImage non reconnu:', ticket.codeImage.substring(0, 50));
        return ticket.fullProductNumber || 'FORMAT_INCONNU';
      }
    } catch (error) {
      console.error('❌ Erreur décodage SimpleNum:', error);
      console.error('❌ CodeImage problématique:', ticket.codeImage);
      return ticket.fullProductNumber || 'ERREUR_DECODE';
    }
  }
  
  // Cas 3: Fallback sur fullProductNumber
  if (ticket.fullProductNumber) {
    console.log('⚠️ Utilisation du fullProductNumber comme fallback:', ticket.fullProductNumber);
    return ticket.fullProductNumber;
  }
  
  console.warn('⚠️ Aucun SimpleNum trouvé dans le ticket');
  return 'N/A';
}

  /**
   * ✅ GÉNÉRATION HTML POUR APERÇU
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
          <title>Étiquettes SimpleNum XT3 - Format Ligne 65x10mm</title>
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
              padding: 0.5mm;
            }
            
            .ticket-label.empty-slot {
              background: transparent;
            }
            
            .simplenum-section {
              width: 8mm;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            
            .simplenum-code { 
              font-size: 10px;
              font-weight: bold;
              
              color: #000;
              writing-mode: horizontal-tb;
              text-align: center;
              margin-left:6.5mm;
            }
            
            .info-section {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100%;
              padding-left: 1mm;
            }
            
            .progressive-number {
              font-size: 10px;
              font-weight: bold;
              color: #000;
              line-height: 1;
              margin-bottom: 0.5mm;
            }
            
            .product-code {
              font-size: 8px;
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
    const simpleNum = this.extractSimpleNumFromTicket(ticket);
    
    return `
      <div class="ticket-label">
        <div class="simplenum-section">
          <div class="simplenum-code">${simpleNum}</div>
        </div>
        <div class="info-section">
          
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

  private formatPrintDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  }

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

  setLastPrintResult(result: any): void {
    this.lastPrintResult = result;
    this.printedTickets = result?.data?.tickets || [];
    
    // Ajouter le SimpleNum décodé à chaque ticket
    this.printedTickets.forEach(ticket => {
      if (ticket.codeType === 'SIMPLENUM' && !ticket.simpleNum) {
        ticket.simpleNum = this.extractSimpleNumFromTicket(ticket);
      }
    });
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
    console.group('Configuration d\'impression SimpleNum XT3');
    console.log('Résolution:', `${this.PIXELS_PER_MM} pixels/mm`);
    console.log('Configuration de base:', this.printConfig);
    console.log('Positions en pixels:', this.printPositionConfig);
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

  // API Methods
  printTickets(request: PrintTicketRequest): Observable<PrintTicketResponse> {
    const xt3Request = {
      ...request,
      codeType: 'SIMPLENUM'
    };
    return this.http.post<PrintTicketResponse>(`${this.apiUrl}/print/tickets`, xt3Request);
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