// src/auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: number;
  nom: string;
  role: string; // Ajouter le rôle
}