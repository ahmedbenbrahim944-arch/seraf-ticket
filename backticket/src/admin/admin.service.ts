// src/admin/admin.service.ts
import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { nom, prenom, password } = createAdminDto;

    // Vérifier si un admin avec le même nom existe déjà
    const existingAdmin = await this.adminRepository.findOne({ 
      where: { nom } 
    });
    
    if (existingAdmin) {
      throw new ConflictException('Un admin avec ce nom existe déjà');
    }

    try {
      // Hasher le mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer le nouvel admin
      const admin = this.adminRepository.create({
        nom,
        prenom,
        password: hashedPassword,
      });

      return await this.adminRepository.save(admin);
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la création de l\'admin');
    }
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find();
  }

  async findOneById(id: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({ where: { id } });
  }

  async findOneByNom(nom: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({ where: { nom } });
  }

  async findOneByNomPrenom(nom: string, prenom: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({ where: { nom, prenom } });
  }
}