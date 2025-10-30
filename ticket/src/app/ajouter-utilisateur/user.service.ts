import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  nom: string;
  prenom: string;
  password: string;
}

export interface UpdateUserDto {
  nom?: string;
  prenom?: string;
  password?: string;
  isActive?: boolean;
}

export interface ApiResponse {
  message: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  // Créer un utilisateur
  createUser(userData: CreateUserDto): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, userData);
  }

  // Récupérer tous les utilisateurs
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Récupérer un utilisateur par ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour un utilisateur
  updateUser(id: number, userData: UpdateUserDto): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}`, userData);
  }

  // Supprimer un utilisateur
  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Activer un utilisateur
  activateUser(id: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/activate`, {});
  }

  // Désactiver un utilisateur
  deactivateUser(id: number): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}