import { PartialType } from '@nestjs/mapped-types';
import { CreateVacinaDto } from './create-vacina.dto';
import { IsOptional } from 'class-validator';

export class UpdateVacinaDto extends PartialType(CreateVacinaDto) {
  @IsOptional()
  name: string;
}
