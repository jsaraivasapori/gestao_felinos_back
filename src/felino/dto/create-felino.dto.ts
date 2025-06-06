import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Raca } from '@prisma/client';
import { Transform } from 'class-transformer';
export class CreateFelinoDto {
  @IsNotEmpty()
  @IsString({ message: 'Nome precisa ser string' })
  @MaxLength(50)
  nome: string;

  @IsNumber({ allowNaN: false }, { message: 'Invalid input' })
  @Transform(({ value }) => parseInt(value, 10)) // Converte string para número
  @IsPositive({})
  @Min(0, { message: 'Idade precisa ser maior ou igual a 0' })
  @IsNotEmpty()
  idade: number;

  @IsNotEmpty()
  @IsEnum(Raca, { message: 'Raca inválida' })
  raca: Raca;

  @IsDateString()
  @IsOptional()
  dataResgate: string;

  @IsNotEmpty()
  @IsBoolean()
  fiv: boolean;

  @IsNotEmpty()
  @IsBoolean()
  felv: boolean;

  @IsNotEmpty()
  @IsBoolean()
  pif: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isolado: boolean;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  observacao: string;
}
