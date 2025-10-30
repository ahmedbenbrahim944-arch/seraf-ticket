import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Length, Min, IsNotEmpty, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FournisseurCode } from '../entities/product.entity';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  ligne: string; // Obligatoire - Nouveau champ clé primaire

  @IsNotEmpty()
  @IsString()
  reference: string;

  @IsNumber()
  @Min(1)
  uniqueProductId: number;

  @IsOptional()
  @IsDateString()
  dateInput?: string; // Format: YYYY-MM-DD ou DD/MM/YYYY

  @IsOptional()
  @IsString()
  @Length(1, 1)
  annee?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  semaine?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  numeroProgressif?: number;

  @IsOptional()
  @IsEnum(FournisseurCode)
  codeFournisseur?: FournisseurCode;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  indice?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  typeTicket?: string;
}

export class UpdateProductDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  ligne: string; // Obligatoire pour identifier le produit à modifier

  @IsNotEmpty()
  @IsString()
  reference: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  uniqueProductId?: number;

  @IsOptional()
  @IsDateString()
  dateInput?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1)
  annee?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  semaine?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  numeroProgressif?: number;

  @IsOptional()
  @IsEnum(FournisseurCode)
  codeFournisseur?: FournisseurCode;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  indice?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  typeTicket?: string;

  @IsOptional()
  @Type(() => Boolean)
  resetProgressiveNumber?: boolean; // Pour remettre à 0000
}

export class ProductResponseDto {
  id: number;
  ligne: string; // Nouveau champ
  reference: string; // Nouveau champ
  uniqueProductId: number;
  annee: string;
  semaine: string;
  numeroProgressif: string;
  codeFournisseur: FournisseurCode;
  indice: string;
  typeTicket: string; // Nouveau champ
  compteurImpression: number;
  fullProductNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
