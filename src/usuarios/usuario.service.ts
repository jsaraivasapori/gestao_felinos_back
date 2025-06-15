import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    return await this.prisma.usuarios.create({
      data: createUsuarioDto,
    });
  }

  async findAll() {
    return await this.prisma.usuarios.findMany();
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: id },
    });
    if (!usuario) {
      throw new NotFoundException({
        message: 'Usuário não encontrado',
        erro: 'Not found',
        statusCode: 404,
      });
    }
    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      return await this.prisma.felinos.update({
        where: { id },
        data: updateUsuarioDto,
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
      return this.prisma.usuarios.delete({
        where: { id },
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
}
