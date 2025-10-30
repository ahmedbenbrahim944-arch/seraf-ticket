import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface A3PrintTicketRequest {
  ligne: string;
  reference: string;
  quantity: number;
  matricule?: string;
  printDate?: string;
  codeFournisseur?: string;
  codeType: 'NUM';
  champS: string; // Préfixe A3, T5, etc.
}

export interface A3PrintTicketResponse {
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
      champS?: string;
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

export interface A3PrintConfig {
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

export interface A3PrintPositionConfig {
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

@Injectable({
  providedIn: 'root'
})
export class A3PrintService {
  private apiUrl = 'http://localhost:3000';
  private readonly PIXELS_PER_MM = 8;

  private printConfig: A3PrintConfig = {
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

  private printPositionConfig: A3PrintPositionConfig = {
    simpleNumX: 10,
    simpleNumY: 30,
    simpleNumFontSize: 4,
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

  private lastPrintResult: any = null;
  private printedTickets: any[] = [];

  constructor(private http: HttpClient) {}

  private mmToPixels(mm: number): number {
    return Math.round(mm * this.PIXELS_PER_MM);
  }

  /**
   * ✅ IMPRESSION AVEC LIGNE - VERSION A3 SIMPLENUM
   */
  printWithLineTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`🖨️ Génération TSPL A3 pour ${tickets.length} tickets`);
        
        const tsplCommands = this.generateLineTSPL(tickets, copies);
        console.log('📄 Commandes TSPL générées:', tsplCommands);
        
        this.sendToPrintServer(tsplCommands).then(resolve).catch(reject);
      } catch (error) {
        console.error('❌ Erreur génération TSPL:', error);
        reject({ success: false, message: 'Erreur lors de la génération des commandes d\'impression' });
      }
    });
  }

  /**
   * ✅ GÉNÉRATION LIGNE PAR LIGNE AVEC A3 SIMPLENUM
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
      
      console.log(`📝 Génération ligne ${lineIndex + 1}/${totalLines}: tickets ${startIndex + 1} à ${endIndex}`);
      
      commands.push('CLS');
      
      for (let i = startIndex; i < endIndex; i++) {
        const ticket = tickets[i];
        const positionInLine = i - startIndex;
        const offsetXMm = this.calculateTicketOffsetX(positionInLine);
        
        console.log(`  🎫 Étiquette ${positionInLine + 1}: offset ${offsetXMm}mm`);
        
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
   * ✅ GÉNÉRATION D'UN TICKET AVEC OFFSET (A3 FORMAT)
   * Format: A3/808/S42
   */
  private generateSingleTicketCommandsWithPixelOffset(ticket: any, offsetXMm: number): string[] {
    const offsetXPx = this.mmToPixels(offsetXMm);
    const commands: string[] = [];

    // SimpleNum au format PREFIX/XXX/SWW
    const simpleNum = this.extractSimpleNumFromTicket(ticket);
    if (simpleNum) {
      const textX = this.printPositionConfig.simpleNumX + offsetXPx;
      const textY = this.printPositionConfig.simpleNumY;
      
      // Triple impression pour plus d'épaisseur et visibilité
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.simpleNumFontSize}",0,1,1,"${simpleNum}"`);
      commands.push(`TEXT ${textX+1},${textY},"${this.printPositionConfig.simpleNumFontSize}",0,1,1,"${simpleNum}"`);
      commands.push(`TEXT ${textX},${textY+1},"${this.printPositionConfig.simpleNumFontSize}",0,1,1,"${simpleNum}"`);
    }

