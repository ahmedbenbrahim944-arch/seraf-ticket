import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product,FournisseurCode } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto,ProductResponseDto } from './dto/product.dto';
import { DateConverter } from 'src/common/utils/date-converter.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Crée un nouveau produit
   */
  async createProduct(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Vérifier si le produit existe déjà avec la combinaison ligne + reference
    const existingProduct = await this.productRepository.findOne({
      where: { 
        ligne: createProductDto.ligne,
        reference: createProductDto.reference
      }
    });

    if (existingProduct) {
      throw new ConflictException(`Un produit avec la ligne "${createProductDto.ligne}" et la référence "${createProductDto.reference}" existe déjà`);
    }

    const product = new Product();
    product.ligne = createProductDto.ligne;
    product.reference = createProductDto.reference;
    product.uniqueProductId = createProductDto.uniqueProductId;
    product.typeTicket = createProductDto.typeTicket || '';
    product.numeroProgressif = createProductDto.numeroProgressif || 0;

    // Gestion de la date automatique si fournie
    if (createProductDto.dateInput) {
      try {
        const date = DateConverter.parseDateString(createProductDto.dateInput);
        const { yearCode, weekNumber } = DateConverter.convertDateToProductCodes(date);
        product.annee = yearCode;
        product.semaine = weekNumber;
      } catch (error) {
        throw new BadRequestException(error.message || 'Format de date invalide. Utilisez DD/MM/YYYY ou YYYY-MM-DD');
      }
    } else {
      // Utiliser les valeurs manuelles ou par défaut
      product.annee = createProductDto.annee || 'E';
      product.semaine = createProductDto.semaine || '10';
    }

    product.codeFournisseur = createProductDto.codeFournisseur || FournisseurCode.M0;
    product.indice = createProductDto.indice || '040';

    const savedProduct = await this.productRepository.save(product);
    return this.mapToResponseDto(savedProduct);
  }

  /**
   * Met à jour un produit existant
   */
  async updateProduct(updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { 
        ligne: updateProductDto.ligne,
        reference: updateProductDto.reference
      }
    });

    if (!product) {
      throw new NotFoundException(`Aucun produit trouvé avec la ligne "${updateProductDto.ligne}" et la référence "${updateProductDto.reference}"`);
    }

    // Gestion de la date automatique si fournie
    if (updateProductDto.dateInput) {
      try {
        const date = DateConverter.parseDateString(updateProductDto.dateInput);
        const { yearCode, weekNumber } = DateConverter.convertDateToProductCodes(date);
        product.annee = yearCode;
        product.semaine = weekNumber;
      } catch (error) {
        throw new BadRequestException(error.message || 'Format de date invalide. Utilisez DD/MM/YYYY ou YYYY-MM-DD');
      }
    } else {
      // Mettre à jour les champs individuels si fournis
      if (updateProductDto.annee) product.annee = updateProductDto.annee;
      if (updateProductDto.semaine) product.semaine = updateProductDto.semaine;
    }

    // Reset du numéro progressif si demandé
    if (updateProductDto.resetProgressiveNumber) {
      product.numeroProgressif = 1; // Remettre à 1 au lieu de '0001'
    } else if (updateProductDto.numeroProgressif !== undefined) {
      product.numeroProgressif = updateProductDto.numeroProgressif;
    }

    // Autres champs
    if (updateProductDto.uniqueProductId) product.uniqueProductId = updateProductDto.uniqueProductId;
    if (updateProductDto.codeFournisseur) product.codeFournisseur = updateProductDto.codeFournisseur;
    if (updateProductDto.indice) product.indice = updateProductDto.indice;
    if (updateProductDto.description !== undefined) product.description = updateProductDto.description;
    
    if (updateProductDto.typeTicket !== undefined) {
      product.typeTicket = updateProductDto.typeTicket || '';
    }

    const savedProduct = await this.productRepository.save(product);
    return this.mapToResponseDto(savedProduct);
  }

  /**
   * Récupère un produit par ligne et référence
   */
  async getProductByLigneAndReference(ligne: string, reference: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { ligne, reference }
    });

    if (!product) {
      throw new NotFoundException(`Aucun produit trouvé avec la ligne "${ligne}" et la référence "${reference}"`);
    }

    return this.mapToResponseDto(product);
  }

  /**
   * Récupère un produit par son ID unique (pour compatibilité)
   */
  async getProductByUniqueId(uniqueProductId: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { uniqueProductId }
    });

    if (!product) {
      throw new NotFoundException(`Aucun produit trouvé avec l'ID unique ${uniqueProductId}`);
    }

    return this.mapToResponseDto(product);
  }

  /**
   * Récupère tous les produits
   */
  async getAllProducts(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      order: { createdAt: 'DESC' }
    });

    return products.map(product => this.mapToResponseDto(product));
  }

  /**
   * Incrémente le compteur d'impression (pour les impressions)
   */
  async incrementPrintCounter(ligne: string, reference: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { ligne, reference }
    });

    if (!product) {
      throw new NotFoundException(`Aucun produit trouvé avec la ligne "${ligne}" et la référence "${reference}"`);
    }

    product.compteurImpression += 1;
    
    const savedProduct = await this.productRepository.save(product);
    return this.mapToResponseDto(savedProduct);
  }

  /**
   * Supprime un produit
   */
  async deleteProduct(ligne: string, reference: string): Promise<void> {
    const result = await this.productRepository.delete({ ligne, reference });
    
    if (result.affected === 0) {
      throw new NotFoundException(`Aucun produit trouvé avec la ligne "${ligne}" et la référence "${reference}"`);
    }
  }

  /**
   * Récupère les lignes disponibles
   */
  async getAvailableLignes(): Promise<string[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.ligne', 'ligne')
      .where('product.ligne IS NOT NULL')
      .andWhere('product.ligne != :empty', { empty: '' })
      .getRawMany();

    return products.map(p => p.ligne).filter(ligne => ligne !== null && ligne !== '');
  }

  /**
   * Récupère les références par ligne
   */
  async getReferencesByLigne(ligne: string): Promise<string[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.reference', 'reference')
      .where('product.ligne = :ligne', { ligne })
      .andWhere('product.reference IS NOT NULL')
      .andWhere('product.reference != :empty', { empty: '' })
      .getRawMany();

    return products.map(p => p.reference).filter(ref => ref !== null && ref !== '');
  }

  /**
   * Convertit l'entité en DTO de réponse
   */
  private mapToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      ligne: product.ligne,
      reference: product.reference,
      uniqueProductId: product.uniqueProductId,
      annee: product.annee,
      semaine: product.semaine,
      numeroProgressif: product.numeroProgressif.toString().padStart(4, '0'),
      codeFournisseur: product.codeFournisseur,
      indice: product.indice,
      typeTicket: product.typeTicket || '',
      compteurImpression: product.compteurImpression,
      fullProductNumber: product.getFullProductNumber(),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
