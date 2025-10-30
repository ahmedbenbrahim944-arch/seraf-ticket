import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './dto/statistics.service';
import { PrintJob } from '../print/entities/print-job.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrintJob, Product])
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService]
})
export class StatisticsModule {}