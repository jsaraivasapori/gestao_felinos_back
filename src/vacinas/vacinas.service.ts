import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVacinacaoDto } from './dto/vacinacao/vacinacao-create-dto';
import { StatusCiclo } from '@prisma/client';

@Injectable()
export class VacinasService {
  constructor(private prisma: PrismaService) {}

  // Inicio Metodos Vacinaçao
  /**
   * Registra a primeira dose de uma vacina para um felino
   * e cria o protocolo vacinal correspondente.
   * Tudo dentro de uma única transação.
   */
  async registrarPrimeiraDose(primeiraVacina: CreateVacinacaoDto) {
    return this.prisma.$transaction(async (tx) => {
      const felinoExiste = await tx.felinos.findUnique({
        where: { id: primeiraVacina.felinoId },
      });
      const vacinaExiste = await tx.vacinas.findUnique({
        where: { id: primeiraVacina.vacinaId },
      });
      if (!felinoExiste) {
        throw new BadRequestException(
          `Felino com o ID ${primeiraVacina.felinoId} não encontrado`,
        );
      }

      if (!vacinaExiste) {
        throw new BadRequestException(
          `Vacina com o ID ${primeiraVacina.vacinaId} não encontrada`,
        );
      }
      const vacinaRealizada = await tx.vacinacoesRealizadas.create({
        data: {
          felinoId: primeiraVacina.felinoId,
          vacinaId: primeiraVacina.vacinaId,
          lote: primeiraVacina.lote,
          laboratorio: primeiraVacina.laboratorio,
          medVet: primeiraVacina.medVet,
          valorPago: primeiraVacina.valorPago,
        },
      });

      const statusAtual =
        primeiraVacina.dosesNecessarias === 1
          ? StatusCiclo.COMPLETO
          : StatusCiclo.EM_ANDAMENTO;

      const protocoloVacinal = await tx.protocoloVacinal.create({
        data: {
          felinoId: primeiraVacina.felinoId,
          vacinaId: primeiraVacina.vacinaId,
          dosesNecessarias: primeiraVacina.dosesNecessarias,
          intervaloEntreDosesEmDias: primeiraVacina.intervaloEntreDosesEmDias,
          status: statusAtual,
        },
      });
      return { vacinaRealizada, protocoloVacinal };
    });
  }

  // Fim Metodos Vacinação

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
