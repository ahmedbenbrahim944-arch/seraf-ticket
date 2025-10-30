import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface PrintButton {
  id: string;
  label: string;
  route?: string;
  isLogout?: boolean;
}

@Component({
  selector: 'app-sidebarus',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebarus.component.html',
  styleUrls: ['./sidebarus.component.css']
})
export class SidebarusComponent implements OnInit {
  activeItem: string = '';
  isLoading: boolean = false;

  printButtons: PrintButton[] = [
    {
      id: 'comando-xt5',
      label: 'Comondo XT5',
      route: '/XT5'
    },
    {
      id: 'comando-xt7',
      label: 'Comondo XT7',
      route: '/XT7'
    },
    {
      id: 'module-xt5',
      label: 'Polo',
      route: '/Polo'
    },
    {
      id: 'groupo-xt2',
      label: 'Groupo Base XT2',
      route: '/XT2'
    },
    {
      id: 'deconnexion',
      label: 'Déconnexion',
      isLogout: true
    }
  ];

  constructor(
    private router: Router, 
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    // Animation d'entrée
    this.initializeAnimations();
  }

  /**
   * Gère le clic sur un bouton d'impression
   */
  onButtonClick(itemId: string, route?: string) {
    // Empêcher les clics multiples pendant le chargement
    if (this.isLoading) {
      return;
    }

    this.activeItem = itemId;
    this.isLoading = true;

    // Animation de clic
    const button = event?.target as HTMLElement;
    if (button) {
      this.addClickAnimation(button.closest('.print-button') as HTMLElement);
    }

    // Navigation avec délai pour l'animation
    if (route) {
      setTimeout(() => {
        this.router.navigate([route]).finally(() => {
          this.isLoading = false;
        });
      }, 300);
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Gère le clic sur le bouton de déconnexion
   */
  onLogoutClick() {
    if (this.isLoading) {
      return;
    }

    this.activeItem = 'deconnexion';
    this.isLoading = true;

    // Animation de clic
    const button = event?.target as HTMLElement;
    if (button) {
      this.addClickAnimation(button.closest('.print-button') as HTMLElement);
    }

    // Afficher une confirmation (optionnel)
    setTimeout(() => {
      this.logout();
    }, 300);
  }

  /**
   * Initialise les animations au chargement
   */
  private initializeAnimations() {
    setTimeout(() => {
      const container = this.elementRef.nativeElement.querySelector('.print-container');
      if (container) {
        container.classList.add('loaded');
      }
    }, 100);
  }

  /**
   * Ajoute une animation de clic au bouton
   */
  private addClickAnimation(button: HTMLElement | null) {
    if (!button) return;

    button.classList.add('clicked');
    
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 600);
  }

  /**
   * Gère l'effet ripple au clic
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest('.print-button');
    
    if (button && !this.isLoading) {
      this.createRippleEffect(event, button as HTMLElement);
    }
  }

  /**
   * Crée l'effet ripple animé
   */
  private createRippleEffect(event: MouseEvent, button: HTMLElement) {
    const ripple = button.querySelector('.button-ripple') as HTMLElement;
    
    if (!ripple) return;

    // Obtenir les dimensions et position du bouton
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculer la taille du ripple (distance au coin le plus éloigné)
    const size = Math.max(
      Math.sqrt(x * x + y * y),
      Math.sqrt((rect.width - x) * (rect.width - x) + y * y),
      Math.sqrt(x * x + (rect.height - y) * (rect.height - y)),
      Math.sqrt((rect.width - x) * (rect.width - x) + (rect.height - y) * (rect.height - y))
    ) * 2;

    // Réinitialiser le ripple
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.opacity = '1';

    // Animer le ripple
    setTimeout(() => {
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      ripple.style.opacity = '0';
      ripple.style.transition = 'all 0.6s ease-out';
    }, 10);

    // Nettoyer après l'animation
    setTimeout(() => {
      ripple.style.transition = 'none';
    }, 650);
  }

  /**
   * Logique de déconnexion
   */
  private logout() {
    
    this.router.navigate(['/login']).finally(() => {
      this.isLoading = false;
    });
  }

  /**
   * Gère la navigation au clavier
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const buttons = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.print-button')
    ) as HTMLElement[];
    
    const currentIndex = buttons.findIndex(
      btn => btn === document.activeElement
    );

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex]?.focus();
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[prevIndex]?.focus();
        break;
        
      case 'Home':
        event.preventDefault();
        buttons[0]?.focus();
        break;
        
      case 'End':
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
        break;
    }
  }

  /**
   * Nettoie les ressources au destroy du composant
   */
  ngOnDestroy() {
    this.isLoading = false;
  }
}