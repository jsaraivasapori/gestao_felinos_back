import { Perfil } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

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
