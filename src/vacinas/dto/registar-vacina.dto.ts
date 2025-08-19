// src/vacinacao/dto/registrar-vacinacao.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class RegistrarVacinacaoDto {
  @IsUUID()
  @IsNotEmpty()
  felinoId: string;

  @IsUUID()
  @IsNotEmpty()
  vacinaId: string;

  @IsString()
  @IsNotEmpty()
  laboratorio: string;

  @IsString()
  @IsNotEmpty()
  lote: string;

  @IsNumber()
  @IsNotEmpty()
  valorPago: number;

  @IsString()
  @IsNotEmpty()
  medVet: string;

  // Informações para criar o protocolo, caso seja a primeira dose
  @IsInt()
  dosesNecessarias: number;

  @IsInt()
  intervaloEntreDosesEmDias: number;

  @IsBoolean()
  requerReforcoAnual: boolean;
}
