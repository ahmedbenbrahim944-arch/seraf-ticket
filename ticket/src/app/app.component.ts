import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SidebarusComponent } from './sidebarus/sidebarus.component';
import { AjouterProduitComponent } from './ajouter-produit/ajouter-produit.component';
import { ModifierProduitComponent } from './modifier-produit/modifier-produit.component';
import { AjouterUtilisateurComponent } from './ajouter-utilisateur/ajouter-utilisateur.component';
import { Xt5Component } from './xt5/xt5.component';
import { PoloComponent } from './polo/polo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LandingComponent,
    RegisterComponent,
    RouterModule,
    LoginComponent,
    SidebarComponent,
    SidebarusComponent,
    AjouterProduitComponent,
    ModifierProduitComponent,
    AjouterProduitComponent,
    AjouterUtilisateurComponent,
    Xt5Component,
    PoloComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ticket';
}
