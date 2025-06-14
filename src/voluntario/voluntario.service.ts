import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVoluntarioDto } from './dto/create-voluntario.dto';
import { UpdateVoluntarioDto } from './dto/update-voluntario.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VoluntarioService {
  constructor(private prisma: PrismaService) {}
  async create(createVoluntarioDto: CreateVoluntarioDto) {
    return await this.prisma.voluntarios.create({
      data: createVoluntarioDto,
    });
  }

  async findAll() {
    return this.prisma.voluntarios.findMany();
  }

  async findOne(id: string) {
    const voluntario = await this.prisma.voluntarios.findUnique({
      where: { id },
    });
    if (!voluntario) {
      throw new NotFoundException({
        message: 'Voluntário não encontrado',
        erro: 'Not found',
        statusCode: 404,
      });
    }
    return voluntario;
  }

  async update(id: string, UpdateVoluntarioDto: UpdateVoluntarioDto) {
    try {
      return await this.prisma.voluntarios.update({
        where: { id },
        data: UpdateVoluntarioDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Voluntário não encontrado',
          error: 'Not found',
          statusCode: 404,
        });
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return this.prisma.voluntarios.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException({
          message: 'Voluntário não encontrado',
          error: 'Not found',
          statusCode: 404,
        });
      }
      throw error;
    }
  }
}
