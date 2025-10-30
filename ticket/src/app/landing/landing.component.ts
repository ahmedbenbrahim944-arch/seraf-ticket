// landing.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from '../register/register.component';
import { SignatureComponent } from './signature/signature.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RegisterComponent,RouterModule,SignatureComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  activeButton: string = '';

  constructor(private router: Router) {}

  onConnect(): void {
    this.activeButton = 'connect';
    
    // Effet visuel avant la navigation
    setTimeout(() => {
      // Navigation vers la page de connexion
      // this.router.navigate(['/login']);
      console.log('Navigation vers la page de connexion');
    }, 200);
  }

  onRegister(): void {
    this.activeButton = 'register';
    
    // Effet visuel avant la navigation
    setTimeout(() => {
      // Navigation vers la page d'inscription
      // this.router.navigate(['/register']);
      console.log('Navigation vers la page d\'inscription');
    }, 200);
  }
}