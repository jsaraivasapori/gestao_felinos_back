import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const hashedPassWord = await bcrypt.hash(createUsuarioDto.senha, 10);
    const newUser = await this.prisma.usuarios.create({
      data: {
        nome: createUsuarioDto.nome,
        login: createUsuarioDto.login,
        senha: hashedPassWord,
        perfil: createUsuarioDto.perfil,
      },
    });
    return {
      id: newUser.id,
      nome: newUser.nome,
      login: newUser.login,
      perfil: newUser.perfil,
      dataCriacao: newUser.dataCriacao,
      dataAtualizacao: newUser.dataAtualziacao,
    };
  }

  async findAll() {
    const users = await this.prisma.usuarios.findMany();

    const usersToReturn = users.map((target) => {
      return {
        id: target.id,
        nome: target.nome,
        login: target.login,
        perfil: target.perfil,
        dataCriacao: target.dataCriacao,
        dataAtualizacao: target.dataAtualziacao,
      };
    });

    return usersToReturn;
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
    return {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
      dataCriacao: usuario.dataCriacao,
      dataAtualizacao: usuario.dataAtualziacao,
    };
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      return await this.prisma.usuarios.update({
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
