import { IsOptional, IsDateString, IsString } from 'class-validator';

export class StatisticsFilterDto {
  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être au format YYYY-MM-DD' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être au format YYYY-MM-DD' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'La ligne doit être une chaîne de caractères' })
  ligne?: string;

  @IsOptional()
  @IsString({ message: 'La référence doit être une chaîne de caractères' })
  reference?: string;

  @IsOptional()
  @IsString({ message: 'Le type de ticket doit être une chaîne de caractères' })
  typeTicket?: string;
}

export class ReferenceStatDto {
  ligne: string;
  reference: string;
  typeTicket: string;
  totalImprime: number;
  pourcentage: number;
  lastPrintDate?: string;
  nombreJobs: number;
}

export class TypeTicketStatDto {
  typeTicket: string;
  totalImprime: number;
  pourcentage: number;
  nombreReferences: number;
  references: Array<{
    ligne: string;
    reference: string;
    totalImprime: number;
  }>;
}

export class StatisticsGlobalesDto {
  totalTicketsImprimes: number;
  totalJobs: number;
  totalReferencesUtilisees: number;
  moyenneTicketsParJob: number;
  periodeCouverture?: {
    dateDebut: string;
    dateFin: string;
  };
}

export class StatisticsResponseDto {
  success: boolean;
  data: {
    globales: StatisticsGlobalesDto;
    parReference: ReferenceStatDto[];
    parTypeTicket: TypeTicketStatDto[];
    topReferences: ReferenceStatDto[]; // Top 10 des références les plus imprimées
  };
}

export class StatisticsDetailReferenceDto {
  ligne: string;
  reference: string;
  typeTicket: string;
  totalImprime: number;
  pourcentage: number;
  details: {
    premierePrint: string;
    dernierePrint: string;
    nombreJobs: number;
    evolutionMensuelle: Array<{
      mois: string;
      annee: number;
      totalImprime: number;
    }>;
    utilisateursUniques: Array<{
      matricule: string;
      totalImprime: number;
    }>;
  };
}