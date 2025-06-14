import { Turno } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVoluntarioDto {
  @IsNotEmpty()
  @IsString({ message: 'Nome precisa ser uma string' })
  @MaxLength(50, { message: 'Nome precisa ter até 50 caracteres' })
  nome: string;

  @IsNotEmpty()
  @IsString({ message: 'Nome precisa ser uma string' })
  @MaxLength(12, { message: 'Nome precisa ter até 12 caracteres' })
  telefone: string;

  @IsNotEmpty()
  @IsEnum(Turno, { message: 'Turno inválido' })
  turno: Turno;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Largadouro precisa ter até 255 caracteres' })
  largadouro: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Bairro precisa ter até 255 caracteres' })
  bairro: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Cidade precisa ter até 255 caracteres' })
  cidade: string;

  @IsString()
  @MaxLength(8, { message: 'CEP inválido' })
  cep: string;
}
