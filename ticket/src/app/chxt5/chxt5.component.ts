import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chxt5',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './chxt5.component.html',
  styleUrls: ['./chxt5.component.css']
})
export class ChXT5Component {
  constructor (private router: Router,
  ){}
  
  
  // Méthode pour imprimer par 3
  imprimerPar3(): void {
    console.log('Impression par 3 déclenchée');
    // Ajoutez ici votre logique d'impression
    // Par exemple: appel à un service d'impression
  }

  // Méthode pour imprimer par 4
  imprimerPar4(): void {
    console.log('Impression par 4 déclenchée');
    // Ajoutez ici votre logique d'impression
    // Par exemple: appel à un service d'impression
  }

  // Méthode optionnelle pour gérer l'effet ripple
  createRipple(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('button-ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
  goBack(): void {
    this.router.navigate(['/sideus']);
  }
}