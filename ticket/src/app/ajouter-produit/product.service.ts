import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Product, 
  CreateProductDto, 
  UpdateProductDto, 
  ApiResponse 
} from '../shared/interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/products';

  constructor(private http: HttpClient) {}

  // Créer un nouveau produit
  createProduct(productData: CreateProductDto): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, productData);
  }

  // Récupérer tous les produits
  getAllProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl);
  }

  // Récupérer un produit par ligne et référence
  getProductByLigneAndReference(ligne: string, reference: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${encodeURIComponent(ligne)}/${encodeURIComponent(reference)}`);
  }

  // Mettre à jour un produit
  updateProduct(updateData: UpdateProductDto): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(this.apiUrl, updateData);
  }

  // Supprimer un produit
  deleteProduct(ligne: string, reference: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(ligne)}/${encodeURIComponent(reference)}`);
  }

  // Incrémenter le compteur d'impression
  incrementPrintCounter(ligne: string, reference: string): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/${encodeURIComponent(ligne)}/${encodeURIComponent(reference)}/print`, {});
  }

  // Réinitialiser le numéro progressif
  resetProgressiveNumber(ligne: string, reference: string): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/${encodeURIComponent(ligne)}/${encodeURIComponent(reference)}/reset-progressive`, {});
  }

  // Récupérer toutes les lignes disponibles
  getAvailableLignes(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/lignes`);
  }

  // Récupérer les références pour une ligne spécifique
  getReferencesByLigne(ligne: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/lignes/${encodeURIComponent(ligne)}/references`);
  }
}