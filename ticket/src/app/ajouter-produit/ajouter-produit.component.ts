import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService,  } from './product.service';
import { CreateProductDto } from '../shared/interfaces/product.interface';

@Component({
  selector: 'app-ajouter-produit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ajouter-produit.component.html',
  styleUrls: ['./ajouter-produit.component.css']
})
export class AjouterProduitComponent implements OnInit {
  productForm: FormGroup;
  isSubmitting = false;
  serverError = '';
  successMessage = '';

  fournisseurOptions = [
    { value: 'M0', label: 'M0' },
    { value: 'M1', label: 'M1' }
  ];

  typeTicketOptions = [
    { value: '30*15', label: 'Ticket 30*15mm' },
    { value: '17x20', label: 'Ticket 20*10mm' },
    { value: '17x7', label: 'Ticket 17*7mm' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      ligne: ['', [Validators.required, Validators.maxLength(50)]],
      reference: ['', [Validators.required]],
      codeProduit: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      date: ['', [Validators.required]],
      numeroProgresse: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      fournisseur: ['', [Validators.required]],
      indice: ['', [Validators.required, Validators.maxLength(10)]],
      typeTicket: ['', [Validators.required]]
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.productForm.valid) {
      this.isSubmitting = true;
      this.serverError = '';
      this.successMessage = '';

      const formData = this.productForm.value;
      
      // Préparer les données pour l'API
      const productData: CreateProductDto = {
        ligne: formData.ligne,
        reference: formData.reference,
        uniqueProductId: parseInt(formData.codeProduit),
        dateInput: this.formatDateForAPI(formData.date),
        numeroProgressif: parseInt(formData.numeroProgresse),
        codeFournisseur: formData.fournisseur,
        indice: formData.indice,
        typeTicket: formData.typeTicket
      };

      this.productService.createProduct(productData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.successMessage = response.message;
          
          // Réinitialiser le formulaire après succès
          setTimeout(() => {
            this.resetForm();
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.handleError(error);
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched();
    }
  }

  private formatDateForAPI(date: string): string {
    // Convertir la date du format YYYY-MM-DD (HTML) vers DD/MM/YYYY (API)
    if (date) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }
    return '';
  }

  private handleError(error: any) {
    console.error('Erreur lors de la création du produit:', error);
    
    if (error.status === 409) {
      this.serverError = 'Un produit avec cette ligne et référence existe déjà';
    } else if (error.status === 400) {
      this.serverError = error.error?.message || 'Données invalides';
    } else if (error.error?.message) {
      this.serverError = error.error.message;
    } else {
      this.serverError = 'Erreur lors de la création du produit. Veuillez réessayer.';
    }
    
    setTimeout(() => this.serverError = '', 5000);
  }

  private markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });
  }

  private resetForm() {
    this.productForm.reset();
    // Réinitialiser les validators
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.setErrors(null);
    });
  }

  onCancel() {
    this.router.navigate(['/admin/dashboard']);
  }

  onBack() {
    window.history.back();
  }

  // Méthodes helper pour la validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
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
}