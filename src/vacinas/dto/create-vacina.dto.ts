import { IsNotEmpty } from 'class-validator';

export class CreateVacinaDto {
  @IsNotEmpty()
  nome: string;
}
