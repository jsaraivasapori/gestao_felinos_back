import { PartialType } from '@nestjs/mapped-types';
import { CreateFelinoDto } from './create-felino.dto';

export class UpdateFelinoDto extends PartialType(CreateFelinoDto) {}
