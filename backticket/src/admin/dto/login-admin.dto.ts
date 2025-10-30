// src/auth/dto/login-admin.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginAdminDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}