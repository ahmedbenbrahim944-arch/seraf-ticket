import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bwipjs from 'bwip-js'; // Remplacer QRCode par bwip-js
import { PrintJob, PrintTicket } from './entities/print-job.entity';
import { Product } from 'src/products/entities/product.entity';
import { PrintTicketDto, PrintStatsDto } from './dto/print-ticket.dto';
import { DateConverter } from 'src/common/utils/date-converter.util';

@Injectable()
export class PrintService {
  constructor(
    @InjectRepository(PrintJob)
    private printJobRepository: Repository<PrintJob>,
    @InjectRepository(PrintTicket)
    private printTicketRepository: Repository<PrintTicket>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

   private async generateQRCode(data: string): Promise<string> {
    try {
      const png = await bwipjs.toBuffer({
        bcid: 'qrcode',           // Type de code-barres: QR Code
        text: data,               // Données à encoder
        scale: 3,                 // Facteur d'échelle
        height: 10,               // Hauteur en millimètres
        width: 10,                // Largeur en millimètres
        includetext: false,       // Ne pas inclure le texte
        textxalign: 'center',
      });

      const base64 = png.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du QR Code:', error);
      throw new BadRequestException('Impossible de générer le QR Code');
    }
  }

  /**
   * 🆕 Génère un DataMatrix au lieu d'un QR Code
   */
  private async generateDataMatrix(data: string): Promise<string> {
    try {
      // Générer le DataMatrix
      const png = await bwipjs.toBuffer({
        bcid: 'datamatrix',        // Type de code-barres: DataMatrix
        text: data,                 // Données à encoder
        scale: 3,                   // Facteur d'échelle (3x)
        height: 10,                 // Hauteur en millimètres
        width: 10,                  // Largeur en millimètres
        includetext: false,         // Ne pas inclure le texte sous le code
        textxalign: 'center',       // Alignement du texte
      });

      // Convertir en Data URL
      const base64 = png.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du DataMatrix:', error);
      throw new BadRequestException('Impossible de générer le DataMatrix');
    }
  }

  /**
 * 🆕 Génère un simplenum selon le format spécifié
 * Format: 3 derniers chiffres de référence + semaine + année + code unique société
 */
private async generateSimpleNum(
  data: string, 
  reference: string, 
  printDate: string
): Promise<string> {
  try {
    console.log('📝 Génération SimpleNum pour:', { reference, printDate });
    
    // 1. Extraire les 3 derniers chiffres de la référence
    const refDigits = reference.replace(/\D/g, '');
    const lastThreeRef = refDigits.slice(-3).padStart(3, '0');
    console.log('  → 3 derniers chiffres référence:', lastThreeRef);
    
    // 2. Extraire la semaine et l'année de la date
    const date = DateConverter.parseDateString(printDate);
    const { yearCode, weekNumber } = DateConverter.convertDateToProductCodes(date);
    
    // 3. CORRECTION: S'assurer que l'année est sur 2 chiffres
    let yearLastTwo = yearCode;
    // Si l'année est une lettre (F), utiliser l'année réelle
    if (yearCode.length === 1 && /[A-Z]/.test(yearCode)) {
      const realYear = date.getFullYear();
      yearLastTwo = String(realYear).slice(-2);
      console.log('  → Correction année:', yearCode, '→', yearLastTwo);
    }
    // S'assurer que c'est bien 2 chiffres
    yearLastTwo = String(yearLastTwo).slice(-2).padStart(2, '0');
    
    // 4. Semaine sur 2 chiffres
    const weekTwoDigits = weekNumber.padStart(2, '0');
    console.log('  → Semaine (2 chiffres):', weekTwoDigits);
    console.log('  → Année (2 chiffres):', yearLastTwo);
    
    // 5. Code unique de société
    const companyCode = '897';
    console.log('  → Code société:', companyCode);
    
    // 6. Construire le SimpleNum final (10 chiffres)
    const simpleNum = `${lastThreeRef}${weekTwoDigits}${yearLastTwo}${companyCode}`;
    console.log('✅ SimpleNum généré:', simpleNum);
    
    // Vérification du format
    if (simpleNum.length !== 10) {
      throw new Error(`SimpleNum invalide: longueur ${simpleNum.length} au lieu de 10`);
    }
    
    // 7. Encoder en base64
    const buffer = Buffer.from(simpleNum, 'utf-8');
    const base64 = buffer.toString('base64');
    const dataUrl = `data:text/plain;base64,${base64}`;
    
    return dataUrl;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du SimpleNum:', error);
    throw new BadRequestException(`Impossible de générer le SimpleNum: ${error.message}`);
  }
}

/**
 * 🆕 Génère un numéro simple au format "A3/808/S42"
 */
private async generateSimpleNumber(
  ligne: string,
  reference: string, 
  printDate: string
): Promise<string> {
  try {
    console.log('📝 Génération SimpleNumber pour:', { ligne, reference, printDate });
    
    // 1. Extraire les 3 derniers chiffres de la référence
    const refDigits = reference.replace(/\D/g, '');
    const lastThreeRef = refDigits.slice(-3).padStart(3, '0');
    console.log('  → 3 derniers chiffres référence:', lastThreeRef);
    
    // 2. Extraire la semaine de la date
    const date = DateConverter.parseDateString(printDate);
    const { weekNumber } = DateConverter.convertDateToProductCodes(date);
    
    // 3. Formater la semaine (S42)
    const formattedWeek = `S${weekNumber}`;
    console.log('  → Semaine:', formattedWeek);
    
    // 4. Construire le numéro final au format "A3/808/S42"
    const simpleNumber = `${ligne}/${lastThreeRef}/${formattedWeek}`;
    console.log('✅ SimpleNumber généré:', simpleNumber);
    
    // 5. Encoder en base64 pour uniformité avec les autres types
    const buffer = Buffer.from(simpleNumber, 'utf-8');
    const base64 = buffer.toString('base64');
    const dataUrl = `data:text/plain;base64,${base64}`;
    
    return dataUrl;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du SimpleNumber:', error);
    throw new BadRequestException(`Impossible de générer le SimpleNumber: ${error.message}`);
  }
}

  private async generateCode(
  data: string, 
  codeType: string, 
  reference?: string, 
  printDate?: string,
  ligne?: string  // Ajouter ligne pour le cas NUM
): Promise<string> {
  switch (codeType.toUpperCase()) {
    case 'QRCODE':
      return await this.generateQRCode(data);
    case 'DATAMATRIX':
      return await this.generateDataMatrix(data);
    case 'SIMPLENUM':
      if (!reference || !printDate) {
        throw new BadRequestException('Reference et printDate sont requis pour SIMPLENUM');
      }
      return await this.generateSimpleNum(data, reference, printDate);
    case 'NUM':  // 🆕 NOUVEAU CAS
      if (!ligne || !reference || !printDate) {
        throw new BadRequestException('Ligne, reference et printDate sont requis pour NUM');
      }
      return await this.generateSimpleNumber(ligne, reference, printDate);
    default:
      return await this.generateDataMatrix(data);
  }
}

  /**
   * 🆕 NOUVELLE MÉTHODE : Vérifie et met à jour la semaine si nécessaire
   */
  private async checkAndUpdateWeek(product: Product, printDate: string): Promise<{ annee: string; semaine: string; weekChanged: boolean }> {
    try {
      // Convertir la date d'impression
      const date = DateConverter.parseDateString(printDate);
      const { yearCode, weekNumber } = DateConverter.convertDateToProductCodes(date);
      
      // Vérifier si la semaine a changé
      const weekChanged = product.semaine !== weekNumber || product.annee !== yearCode;
      
      if (weekChanged) {
        console.log(`🔄 Changement de semaine détecté pour ${product.ligne}/${product.reference}`);
        console.log(`   Ancienne: ${product.annee}${product.semaine} → Nouvelle: ${yearCode}${weekNumber}`);
        
        // Mettre à jour le produit avec la nouvelle semaine
        product.annee = yearCode;
        product.semaine = weekNumber;
        
        // 🔥 IMPORTANT: Remettre le numéro progressif à 1 lors du changement de semaine
        product.numeroProgressif = 0; // Sera incrémenté à 1 lors de l'impression
        
        await this.productRepository.save(product);
        
        console.log(`✅ Produit mis à jour: Semaine ${weekNumber}, Progressif remis à 0`);
      }
      
      return { 
        annee: yearCode, 
        semaine: weekNumber, 
        weekChanged 
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la semaine:', error);
      throw new BadRequestException('Erreur lors de la vérification de la date');
    }
  }

  async printTickets(printTicketDto: PrintTicketDto, userId: number) {
    // Récupérer le produit
    const product = await this.productRepository.findOne({
      where: {
        ligne: printTicketDto.ligne,
        reference: printTicketDto.reference
      }
    });

    if (!product) {
      throw new NotFoundException(`Produit non trouvé avec ligne: ${printTicketDto.ligne} et référence: ${printTicketDto.reference}`);
    }

    const codeFournisseurToUse = printTicketDto.codeFournisseur || product.codeFournisseur;
    
    const codeType = printTicketDto.codeType || 'DATAMATRIX';

    // Déterminer la date d'impression
    const printDate = printTicketDto.printDate || new Date().toISOString().split('T')[0];

    // 🆕 VÉRIFICATION ET MISE À JOUR AUTOMATIQUE DE LA SEMAINE
    const { annee, semaine, weekChanged } = await this.checkAndUpdateWeek(product, printDate);

    // Créer le job d'impression
    const printJob = new PrintJob();
    printJob.ligne = printTicketDto.ligne;
    printJob.reference = printTicketDto.reference;
    printJob.quantity = printTicketDto.quantity;
    printJob.matricule = printTicketDto.matricule;
    printJob.printDate = printDate;
    printJob.startProgressive = product.numeroProgressif + 1;
    printJob.endProgressive = product.numeroProgressif + printTicketDto.quantity;
    printJob.notes = printTicketDto.notes || '';
    printJob.userId = userId;
    printJob.codeType = codeType; // Stocker le type de code utilisé


    const savedPrintJob = await this.printJobRepository.save(printJob);

    // Générer les tickets
    const tickets: Array<{
      fullProductNumber: string;
       codeImage: string; // Champ générique pour les deux types
      codeType: string;    
       matricule: string;
      printDate: string;
      progressiveNumber: string;
      ligne: string;
      reference: string;
      indice: string;
      codeFournisseur: string;
      champS?: string;
      aiec?: string;
    }> = [];

    for (let i = 0; i < printTicketDto.quantity; i++) {
      const currentProgressive = product.numeroProgressif + i + 1;
      const formattedProgressive = currentProgressive.toString().padStart(4, '0');
      
      // 🔥 Utiliser l'année et la semaine mises à jour automatiquement
      const fullProductNumber = `${annee}${semaine}${formattedProgressive}${product.uniqueProductId}${codeFournisseurToUse}${product.indice}`;
      
      // Générer le DataMatrix (au lieu du QR Code)
          const codeImage = await this.generateCode(
          fullProductNumber, 
          codeType, 
          printTicketDto.reference, 
          printDate,
          printTicketDto.ligne 
        );      // Créer le ticket
      const ticket = new PrintTicket();
      ticket.fullProductNumber = fullProductNumber;
      ticket.codeImage = codeImage; // Champ unifié pour les deux types
      ticket.codeType = codeType;  
      ticket.matricule = printTicketDto.matricule;
      ticket.printDate = printJob.printDate;
      ticket.progressiveNumber = formattedProgressive;
      ticket.ligne = printTicketDto.ligne;
      ticket.reference = printTicketDto.reference;
      ticket.indice = product.indice;
      ticket.codeFournisseur = codeFournisseurToUse;
      ticket.champS = printTicketDto.champS || '';
      ticket.aiec = printTicketDto.aiec;
      ticket.printJob = savedPrintJob;

      const savedTicket = await this.printTicketRepository.save(ticket);
      
      tickets.push({
        fullProductNumber: savedTicket.fullProductNumber,
        codeImage: savedTicket.codeImage,
        codeType: savedTicket.codeType,
        matricule: savedTicket.matricule,
        printDate: savedTicket.printDate,
        progressiveNumber: savedTicket.progressiveNumber,
        ligne: savedTicket.ligne,
        reference: savedTicket.reference,
        indice: savedTicket.indice,
        codeFournisseur: savedTicket.codeFournisseur,
        champS: savedTicket.champS || '',
        aiec: savedTicket.aiec,
      });
    }

    // Mettre à jour le numéro progressif du produit
    product.numeroProgressif += printTicketDto.quantity;
    product.compteurImpression += printTicketDto.quantity;
    await this.productRepository.save(product);

    return {
      printJobId: savedPrintJob.id,
      tickets,
      summary: {
        totalTickets: printTicketDto.quantity,
        progressiveRange: `${printJob.startProgressive.toString().padStart(4, '0')} - ${printJob.endProgressive.toString().padStart(4, '0')}`,
        productInfo: {
          ligne: product.ligne,
          reference: product.reference,
          uniqueProductId: product.uniqueProductId
        },
        // 🆕 Indication si la semaine a changé
        codeType: codeType, // Retourner le type de code utilisé
        weekInfo: weekChanged ? {
          changed: true,
          newWeek: `${annee}${semaine}`,
          message: 'Nouvelle semaine détectée - Numéro progressif remis à 1'
        } : {
          changed: false,
          currentWeek: `${annee}${semaine}`
        }
      }
    };
  }

  private extractReferenceDigits(reference: string): string {
  // Enlever tous les caractères non-numériques
  const digits = reference.replace(/\D/g, '');
  
  // Si la référence ne contient pas assez de chiffres, utiliser la référence complète
  if (digits.length < 3) {
    console.warn(`⚠️ Référence "${reference}" ne contient que ${digits.length} chiffres`);
    return reference.slice(-3).padStart(3, '0');
  }
  
  return digits;
}

  /**
   * 🆕 Méthode pour prévisualiser avec détection automatique de la semaine
   */
  async getFullProductNumberPreview(
  ligne: string, 
  reference: string, 
  codeFournisseur?: string,
  printDate?: string,
  codeType?: string
) {
  const product = await this.productRepository.findOne({
    where: { ligne, reference }
  });

  if (!product) {
    throw new NotFoundException(`Produit non trouvé avec ligne: ${ligne} et référence: ${reference}`);
  }

  const codeFournisseurToUse = codeFournisseur || product.codeFournisseur;
  const dateToUse = printDate || new Date().toISOString().split('T')[0];
  const codeTypeToUse = codeType || 'DATAMATRIX';
  
  // Calculer la semaine actuelle
  let anneeToUse = product.annee;
  let semaineToUse = product.semaine;
  let weekWillChange = false;

  try {
    const date = DateConverter.parseDateString(dateToUse);
    const { yearCode, weekNumber } = DateConverter.convertDateToProductCodes(date);
    anneeToUse = yearCode;
    semaineToUse = weekNumber;
    
    weekWillChange = product.semaine !== weekNumber || product.annee !== yearCode;
  } catch (error) {
    console.error('Erreur lors de l\'extraction de la date:', error);
  }
  
  const nextProgressive = weekWillChange ? 1 : (product.numeroProgressif + 1);
  const nextProgressiveFormatted = nextProgressive.toString().padStart(4, '0');
  
  // 🔥 GÉNÉRATION DU SIMPLENUM PREVIEW
  let simpleNumPreview = '';
  if (codeTypeToUse === 'SIMPLENUM') {
    const refDigits = this.extractReferenceDigits(reference);
    const lastThreeRef = refDigits.slice(-3).padStart(3, '0');
    const weekTwoDigits = semaineToUse.padStart(2, '0');
    const yearLastTwo = anneeToUse.slice(-2);
    const companyCode = '897';
    
    simpleNumPreview = `${lastThreeRef}${weekTwoDigits}${yearLastTwo}${companyCode}`;
    console.log('🔍 Preview SimpleNum:', simpleNumPreview);
  }
  
  const fullProductNumber = codeTypeToUse === 'SIMPLENUM' 
    ? simpleNumPreview
    : `${anneeToUse}${semaineToUse}${nextProgressiveFormatted}${product.uniqueProductId}${codeFournisseurToUse}${product.indice}`;
  
  return {
    fullProductNumber,
    codeType: codeTypeToUse,
    codeFournisseur: codeFournisseurToUse,
    nextProgressiveNumber: nextProgressiveFormatted,
    annee: anneeToUse,
    semaine: semaineToUse,
    weekWillChange,
    currentWeek: `${product.annee}${product.semaine}`,
    newWeek: weekWillChange ? `${anneeToUse}${semaineToUse}` : null,
    warning: weekWillChange ? '⚠️ Nouvelle semaine détectée - Le progressif sera remis à 0001' : null,
    simpleNum: simpleNumPreview || null // 🔥 Ajouter le SimpleNum dans la réponse
  };
}

  // Les autres méthodes restent inchangées...
  async getPrintHistory(userId: number) {
    const printJobs = await this.printJobRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' }
    });

    const totalPrinted = printJobs.reduce((sum, job) => sum + job.quantity, 0);

    return {
      data: printJobs.map(job => ({
        id: job.id,
        ligne: job.ligne,
        reference: job.reference,
        quantity: job.quantity,
        matricule: job.matricule,
        printDate: job.printDate,
        startProgressive: job.startProgressive,
        endProgressive: job.endProgressive,
        createdAt: job.createdAt.toISOString(),
        product: job.product ? {
          uniqueProductId: job.product.uniqueProductId,
          annee: job.product.annee,
          semaine: job.product.semaine,
          codeFournisseur: job.product.codeFournisseur,
          indice: job.product.indice
        } : null
      })),
      count: printJobs.length,
      totalPrinted
    };
  }

