import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrintJob } from 'src/print/entities/print-job.entity';
import { Product } from 'src/products/entities/product.entity';
import {
  StatisticsFilterDto,
  StatisticsResponseDto,
  StatisticsDetailReferenceDto,
  ReferenceStatDto,
  TypeTicketStatDto,
  StatisticsGlobalesDto
} from './statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(PrintJob)
    private printJobRepository: Repository<PrintJob>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Récupère les statistiques globales avec filtres
   */
  async getGlobalStatistics(filters: StatisticsFilterDto): Promise<StatisticsResponseDto> {
    // Construction de la requête avec filtres
    let query = this.printJobRepository
      .createQueryBuilder('pj')
      .leftJoinAndSelect('pj.product', 'product');

    if (filters.startDate) {
      query = query.andWhere('pj.printDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query = query.andWhere('pj.printDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.ligne) {
      query = query.andWhere('pj.ligne = :ligne', { ligne: filters.ligne });
    }

    if (filters.reference) {
      query = query.andWhere('pj.reference = :reference', { reference: filters.reference });
    }

    if (filters.typeTicket) {
      query = query.andWhere('product.typeTicket = :typeTicket', { typeTicket: filters.typeTicket });
    }

    const printJobs = await query.getMany();

    // Calcul des statistiques globales
    const globales = this.calculateGlobales(printJobs);

    // Statistiques par référence
    const parReference = await this.calculateParReference(printJobs);

    // Statistiques par type de ticket
    const parTypeTicket = await this.calculateParTypeTicket(printJobs);

    // Top 10 références
    const topReferences = parReference
      .sort((a, b) => b.totalImprime - a.totalImprime)
      .slice(0, 10);

    return {
      success: true,
      data: {
        globales,
        parReference,
        parTypeTicket,
        topReferences
      }
    };
  }

  /**
   * Calcule les statistiques globales
   */
  private calculateGlobales(printJobs: PrintJob[]): StatisticsGlobalesDto {
    const totalTicketsImprimes = printJobs.reduce((sum, job) => sum + job.quantity, 0);
    const totalJobs = printJobs.length;
    
    // Références uniques
    const referencesUniques = new Set(
      printJobs.map(job => `${job.ligne}-${job.reference}`)
    );

    const moyenneTicketsParJob = totalJobs > 0 
      ? Math.round((totalTicketsImprimes / totalJobs) * 100) / 100 
      : 0;

    // Période de couverture
    let periodeCouverture;
    if (printJobs.length > 0) {
      const dates = printJobs.map(job => new Date(job.printDate)).sort((a, b) => a.getTime() - b.getTime());
      periodeCouverture = {
        dateDebut: dates[0].toISOString().split('T')[0],
        dateFin: dates[dates.length - 1].toISOString().split('T')[0]
      };
    }

    return {
      totalTicketsImprimes,
      totalJobs,
      totalReferencesUtilisees: referencesUniques.size,
      moyenneTicketsParJob,
      periodeCouverture
    };
  }

  /**
   * Calcule les statistiques par référence
   */
  private async calculateParReference(printJobs: PrintJob[]): Promise<ReferenceStatDto[]> {
    const totalTickets = printJobs.reduce((sum, job) => sum + job.quantity, 0);
    
    // Grouper par référence avec typage fort
    const groupedByRef = printJobs.reduce((acc, job) => {
      const key = `${job.ligne}-${job.reference}`;
      if (!acc[key]) {
        acc[key] = {
          ligne: job.ligne,
          reference: job.reference,
          typeTicket: job.product?.typeTicket || '',
          jobs: [] as PrintJob[]
        };
      }
      acc[key].jobs.push(job);
      return acc;
    }, {} as Record<string, { ligne: string; reference: string; typeTicket: string; jobs: PrintJob[] }>);

    // Calculer les stats pour chaque référence
    const stats: ReferenceStatDto[] = Object.values(groupedByRef).map((group) => {
      const totalImprime = group.jobs.reduce((sum, job) => sum + job.quantity, 0);
      const pourcentage = totalTickets > 0 
        ? Math.round((totalImprime / totalTickets) * 10000) / 100 
        : 0;
      
      // Trouver la dernière date d'impression
      const dates = group.jobs.map(job => new Date(job.printDate));
      const lastPrintDate = new Date(Math.max(...dates.map(d => d.getTime())))
        .toISOString().split('T')[0];

      return {
        ligne: group.ligne,
        reference: group.reference,
        typeTicket: group.typeTicket,
        totalImprime,
        pourcentage,
        lastPrintDate,
        nombreJobs: group.jobs.length
      };
    });

    return stats.sort((a, b) => b.totalImprime - a.totalImprime);
  }

  /**
   * Calcule les statistiques par type de ticket
   */
  private async calculateParTypeTicket(printJobs: PrintJob[]): Promise<TypeTicketStatDto[]> {
    const totalTickets = printJobs.reduce((sum, job) => sum + job.quantity, 0);
    
    // Grouper par type de ticket
    const groupedByType = printJobs.reduce((acc, job) => {
      const typeTicket = job.product?.typeTicket || 'Non défini';
      if (!acc[typeTicket]) {
        acc[typeTicket] = {
          typeTicket,
          jobs: [],
          references: new Set<string>()
        };
      }
      acc[typeTicket].jobs.push(job);
      acc[typeTicket].references.add(`${job.ligne}-${job.reference}`);
      return acc;
    }, {} as Record<string, { typeTicket: string; jobs: PrintJob[]; references: Set<string> }>);

    // Calculer les stats pour chaque type
    const stats: TypeTicketStatDto[] = Object.values(groupedByType).map((group) => {
      const totalImprime = group.jobs.reduce((sum, job) => sum + job.quantity, 0);
      const pourcentage = totalTickets > 0 
        ? Math.round((totalImprime / totalTickets) * 10000) / 100 
        : 0;

      // Grouper les références pour ce type
      const refGroups = group.jobs.reduce((acc, job) => {
        const key = `${job.ligne}-${job.reference}`;
        if (!acc[key]) {
          acc[key] = {
            ligne: job.ligne,
            reference: job.reference,
            totalImprime: 0
          };
        }
        acc[key].totalImprime += job.quantity;
        return acc;
      }, {} as Record<string, { ligne: string; reference: string; totalImprime: number }>);

      const references: Array<{ ligne: string; reference: string; totalImprime: number }> = Object.values(refGroups)
        .sort((a, b) => b.totalImprime - a.totalImprime)
        .slice(0, 5); // Top 5 références pour ce type

      return {
        typeTicket: group.typeTicket,
        totalImprime,
        pourcentage,
        nombreReferences: group.references.size,
        references
      };
    });

    return stats.sort((a, b) => b.totalImprime - a.totalImprime);
  }

  /**
   * Récupère les détails d'une référence spécifique
   */
  async getReferenceDetails(
    ligne: string, 
    reference: string, 
    filters: StatisticsFilterDto
  ): Promise<StatisticsDetailReferenceDto> {
    // Récupérer le produit
    const product = await this.productRepository.findOne({
      where: { ligne, reference }
    });

    if (!product) {
      throw new Error(`Produit non trouvé: ${ligne} - ${reference}`);
    }

    // Récupérer les jobs pour cette référence
    let query = this.printJobRepository
      .createQueryBuilder('pj')
      .where('pj.ligne = :ligne', { ligne })
      .andWhere('pj.reference = :reference', { reference });

    if (filters.startDate) {
      query = query.andWhere('pj.printDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query = query.andWhere('pj.printDate <= :endDate', { endDate: filters.endDate });
    }

    const jobs = await query.getMany();

    const totalImprime = jobs.reduce((sum, job) => sum + job.quantity, 0);

    // Calculer le pourcentage par rapport au total global
    const allJobs = await this.printJobRepository.find();
    const totalGlobal = allJobs.reduce((sum, job) => sum + job.quantity, 0);
    const pourcentage = totalGlobal > 0 
      ? Math.round((totalImprime / totalGlobal) * 10000) / 100 
      : 0;

    // Dates
    const dates = jobs.map(job => new Date(job.printDate)).sort((a, b) => a.getTime() - b.getTime());
    const premierePrint = dates.length > 0 ? dates[0].toISOString().split('T')[0] : '';
    const dernierePrint = dates.length > 0 ? dates[dates.length - 1].toISOString().split('T')[0] : '';

    // Évolution mensuelle
    const evolutionMensuelle = this.calculateMonthlyEvolution(jobs);

    // Utilisateurs uniques
    const utilisateursUniques = this.calculateUniqueUsers(jobs);

    return {
      ligne,
      reference,
      typeTicket: product.typeTicket || '',
      totalImprime,
      pourcentage,
      details: {
        premierePrint,
        dernierePrint,
        nombreJobs: jobs.length,
        evolutionMensuelle,
        utilisateursUniques
      }
    };
  }

  /**
   * Calcule l'évolution mensuelle
   */
  private calculateMonthlyEvolution(jobs: PrintJob[]): Array<{
    mois: string;
    annee: number;
    totalImprime: number;
  }> {
    const monthlyData = jobs.reduce((acc, job) => {
      const date = new Date(job.printDate);
      const mois = date.toLocaleString('fr-FR', { month: 'long' });
      const annee = date.getFullYear();
      const key = `${annee}-${mois}`;
      
      if (!acc[key]) {
        acc[key] = { mois, annee, totalImprime: 0 };
      }
      acc[key].totalImprime += job.quantity;
      return acc;
    }, {} as Record<string, { mois: string; annee: number; totalImprime: number }>);

    return Object.values(monthlyData)
      .sort((a, b) => {
        if (a.annee !== b.annee) return a.annee - b.annee;
        const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return months.indexOf(a.mois) - months.indexOf(b.mois);
      });
  }

  /**
   * Calcule les utilisateurs uniques
   */
  private calculateUniqueUsers(jobs: PrintJob[]): Array<{
    matricule: string;
    totalImprime: number;
  }> {
    const userGroups = jobs.reduce((acc, job) => {
      if (!acc[job.matricule]) {
        acc[job.matricule] = { matricule: job.matricule, totalImprime: 0 };
      }
      acc[job.matricule].totalImprime += job.quantity;
      return acc;
    }, {} as Record<string, { matricule: string; totalImprime: number }>);

    return Object.values(userGroups)
      .sort((a, b) => b.totalImprime - a.totalImprime);
  }

  /**
   * Récupère les statistiques d'une période spécifique (jour, semaine, mois)
   */
  async getStatisticsByPeriod(
    period: 'day' | 'week' | 'month',
    filters: StatisticsFilterDto
  ): Promise<Array<{ period: string; totalImprime: number; nombreJobs: number }>> {
    let query = this.printJobRepository
      .createQueryBuilder('pj')
      .leftJoinAndSelect('pj.product', 'product');

    if (filters.startDate) {
      query = query.andWhere('pj.printDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query = query.andWhere('pj.printDate <= :endDate', { endDate: filters.endDate });
    }

    const jobs = await query.getMany();

    // Grouper selon la période avec typage fort
    const groupedData = jobs.reduce((acc, job) => {
      const date = new Date(job.printDate);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekNumber = this.getWeekNumber(date);
        key = `${date.getFullYear()}-S${weekNumber}`;
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = { period: key, totalImprime: 0, nombreJobs: 0 };
      }
      acc[key].totalImprime += job.quantity;
      acc[key].nombreJobs += 1;
      return acc;
    }, {} as Record<string, { period: string; totalImprime: number; nombreJobs: number }>);

    return Object.values(groupedData).sort((a, b) => 
      a.period.localeCompare(b.period)
    );
  }

  /**
   * Utilitaire pour obtenir le numéro de semaine
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}