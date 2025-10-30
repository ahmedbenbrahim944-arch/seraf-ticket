import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  Min, 
  Max, 
  IsDateString, 
  IsOptional,
  IsAlphanumeric,
  Length,
  Matches,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrintTicketDto {
  @IsNotEmpty({ message: 'La ligne est obligatoire' })
  @IsString({ message: 'La ligne doit être une chaîne de caractères' })
  @Length(1, 50, { message: 'La ligne doit contenir entre 1 et 50 caractères' })
  ligne: string;

  @IsNotEmpty({ message: 'La référence est obligatoire' })
  @IsString({ message: 'La référence doit être une chaîne de caractères' })
  reference: string;

  @IsNotEmpty({ message: 'La quantité est obligatoire' })
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être au moins de 1' })
  @Max(10000, { message: 'La quantité ne peut pas dépasser 10000' })
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString({ message: 'Le matricule doit être une chaîne de caractères' })
  @Length(1, 50, { message: 'Le matricule doit contenir entre 1 et 50 caractères' })
  matricule: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date doit être au format YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'La date doit être au format YYYY-MM-DD (ex: 2024-03-15)' 
  })
  printDate?: string;
  
  @IsOptional()
  @IsString({ message: 'Le code fournisseur doit être une chaîne de caractères' })
  @IsIn(['M0', 'M1'], { message: 'Le code fournisseur doit être M0 ou M1' })
  codeFournisseur?: string;

  @IsOptional()
  @IsString({ message: 'Le champ S doit être une chaîne de caractères' })
  @Length(0, 20, { message: 'Le champ S ne peut pas dépasser 20 caractères' })
  champS?: string ;

   @IsOptional({ message: 'Le A-IEC est obligatoire' })
  @IsString({ message: 'Le A-IEC doit être une chaîne de caractères' })
  @Length(1, 20, { message: 'Le A-IEC doit contenir entre 1 et 20 caractères' })
  aiec: string;

  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @Length(0, 500, { message: 'Les notes ne peuvent pas dépasser 500 caractères' })
  notes?: string;

  @IsOptional()
@IsString({ message: 'Le type de code doit être une chaîne de caractères' })
@IsIn(['QRCODE', 'DATAMATRIX', 'SIMPLENUM', 'NUM'], { 
  message: 'Le type de code doit être QRCODE, DATAMATRIX, SIMPLENUM ou NUM'  
})
codeType?: string;
}


export class PrintTicketResponseDto {
  success: boolean;
  message: string;
  data: {
    printJobId: number;
    tickets: Array<{
      fullProductNumber: string;
      codeImage: string; // Champ unifié
      codeType: string;  // Type de code
      matricule?: string;
      printDate: string;
      progressiveNumber: string;
      ligne: string;
      reference: string;
      indice: string;
      codeFournisseur: string;
      champS?: string;
      aiec?: string; // ✅ AJOUTEZ CETTE LIGNE
    }>;
    summary: {
      totalTickets: number;
      progressiveRange: string;
      productInfo: {
        ligne: string;
        reference: string;
        uniqueProductId: number;
      };
       codeType?: string; // Ajouter optionnellement
      weekInfo?: any;    // Ajouter optionnellement
    };
  };
}

export class PrintHistoryResponseDto {
  success: boolean;
  data: Array<{
    id: number;
    ligne: string;
    reference: string;
    quantity: number;
    matricule?: string;
    printDate: string;
    startProgressive: number;
    endProgressive: number;
    createdAt: string;
    product: {
      uniqueProductId: number;
      annee: string;
      semaine: string;
      codeFournisseur: string;
      indice: string;
    };
  }>;
  count: number;
  totalPrinted: number;
}

export class PrintStatsDto {
  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être au format YYYY-MM-DD' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être au format YYYY-MM-DD' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'Le matricule doit être une chaîne de caractères' })
  matricule?: string;

  @IsOptional()
  @IsString({ message: 'La ligne doit être une chaîne de caractères' })
  ligne?: string;
}
