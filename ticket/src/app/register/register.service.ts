// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface Admin {
  nom: string;
  prenom: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  admin: Omit<Admin, 'password'>;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = 'http://localhost:3000'; // Adaptez selon votre port NestJS

  constructor(private http: HttpClient, private router: Router) {}

  register(admin: Admin): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/admin/register`, admin);
  }
}