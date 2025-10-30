
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrintService , PrintTicketRequest , PrinterInfo , PrintPositionConfig  } from './print.service';

@Component({
  selector: 'app-xt4',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './xt4.component.html',
  styleUrls: ['./xt4.component.css']
})
export class Xt4Component implements OnInit {

  // Propriétés du formulaire
  selectedLigne: string = 'L32:GBXT4'; // Ligne fixe pour XT4
  selectedReference: string = '';
  codeProduit: string = '';
  selectedDate: string = '';
  numeroProgressive: string = '';
  selectedMode: string = 'M0';
  indice: string = '';
  quantite: number = 1;
  showPositionConfig = false;

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

  showImageModal: boolean = false;
  selectedImage: string = '';

  // Propriétés pour les résultats d'impression
  showPrintResult: boolean = false;
  printResult: any = null;
  printedTickets: any[] = [];

  // Configuration de position
  currentPositionConfig: PrintPositionConfig | null = null;

  constructor(
    private router: Router,
    private printService: PrintService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadPrinters();
    this.setDefaultDate();
    this.currentPositionConfig = this.printService.getPrintPositionConfig();
    
    // Charger automatiquement les références pour la ligne L32:GBXT4
    this.onLigneChange();
  }

  /**
   * Charge la liste des imprimantes disponibles
   */
  private async loadPrinters(): Promise<void> {
    try {
      this.printService.getAvailablePrinters().subscribe({
        next: (response) => {
          if (response.success) {
            this.availablePrinters = response.data;
            
            // Sélectionner automatiquement l'imprimante par défaut ou TSC
            const defaultPrinter = this.availablePrinters.find(p => p.isDefault || p.isTSC);
            if (defaultPrinter) {
              this.selectedPrinter = defaultPrinter.name;
            }
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des imprimantes:', error);
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des imprimantes:', error);
    }
  }

   openImageModal(imageUrl: string): void {
    this.selectedImage = imageUrl;
    this.showImageModal = true;
    // Empêcher le défilement de la page en arrière-plan
    document.body.style.overflow = 'hidden';
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = '';
    // Rétablir le défilement
    document.body.style.overflow = '';
  }

  /**
   * Test de l'imprimante sélectionnée
   */
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
    
    // Charger les références directement pour la ligne fixe L32:GBXT4
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

    // Vérifier qu'une imprimante est sélectionnée
    if (!this.selectedPrinter && this.availablePrinters.length > 0) {
      this.errorMessage = 'Veuillez sélectionner une imprimante TSC compatible';
      return;
    }

    // Mettre à jour la configuration de l'imprimante
    if (this.selectedPrinter) {
      this.printService.updatePrintConfig({ printerName: this.selectedPrinter });
    }

    this.showPrintDialog = true;
  }

  async confirmPrint(): Promise<void> {
    this.isLoading = true;

    const printRequest: PrintTicketRequest = {
      ligne: this.selectedLigne,
      reference: this.selectedReference,
      quantity: this.quantite,
      printDate: this.selectedDate,
      codeFournisseur: this.selectedMode,
      codeType: 'DATAMATRIX'
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
            
            // Stocker le résultat de l'impression
            this.printService.setLastPrintResult(response);
            this.printResult = response;
            this.printedTickets = response.data.tickets;
            
            // Afficher les résultats
            this.showPrintResult = true;
            
            // IMPRESSION RÉELLE avec TSC TE200 - Format XT4
            this.printService.printWithLineTSPL(response.data.tickets, this.parallelTickets)
              .then((printResponse) => {
                if (printResponse.success) {
                  this.showSuccessNotification(`Tickets XT4 imprimés avec succès sur ${this.selectedPrinter}`);
                } else {
                  this.showWarningNotification(`Impression: ${printResponse.message}`);
                }
              })
              .catch((printError) => {
                console.error('Erreur impression TSPL:', printError);
                this.showWarningNotification('Tickets générés mais erreur d\'impression physique.');
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
      console.error('Erreur d\'impression:', error);
      this.errorMessage = error.error?.message || 'Erreur lors de l\'impression';
      this.isLoading = false;
      this.showErrorNotification(this.errorMessage);
    }
  }

  // Fermer l'affichage des résultats
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
    // Ne pas réinitialiser la ligne sélectionnée
    this.selectedReference = '';
    this.codeProduit = '';
    this.numeroProgressive = '';
    this.quantite = 1;
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
    this.router.navigate(['/sideus']);
  }

  /**
   * Méthodes de notification
   */
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
