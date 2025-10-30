// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrintModule } from './print/print.module';
import { ProductsModule } from './products/products.module';
import { StatisticsModule } from './statistics/statistics.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'root', // Vérifiez votre nom d'utilisateur MySQL
      password: '', // Essayez avec un mot de passe vide si vous n'en avez pas défini
      database: 'ticket', // Créez d'abord la base de données
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    AdminModule,
    AuthModule,
    UserModule,
    ProductsModule,
    PrintModule,
    StatisticsModule
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}