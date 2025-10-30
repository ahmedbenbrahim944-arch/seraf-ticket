import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto,ProductResponseDto } from './dto/product.dto';
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Crée un nouveau produit
   * POST /products
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.createProduct(createProductDto);
    
    return {
      success: true,
      message: 'Produit créé avec succès',
      data: product
    };
  }

  /**
   * Met à jour un produit existant
   * PUT /products
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateProduct(@Body() updateProductDto: UpdateProductDto): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.updateProduct(updateProductDto);
    
    return {
      success: true,
      message: 'Produit modifié avec succès',
      data: product
    };
  }

  /**
   * Récupère un produit par ligne et référence
   * GET /products/:ligne/:reference
   */
  @Get(':ligne/:reference')
  async getProduct(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string
  ): Promise<{
    success: boolean;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.getProductByLigneAndReference(ligne, reference);
    
    return {
      success: true,
      data: product
    };
  }

  /**
   * Récupère les lignes disponibles
   * GET /products/lignes
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
   * Récupère les références par ligne
   * GET /products/lignes/:ligne/references
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
   * Récupère un produit par son ID unique (pour compatibilité)
   * GET /products/by-id/:uniqueProductId
   */
  @Get('by-id/:uniqueProductId')
  async getProductByUniqueId(@Param('uniqueProductId') uniqueProductId: number): Promise<{
    success: boolean;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.getProductByUniqueId(uniqueProductId);
    
    return {
      success: true,
      data: product
    };
  }

  /**
   * Récupère tous les produits
   * GET /products
   */
  @Get()
  async getAllProducts(): Promise<{
    success: boolean;
    data: ProductResponseDto[];
    count: number;
  }> {
    const products = await this.productsService.getAllProducts();
    
    return {
      success: true,
      data: products,
      count: products.length
    };
  }

  /**
   * Remet le numéro progressif à zéro
   * POST /products/:ligne/:reference/reset-progressive
   */
  @Post(':ligne/:reference/reset-progressive')
  @HttpCode(HttpStatus.OK)
  async resetProgressiveNumber(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string
  ): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.updateProduct({
      ligne,
      reference,
      resetProgressiveNumber: true
    });
    
    return {
      success: true,
      message: 'Numéro progressif remis à zéro avec succès',
      data: product
    };
  }

  /**
   * Change l'année et la semaine via une date
   * POST /products/:ligne/:reference/change-date
   */
  @Post(':ligne/:reference/change-date')
  @HttpCode(HttpStatus.OK)
  async changeDateInfo(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string,
    @Body() dateInfo: { dateInput: string }
  ): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.updateProduct({
      ligne,
      reference,
      dateInput: dateInfo.dateInput
    });
    
    return {
      success: true,
      message: 'Date mise à jour avec succès',
      data: product
    };
  }

  /**
   * Change l'indice d'un produit
   * POST /products/:ligne/:reference/change-indice
   */
  @Post(':ligne/:reference/change-indice')
  @HttpCode(HttpStatus.OK)
  async changeIndice(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string,
    @Body() indiceInfo: { indice: string }
  ): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.updateProduct({
      ligne,
      reference,
      indice: indiceInfo.indice
    });
    
    return {
      success: true,
      message: 'Indice modifié avec succès',
      data: product
    };
  }

  /**
   * Change le type de ticket d'un produit
   * POST /products/:ligne/:reference/change-type-ticket
   */
  @Post(':ligne/:reference/change-type-ticket')
  @HttpCode(HttpStatus.OK)
  async changeTypeTicket(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string,
    @Body() typeTicketInfo: { typeTicket: string }
  ): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.updateProduct({
      ligne,
      reference,
      typeTicket: typeTicketInfo.typeTicket
    });
    
    return {
      success: true,
      message: 'Type de ticket modifié avec succès',
      data: product
    };
  }

  /**
   * Incrémente le compteur d'impression
   * POST /products/:ligne/:reference/print
   */
  @Post(':ligne/:reference/print')
  @HttpCode(HttpStatus.OK)
  async printProduct(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string
  ): Promise<{
    success: boolean;
    message: string;
    data: ProductResponseDto;
  }> {
    const product = await this.productsService.incrementPrintCounter(ligne, reference);
    
    return {
      success: true,
      message: 'Impression enregistrée, compteur incrémenté',
      data: product
    };
  }

  /**
   * Supprime un produit
   * DELETE /products/:ligne/:reference
   */
  @Delete(':ligne/:reference')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(
    @Param('ligne') ligne: string,
    @Param('reference') reference: string
  ): Promise<void> {
    await this.productsService.deleteProduct(ligne, reference);
  }
}
