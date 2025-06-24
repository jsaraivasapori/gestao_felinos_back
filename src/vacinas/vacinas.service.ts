import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VacinasService {
  constructor(private prisma: PrismaService) {}

  // Inicio metodos básicos

  async create(createVacinaDto: CreateVacinaDto) {
    return this.prisma.vacinas.create({ data: createVacinaDto });
  }

  async findAll() {
    return this.prisma.vacinas.findMany();
  }

  async findOne(id: string) {
    try {
      return await this.prisma.vacinas.findUnique({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Usuário não encontrado',
          erro: 'Not found',
          statusCode: 404,
        });
      }
      throw error;
    }
  }

  async update(id: string, updateVacinaDto: UpdateVacinaDto) {
    try {
      return await this.prisma.vacinas.update({
        where: { id },
        data: updateVacinaDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Usuário não encontrado',
          error: 'Not found',
          statusCode: 404,
        });
      }
      throw error;
    }
  }
  // Fim metodos basicos
}
