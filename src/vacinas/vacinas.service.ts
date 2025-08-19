import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusCiclo } from '@prisma/client';
import { RegistrarVacinacaoDto } from './dto/registar-vacina.dto';

/**
 * Service responsável pela lógica de negócio relacionada a Vacinas e ao processo de Vacinação.
 * Contém tanto o CRUD básico para o cadastro de vacinas quanto as regras complexas
 * para registrar doses e gerenciar os protocolos vacinais dos felinos.
 */
@Injectable()
export class VacinasService {
  constructor(private prisma: PrismaService) {}

  // ===================================================================
  // MÉTODOS DE VACINAÇÃO (LÓGICA DE NEGÓCIO PRINCIPAL)
  // ===================================================================

  /**
   * Registra a primeira dose de uma vacina para um felino e cria o protocolo vacinal correspondente.
   * Esta operação é transacional, garantindo que o protocolo e o registro da dose sejam criados juntos, ou nenhum deles.
   * - Se for uma vacina de dose única, o ciclo já é criado como 'COMPLETO'.
   * - Se for anual, já calcula a data de lembrete para o próximo ano.
   * @param primeiraVacina DTO com os dados para criar o protocolo e registrar a primeira dose.
   * @returns Um objeto contendo a vacina aplicada e o protocolo criado.
   */
  // Não se esqueça de importar 'Prisma' junto com 'StatusCiclo'
  // import { StatusCiclo, Prisma } from '@prisma/client';

  async registrar(dto: RegistrarVacinacaoDto) {
    // Usamos uma transação para garantir a consistência dos dados.
    // Se qualquer uma das operações falhar, tudo é desfeito (rollback).
    return this.prisma.$transaction(async (tx) => {
      // 1. Verifica se o felino e a vacina existem
      const felino = await tx.felinos.findUnique({
        where: { id: dto.felinoId },
      });
      if (!felino) {
        throw new NotFoundException(
          `Felino com ID ${dto.felinoId} não encontrado.`,
        );
      }
      const vacina = await tx.vacinas.findUnique({
        where: { id: dto.vacinaId },
      });
      if (!vacina) {
        throw new NotFoundException(
          `Vacina com ID ${dto.vacinaId} não encontrada.`,
        );
      }

      // 2. Encontra ou Cria o Protocolo Vacinal
      // O Prisma se encarrega de encontrar um protocolo com base na chave única (felinoId_vacinaId)
      // ou criar um novo se não existir.
      let protocolo = await tx.protocoloVacinal.upsert({
        where: {
          felinoId_vacinaId: { felinoId: dto.felinoId, vacinaId: dto.vacinaId },
        },
        update: {}, // Não atualiza nada se já existir, retorna o que existe
        create: {
          felinoId: dto.felinoId,
          vacinaId: dto.vacinaId,
          dosesNecessarias: dto.dosesNecessarias,
          intervaloEntreDosesEmDias: dto.intervaloEntreDosesEmDias,
          requerReforcoAnual: dto.requerReforcoAnual,
          status: StatusCiclo.PENDENTE, // Começa como pendente
        },
      });

      // 3. Cria o registro da aplicação da vacina (a dose)
      await tx.aplicacaoVacina.create({
        data: {
          laboratorio: dto.laboratorio,
          lote: dto.lote,
          medVet: dto.medVet,
          // A data de aplicação e valor pago podem ser adicionados aqui se vierem do DTO
          protocoloVacinalId: protocolo.id,
          valorPago: dto.valorPago,
        },
      });

      // 4. Atualiza o Status do Protocolo
      // Contamos quantas doses já foram aplicadas para este protocolo
      const dosesAplicadas = await tx.aplicacaoVacina.count({
        where: { protocoloVacinalId: protocolo.id },
      });

      let novoStatus: StatusCiclo = StatusCiclo.EM_ANDAMENTO;
      let proximaData: Date | null = new Date();

      if (dosesAplicadas >= protocolo.dosesNecessarias) {
        novoStatus = StatusCiclo.COMPLETO;
        proximaData = null; // Ciclo completo, não há próxima data
      } else {
        // Calcula a data da próxima dose
        proximaData.setDate(
          proximaData.getDate() + protocolo.intervaloEntreDosesEmDias,
        );
      }

      // Atualiza o protocolo com o novo status e a próxima data
      const protocoloAtualizado = await tx.protocoloVacinal.update({
        where: { id: protocolo.id },
        data: {
          status: novoStatus,
          dataProximaVacina: proximaData,
        },
        include: {
          aplicacoes: true, // Retorna o protocolo com as aplicações para confirmação
        },
      });

      return protocoloAtualizado;
    });
  }

  async getAllVaccination() {}

  // ===================================================================
  // MÉTODOS CRUD BÁSICOS PARA O MODELO 'Vacinas'
  // ===================================================================

  /**
   * Cria uma nova vacina no sistema.
   * @param createVacinaDto DTO com os dados da vacina a ser criada.
   */
  async create(createVacinaDto: CreateVacinaDto) {
    return this.prisma.vacinas.create({ data: createVacinaDto });
  }

  /**
   * Retorna uma lista de todas as vacinas cadastradas.
   */
  async findAll() {
    return this.prisma.vacinas.findMany();
  }

  /**
   * Busca uma vacina específica pelo seu ID.
   * @param id O ID da vacina a ser encontrada.
   * @throws {NotFoundException} Se a vacina com o ID fornecido não for encontrada.
   */
  async findOne(id: string) {
    const vacina = await this.prisma.vacinas.findUnique({ where: { id } });
    if (!vacina) {
      throw new NotFoundException(`Vacina com o ID ${id} não encontrada.`);
    }
    return vacina;
  }

  /**
   * Atualiza os dados de uma vacina existente.
   * @param id O ID da vacina a ser atualizada.
   * @param updateVacinaDto DTO com os dados a serem modificados.
   * @throws {NotFoundException} Se a vacina com o ID fornecido não for encontrada para atualização.
   */
  async update(id: string, updateVacinaDto: UpdateVacinaDto) {
    try {
      return await this.prisma.vacinas.update({
        where: { id },
        data: updateVacinaDto,
      });
    } catch (error) {
      // Captura o erro específico do Prisma quando o registro a ser atualizado não existe.
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Vacina com o ID ${id} não encontrada para atualização.`,
        );
      }
      throw error; // Lança outros erros inesperados.
    }
  }
}
