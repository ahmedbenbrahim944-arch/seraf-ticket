import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface AdminButton {
  id: string;
  label: string;
  route?: string;
  isLogout?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeItem: string = '';
  isLoading: boolean = false;

  adminButtons: AdminButton[] = [
    {
      id: 'statistiques',
      label: 'Statistiques',
      route: '/stat'
    },
    {
      id: 'ajout-utilisateurs',
      label: 'Ajouter Utilisateurs',
      route: '/ajouteruser'
    },
    {
      id: 'ajouter-produit',
      label: 'Ajouter Produit',
      route: '/ajouter'
    },
    {
      id: 'modifier-produit',
      label: 'Modifier Produit',
      route: '/modifier'
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
   * Gère le clic sur un bouton d'administration
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

    // Déconnexion directe sans confirmation
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
    // Implémenter la logique de déconnexion ici
    console.log('Déconnexion en cours...');
    
    // Exemple d'implémentation:
    // 1. Supprimer le token d'authentification
    // localStorage.removeItem('authToken');
    // sessionStorage.clear();
    
    // 2. Appeler le service d'authentification
    // this.authService.logout().subscribe(() => {
    //   this.router.navigate(['/login']);
    // });
    
    // 3. Redirection vers la page de connexion
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