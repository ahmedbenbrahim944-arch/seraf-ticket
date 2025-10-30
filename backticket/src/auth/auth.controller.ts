import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAdminDto } from 'src/admin/dto/login-admin.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateAdminDto } from 'src/admin/dto/create-admin.dto';
import { AdminService } from 'src/admin/admin.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  @Post('admin/register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async adminRegister(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminService.createAdmin(createAdminDto);
    
    // Retourner l'admin sans le mot de passe
    const { password, ...adminWithoutPassword } = admin;
    
    return {
      message: 'Admin créé avec succès',
      admin: adminWithoutPassword,
    };
  }

  @Post('admin/login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async adminLogin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.adminLogin(loginAdminDto);
  }

  @Post('user/login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async userLogin(@Body() loginUserDto: LoginUserDto) {
    return this.authService.userLogin(loginUserDto);
  }
}