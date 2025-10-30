// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { UserService } from '../user/user.service';
import { LoginAdminDto } from 'src/admin/dto/login-admin.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(nom: string, password: string): Promise<any> {
    const admin = await this.adminService.findOneByNom(nom);
    
    if (admin && await bcrypt.compare(password, admin.password)) {
      const { password, ...result } = admin;
      return result;
    }
    
    return null;
  }

  async validateUser(nom: string, password: string): Promise<any> {
    const user = await this.userService.findOneByNom(nom);
    
    if (user && user.isActive && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async adminLogin(loginAdminDto: LoginAdminDto) {
    const { nom, password } = loginAdminDto;
    
    const admin = await this.validateAdmin(nom, password);
    
    if (!admin) {
      throw new UnauthorizedException('Nom ou mot de passe incorrect');
    }

    const payload: JwtPayload = { 
      sub: admin.id, 
      nom: admin.nom,
      role: 'admin'
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom
      }
    };
  }

  async userLogin(loginUserDto: LoginUserDto) {
    const { nom, password } = loginUserDto;
    
    const user = await this.validateUser(nom, password);
    
    if (!user) {
      throw new UnauthorizedException('Nom ou mot de passe incorrect');
    }

    const payload: JwtPayload = { 
      sub: user.id, 
      nom: user.nom,
      role: 'user'
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom
      }
    };
  }

  async validateUserById(userId: number) {
    return await this.userService.findOne(userId);
  }

  async validateAdminById(adminId: number) {
    return await this.adminService.findOneById(adminId);
  }
}