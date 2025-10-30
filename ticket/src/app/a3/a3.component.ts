import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { A3PrintService, A3PrintTicketRequest } from './a3-print.service';

@Component({
  selector: 'app-a3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './a3.component.html',
  styleUrls: ['./a3.component.css']
})
export class A3Component implements OnInit {
  // Propriétés du formulaire
  selectedLigne: string = 'L15:MT5A3';
  selectedReference: string = '';
  champS: string = ''; // Préfixe A3, T5, etc.
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
    private a3PrintService: A3PrintService
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
    this.a3PrintService.getAvailableLignes().subscribe({
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
      this.a3PrintService.getReferencesByLigne(this.selectedLigne).subscribe({
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
      this.a3PrintService.getProductDetails(this.selectedLigne, this.selectedReference).subscribe({
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

  onChampSChange(): void {
    this.previewSimpleNum();
  }

  onDateChange(): void {
    this.previewSimpleNum();
  }

  /**
   * Prévisualise le SimpleNum au format PREFIX/XXX/SWW
   */
  private previewSimpleNum(): void {
    if (!this.selectedLigne || !this.selectedReference || !this.selectedDate) {
      return;
    }

    // Validation du préfixe
    if (!this.champS || this.champS.trim().length === 0) {
      this.simpleNumPreview = '';
      return;
    }

    this.a3PrintService.previewProductNumber(
      this.selectedLigne,
      this.selectedReference,
      undefined,
      this.selectedDate,
      this.champS // Passer le préfixe
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
   * Génère le SimpleNum pour prévisualisation au format PREFIX/XXX/SWW
   */
  private generateSimpleNumPreview(data: any): void {
    if (!this.selectedReference || !data.semaine || !this.champS) {
      console.warn('⚠️ Données manquantes pour générer SimpleNum preview');
      this.simpleNumPreview = '';
      return;
    }

    try {
      // Extraire les 3 derniers chiffres de la référence
      const refDigits = this.selectedReference.replace(/\D/g, '');
      const lastThreeRef = refDigits.slice(-3).padStart(3, '0');
      
      // Formater la semaine: S + 2 chiffres
      const weekFormatted = `S${data.semaine.padStart(2, '0')}`;
      
      // Préfixe en majuscules
      const prefixUpperCase = this.champS.trim().toUpperCase();
      
      // Format final: PREFIX/XXX/SWW
      this.simpleNumPreview = `${prefixUpperCase}/${lastThreeRef}/${weekFormatted}`;
      
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

    const printRequest: A3PrintTicketRequest = {
      ligne: this.selectedLigne,
      reference: this.selectedReference,
      quantity: this.quantite,
      printDate: this.selectedDate,
      codeType: 'NUM',
      champS: this.champS.trim().toUpperCase()
    };

    console.log('🖨️ Démarrage impression SimpleNum A3:', printRequest);

    try {
      this.a3PrintService.printTickets(printRequest).subscribe({
        next: async (response) => {
          console.log('📦 Réponse du serveur:', response);
          
          if (response && response.success) {
            console.log('✅ Impression réussie, tickets reçus:', response.data.tickets.length);
            
            // Sauvegarder les résultats dans le service
            this.a3PrintService.setLastPrintResult(response);
            
            // Sauvegarder localement
            this.printResult = response;
            this.printedTickets = response.data.tickets;
            
            console.log('📝 Tickets sauvegardés:', this.printedTickets);
            
            // 🔥 IMPRESSION DIRECTE AVEC TSPL
            try {
              console.log('🖨️ Envoi à l\'imprimante...');
              await this.a3PrintService.printWithLineTSPL(this.printedTickets, 1);
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
    
    // Si c'est dans codeImage (data:text/plain)
    if (ticket.codeImage && ticket.codeType === 'SIMPLENUM') {
      try {
        const dataUrl = ticket.codeImage;
        
        // Format: data:text/plain;charset=utf-8,A3%2F808%2FS42
        if (dataUrl.startsWith('data:text/plain;charset=utf-8,')) {
          const encoded = dataUrl.replace('data:text/plain;charset=utf-8,', '');
          const decoded = decodeURIComponent(encoded);
          console.log('✅ SimpleNum décodé:', decoded);
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
        return 'Erreur décodage';
      }
    }
    
    // Fallback: construire depuis les données du ticket
    if (ticket.champS && ticket.reference && ticket.printDate) {
      try {
        const refDigits = ticket.reference.replace(/\D/g, '');
        const lastThree = refDigits.slice(-3).padStart(3, '0');
        
        // Extraire semaine de printDate
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
    
    return ticket.fullProductNumber || 'N/A';
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

  closePrintResult(): void {
    this.showPrintResult = false;
    this.printResult = null;
    this.printedTickets = [];
  }

  private isFormValid(): boolean {
    const isValid = !!(
      this.selectedLigne &&
      this.selectedReference &&
      this.champS &&
      this.champS.trim().length > 0 &&
      this.selectedDate &&
      this.quantite > 0
    );
    
    console.log('📋 Validation formulaire:', {
      ligne: this.selectedLigne,
      reference: this.selectedReference,
      champS: this.champS,
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
    this.champS = '';
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