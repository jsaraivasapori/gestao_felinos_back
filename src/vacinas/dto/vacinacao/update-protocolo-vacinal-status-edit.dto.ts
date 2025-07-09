import { StatusCiclo } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateProtocoloVacinalStatus {
  @IsEnum(StatusCiclo)
  @IsNotEmpty()
  status: StatusCiclo;
}
