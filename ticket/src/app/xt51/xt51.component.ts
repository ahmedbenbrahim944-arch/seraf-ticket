import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrintService, PrintTicketRequest, PrinterInfo, PrintPositionConfig } from './print.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-xt51',
  standalone: true,
  imports: [CommonModule,RouterModule,FormsModule],
  templateUrl: './xt51.component.html',
  styleUrl: './xt51.component.css'
})
export class Xt51Component {

   selectedLigne: string = 'L33:COM XT5';
    selectedReference: string = '';
    codeProduit: string = '';
    selectedDate: string = '';
    numeroProgressive: string = '';
    selectedMode: string = 'M0';
    indice: string = '';
    quantite: number = 1;
    matricule: string = '';
    showPositionConfig = false;
    defaultCodeFournisseur: string = '';
  
    // 🆕 Propriétés pour le changement de semaine
    weekChangeDetected: boolean = false;
    weekChangeInfo: {
      currentWeek: string;
      newWeek: string;
      warning: string;
    } = {
      currentWeek: '',
      newWeek: '',
      warning: ''
    };
  
    // État de l'application
    isLoading: boolean = false;
    errorMessage: string = '';
    showPrintDialog: boolean = false;
    parallelTickets: number = 1;
    
    // Gestion des imprimantes
    availablePrinters: PrinterInfo[] = [];
    selectedPrinter: string = '';
    showPrinterTest = false;
    printerTestResult: string = '';
  
    // Données des listes
    references: string[] = [];
  
    // Propriétés pour les résultats d'impression
    showPrintResult: boolean = false;
    printResult: any = null;
    printedTickets: any[] = [];
  
    showImageModal: boolean = false;
    selectedImage: string = '';
  
    // Configuration de position
    currentPositionConfig: PrintPositionConfig | null = null;
  
    constructor(
      private router: Router,
      private printService: PrintService
    ) {}
  
    async ngOnInit(): Promise<void> {
      this.setDefaultDate();
      this.currentPositionConfig = this.printService.getPrintPositionConfig();
      this.onLigneChange();
    }
  
    onPositionConfigUpdated(config: PrintPositionConfig): void {
      this.currentPositionConfig = config;
      this.showSuccessNotification('Configuration de position sauvegardée');
    }
  
    openImageModal(imageUrl: string): void {
      this.selectedImage = imageUrl;
      this.showImageModal = true;
      document.body.style.overflow = 'hidden';
    }
  
    closeImageModal(): void {
      this.showImageModal = false;
      this.selectedImage = '';
      document.body.style.overflow = '';
    }
  
    testSelectedPrinter(): void {
      if (!this.selectedPrinter) {
        this.printerTestResult = 'Veuillez sélectionner une imprimante';
        return;
      }
  
      this.showPrinterTest = true;
      this.printerTestResult = 'Test en cours...';
  
      this.printService.testPrinter(this.selectedPrinter).subscribe({
        next: (response) => {
          this.printerTestResult = response.message;
          if (response.success) {
            this.showSuccessNotification('Test d\'imprimante réussi');
          } else {
            this.showWarningNotification(response.message);
          }
        },
        error: (error) => {
          this.printerTestResult = `Erreur: ${error.error?.message || error.message}`;
          this.showErrorNotification('Erreur lors du test d\'imprimante');
        }
      });
    }
  
