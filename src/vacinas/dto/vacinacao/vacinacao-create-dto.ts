import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  valorPago: number;

  // Informações para o NOVO protocolo
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  dosesNecessarias: number;

  @IsDateString()
  @IsOptional()
  dataProximaVacina: Date;

  @Transform(({ value }) =>
    value === '' || value === undefined ? null : Number(value),
  )
  @IsOptional()
  @IsInt()
  @IsPositive()
  intervaloEntreDosesEmDias?: number;

  @IsBoolean()
  requerReforcoAnual;
}
