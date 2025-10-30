import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../ajouter-produit/product.service';
import { UpdateProductDto } from '../shared/interfaces/product.interface';
import { ApiResponse } from '../ajouter-utilisateur/user.service';

@Component({
  selector: 'app-modifier-produit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modifier-produit.component.html',
  styleUrls: ['./modifier-produit.component.css']
})
export class ModifierProduitComponent implements OnInit {
  productForm: FormGroup;
  isSubmitting = false;
  serverError = '';
  successMessage = '';
  isLoading = true;

  // Options dynamiques
  ligneOptions: { value: string, label: string }[] = [];
  availableReferences: { value: string, label: string }[] = [];
  fournisseurOptions = [
    { value: 'M0', label: 'M0' },
    { value: 'M1', label: 'M1' }
  ];
  typeTicketOptions = [
    { value: '30x15', label: 'Ticket 30*15' },
    { value: '17x20', label: 'Ticket 20*10' },
    { value: '15x8', label: 'Ticket 17*7' }
  ];

  // Données originales du produit
  originalLigne: string = '';
  originalReference: string = '';
  productId: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      ligne: ['', [Validators.required]],
      reference: ['', [Validators.required]],
      codeProduit: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      date: ['', [Validators.required]],
      numeroProgresse: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      fournisseur: ['', [Validators.required]],
      indice: ['', [Validators.required, Validators.maxLength(10)]],
      typeTicket: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    console.group('🔄 Initialisation du composant ModifierProduit');
    
    // Charger les options dynamiques
    this.loadLigneOptions();
    
    // Écouter les changements de ligne pour charger les références
    this.productForm.get('ligne')?.valueChanges.subscribe(ligne => {
      console.log('📝 Ligne modifiée:', ligne);
      this.onLigneChange(ligne);
    });

    // Écouter les changements de référence pour charger automatiquement les données
    this.productForm.get('reference')?.valueChanges.subscribe(reference => {
      const ligne = this.productForm.get('ligne')?.value;
      console.log('📝 Référence modifiée:', reference, 'pour la ligne:', ligne);
      if (ligne && reference) {
        this.loadProductDataBySelection(ligne, reference);
      }
    });

    // Charger les données du produit initial
    this.loadInitialProductData();
    
