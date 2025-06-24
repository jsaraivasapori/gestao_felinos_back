import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFelinoDto } from './dto/create-felino.dto';
import { UpdateFelinoDto } from './dto/update-felino.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FelinoService {
  constructor(private prisma: PrismaService) {}
  //Inicio metodos  vacina por felino

  //Inicio metodos basicos CRUD
  async create(createFelinoDto: CreateFelinoDto) {
    return await this.prisma.felinos.create({
      data: createFelinoDto,
    });
  }

  async findAll() {
    return this.prisma.felinos.findMany();
  }

  async findOne(id: string) {
    const felino = await this.prisma.felinos.findUnique({
      where: { id: id },
    });

    if (!felino) {
      throw new NotFoundException({
        message: 'Felino não encontrado',
        erro: 'Not found',
        statusCode: 404,
      });
    }
    return felino;
  }

  async update(id: string, updateFelinoDto: UpdateFelinoDto) {
    try {
      return await this.prisma.felinos.update({
        where: { id },
        data: updateFelinoDto,
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

  async remove(id: string) {
    try {
      return this.prisma.felinos.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Felino não encontrado',
          error: 'Not found',
          statusCode: 404,
        });
      }
      throw error;
    }
  }
  //Fim metodos basicos CRUD
}
