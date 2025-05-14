import {
  IsBoolean,
  IsDateString,
  IsEnum,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Raca } from '@prisma/client';
export class CreateFelinoDto {
  @IsNotEmpty()
  @IsString({ message: 'Nome precisa ser string' })
  @MaxLength(50)
  nome: string;

  @IsNumber({ allowNaN: false }, { message: 'Invalid input' })
  @IsPositive({})
  @Min(0, { message: 'Idade precisa ser maior ou igual a 0' })
  @IsNotEmpty()
  idade: number;

  @IsNotEmpty()
  @IsEnum(Raca, { message: 'Raca inválida' })
  raca: Raca;

  @IsDateString()
  @IsNotEmpty()
  dataResgate: Date;

  @IsDateString()
  @IsNotEmpty()
  dataAdocao: Date;

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
