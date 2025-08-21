import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusCiclo, Vacinas } from '@prisma/client';
import { RegistrarVacinacaoDto } from './dto/registar-vacina.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProtocoloVacinal, AplicacaoVacina } from '@prisma/client';

/**
 * @class VacinasService
 * @description
 * Serviço responsável por toda a lógica de negócio relacionada a vacinas e ao
 * processo de vacinação dos felinos.
 *
 * Suas responsabilidades se dividem em duas áreas principais:
 * 1.  **Gestão do Catálogo de Vacinas:** Operações CRUD (Criar, Ler, Atualizar) para as
 * entidades `Vacinas`.
 * 2.  **Orquestração do Ciclo de Vacinação:** Lógica complexa para registrar doses,
 * gerenciar protocolos, consultar históricos e automatizar verificações de status.
 */
@Injectable()
export class VacinasService {
  /**
   * @private
   * Instância do Logger para registrar informações e eventos importantes do serviço.
   */
  private readonly logger = new Logger(VacinasService.name);

  /**
   * @constructor
   * @param {PrismaService} prisma - Instância do serviço do Prisma para acesso ao banco de dados,
   * injetada pelo sistema de injeção de dependência do NestJS.
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Registra a aplicação de uma dose de vacina para um felino, gerenciando todo o ciclo de vida
   * do protocolo de vacinação.
   *
   * @description
   * Este método lida de forma inteligente tanto com a primeira dose quanto com as doses subsequentes.
   * Ele utiliza uma transação de banco de dados para garantir a consistência dos dados.
   * A lógica inclui: criar um protocolo se for a primeira dose, adicionar a aplicação,
   * atualizar o status do ciclo (`EM_ANDAMENTO`, `COMPLETO`) e agendar lembretes anuais.
   *
   * @param {RegistrarVacinacaoDto} dto - Objeto com todos os dados necessários para o registro.
   * @returns {Promise<ProtocoloVacinal & { aplicacoes: AplicacaoVacina[] }>} O protocolo completo e
   * atualizado, incluindo a lista de todas as doses aplicadas.
   * @throws {NotFoundException} Se o felino ou a vacina com os IDs fornecidos não forem encontrados.
   */
  async registrar(
    dto: RegistrarVacinacaoDto,
  ): Promise<ProtocoloVacinal & { aplicacoes: AplicacaoVacina[] }> {
    return this.prisma.$transaction(async (tx) => {
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

      const protocolo = await tx.protocoloVacinal.upsert({
        where: {
          felinoId_vacinaId: { felinoId: dto.felinoId, vacinaId: dto.vacinaId },
        },
        update: {},
        create: {
          felinoId: dto.felinoId,
          vacinaId: dto.vacinaId,
          dosesNecessarias: dto.dosesNecessarias,
          intervaloEntreDosesEmDias: dto.intervaloEntreDosesEmDias,
          requerReforcoAnual: dto.requerReforcoAnual,
          status: StatusCiclo.PENDENTE,
        },
      });

      await tx.aplicacaoVacina.create({
        data: {
          laboratorio: dto.laboratorio,
          lote: dto.lote,
          medVet: dto.medVet,
          protocoloVacinalId: protocolo.id,
          valorPago: dto.valorPago,
        },
      });

      const dosesAplicadas = await tx.aplicacaoVacina.count({
        where: { protocoloVacinalId: protocolo.id },
      });

      let novoStatus: StatusCiclo = StatusCiclo.EM_ANDAMENTO;
      let proximaData: Date | null = new Date();
      let dataLembreteProximoCiclo: Date | null = null;

      if (dosesAplicadas >= protocolo.dosesNecessarias) {
        novoStatus = StatusCiclo.COMPLETO;
        proximaData = null;
        if (protocolo.requerReforcoAnual) {
          dataLembreteProximoCiclo = new Date();
          dataLembreteProximoCiclo.setFullYear(
            dataLembreteProximoCiclo.getFullYear() + 1,
          );
        }
      } else {
        proximaData.setDate(
          proximaData.getDate() + protocolo.intervaloEntreDosesEmDias,
        );
      }

      const protocoloAtualizado = await tx.protocoloVacinal.update({
        where: { id: protocolo.id },
        data: {
          status: novoStatus,
          dataProximaVacina: proximaData,
          dataLembreteProximoCiclo: dataLembreteProximoCiclo,
        },
        include: { aplicacoes: true },
      });

      return protocoloAtualizado;
    });
  }

  /**
   * Busca o histórico completo de vacinação de um felino específico.
   * @param {string} felinoId - O ID (UUID) do felino a ser consultado.
   * @returns {Promise<ProtocoloVacinal[]>} Uma lista de protocolos de vacinação do felino,
   * incluindo os dados da vacina e de cada aplicação.
   * @throws {NotFoundException} Se o felino com o ID fornecido não for encontrado.
   */
  async buscarPorFelino(felinoId: string): Promise<ProtocoloVacinal[]> {
    const felino = await this.prisma.felinos.findUnique({
      where: { id: felinoId },
    });
    if (!felino) {
      throw new NotFoundException(`Felino com ID ${felinoId} não encontrado.`);
    }
    return this.prisma.protocoloVacinal.findMany({
      where: { felinoId },
      include: { vacina: true, aplicacoes: true },
    });
  }

