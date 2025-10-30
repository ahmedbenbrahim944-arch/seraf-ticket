import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrintTicketRequest {
  ligne: string;
  reference: string;
  aiec: string;
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
      aiec: string;
      indice: string;
      codeFournisseur: string;
    }>;
    summary: {
      totalTickets: number;
      progressiveRange: string;
      productInfo: {
        ligne: string;
        reference: string;
        aiec: string;
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
  aiecX: number;
  aiecY: number;
  aiecFontSize?: number;
  matriculeX: number;
  matriculeY: number;
  matriculeFontSize?: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
  status: string;
  isTSC: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Mxt5PrintService {
  private apiUrl = 'http://localhost:3000';
  private readonly PIXELS_PER_MM = 8;

  private printConfig: PrintConfig = {
    printerName: 'TSC_TE210',
    labelWidth: 17,
    labelHeight: 7,
    gap: 5,
    speed: 6,
    density: 8
  };

  private printPositionConfig: PrintPositionConfig = {
    qrCodeX: 1,
    qrCodeY: 1,
    qrCodeSize: 2,
    
    serialNumberX: 42,
    serialNumberY: 4,
    serialNumberFontSize: 2,
    
    productCodeX: 42,
    productCodeY: 28,
    productCodeFontSize: 1,

    aiecX: 42,
    aiecY: 18,
    aiecFontSize: 1,

    matriculeX: 42,
    matriculeY: 38,
    matriculeFontSize: 1
  };

  private lastPrintResult: any = null;
  private printedTickets: any[] = [];

  constructor(private http: HttpClient) {}

  private mmToPixels(mm: number): number {
    return Math.round(mm * this.PIXELS_PER_MM);
  }

  printSuccessiveTSPL(tickets: any[], copies: number = 1): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      try {
        if (!tickets || tickets.length === 0) {
          reject({ success: false, message: 'Aucun ticket à imprimer' });
          return;
        }

        console.log(`Génération TSPL successive pour ${tickets.length} tickets MXT5 (17x7mm)`);
        
        const tsplCommands = this.generateSuccessiveTSPL(tickets, copies);
        console.log('Commandes TSPL générées:', tsplCommands);
        
        this.sendToPrintServer(tsplCommands).then(resolve).catch(reject);
      } catch (error) {
        console.error('Erreur lors de la génération TSPL:', error);
        reject({ success: false, message: 'Erreur lors de la génération des commandes d\'impression' });
      }
    });
  }

  private generateSuccessiveTSPL(tickets: any[], copies: number = 1): string {
    const { labelWidth, labelHeight, gap, speed, density } = this.printConfig;
    
    let commands = [
      `SIZE ${labelWidth} mm, ${labelHeight} mm`,
      `GAP ${gap} mm, 0`,
      `SPEED ${speed}`,
      `DENSITY ${density}`,
      `REFERENCE 0,0`,
      `SET TEAR ON`,
      `DIRECTION 0`
    ];

    tickets.forEach((ticket, index) => {
      console.log(`Génération ticket MXT5 ${index + 1}/${tickets.length}:`, ticket.progressiveNumber);
      
      commands.push('CLS');
      
      if (ticket.fullProductNumber) {
        const qrX = this.printPositionConfig.qrCodeX;
        const qrY = this.printPositionConfig.qrCodeY;
        commands.push(`QRCODE ${qrX},${qrY},H,${this.printPositionConfig.qrCodeSize},A,0,"${ticket.fullProductNumber}"`);
      }
      
      if (ticket.progressiveNumber) {
        const textX = this.printPositionConfig.serialNumberX;
        const textY = this.printPositionConfig.serialNumberY;
        commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.serialNumberFontSize}",0,1,1,"${ticket.progressiveNumber}"`);
      }
      
      if (ticket.aiec && ticket.aiec !== 'vide' && ticket.aiec.trim() !== '') {
      const textX = this.printPositionConfig.aiecX;
      const textY = this.printPositionConfig.aiecY;
      commands.push(`TEXT ${textX},${textY},"${this.printPositionConfig.aiecFontSize}",0,1,1,"${ticket.aiec}"`);
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

  private generatePrintableHTML(): string {
    const tickets = this.getPrintedTickets();
    const { labelWidth, labelHeight, gap } = this.printConfig;
    
    if (!tickets || tickets.length === 0) {
      return this.generateEmptyPrintHTML();
    }
    
    let ticketsHTML = '';
    
    tickets.forEach((ticket, index) => {
      ticketsHTML += this.generateSingleTicketHTML(ticket, index + 1);
    });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquettes MXT5 - Format 17x7mm</title>
          <style>
            @page { 
              size: ${labelWidth}mm ${labelHeight}mm;
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
            
            .ticket-label {
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              position: relative;
              background: white;
              display: flex;
              align-items: center;
              page-break-after: always;
              border: 1px solid #ddd;
              margin-bottom: ${gap}mm;
            }
            
            .ticket-label:last-child {
              page-break-after: avoid;
              margin-bottom: 0;
            }
            
            .qr-section {
              width: 5.5mm;
              height: 5.5mm;
              
              flex-shrink: 0;
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
            
            .ticket-aiec {  
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
            
            @media print {
              body { 
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .ticket-label {
                margin: 0 !important;
                border: none !important;
              }
            }
            
            @media screen {
              body {
                padding: 10px;
                background: #f5f5f5;
              }
            }
          </style>
        </head>
        <body>
          ${ticketsHTML}
        </body>
      </html>
    `;
  }

  private generateSingleTicketHTML(ticket: any, ticketNumber: number): string {
      const showAiec = ticket.aiec && ticket.aiec !== 'vide' && ticket.aiec.trim() !== '';
      const codeImage = ticket.codeImage || ticket.qrCode || '';

    return `
      <div class="ticket-label" data-ticket="${ticketNumber}">
        <div class="qr-section">
          <img src="${codeImage}" alt="QR-${ticket.progressiveNumber}" class="qr-code">
        </div>
        <div class="info-section">
          ${showAiec ? `<div class="ticket-aiec">${ticket.aiec}</div>` : ''}
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
          <title>Aucun ticket à imprimer</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
            }
          </style>
        </head>
        <body>
          <h1>Aucun ticket à imprimer</h1>
          <p>Veuillez générer des tickets avant d'imprimer.</p>
        </body>
      </html>
    `;
  }

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

  debugPrintSettings(): void {
    console.group('Configuration d\'impression MXT5 17x7mm');
    console.log('Résolution:', `${this.PIXELS_PER_MM} pixels/mm`);
    console.log('Configuration de base:', this.printConfig);
    console.log('Positions en pixels:', this.printPositionConfig);
    console.log(`Format ticket: ${this.printConfig.labelWidth}x${this.printConfig.labelHeight}mm`);
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