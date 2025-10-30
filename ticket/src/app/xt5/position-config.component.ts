/*import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrintService, PrintPositionConfig } from './print.service';

@Component({
  selector: 'app-position-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-overlay" *ngIf="show" (click)="onOverlayClick($event)">
      <div class="config-modal" (click)="$event.stopPropagation()">
        <div class="config-header">
          <h3>Configuration des positions (Ticket 17x10mm)</h3>
          <button class="btn-close" (click)="close()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <div class="config-content">
          <!-- Aperçu visuel du ticket avec fonctionnalité de glisser-déposer -->
          <div class="ticket-preview">
            <h4>Aperçu du ticket <small>(Glissez les éléments pour les repositionner)</small></h4>
            <div class="preview-container">
              <div class="ticket-visual" 
                   #ticketContainer
                   [style.width.px]="170" 
                   [style.height.px]="100">
                
                <!-- QR Code preview avec drag & drop -->
                <div class="qr-preview draggable" 
                     [style.left.px]="config.qrCodeX * 10"
                     [style.top.px]="config.qrCodeY * 10"
                     [style.width.px]="70"
                     [style.height.px]="70"
                     (mousedown)="startDrag($event, 'qrCode')"
                     [class.dragging]="draggingElement === 'qrCode'">
                  QR
                </div>
                
                <!-- Numéro série preview avec drag & drop -->
                <div class="serial-preview draggable"
                     [style.left.px]="config.serialNumberX * 10"
                     [style.top.px]="config.serialNumberY * 10"
                     (mousedown)="startDrag($event, 'serialNumber')"
                     [class.dragging]="draggingElement === 'serialNumber'">
                  1360
                </div>
                
                <!-- Code produit preview avec drag & drop -->
                <div class="product-preview draggable"
                     [style.left.px]="config.productCodeX * 10"
                     [style.top.px]="config.productCodeY * 10"
                     (mousedown)="startDrag($event, 'productCode')"
                     [class.dragging]="draggingElement === 'productCode'">
                  F372-M0114
                </div>
              </div>
            </div>
          </div>
          
          <!-- Contrôles de position (gardés pour ajustement fin) -->
          <div class="config-controls">
            <h4>Configuration des positions (en mm)</h4>
            
            <!-- QR Code -->
            <div class="control-group">
              <h5>QR Code (7x7mm)</h5>
              <div class="control-row">
                <label>Position X:</label>
                <input type="number" 
                       [(ngModel)]="config.qrCodeX" 
                       min="0" max="10" step="0.1"
                       (ngModelChange)="onConfigChange()">
                <span>mm</span>
              </div>
              <div class="control-row">
                <label>Position Y:</label>
                <input type="number" 
                       [(ngModel)]="config.qrCodeY" 
                       min="0" max="3" step="0.1"
                       (ngModelChange)="onConfigChange()">
                <span>mm</span>
              </div>
              <div class="control-row">
                <label>Taille:</label>
                <select [(ngModel)]="config.qrCodeSize" (ngModelChange)="onConfigChange()">
                  <option value="2">Petit (2)</option>
                  <option value="3">Moyen (3)</option>
                  <option value="4">Grand (4)</option>
                </select>
              </div>
            </div>
            
            <!-- Numéro série -->
            <div class="control-group">
              <h5>Numéro de série</h5>
              <div class="control-row">
                <label>Position X:</label>
                <input type="number" 
                       [(ngModel)]="config.serialNumberX" 
                       min="0" max="16" step="0.1"
                       (ngModelChange)="onConfigChange()">
                <span>mm</span>
              </div>
              <div class="control-row">
                <label>Position Y:</label>
                <input type="number" 
                       [(ngModel)]="config.serialNumberY" 
                       min="0" max="9" step="0.1"
                       (ngModelChange)="onConfigChange()">
                <span>mm</span>
              </div>
            </div>
            
            <!-- Code produit -->
            <div class="control-group">
              <h5>Code produit</h5>
              <div class="control-row">
                <label>Position X:</label>
                <input type="number" 
                       [(ngModel)]="config.productCodeX" 
                       min="0" max="16" step="0.1"
                       (ngModelChange)="onConfigChange()">
                <span>mm</span>
              </div>
              <div class="control-row">
                <label>Position Y:</label>
                <input type="number" 
                       [(ngModel)]="config.productCodeY" 
                       min="0" max="9" step="0.1"
                       (ngModelChange)="onConfigChange()">
                <span>mm</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="config-footer">
          <button class="btn-secondary" (click)="resetToDefault()">
            Réinitialiser
          </button>
          <button class="btn-primary" (click)="saveAndClose()">
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .config-modal {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }
    
    .config-header h3 {
      margin: 0;
      color: #333;
    }
    
    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }
    
    .btn-close:hover {
      color: #333;
    }
    
    .config-content {
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .ticket-preview h4,
    .config-controls h4 {
      margin: 0 0 15px 0;
      color: #333;
    }
    
    .preview-container {
      border: 2px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      background: #f9f9f9;
    }
    
    .ticket-visual {
      position: relative;
      background: white;
      border: 2px solid #333;
      margin: 0 auto;
      border-radius: 2px;
      touch-action: none;
    }
    
    .qr-preview {
      position: absolute;
      background: #333;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border-radius: 2px;
    }
    
    .serial-preview,
    .product-preview {
      position: absolute;
      font-size: 10px;
      font-weight: bold;
      color: #333;
      white-space: nowrap;
    }
    
    .control-group {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 4px;
      background: #fafafa;
    }
    
    .control-group h5 {
      margin: 0 0 10px 0;
      color: #555;
      font-size: 14px;
    }
    
    .control-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 10px;
    }
    
    .control-row label {
      min-width: 80px;
      font-size: 12px;
      color: #666;
    }
    
    .control-row input,
    .control-row select {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 12px;
    }
    
    .control-row span {
      font-size: 12px;
      color: #666;
    }
    
    .config-footer {
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .btn-secondary,
    .btn-primary {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .draggable {
      cursor: move;
      user-select: none;
    }
    
    .dragging {
      opacity: 0.8;
      box-shadow: 0 0 10px rgba(0, 0, 255, 0.5);
    }
    
    @media (max-width: 768px) {
      .config-content {
        grid-template-columns: 1fr;
      }
      
      .config-modal {
        width: 95%;
        margin: 10px;
      }
    }
  `]
})
export class PositionConfigComponent implements OnInit {
  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() configUpdated = new EventEmitter<PrintPositionConfig>();
  
  @ViewChild('ticketContainer', { static: false }) ticketContainer!: ElementRef;

 // config: PrintPositionConfig = {
    qrCodeX: 5,
    qrCodeY: 1,
    qrCodeSize: 3,
    productCodeX: 1,
    productCodeY: 8.5
  };

  // Ces propriétés doivent être publiques car utilisées dans le template
  draggingElement: string | null = null;
  startX: number = 0;
  startY: number = 0;
  startElementX: number = 0;
  startElementY: number = 0;

  private defaultConfig: PrintPositionConfig = { ...this.config };

  constructor(private printService: PrintService) {}

  ngOnInit(): void {
    this.config = { ...this.printService.getPrintPositionConfig() };
    this.defaultConfig = { ...this.config };
  }

  // Gestion du glisser-déposer
  startDrag(event: MouseEvent, element: string): void {
    event.preventDefault();
    this.draggingElement = element;
    this.startX = event.clientX;
    this.startY = event.clientY;
    
    // Enregistrer la position initiale de l'élément
    if (element === 'qrCode') {
      this.startElementX = this.config.qrCodeX;
      this.startElementY = this.config.qrCodeY;
    } else if (element === 'serialNumber') {
      this.startElementX = this.config.serialNumberX;
      this.startElementY = this.config.serialNumberY;
    } else if (element === 'productCode') {
      this.startElementX = this.config.productCodeX;
      this.startElementY = this.config.productCodeY;
    }
    
    // Ajouter les écouteurs d'événements
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }

  onDrag(event: MouseEvent): void {
    if (!this.draggingElement) return;
    
    const deltaX = (event.clientX - this.startX) / 10; // Conversion pixels -> mm
    const deltaY = (event.clientY - this.startY) / 10; // Conversion pixels -> mm
    
    if (this.draggingElement === 'qrCode') {
      this.config.qrCodeX = Math.max(0, Math.min(10, this.startElementX + deltaX));
      this.config.qrCodeY = Math.max(0, Math.min(3, this.startElementY + deltaY));
    } else if (this.draggingElement === 'serialNumber') {
      this.config.serialNumberX = Math.max(0, Math.min(16, this.startElementX + deltaX));
      this.config.serialNumberY = Math.max(0, Math.min(9, this.startElementY + deltaY));
    } else if (this.draggingElement === 'productCode') {
      this.config.productCodeX = Math.max(0, Math.min(16, this.startElementX + deltaX));
      this.config.productCodeY = Math.max(0, Math.min(9, this.startElementY + deltaY));
    }
  }

  stopDrag(): void {
    this.draggingElement = null;
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  }

  onConfigChange(): void {
    // Mise à jour en temps réel de l'aperçu
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    this.show = false;
    this.showChange.emit(false);
  }

  resetToDefault(): void {
    this.config = { ...this.defaultConfig };
  }

  saveAndClose(): void {
    this.printService.updatePrintPosition(this.config);
    this.configUpdated.emit(this.config);
    this.close();
  }

  // Nettoyer les écouteurs d'événements
  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  }
/** */