    onLigneChange(): void {
      this.selectedReference = '';
      this.codeProduit = '';
      this.numeroProgressive = '';
      this.indice = '';
      this.references = [];
      this.weekChangeDetected = false;
      this.weekChangeInfo = { currentWeek: '', newWeek: '', warning: '' };
      
      if (this.selectedLigne) {
        this.printService.getReferencesByLigne(this.selectedLigne).subscribe({
          next: (response) => {
            if (response.success) {
              this.references = response.data;
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement des références:', error);
            this.errorMessage = 'Erreur de chargement des références';
          }
        });
      }
      
      this.clearError();
    }
  
    onReferenceChange(): void {
      if (this.selectedReference && this.selectedLigne) {
        this.printService.getProductDetails(this.selectedLigne, this.selectedReference).subscribe({
          next: (response) => {
            if (response.success) {
              const product = response.data;
              this.numeroProgressive = product.numeroProgressif;
              this.indice = product.indice;
              this.selectedMode = product.codeFournisseur;
              this.codeProduit = product.fullProductNumber;
              
              // 🆕 Vérifier le changement de semaine
              this.checkWeekChange();
            }
          },
          error: (error) => {
            console.error('Erreur lors du chargement des détails du produit:', error);
            this.errorMessage = 'Erreur de chargement des détails du produit';
          }
        });
      }
      this.clearError();
    }
  
    /**
     * 🆕 Vérifie si la semaine va changer
     */
    private checkWeekChange(): void {
      if (!this.selectedLigne || !this.selectedReference || !this.selectedDate) {
        return;
      }
  
      this.printService.previewProductNumber(
        this.selectedLigne,
        this.selectedReference,
        this.selectedMode,
        this.selectedDate
      ).subscribe({
        next: (response) => {
          if (response && response.success && response.data) {
            const data = response.data;
            
            // Mettre à jour le code produit
            this.codeProduit = data.fullProductNumber;
            this.numeroProgressive = data.nextProgressiveNumber;
            
            // Détecter le changement de semaine
            if (data.weekWillChange === true) {
              this.weekChangeDetected = true;
              this.weekChangeInfo = {
                currentWeek: data.currentWeek || '',
                newWeek: data.newWeek || '',
                warning: data.warning || 'Nouvelle semaine détectée'
              };
              console.log('⚠️ Changement de semaine:', this.weekChangeInfo);
            } else {
              this.weekChangeDetected = false;
              this.weekChangeInfo = { currentWeek: '', newWeek: '', warning: '' };
            }
          }
        },
        error: (error) => {
          console.error('Erreur prévisualisation:', error);
          this.weekChangeDetected = false;
          this.weekChangeInfo = { currentWeek: '', newWeek: '', warning: '' };
        }
      });
    }
  
    /**
     * 🆕 Appelée quand la date change
     */
    onDateChange(): void {
      this.checkWeekChange();
    }
  
    async onPrint(): Promise<void> {
      if (!this.isFormValid()) {
        this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
        return;
      }
  
      if (!this.selectedPrinter && this.availablePrinters.length > 0) {
        this.errorMessage = 'Veuillez sélectionner une imprimante TSC compatible';
        return;
      }
  
      if (this.selectedPrinter) {
        this.printService.updatePrintConfig({ printerName: this.selectedPrinter });
      }
  
      this.showPrintDialog = true;
    }
  
    async confirmPrint(): Promise<void> {
      if (!this.matricule) {
        this.errorMessage = 'Le matricule est obligatoire';
        return;
      }
  
      this.isLoading = true;
  
      const printRequest: PrintTicketRequest = {
        ligne: this.selectedLigne,
        reference: this.selectedReference,
        quantity: this.quantite,
        matricule: this.matricule,
        printDate: this.selectedDate,
        codeFournisseur: this.selectedMode
      };
  
      try {
        this.printService.printTickets(printRequest).subscribe({
          next: (response) => {
            if (response && response.success) {
              console.log('Impression réussie:', response);
              
              // 🆕 Vérifier changement de semaine
              if (response.data.summary.weekInfo?.changed) {
                this.showSuccessNotification(
                  `Tickets imprimés - ${response.data.summary.weekInfo.message}`
                );
              }
              
              this.printService.setLastPrintResult(response);
              this.printResult = response;
              this.printedTickets = response.data.tickets;
              this.showPrintResult = true;
              
              this.printService.printWithTSPL(response.data.tickets, this.parallelTickets)
                .then((printResponse) => {
                  if (printResponse.success) {
                    this.showSuccessNotification(`Tickets imprimés sur ${this.selectedPrinter}`);
                  }
                })
                .catch((printError) => {
                  console.error('Erreur impression:', printError);
                });
              
              this.resetForm();
              this.showPrintDialog = false;
            }
          },
          error: (error) => {
            console.error('Erreur d\'impression:', error);
            this.errorMessage = error.error?.message || 'Erreur lors de l\'impression';
            this.showErrorNotification(this.errorMessage);
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      } catch (error: any) {
        console.error('Erreur:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'impression';
        this.isLoading = false;
      }
    }
  
    closePrintResult(): void {
      this.showPrintResult = false;
      this.printResult = null;
      this.printedTickets = [];
    }
  
    private isFormValid(): boolean {
      return !!(
        this.selectedLigne &&
        this.selectedReference &&
        this.selectedDate &&
        this.matricule &&
        this.quantite > 0
      );
    }
  
    private clearError(): void {
      this.errorMessage = '';
    }
  
    private setDefaultDate(): void {
      const today = new Date();
      this.selectedDate = today.toISOString().split('T')[0];
    }
  
    private resetForm(): void {
      this.selectedLigne = 'L33:COM XT5';
      this.selectedReference = '';
      this.codeProduit = '';
      this.numeroProgressive = '';
      this.quantite = 1;
      this.matricule = '';
      this.indice = '';
      this.selectedMode = 'M0';
      this.weekChangeDetected = false;
      this.weekChangeInfo = { currentWeek: '', newWeek: '', warning: '' };
    }
  
    closePrintDialog(): void {
      this.showPrintDialog = false;
    }
  
    onCancel(): void {
      this.resetForm();
    }
  
    goBack(): void {
      this.router.navigate(['/CHXT5']);
    }
  
    private showSuccessNotification(message: string): void {
      console.log('SUCCESS:', message);
    }
  
    private showWarningNotification(message: string): void {
      console.log('WARNING:', message);
    }
  
    private showErrorNotification(message: string): void {
      console.error('ERROR:', message);
    }
}
