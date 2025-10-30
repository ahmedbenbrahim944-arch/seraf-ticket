import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrintService, PrintTicketRequest } from './print.service';

@Component({
  selector: 'app-xt3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './xt3.component.html',
  styleUrls: ['./xt3.component.css']
})
export class Xt3Component implements OnInit {
  // Propriétés du formulaire
  selectedLigne: string = 'L22:GBXT3';
  selectedReference: string = '';
  simpleNumPreview: string = '';
  selectedDate: string = '';
  quantite: number = 1;

  // Données des listes
  lignes: string[] = [];
  references: string[] = [];

  // Changement de semaine
  weekChangeDetected: boolean = false;
  weekChangeInfo: any = {};

   showImageModal: boolean = false;
  selectedImage: string = '';

  // État de l'application
  isLoading: boolean = false;
  errorMessage: string = '';
  showPrintResult: boolean = false;
  printResult: any = null;
  printedTickets: any[] = [];

  constructor(
    private router: Router,
    private printService: PrintService
  ) {}

  async ngOnInit(): Promise<void> {
    this.setDefaultDate();
    this.loadLignes();
    this.onLigneChange();
  }

  private setDefaultDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  private loadLignes(): void {
    this.printService.getAvailableLignes().subscribe({
      next: (response) => {
        if (response.success) {
          this.lignes = response.data;
          console.log('✅ Lignes chargées:', this.lignes);
        }
      },
      error: (error) => {
        console.error('❌ Erreur chargement lignes:', error);
        this.errorMessage = 'Erreur de chargement des lignes';
      }
    });
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

  onLigneChange(): void {
    this.selectedReference = '';
    this.simpleNumPreview = '';
    this.references = [];
    this.weekChangeDetected = false;

    if (this.selectedLigne) {
      this.printService.getReferencesByLigne(this.selectedLigne).subscribe({
        next: (response) => {
          if (response.success) {
            this.references = response.data;
            console.log('✅ Références chargées:', this.references);
          }
        },
        error: (error) => {
          console.error('❌ Erreur chargement références:', error);
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
            console.log('✅ Détails produit chargés:', product);
            
            // Prévisualiser le SimpleNum
            this.previewSimpleNum();
          }
        },
        error: (error) => {
          console.error('❌ Erreur chargement détails produit:', error);
          this.errorMessage = 'Erreur de chargement des détails';
        }
      });
    }
    this.clearError();
  }

  onDateChange(): void {
    this.previewSimpleNum();
  }

