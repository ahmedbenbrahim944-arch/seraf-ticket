    // src/user/dto/create-user.dto.ts
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nom: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  prenom: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}