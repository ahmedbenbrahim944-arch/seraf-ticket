// src/user/user.service.ts
import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { nom, prenom, password } = createUserDto;

    const existingUser = await this.userRepository.findOne({ 
      where: { nom } 
    });
    
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec ce nom existe déjà');
    }

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = this.userRepository.create({
        nom,
        prenom,
        password: hashedPassword,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la création de l\'utilisateur');
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return user;
  }

  async findOneByNom(nom: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { nom } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // Gérer le mot de passe séparément
    if (updateUserDto.password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Mettre à jour les autres champs
    if (updateUserDto.nom) user.nom = updateUserDto.nom;
    if (updateUserDto.prenom) user.prenom = updateUserDto.prenom;
    if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;

    return await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async deactivate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return await this.userRepository.save(user);
  }

  async activate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return await this.userRepository.save(user);
  }
}