  /**
   * Prévisualise le SimpleNum
   */
  private previewSimpleNum(): void {
    if (!this.selectedLigne || !this.selectedReference || !this.selectedDate) {
      return;
    }

    this.printService.previewProductNumber(
      this.selectedLigne,
      this.selectedReference,
      undefined,
      this.selectedDate
    ).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const data = response.data;
          
          console.log('✅ Preview data:', data);
          
          // Générer le SimpleNum pour prévisualisation
          this.generateSimpleNumPreview(data);
          
          // Vérifier changement de semaine
          if (data.weekWillChange === true) {
            this.weekChangeDetected = true;
            this.weekChangeInfo = {
              currentWeek: data.currentWeek || '',
              newWeek: data.newWeek || '',
              warning: data.warning || 'Nouvelle semaine détectée'
            };
            console.log('⚠️ Changement de semaine détecté:', this.weekChangeInfo);
          } else {
            this.weekChangeDetected = false;
          }
        }
      },
      error: (error) => {
        console.error('❌ Erreur prévisualisation:', error);
        this.weekChangeDetected = false;
      }
    });
  }

  /**
   * 🔥 CORRECTION: Génère le SimpleNum pour prévisualisation
   * Format: 3 chiffres ref + 2 chiffres semaine + 2 chiffres année + 3 chiffres société
   */
  private generateSimpleNumPreview(data: any): void {
  if (!this.selectedReference || !data.annee || !data.semaine) {
    console.warn('⚠️ Données manquantes pour générer SimpleNum preview');
    return;
  }

  try {
    const refDigits = this.selectedReference.replace(/\D/g, '');
    const lastThreeRef = refDigits.slice(-3).padStart(3, '0');
    
    const weekTwoDigits = data.semaine.padStart(2, '0');
    
    // CORRECTION: S'assurer que l'année est sur 2 chiffres
    let yearLastTwo = data.annee;
    if (yearLastTwo.length === 1 && /[A-Z]/.test(yearLastTwo)) {
      // Si c'est une lettre, utiliser l'année actuelle
      const currentYear = new Date().getFullYear();
      yearLastTwo = String(currentYear).slice(-2);
    }
    yearLastTwo = String(yearLastTwo).slice(-2).padStart(2, '0');
    
    const companyCode = '897';
    
    this.simpleNumPreview = `${lastThreeRef}${weekTwoDigits}${yearLastTwo}${companyCode}`;
    
    console.log('✅ SimpleNum preview généré:', this.simpleNumPreview);
    
  } catch (error) {
    console.error('❌ Erreur génération SimpleNum preview:', error);
    this.simpleNumPreview = 'ERREUR';
  }
}

  /**
   * 🔥 FONCTION D'IMPRESSION PRINCIPALE
   */
  async onPrint(): Promise<void> {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;
    this.clearError();

    const printRequest: PrintTicketRequest = {
      ligne: this.selectedLigne,
      reference: this.selectedReference,
      quantity: this.quantite,
      printDate: this.selectedDate,
      codeType: 'SIMPLENUM'
    };

    console.log('🖨️ Démarrage impression SimpleNum:', printRequest);

    try {
      this.printService.printTickets(printRequest).subscribe({
        next: async (response) => {
          console.log('📦 Réponse du serveur:', response);
          
          if (response && response.success) {
            console.log('✅ Impression réussie, tickets reçus:', response.data.tickets.length);
            
            // Sauvegarder les résultats dans le service
            this.printService.setLastPrintResult(response);
            
            // Sauvegarder localement
            this.printResult = response;
            this.printedTickets = response.data.tickets;
            
            console.log('📝 Tickets sauvegardés:', this.printedTickets);
            
            // 🔥 IMPRESSION DIRECTE AVEC TSPL
            try {
              console.log('🖨️ Envoi à l\'imprimante...');
              await this.printService.printWithLineTSPL(this.printedTickets, 1);
              console.log('✅ Impression envoyée à l\'imprimante');
            } catch (printError) {
              console.error('⚠️ Erreur impression directe:', printError);
            }
            
            // Afficher le dialogue de résultat
            this.showPrintResult = true;
            
            // Réinitialiser le formulaire
            this.resetForm();
          } else {
            console.error('❌ Réponse invalide:', response);
            this.errorMessage = response.message || 'Erreur lors de l\'impression';
          }
        },
        error: (error) => {
          console.error('❌ Erreur impression SimpleNum:', error);
          this.errorMessage = error.error?.message || 'Erreur lors de l\'impression';
        },
        complete: () => {
          this.isLoading = false;
          console.log('✅ Processus d\'impression terminé');
        }
      });
    } catch (error: any) {
      console.error('❌ Erreur catch:', error);
      this.errorMessage = error.error?.message || 'Erreur lors de l\'impression';
      this.isLoading = false;
    }
  }

  /**
   * Extrait le SimpleNum d'un ticket
   */
  getSimpleNumFromTicket(ticket: any): string {
    // Si le SimpleNum est déjà disponible
    if (ticket.simpleNum) {
      return ticket.simpleNum;
    }
    
    // Si c'est dans codeImage (base64)
    if (ticket.codeImage && ticket.codeType === 'SIMPLENUM') {
      try {
        const base64Data = ticket.codeImage.replace('data:text/plain;base64,', '');
        const decoded = atob(base64Data);
        console.log('✅ SimpleNum décodé:', decoded);
        return decoded;
      } catch (error) {
        console.error('❌ Erreur décodage SimpleNum:', error);
        return 'Erreur décodage';
      }
    }
    
    return ticket.fullProductNumber || 'N/A';
  }

  closePrintResult(): void {
    this.showPrintResult = false;
    this.printResult = null;
    this.printedTickets = [];
  }

  private isFormValid(): boolean {
    const isValid = !!(
      this.selectedLigne &&
      this.selectedReference &&
      this.selectedDate &&
      this.quantite > 0
    );
    
    console.log('📋 Validation formulaire:', {
      ligne: this.selectedLigne,
      reference: this.selectedReference,
      date: this.selectedDate,
      quantite: this.quantite,
      isValid
    });
    
    return isValid;
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  private resetForm(): void {
    this.selectedReference = '';
    this.simpleNumPreview = '';
    this.quantite = 1;
    this.weekChangeDetected = false;
    console.log('🔄 Formulaire réinitialisé');
  }

  onCancel(): void {
    this.resetForm();
  }

  goBack(): void {
    this.router.navigate(['/sideus']);
  }
}