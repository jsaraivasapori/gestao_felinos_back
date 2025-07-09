import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdateProtocoloVacinalDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  dosesNecessarias: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  intervaloEntreDosesEmDias: number;
}
