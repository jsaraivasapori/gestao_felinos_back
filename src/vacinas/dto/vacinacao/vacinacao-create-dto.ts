import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateVacinacaoDto {
  @IsUUID()
  @IsNotEmpty({ message: 'O Id do felino é obrigatório' })
  felinoId: string;

  @IsUUID()
  @IsNotEmpty({ message: 'O Id da vacina é obrigatório' })
  vacinaId: string;

  @IsString()
  @IsNotEmpty()
  laboratorio: string;

  @IsString()
  @IsNotEmpty()
  lote: string;

  @IsString()
  @IsNotEmpty()
  medVet: string;

  @IsNumber()
  @IsPositive()
  valorPago: number;

  // Informações para o NOVO protocolo
  @IsInt()
  @IsPositive()
  dosesNecessarias: number;

  @IsInt()
  @IsPositive()
  intervaloEntreDosesEmDias: number;
}
