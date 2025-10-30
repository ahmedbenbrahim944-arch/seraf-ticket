// src/admin/admin.controller.ts
import { Controller, Post, Body, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Admin } from './admin.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() createAdminDto: CreateAdminDto): Promise<{ message: string; admin: Omit<Admin, 'password'> }> {
    const admin = await this.adminService.createAdmin(createAdminDto);
    
    // Retourner l'admin sans le mot de passe
    const { password, ...adminWithoutPassword } = admin;
    
    return {
      message: 'Admin créé avec succès',
      admin: adminWithoutPassword,
    };
  }

  
  
}