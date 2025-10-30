// app.routes.ts
import { Routes } from '@angular/router';
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
import { Xt7Component } from './xt7/xt7.component';
import { Xt2Component } from './xt2/xt2.component';
import { Mxt5Component } from './mxt5/mxt5.component';
import { Xt6Component } from './xt6/xt6.component';
import { Xt4Component } from './xt4/xt4.component';
import { T4Component } from './t4/t4.component';
import { St7Component } from './st7/st7.component';
import { StatistiquesComponent } from './statistiques/statistiques.component';
import { ChXT5Component } from './chxt5/chxt5.component';
import { Chxt7Component } from './chxt7/chxt7.component';
import { Cht4Component } from './cht4/cht4.component';
import { Chst7Component } from './chst7/chst7.component';
import { Xt51Component } from './xt51/xt51.component';
import { ChpoloComponent } from './chpolo/chpolo.component';
import { Polo1Component } from './polo1/polo1.component';
import { Xt3Component } from './xt3/xt3.component';
import { A3Component } from './a3/a3.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
 /* { path: 'register', component: RegisterComponent },*/
  { path: 'login', component: LoginComponent },
  { path: 'ajouter', component: AjouterProduitComponent },
  { path: 'modifier', component: ModifierProduitComponent },
  { path: 'ajouteruser', component: AjouterUtilisateurComponent },
  { path: 'CHXT5', component: ChXT5Component },
  { path: 'side', component: SidebarComponent },
  { path: 'sideus', component: SidebarusComponent },
  { path: 'Polo', component: PoloComponent },
  { path: 'XT7', component: Xt7Component },
  { path: 'XT2', component: Xt2Component },
  { path: 'MXT5', component: Mxt5Component },
  { path: 'MXT6', component: Xt6Component },
  { path: 'XT4', component: Xt4Component },
  { path: 'T4', component: T4Component },
  { path: 'ST7', component: St7Component },
  { path: 'stat', component: StatistiquesComponent },
  { path: 'XT5', component: Xt5Component },
  { path: 'CHXT7', component: Chxt7Component },
  { path: 'CHT4', component: Cht4Component },
  { path: 'CHT7', component: Chst7Component },
  { path: 'XT51', component: Xt51Component },
  { path: 'CHP', component: ChpoloComponent },
  { path: 'Polo1', component: Polo1Component },
  { path: 'XT3', component: Xt3Component },
  { path: 'MT5A3', component: A3Component },





  
];