  async getPrintStats(userId: number, filters: PrintStatsDto) {
    let query = this.printJobRepository.createQueryBuilder('printJob')
      .where('printJob.userId = :userId', { userId });

    if (filters.startDate) {
      query = query.andWhere('printJob.printDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query = query.andWhere('printJob.printDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.matricule) {
      query = query.andWhere('printJob.matricule = :matricule', { matricule: filters.matricule });
    }

    if (filters.ligne) {
      query = query.andWhere('printJob.ligne = :ligne', { ligne: filters.ligne });
    }

    const printJobs = await query.getMany();
    const totalJobs = printJobs.length;
    const totalPrinted = printJobs.reduce((sum, job) => sum + job.quantity, 0);

    const byMatricule = printJobs.reduce((acc: Array<{ matricule: string; totalJobs: number; totalPrinted: number }>, job) => {
      const existing = acc.find(item => item.matricule === job.matricule);
      if (existing) {
        existing.totalJobs += 1;
        existing.totalPrinted += job.quantity;
      } else {
        acc.push({
          matricule: job.matricule,
          totalJobs: 1,
          totalPrinted: job.quantity
        });
      }
      return acc;
    }, []);

    const byProduct = printJobs.reduce((acc: Array<{ product: string; ligne: string; reference: string; totalJobs: number; totalPrinted: number }>, job) => {
      const key = `${job.ligne}-${job.reference}`;
      const existing = acc.find(item => item.product === key);
      if (existing) {
        existing.totalJobs += 1;
        existing.totalPrinted += job.quantity;
      } else {
        acc.push({
          product: key,
          ligne: job.ligne,
          reference: job.reference,
          totalJobs: 1,
          totalPrinted: job.quantity
        });
      }
      return acc;
    }, []);

    return {
      totalJobs,
      totalPrinted,
      byMatricule,
      byProduct
    };
  }

  async getPrintJobById(id: number, userId: number) {
    const printJob = await this.printJobRepository.findOne({
      where: { id, userId },
      relations: ['tickets', 'product']
    });

    if (!printJob) {
      throw new NotFoundException(`Job d'impression non trouvé avec l'ID: ${id}`);
    }

    return printJob;
  }

  async deletePrintJob(id: number, userId: number) {
    const printJob = await this.printJobRepository.findOne({
      where: { id, userId }
    });

    if (!printJob) {
      throw new NotFoundException(`Job d'impression non trouvé avec l'ID: ${id}`);
    }

    await this.printJobRepository.remove(printJob);
  }

  async getTicketById(id: number) {
    const ticket = await this.printTicketRepository.findOne({
      where: { id }
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket non trouvé avec l'ID: ${id}`);
    }

    return ticket;
  }
}