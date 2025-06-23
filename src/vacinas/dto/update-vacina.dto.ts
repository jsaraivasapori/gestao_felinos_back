import { PartialType } from '@nestjs/mapped-types';
import { CreateVacinaDto } from './create-vacina.dto';

export class UpdateVacinaDto extends PartialType(CreateVacinaDto) {}
