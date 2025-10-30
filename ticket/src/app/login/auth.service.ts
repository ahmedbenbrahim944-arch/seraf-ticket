import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  access_token: string;
  admin?: {
    id: number;
    nom: string;
    prenom: string;
  };
  user?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient, private router: Router) {}

  adminLogin(credentials: { nom: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/admin/login`, credentials)
      .pipe(
        tap(response => {
          if (response.access_token) {
            this.storeAuthData(response, 'admin');
          }
        })
      );
  }

  userLogin(credentials: { nom: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/user/login`, credentials)
      .pipe(
        tap(response => {
          if (response.access_token) {
            this.storeAuthData(response, 'user');
          }
        })
      );
  }

  private storeAuthData(response: LoginResponse, userType: string): void {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user_type', userType);
    
    const userData = userType === 'admin' ? response.admin : response.user;
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUserType(): string | null {
    return localStorage.getItem('user_type');
  }

  getUserData(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}