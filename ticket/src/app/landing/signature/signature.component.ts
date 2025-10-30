// signature.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-container" [class.visible]="isVisible">
      <div class="signature-box" (click)="toggleInfo()">
        <div class="signature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </div>
        <div class="signature-text">
          <span class="creator">Créé par</span>
          <span class="name">Ahmed Ben Brahim</span>
        </div>
        <div class="click-indicator" *ngIf="!showInfo">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
      </div>

      <!-- Panneau d'informations -->
      <div class="info-panel" [class.show]="showInfo" (click)="$event.stopPropagation()">
        <div class="info-header">
          <h3>Contact</h3>
          <button class="close-btn" (click)="toggleInfo()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="info-content">
          <!-- Email -->
          <div class="info-item">
            <div class="info-icon email-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div class="info-text">
              <span class="info-label">Email</span>
              <a href="mailto:ahmedbenbrahim944@gmail.com" class="info-value" target="_blank">
                ahmedbenbrahim&#64;944gmail.com
              </a>
            </div>
          </div>

          <!-- LinkedIn -->
          <div class="info-item">
            <div class="info-icon linkedin-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </div>
            <div class="info-text">
              <span class="info-label">LinkedIn</span>
              <a href="https://www.linkedin.com/in/ahmed-ben-brahim-0634aa306" class="info-value" target="_blank" rel="noopener noreferrer">
                Voir le profil
              </a>
            </div>
          </div>
        </div>

        <div class="info-footer">
          <span>Cliquez en dehors pour fermer</span>
        </div>
      </div>

      <!-- Overlay -->
      <div class="overlay" [class.show]="showInfo" (click)="toggleInfo()"></div>
    </div>
  `,
  styles: [`
    .signature-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      opacity: 0;
      transform: translateX(50px);
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .signature-container.visible {
      opacity: 1;
      transform: translateX(0);
    }

    .signature-box {
      background: linear-gradient(135deg, rgba(9, 13, 117, 0.95), rgba(32, 33, 179, 0.95));
      padding: 12px 24px;
      border-radius: 30px;
      box-shadow: 
        0 8px 32px rgba(9, 13, 117, 0.4),
        0 2px 8px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
    }

    .signature-box:hover {
      transform: translateY(-3px);
      box-shadow: 
        0 12px 40px rgba(9, 13, 117, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .signature-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2.5s ease-in-out infinite;
      color: white;
      flex-shrink: 0;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      50% {
        transform: scale(1.08);
        box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
      }
    }

    .signature-text {
      color: white;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .creator {
      font-size: 10px;
      font-weight: 400;
      opacity: 0.85;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .name {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      background: linear-gradient(90deg, #ffffff, #e0e7ff, #ffffff);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }

    @keyframes shimmer {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }

    .click-indicator {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0.7;
      animation: bounce 2s ease-in-out infinite;
      flex-shrink: 0;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    /* Panneau d'informations */
    .info-panel {
      position: absolute;
      top: 70px;
      right: 0;
      width: 320px;
      background: white;
      border-radius: 16px;
      box-shadow: 
        0 20px 60px rgba(9, 13, 117, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .info-panel.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .info-header {
      background: linear-gradient(135deg, #090D75, #2021B3);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-header h3 {
      color: white;
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .info-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 12px;
      transition: all 0.3s;
    }

    .info-item:hover {
      background: #e8efff;
      transform: translateX(4px);
    }

    .info-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .email-icon {
      background: linear-gradient(135deg, #4285f4, #34a853);
      color: white;
    }

    .linkedin-icon {
      background: linear-gradient(135deg, #0077b5, #00a0dc);
      color: white;
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .info-label {
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 13px;
      color: #090D75;
      font-weight: 600;
      text-decoration: none;
      word-break: break-word;
      transition: color 0.3s;
    }

    .info-value:hover {
      color: #2021B3;
      text-decoration: underline;
    }

    .info-footer {
      padding: 12px 20px;
      background: #f8f9fa;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }

    .info-footer span {
      font-size: 11px;
      color: #6c757d;
      font-style: italic;
    }

    /* Overlay */
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
      z-index: -1;
    }

    .overlay.show {
      opacity: 1;
      pointer-events: auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .signature-container {
        top: 15px;
        right: 15px;
      }

      .signature-box {
        padding: 10px 20px;
      }

      .info-panel {
        width: 280px;
        top: 65px;
      }

      .signature-icon {
        width: 28px;
        height: 28px;
      }

      .creator {
        font-size: 9px;
      }

      .name {
        font-size: 13px;
      }
    }

    @media (max-width: 576px) {
      .signature-container {
        top: 10px;
        right: 10px;
        left: 10px;
      }

      .signature-box {
        padding: 8px 16px;
        gap: 10px;
      }

      .info-panel {
        width: calc(100vw - 40px);
        right: 10px;
        top: 60px;
      }

      .signature-icon {
        width: 26px;
        height: 26px;
      }

      .creator {
        font-size: 8px;
      }

      .name {
        font-size: 12px;
      }

      .click-indicator {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class SignatureComponent implements OnInit {
  isVisible = false;
  showInfo = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.isVisible = true;
    }, 500);
  }

  toggleInfo(): void {
    this.showInfo = !this.showInfo;
  }
}