    // Numéro progressif (optionnel selon vos besoins)
    if (ticket.progressiveNumber) {
      const textX = this.printPositionConfig.serialNumberX + offsetXPx;
      const textY = this.printPositionConfig.serialNumberY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"N°${ticket.progressiveNumber}"`);
    }

    // Code produit (optionnel)
    if (ticket.ligne && ticket.reference) {
      const textX = this.printPositionConfig.productCodeX + offsetXPx;
      const textY = this.printPositionConfig.productCodeY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.productCodeFontSize}",0,1,1,"${ticket.ligne}/${ticket.reference}"`);
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
   * ✅ EXTRACTION DU SIMPLENUM (FORMAT A3/808/S42)
   */
  private extractSimpleNumFromTicket(ticket: any): string {
    // Cas 1: SimpleNum déjà disponible en texte clair
    if (ticket.simpleNum) {
      console.log('✅ SimpleNum trouvé directement:', ticket.simpleNum);
      return ticket.simpleNum;
    }
    
    // Cas 2: Décoder depuis codeImage (data:text/plain)
    if (ticket.codeImage && ticket.codeType === 'SIMPLENUM') {
      try {
        // Format: data:text/plain;charset=utf-8,A3%2F808%2FS42
        const dataUrl = ticket.codeImage;
        
        if (dataUrl.startsWith('data:text/plain;charset=utf-8,')) {
          const encoded = dataUrl.replace('data:text/plain;charset=utf-8,', '');
          const decoded = decodeURIComponent(encoded);
          console.log('✅ SimpleNum décodé depuis data URL:', decoded);
          return decoded;
        }
        
        // Fallback base64
        if (dataUrl.startsWith('data:text/plain;base64,')) {
          const base64Data = dataUrl.replace('data:text/plain;base64,', '');
          const decoded = atob(base64Data);
          console.log('✅ SimpleNum décodé depuis base64:', decoded);
          return decoded;
        }
        
      } catch (error) {
        console.error('❌ Erreur décodage SimpleNum:', error);
        return 'ERREUR_DECODE';
      }
    }
    
    // Cas 3: Construire depuis champS si disponible
    if (ticket.champS && ticket.reference && ticket.printDate) {
      try {
        const refDigits = ticket.reference.replace(/\D/g, '');
        const lastThree = refDigits.slice(-3).padStart(3, '0');
        
        // Extraire semaine de printDate (format YYYY-MM-DD)
        const date = new Date(ticket.printDate);
        const weekNum = this.getWeekNumber(date);
        const weekFormatted = `S${String(weekNum).padStart(2, '0')}`;
        
        const simpleNum = `${ticket.champS}/${lastThree}/${weekFormatted}`;
        console.log('✅ SimpleNum construit:', simpleNum);
        return simpleNum;
      } catch (error) {
        console.error('❌ Erreur construction SimpleNum:', error);
      }
    }
    
    // Cas 4: Fallback
    if (ticket.fullProductNumber) {
      console.log('⚠️ Utilisation du fullProductNumber comme fallback');
      return ticket.fullProductNumber;
    }
    
    return 'N/A';
  }

  /**
   * Calcule le numéro de semaine ISO
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
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
          <title>Étiquettes A3 SimpleNum - Format ${labelWidth}x${labelHeight}mm</title>
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
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              border: 1px solid #eee;
            }
            
            .ticket-label.empty-slot {
              background: transparent;
              border: none;
            }
            
            .simplenum-code { 
              font-size: 10px;
              font-weight: bold;
              color: #000;
              text-align: center;
              margin-right:3mm;
          }
            
            @media print {
              body { 
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .ticket-label {
                border: none;
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
    const simpleNum = this.extractSimpleNumFromTicket(ticket);
    
    return `
      <div class="ticket-label">
        <div class="simplenum-code">${simpleNum}</div>
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

  private sendToPrintServer(tsplCommands: string): Promise<{ success: boolean; message: string }> {
    const printData = {
      tsplCommands: tsplCommands,
      printerName: this.printConfig.printerName
    };

    return new Promise((resolve, reject) => {
      this.http.post<{ success: boolean; message: string; filePath?: string }>(`${this.apiUrl}/print/direct`, printData).subscribe({
        next: (response) => {
          console.log('✅ Réponse du serveur d\'impression:', response);
          
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
          console.error('❌ Erreur lors de l\'envoi à l\'imprimante:', error);
          const errorMessage = error.error?.message || 'Erreur de communication avec l\'imprimante';
          this.showErrorMessage(errorMessage);
          
          this.fallbackPrint(tsplCommands);
          reject({ success: false, message: errorMessage });
        }
      });
    });
  }

  private fallbackPrint(tsplCommands: string): void {
    console.log('📄 Fallback: ouverture du dialogue d\'impression');
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
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

  updatePrintConfig(config: Partial<A3PrintConfig>): void {
    this.printConfig = { ...this.printConfig, ...config };
  }

  getPrintConfig(): A3PrintConfig {
    return { ...this.printConfig };
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

  private showSuccessMessage(message: string): void {
    console.log('✅ SUCCESS:', message);
  }

  private showWarningMessage(message: string): void {
    console.warn('⚠️ WARNING:', message);
  }

  private showErrorMessage(message: string): void {
    console.error('❌ ERROR:', message);
  }

  // ========== API METHODS ==========
  
  printTickets(request: A3PrintTicketRequest): Observable<A3PrintTicketResponse> {
    return this.http.post<A3PrintTicketResponse>(`${this.apiUrl}/print/tickets`, request);
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
    printDate?: string,
    prefix?: string
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
      simpleNum?: string;
    };
  }> {
    let params = new HttpParams();
    if (printDate) params = params.set('printDate', printDate);
    if (codeFournisseur) params = params.set('codeFournisseur', codeFournisseur);
    if (prefix) params = params.set('prefix', prefix);
    params = params.set('codeType', 'SIMPLENUM');

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
        simpleNum?: string;
      };
    }>(
      `${this.apiUrl}/print/preview/${ligne}/${reference}`,
      { params }
    );
  }
}