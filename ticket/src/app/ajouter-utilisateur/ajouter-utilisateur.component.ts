import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User, UserService,CreateUserDto , UpdateUserDto } from './user.service';

@Component({
  selector: 'app-ajouter-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ajouter-utilisateur.component.html',
  styleUrls: ['./ajouter-utilisateur.component.css']
})
export class AjouterUtilisateurComponent implements OnInit {
  userForm: FormGroup;
  users: User[] = [];
  isEditing = false;
  editingUserId: number | null = null;
  showUsersList = false;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
    });
  }

  trackByUserId(index: number, user: any): number {
    return user.id; // ou user._id selon votre structure de données
  }

  ngOnInit() {
    this.loadUsers();
  }

  // Charger tous les utilisateurs
  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Soumettre le formulaire
  onSubmit() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.userForm.value;

    if (this.isEditing && this.editingUserId) {
      this.updateUser(formData);
    } else {
      this.addUser(formData);
    }
  }

  // Ajouter un nouvel utilisateur
  addUser(userData: CreateUserDto) {
    this.userService.createUser(userData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message;
        this.resetForm();
        this.loadUsers(); // Recharger la liste
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.handleError(error, 'création');
      }
    });
  }

  // Mettre à jour un utilisateur
  updateUser(userData: UpdateUserDto) {
    if (!this.editingUserId) return;

    this.userService.updateUser(this.editingUserId, userData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message;
        this.resetForm();
        this.loadUsers(); // Recharger la liste
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.handleError(error, 'mise à jour');
      }
    });
  }

  // Préparer l'édition d'un utilisateur
  editUser(user: User) {
    this.isEditing = true;
    this.editingUserId = user.id;
    this.showUsersList = false;
    
    this.userForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      password: '' // Laisser vide pour la sécurité
    });

    // Retirer la validation required pour le mot de passe en mode édition
    this.userForm.get('password')?.setValidators([Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  // Supprimer un utilisateur
  deleteUser(userId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(userId).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadUsers(); // Recharger la liste
          
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.handleError(error, 'suppression');
        }
      });
    }
  }

  // Activer/Désactiver un utilisateur
  toggleUserStatus(user: User) {
    const action = user.isActive ? 'désactiver' : 'activer';
    
    if (confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      const observable = user.isActive 
        ? this.userService.deactivateUser(user.id)
        : this.userService.activateUser(user.id);

      observable.subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadUsers(); // Recharger la liste
          
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.handleError(error, 'changement de statut');
        }
      });
    }
  }

  // Gérer les erreurs
  private handleError(error: any, action: string) {
    console.error(`Erreur lors de la ${action}:`, error);
    
    if (error.status === 409) {
      this.errorMessage = 'Un utilisateur avec ce nom existe déjà';
    } else if (error.status === 404) {
      this.errorMessage = 'Utilisateur non trouvé';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = `Erreur lors de la ${action} de l'utilisateur`;
    }
    
    setTimeout(() => this.errorMessage = '', 5000);
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.userForm.reset();
    this.isEditing = false;
    this.editingUserId = null;
    
    // Remettre la validation required pour le mot de passe
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  // Annuler l'édition
  cancelEdit() {
    this.resetForm();
    this.showUsersList = true;
  }

  // Basculer l'affichage de la liste
  toggleUsersList() {
    this.showUsersList = !this.showUsersList;
    if (!this.showUsersList) {
      this.resetForm();
    }
  }

  // Marquer tous les champs comme touchés pour afficher les erreurs
  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Vérifier si un champ a une erreur
  hasError(fieldName: string, errorType?: string): boolean {
    const control = this.userForm.get(fieldName);
    if (errorType) {
      return control?.hasError(errorType) && control?.touched || false;
    }
    return control?.invalid && control?.touched || false;
  }

  // Obtenir le message d'erreur pour un champ
  getErrorMessage(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return this.getFieldLabel(fieldName) + ' est requis';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return this.getFieldLabel(fieldName) + ` doit contenir au moins ${minLength} caractères`;
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return this.getFieldLabel(fieldName) + ` ne peut pas dépasser ${maxLength} caractères`;
    }
    
    return '';
  }

  // Obtenir le label du champ
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Le nom',
      prenom: 'Le prénom',
      password: 'Le mot de passe'
    };
    return labels[fieldName] || fieldName;
  }

  // Formater la date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  // Navigation de retour
  goBack() {
    this.router.navigate(['/side']);
  }
}