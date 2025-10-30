// print.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintService } from './print.service';
import { PrintController } from './print.controller';
import { PrintJob } from './entities/print-job.entity';
import { PrintTicket } from './entities/print-job.entity';
import { Product } from '../products/entities/product.entity';
import { ProductsModule } from '../products/products.module'; // ← Ajoutez cette importation

@Module({
  imports: [
    TypeOrmModule.forFeature([PrintJob, PrintTicket, Product]),
    ProductsModule, // ← Ajoutez cette ligne
  ],
  controllers: [PrintController],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}