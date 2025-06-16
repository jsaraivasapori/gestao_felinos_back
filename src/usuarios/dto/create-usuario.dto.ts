import { Perfil } from '@prisma/client';
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty()
  nome: string;

  @IsNotEmpty()
  login: string;

  @IsNotEmpty()
  senha: string;

  @IsNotEmpty()
  perfil: Perfil;
}
