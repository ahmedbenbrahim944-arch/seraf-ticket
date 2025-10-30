import { 
  Controller, 
  Get, 
  Query, 
  Param,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { StatisticsService } from './dto/statistics.service';
import { 
  StatisticsFilterDto, 
  StatisticsResponseDto,
  StatisticsDetailReferenceDto 
} from './dto/statistics.dto';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Récupère les statistiques globales
   * GET /statistics/global
   */
  @Get('global')
  @HttpCode(HttpStatus.OK)
  async getGlobalStatistics(
    @Query() filters: StatisticsFilterDto
  ): Promise<StatisticsResponseDto> {
    return await this.statisticsService.getGlobalStatistics(filters);
  }

  /**
   * Récupère les détails d'une référence spécifique
   * GET /statistics/reference/:ligne/:reference
   */
  @Get('reference/:ligne/:reference')
  @HttpCode(HttpStatus.OK)
  async getReferenceDetails(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string,
    @Query() filters: StatisticsFilterDto
  ): Promise<{
    success: boolean;
    data: StatisticsDetailReferenceDto;
  }> {
    const data = await this.statisticsService.getReferenceDetails(
      ligne, 
      reference, 
      filters
    );
    
    return {
      success: true,
      data
    };
  }

  /**
   * Récupère les statistiques par période (jour, semaine, mois)
   * GET /statistics/period/:period
   */
  @Get('period/:period')
  @HttpCode(HttpStatus.OK)
  async getStatisticsByPeriod(
    @Param('period') period: 'day' | 'week' | 'month',
    @Query() filters: StatisticsFilterDto
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    const data = await this.statisticsService.getStatisticsByPeriod(period, filters);
    
    return {
      success: true,
      data
    };
  }

  /**
   * Récupère les statistiques des types de tickets
   * GET /statistics/types
   */
  @Get('types')
  @HttpCode(HttpStatus.OK)
  async getTypeTicketStatistics(
    @Query() filters: StatisticsFilterDto
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    const result = await this.statisticsService.getGlobalStatistics(filters);
    
    return {
      success: true,
      data: {
        parTypeTicket: result.data.parTypeTicket,
        totaux: {
          totalTickets: result.data.globales.totalTicketsImprimes,
          nombreTypes: result.data.parTypeTicket.length
        }
      }
    };
  }

  /**
   * Récupère les statistiques des références
   * GET /statistics/references
   */
  @Get('references')
  @HttpCode(HttpStatus.OK)
  async getReferenceStatistics(
    @Query() filters: StatisticsFilterDto
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    const result = await this.statisticsService.getGlobalStatistics(filters);
    
    return {
      success: true,
      data: {
        parReference: result.data.parReference,
        topReferences: result.data.topReferences,
        totaux: {
          totalTickets: result.data.globales.totalTicketsImprimes,
          nombreReferences: result.data.globales.totalReferencesUtilisees
        }
      }
    };
  }

  /**
   * Export des statistiques en format simple (pour Excel, CSV, etc.)
   * GET /statistics/export
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  async exportStatistics(
    @Query() filters: StatisticsFilterDto
  ): Promise<{
    success: boolean;
    data: {
      headers: string[];
      rows: any[];
    };
  }> {
    const result = await this.statisticsService.getGlobalStatistics(filters);
    
    const headers = [
      'Ligne',
      'Référence',
      'Type Ticket',
      'Total Imprimé',
      'Pourcentage (%)',
      'Nombre de Jobs',
      'Dernière Impression'
    ];

    const rows = result.data.parReference.map(ref => [
      ref.ligne,
      ref.reference,
      ref.typeTicket,
      ref.totalImprime,
      ref.pourcentage,
      ref.nombreJobs,
      ref.lastPrintDate
    ]);

    return {
      success: true,
      data: {
        headers,
        rows
      }
    };
  }
}