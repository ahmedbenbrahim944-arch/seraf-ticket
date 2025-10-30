// src/user/user.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './user.entity';
import { AdminRoleGuard } from 'src/auth/guards/admin-role.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AdminRoleGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() createUserDto: CreateUserDto): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const user = await this.userService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'Utilisateur créé avec succès',
      user: userWithoutPassword,
    };
  }

  @Get()
 @UseGuards(AdminRoleGuard)
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userService.findAll();
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  @Get(':id')
 @UseGuards(AdminRoleGuard)
  async findOne(@Param('id') id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findOne(+id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Patch(':id')
    @UseGuards(AdminRoleGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const user = await this.userService.update(+id, updateUserDto);
    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'Utilisateur modifié avec succès',
      user: userWithoutPassword,
    };
  }

  @Delete(':id')
    @UseGuards(AdminRoleGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.userService.remove(+id);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  @Patch(':id/deactivate')
    @UseGuards(AdminRoleGuard)
  async deactivate(@Param('id') id: string): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const user = await this.userService.deactivate(+id);
    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'Utilisateur désactivé avec succès',
      user: userWithoutPassword,
    };
  }

  @Patch(':id/activate')
    @UseGuards(AdminRoleGuard)
  async activate(@Param('id') id: string): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const user = await this.userService.activate(+id);
    const { password, ...userWithoutPassword } = user;
    
    return {
      message: 'Utilisateur activé avec succès',
      user: userWithoutPassword,
    };
  }
}