    console.groupEnd();
  }

  // Charger les options de ligne depuis l'API
  loadLigneOptions() {
    console.log('📡 Chargement des options de ligne...');
    
    this.productService.getAvailableLignes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ligneOptions = response.data.map(ligne => ({ value: ligne, label: ligne }));
          console.log('✅ Options de ligne chargées:', this.ligneOptions.length, 'lignes');
        } else {
          console.warn('⚠️ Réponse API sans données:', response);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des lignes:', error);
        this.serverError = 'Erreur lors du chargement des options de ligne';
        setTimeout(() => this.serverError = '', 5000);
      }
    });
  }

  // Charger les références quand la ligne change
  onLigneChange(ligne: string) {
    console.log('🔄 Chargement des références pour la ligne:', ligne);
    
    if (ligne) {
      this.productService.getReferencesByLigne(ligne).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availableReferences = response.data.map(ref => ({ value: ref, label: ref }));
            console.log('✅ Références chargées:', this.availableReferences.length, 'références');
            
            // Réinitialiser la sélection de référence quand la ligne change
            this.productForm.patchValue({ reference: '' });
          } else {
            console.warn('⚠️ Aucune référence trouvée pour la ligne:', ligne);
            this.availableReferences = [];
            this.productForm.patchValue({ reference: '' });
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des références:', error);
          this.availableReferences = [];
          this.productForm.patchValue({ reference: '' });
          this.serverError = 'Erreur lors du chargement des références';
          setTimeout(() => this.serverError = '', 5000);
        }
      });
    } else {
      this.availableReferences = [];
      this.productForm.patchValue({ reference: '' });
      console.log('🧹 Références vidées (ligne non sélectionnée)');
    }
  }

  // Charger les données initiales du produit depuis les paramètres de route
  loadInitialProductData() {
    const ligne = this.route.snapshot.paramMap.get('ligne');
    const reference = this.route.snapshot.paramMap.get('reference');

    console.log('📥 Paramètres de route - Ligne:', ligne, 'Référence:', reference);

    if (ligne && reference) {
      this.originalLigne = ligne;
      this.originalReference = reference;

      // Pré-remplir la ligne et la référence
      this.productForm.patchValue({
        ligne: ligne,
        reference: reference
      });

      // Charger les données du produit
      this.loadProductDataBySelection(ligne, reference);
    } else {
      console.error('❌ Paramètres manquants dans l\'URL');
      this.serverError = 'Ligne ou référence manquante dans l\'URL';
      this.isLoading = false;
      setTimeout(() => this.serverError = '', 5000);
    }
  }

  // Charger les données du produit basé sur la sélection ligne/référence
  loadProductDataBySelection(ligne: string, reference: string) {
    console.log('📡 Chargement des données du produit pour:', ligne, '/', reference);
    
    this.isLoading = true;
    this.serverError = '';
    
    this.productService.getProductByLigneAndReference(ligne, reference).subscribe({
      next: (response) => {
        console.group('✅ Données du produit chargées avec succès');
        console.log('📋 Données reçues:', response.data);
        this.populateForm(response.data);
        this.isLoading = false;
        console.log('🎯 Formulaire rempli avec les données du produit');
        console.groupEnd();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du produit:', error);
        this.serverError = 'Erreur lors du chargement du produit ou produit non trouvé';
        this.isLoading = false;
        
        // Réinitialiser les autres champs si le produit n'est pas trouvé
        if (error.status === 404) {
          this.resetFormFields();
        }
        
        setTimeout(() => this.serverError = '', 5000);
      }
    });
  }

  // Remplir le formulaire avec les données du produit
  populateForm(product: any) {
    console.group('📝 Remplissage du formulaire');
    
    // Convertir la date du format API vers le format HTML (YYYY-MM-DD)
    const formattedDate = this.convertDateToHtmlFormat(product.createdAt);
    
    console.log('📅 Date convertie:', product.createdAt, '→', formattedDate);
    
    this.productForm.patchValue({
      codeProduit: product.uniqueProductId.toString(),
      date: formattedDate,
      numeroProgresse: parseInt(product.numeroProgressif),
      fournisseur: product.codeFournisseur,
      indice: product.indice,
      typeTicket: product.typeTicket
    });

    console.log('✅ Formulaire rempli avec les valeurs:', this.productForm.value);
    console.groupEnd();
  }

  // Réinitialiser les champs du formulaire (sauf ligne et référence)
  resetFormFields() {
    console.log('🔄 Réinitialisation des champs du formulaire');
    
    this.productForm.patchValue({
      codeProduit: '',
      date: '',
      numeroProgresse: '',
      fournisseur: '',
      indice: '',
      typeTicket: ''
    });
  }

  // Convertir la date pour l'input HTML
  private convertDateToHtmlFormat(dateString: string): string {
    if (dateString) {
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.warn('⚠️ Erreur de conversion de date:', dateString, error);
        return '';
      }
    }
    return '';
  }

  // Soumettre le formulaire
  onSubmit() {
    console.group('🚀 Soumission du formulaire de modification');
    
    if (this.productForm.valid) {
      this.isSubmitting = true;
      this.serverError = '';
      this.successMessage = '';

      const formData = this.productForm.value;
      console.log('📋 Données du formulaire:', formData);
      
      // Préparer les données pour l'API
      const updateData: UpdateProductDto = {
        ligne: formData.ligne,
        reference: formData.reference,
        uniqueProductId: parseInt(formData.codeProduit),
        dateInput: this.formatDateForAPI(formData.date),
        numeroProgressif: parseInt(formData.numeroProgresse),
        codeFournisseur: formData.fournisseur,
        indice: formData.indice,
        typeTicket: formData.typeTicket
      };

      console.log('📤 Données préparées pour l\'API:', updateData);

      this.productService.updateProduct(updateData).subscribe({
        next: (response) => {
          console.group('✅ Produit modifié avec succès');
          console.log('📨 Réponse API:', response);
          this.isSubmitting = false;
          this.successMessage = response.message || 'Produit modifié avec succès!';
          
          // Mettre à jour les valeurs originales si la ligne ou référence a changé
          if (formData.ligne !== this.originalLigne || formData.reference !== this.originalReference) {
            console.log('🔄 Mise à jour des identifiants originaux');
            this.originalLigne = formData.ligne;
            this.originalReference = formData.reference;
          }

          console.log('⏰ Redirection dans 3 secondes...');
          // Rediriger après 3 secondes
          setTimeout(() => {
            console.log('➡️ Navigation vers la liste des produits');
            this.router.navigate(['/admin/products']);
          }, 3000);
          console.groupEnd();
        },
        error: (error) => {
          console.group('❌ Erreur lors de la modification');
          this.isSubmitting = false;
          this.handleError(error);
          console.groupEnd();
        }
      });
    } else {
      console.warn('❌ Formulaire invalide - Marquage des champs');
      this.markFormGroupTouched();
      console.log('🔍 État de validation des champs:');
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        console.log(`  ${key}: valid=${control?.valid}, errors=`, control?.errors);
      });
    }
    
    console.groupEnd();
  }

  private formatDateForAPI(date: string): string {
    console.log('📅 Formatage de la date pour l\'API:', date);
    
    if (date) {
      try {
        const [year, month, day] = date.split('-');
        const formatted = `${day}/${month}/${year}`;
        console.log('✅ Date formatée:', formatted);
        return formatted;
      } catch (error) {
        console.error('❌ Erreur de formatage de date:', error);
        return '';
      }
    }
    return '';
  }

  private handleError(error: any) {
    console.error('💥 Erreur détaillée:', error);
    
    if (error.status === 404) {
      this.serverError = 'Produit non trouvé';
    } else if (error.status === 400) {
      this.serverError = error.error?.message || 'Données invalides';
    } else if (error.status === 409) {
      this.serverError = 'Un produit avec ces informations existe déjà';
    } else if (error.error?.message) {
      this.serverError = error.error.message;
    } else {
      this.serverError = 'Erreur lors de la modification du produit. Veuillez réessayer.';
    }
    
    console.log('⚠️ Message d\'erreur affiché:', this.serverError);
    setTimeout(() => {
      this.serverError = '';
      console.log('🧹 Message d\'erreur effacé');
    }, 5000);
  }

  private markFormGroupTouched() {
    console.log('🎯 Marquage de tous les champs comme touchés');
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });
  }

  onCancel() {
    console.log('❌ Annulation - Retour à la liste des produits');
    this.router.navigate(['/admin/products']);
  }

  onBack() {
    console.log('⬅️ Retour à la page précédente');
    window.history.back();
  }

  // Méthodes helper pour la validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    const isInvalid = !!(field && field.invalid && (field.dirty || field.touched));
    
    if (isInvalid) {
      console.debug(`❌ Champ ${fieldName} invalide:`, field?.errors);
    }
    
    return isInvalid;
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
      if (field.errors['pattern']) {
        return `${this.getFieldLabel(fieldName)} doit contenir uniquement des chiffres`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${maxLength} caractères`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      ligne: 'Ligne',
      reference: 'Référence',
      codeProduit: 'Code Produit',
      date: 'Date',
      numeroProgresse: 'N° Progresse',
      fournisseur: 'Fournisseur',
      indice: 'Indice',
      typeTicket: 'Type Ticket'
    };
    return labels[fieldName] || fieldName;
  }

  // Méthode de débogage
  debugFormState() {
    console.group('🐛 État du formulaire de débogage');
    console.log('Valid:', this.productForm.valid);
    console.log('Invalid:', this.productForm.invalid);
    console.log('Pristine:', this.productForm.pristine);
    console.log('Dirty:', this.productForm.dirty);
    console.log('Touched:', this.productForm.touched);
    console.log('Valeurs:', this.productForm.value);
    console.log('Erreurs:', this.productForm.errors);
    console.groupEnd();
  }
}