import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegisterService } from './register.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  admin = {
    nom: '',
    prenom: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSuccess = false;

  constructor(
    private router: Router,
    private registerService: RegisterService
  ) {}

  onSubmit() {
    // Réinitialiser les messages
    this.errorMessage = '';
    this.successMessage = '';
    this.isSuccess = false;

    // Validation
    if (!this.admin.nom || !this.admin.prenom || !this.admin.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.admin.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isLoading = true;

    this.registerService.register(this.admin).subscribe({
      next: (response) => {
        console.log('Admin créé avec succès:', response);
        this.isLoading = false;
        this.isSuccess = true;
        this.successMessage = `${response.message} - Redirection dans 2 secondes...`;
        
        // Redirection après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { 
              registered: 'true',
              nom: this.admin.nom 
            }
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        this.isLoading = false;
        this.isSuccess = false;
        
        if (error.status === 409) {
          this.errorMessage = '❌ Un admin avec ce nom existe déjà';
        } else if (error.status === 400) {
          this.errorMessage = '❌ Données invalides. Vérifiez les champs.';
        } else if (error.error?.message) {
          this.errorMessage = `❌ ${error.error.message}`;
        } else {
          this.errorMessage = '❌ Erreur lors de la création du compte. Veuillez réessayer.';
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.admin = { nom: '', prenom: '', password: '' };
    this.errorMessage = '';
    this.successMessage = '';
    this.isSuccess = false;
  }
}