  /**
   * Busca por protocolos de vacinação que exigem atenção, como doses atrasadas
   * ou próximas do vencimento.
   * @returns {Promise<ProtocoloVacinal[]>} Uma lista de protocolos que atendem aos critérios de
   * alerta, incluindo dados do felino e da vacina para fácil identificação.
   */
  async alertas(): Promise<ProtocoloVacinal[]> {
    const hoje = new Date();
    const daqui7Dias = new Date();
    daqui7Dias.setDate(hoje.getDate() + 7);

    return this.prisma.protocoloVacinal.findMany({
      where: {
        OR: [
          { status: StatusCiclo.ATRASADO },
          {
            status: StatusCiclo.EM_ANDAMENTO,
            dataProximaVacina: { gte: hoje, lte: daqui7Dias },
          },
        ],
      },
      include: { felino: true, vacina: true },
    });
  }

  /**
   * Busca por protocolos concluídos que têm um reforço anual agendado para os próximos 30 dias.
   * @returns {Promise<ProtocoloVacinal[]>} Uma lista de protocolos com reforços anuais próximos,
   * incluindo dados do felino e da vacina.
   */
  async buscarReforcosAnuais(): Promise<ProtocoloVacinal[]> {
    const hoje = new Date();
    const daqui30Dias = new Date();
    daqui30Dias.setDate(hoje.getDate() + 30);

    return this.prisma.protocoloVacinal.findMany({
      where: {
        status: StatusCiclo.COMPLETO,
        dataLembreteProximoCiclo: { gte: hoje, lte: daqui30Dias },
      },
      include: { felino: true, vacina: true },
    });
  }

  /**
   * Cria uma nova vacina no catálogo do sistema.
   * @param {CreateVacinaDto} createVacinaDto - Objeto com os dados da nova vacina (ex: nome).
   * @returns {Promise<Vacinas>} O objeto da vacina recém-criada.
   */
  async create(createVacinaDto: CreateVacinaDto): Promise<Vacinas> {
    return this.prisma.vacinas.create({ data: createVacinaDto });
  }

  /**
   * Retorna uma lista de todas as vacinas cadastradas no catálogo.
   * @returns {Promise<Vacinas[]>} Uma lista com todas as vacinas.
   */
  async findAll(): Promise<Vacinas[]> {
    return this.prisma.vacinas.findMany();
  }

  /**
   * Busca e retorna uma vacina específica do catálogo pelo seu ID.
   * @param {string} id - O ID (UUID) da vacina a ser buscada.
   * @returns {Promise<Vacinas>} O objeto da vacina encontrada.
   * @throws {NotFoundException} Se a vacina com o ID fornecido não for encontrada.
   */
  async findOne(id: string): Promise<Vacinas> {
    const vacina = await this.prisma.vacinas.findUnique({ where: { id } });
    if (!vacina) {
      throw new NotFoundException(`Vacina com o ID ${id} não encontrada.`);
    }
    return vacina;
  }

  /**
   * Atualiza os dados de uma vacina existente no catálogo.
   * @param {string} id - O ID (UUID) da vacina a ser atualizada.
   * @param {UpdateVacinaDto} updateVacinaDto - Objeto com os dados a serem modificados.
   * @returns {Promise<Vacinas>} O objeto da vacina com os dados atualizados.
   * @throws {NotFoundException} Se a vacina com o ID fornecido não for encontrada.
   */
  async update(id: string, updateVacinaDto: UpdateVacinaDto): Promise<Vacinas> {
    try {
      return await this.prisma.vacinas.update({
        where: { id },
        data: updateVacinaDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Vacina com o ID ${id} não encontrada para atualização.`,
        );
      }
      throw error;
    }
  }

  /**
   * Tarefa agendada (Cron Job) para atualizar o status de protocolos de vacinação para 'ATRASADO'.
   * @description
   * Este método executa automaticamente em um agendamento definido (ex: todo dia às 2h da manhã).
   * Ele busca no banco de dados por protocolos que estão 'EM_ANDAMENTO' mas cuja data da próxima
   * dose já passou, e então atualiza o status deles para 'ATRASADO'.
   * A execução e os resultados são registrados no console.
   * @returns {Promise<void>}
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'verificarProtocolosAtrasados',
    timeZone: 'America/Sao_Paulo',
  })
  async handleVerificarProtocolosAtrasados(): Promise<void> {
    this.logger.log(
      'CRON JOB: Iniciando verificação de protocolos de vacinação atrasados...',
    );

    const hoje = new Date();
    const protocolosAtrasados = await this.prisma.protocoloVacinal.findMany({
      where: {
        status: StatusCiclo.EM_ANDAMENTO,
        dataProximaVacina: { lt: hoje },
      },
      select: { id: true },
    });

    if (protocolosAtrasados.length === 0) {
      this.logger.log(
        'CRON JOB: Nenhum protocolo atrasado encontrado. Encerrando.',
      );
      return;
    }

    const idsParaAtualizar = protocolosAtrasados.map((p) => p.id);

    const resultado = await this.prisma.protocoloVacinal.updateMany({
      where: { id: { in: idsParaAtualizar } },
      data: { status: StatusCiclo.ATRASADO },
    });

    this.logger.log(
      `CRON JOB: Verificação concluída. ${resultado.count} protocolos foram atualizados para o status ATRASADO.`,
    );
  }
}
