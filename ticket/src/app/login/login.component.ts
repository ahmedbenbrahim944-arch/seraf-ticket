import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  userType: 'admin' | 'user' = 'admin';
  
  loginData = {
    nom: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false; // Nouvelle propriété pour gérer l'affichage du mot de passe

  constructor(private router: Router, private authService: AuthService) {}

  setUserType(type: 'admin' | 'user') {
    this.userType = type;
    this.errorMessage = '';
    this.successMessage = '';
  }

   togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.loginData.nom || !this.loginData.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;

    if (this.userType === 'admin') {
      this.authService.adminLogin(this.loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Connexion admin réussie!';
          setTimeout(() => {
            this.router.navigate(['/side']);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Erreur de connexion';
        }
      });
    } else {
      this.authService.userLogin(this.loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Connexion utilisateur réussie!';
          setTimeout(() => {
            this.router.navigate(['/sideus']);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Erreur de connexion';
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}