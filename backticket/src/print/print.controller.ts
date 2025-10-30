import { 
  Controller, 
  Post, 
  Body, 
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Delete,
  Param
} from '@nestjs/common';
import { PrintService } from './print.service';
import { ProductsService } from '../products/products.service';
import { PrintTicketDto, PrintTicketResponseDto , PrintStatsDto } from './dto/print-ticket.dto';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';  // Import corrigé pour fs avec promises
import * as path from 'path';       // Import pour path
import * as os from 'os';          // Import pour os
import { exec } from 'child_process'; // Import pour exec
import { promisify } from 'util';  

const execAsync = promisify(exec);

export class DirectPrintDto {
  tsplCommands: string;
  printerName: string;
  protocol: string;
}

@Controller('print')
export class PrintController {
  constructor(
    private readonly printService: PrintService,
    private readonly productsService: ProductsService
  ) {}

  /**
   * Imprimer des tickets
   * POST /print/tickets
   */
   @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  async printTickets(
    @Body() printTicketDto: PrintTicketDto
  ): Promise<PrintTicketResponseDto> {
    // Pour la démo, on utilise un userId fictif
    const userId = 1;
    const result = await this.printService.printTickets(printTicketDto, userId);
    
    return {
      success: true,
      message: 'Tickets imprimés avec succès',
      data: result
    };
  }

  /**
   * Récupérer l'historique d'impression
   * GET /print/history
   */
  @Get('history')
  async getPrintHistory(): Promise<{
    success: boolean;
    data: any;
  }> {
    // Pour la démo, on utilise un userId fictif
    const userId = 1;
    const history = await this.printService.getPrintHistory(userId);
    
    return {
      success: true,
      data: history
    };
  }

  

  /**
   * Récupérer les statistiques d'impression
   * GET /print/stats
   */
  @Get('stats')
  async getPrintStats(
    @Query() filters: PrintStatsDto
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    // Pour la démo, on utilise un userId fictif
    const userId = 1;
    const stats = await this.printService.getPrintStats(userId, filters);
    
    return {
      success: true,
      data: stats
    };
  }

  /**
   * Récupérer un job d'impression spécifique
   * GET /print/job/:id
   */
  @Get('job/:id')
  async getPrintJob(
    @Param('id') id: number
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    // Pour la démo, on utilise un userId fictif
    const userId = 1;
    const job = await this.printService.getPrintJobById(id, userId);
    
    return {
      success: true,
      data: job
    };
  }

  /**
   * Supprimer un job d'impression
   * DELETE /print/job/:id
   */
  @Delete('job/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePrintJob(
    @Param('id') id: number
  ): Promise<void> {
    // Pour la démo, on utilise un userId fictif
    const userId = 1;
    await this.printService.deletePrintJob(id, userId);
  }

  /**
   * Récupérer le QR code d'un ticket
   * GET /print/ticket/:id/qrcode
   */
  @Get('ticket/:id/qrcode')
  async getTicketQRCode(
    @Param('id') id: number
  ): Promise<{
    success: boolean;
    data: {
      codeImage: string; // Changer de dataMatrix à codeImage
      codeType: string;  // Ajouter codeType
      fullProductNumber: string;
    };
  }> {
    const ticket = await this.printService.getTicketById(id);
    
    return {
      success: true,
      data: {
        codeImage: ticket.codeImage, // Utiliser codeImage
        codeType: ticket.codeType,   // Ajouter codeType
        fullProductNumber: ticket.fullProductNumber
      }
    };
  }

  /**
   * Récupérer les lignes disponibles
   * GET /print/lignes
   */
  @Get('lignes')
  async getAvailableLignes(): Promise<{
    success: boolean;
    data: string[];
  }> {
    const lignes = await this.productsService.getAvailableLignes();
    return {
      success: true,
      data: lignes
    };
  }

  /**
   * Récupérer les références par ligne
   * GET /print/lignes/:ligne/references
   */
  @Get('lignes/:ligne/references')
  async getReferencesByLigne(@Param('ligne') ligne: string): Promise<{
    success: boolean;
    data: string[];
  }> {
    const references = await this.productsService.getReferencesByLigne(ligne);
    return {
      success: true,
      data: references
    };
  }

  /**
   * Récupérer les détails d'un produit
   * GET /print/product-details/:ligne/:reference
   */
  @Get('product-details/:ligne/:reference')
  async getProductDetails(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string
  ): Promise<{
    success: boolean;
    data: any;
  }> {
    const product = await this.productsService.getProductByLigneAndReference(ligne, reference);
    
    return {
      success: true,
      data: {
        numeroProgressif: product.numeroProgressif,
        codeFournisseur: product.codeFournisseur,
        indice: product.indice,
        uniqueProductId: product.uniqueProductId,
        fullProductNumber: product.fullProductNumber
      }
    };
  }

  @Get('preview/:ligne/:reference')
async getProductPreview(
  @Param('ligne') ligne: string,
  @Param('reference') reference: string,
  @Query('printDate') printDate?: string,
  @Query('codeFournisseur') codeFournisseur?: string
): Promise<{
  success: boolean;
  data: any;
}> {
  const preview = await this.printService.getFullProductNumberPreview(
    ligne, 
    reference, 
    codeFournisseur,
    printDate
  );
  
  return {
    success: true,
    data: preview
  };
}
  
}
