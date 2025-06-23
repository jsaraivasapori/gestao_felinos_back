import { Injectable } from '@nestjs/common';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';

@Injectable()
export class VacinasService {
  create(createVacinaDto: CreateVacinaDto) {
    return 'This action adds a new vacina';
  }

  findAll() {
    return `This action returns all vacinas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vacina`;
  }

  update(id: number, updateVacinaDto: UpdateVacinaDto) {
    return `This action updates a #${id} vacina`;
  }

  remove(id: number) {
    return `This action removes a #${id} vacina`;
  }
}
