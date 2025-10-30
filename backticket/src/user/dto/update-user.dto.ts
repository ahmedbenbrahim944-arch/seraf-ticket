// src/user/dto/update-user.dto.ts
import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  prenom?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}