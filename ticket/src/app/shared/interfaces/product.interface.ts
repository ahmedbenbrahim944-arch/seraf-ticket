export interface Product {
  id: number;
  ligne: string;
  reference: string;
  uniqueProductId: number;
  annee: string;
  semaine: string;
  numeroProgressif: string;
  codeFournisseur: string;
  indice: string;
  typeTicket: string;
  compteurImpression: number;
  fullProductNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  ligne: string;
  reference: string;
  uniqueProductId: number;
  dateInput?: string;
  annee?: string;
  semaine?: string;
  numeroProgressif?: number;
  codeFournisseur?: string;
  indice?: string;
  typeTicket?: string;
}

export interface UpdateProductDto {
  ligne: string;
  reference: string;
  uniqueProductId?: number;
  dateInput?: string;
  annee?: string;
  semaine?: string;
  numeroProgressif?: number;
  codeFournisseur?: string;
  indice?: string;
  typeTicket?: string;
  resetProgressiveNumber?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}