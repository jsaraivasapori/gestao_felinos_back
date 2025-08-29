import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
   * Registra a aplicação de uma dose de vacina, gerenciando de forma inteligente o ciclo de vida
   * dos protocolos, incluindo a criação de novos ciclos para reforços.
   *
   * @description
   * Este método é o coração da lógica de vacinação. Ele lida com todos os cenários:
   * 1.  **Primeira Dose:** Cria um novo protocolo de vacinação ativo.
   * 2.  **Dose Subsequente:** Encontra o protocolo ativo e adiciona uma nova aplicação, atualizando o status.
   * 3.  **Novo Ciclo (Reforço):** Se um protocolo ativo para a mesma vacina/felino já estiver 'COMPLETO'
   * e permitir reforços, ele "arquiva" o protocolo antigo (marcando-o como `ativo: false`) e
   * cria um novo ciclo, registrando a primeira dose nele.
   * 4.  **Bloqueio:** Se um ciclo estiver 'COMPLETO' e não permitir reforços, a operação é bloqueada.
   *
   * Toda a sequência é executada dentro de uma transação para garantir a integridade dos dados.
   *
   * @param {RegistrarVacinacaoDto} dto - Objeto com todos os dados necessários para o registro.
   * @returns {Promise<ProtocoloVacinal & { aplicacoes: AplicacaoVacina[] }>} O protocolo ATIVO completo e
   * atualizado, incluindo a lista de todas as doses aplicadas nele.
   * @throws {NotFoundException} Se o felino ou a vacina com os IDs fornecidos não forem encontrados.
   * @throws {BadRequestException} Se for tentado adicionar uma dose a um ciclo já completo que não permite reforços.
   */
  async registrar(
    dto: RegistrarVacinacaoDto,
  ): Promise<ProtocoloVacinal & { aplicacoes: AplicacaoVacina[] }> {
    return this.prisma.$transaction(async (tx) => {
      // --- PASSO 1: Validações Iniciais ---
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

      // --- PASSO 2: Busca pelo protocolo ATIVO existente ---
      let protocoloAtivo = await tx.protocoloVacinal.findUnique({
        where: {
          // Usa a nova chave única que inclui o campo 'ativo'
          felinoId_vacinaId_ativo: {
            felinoId: dto.felinoId,
            vacinaId: dto.vacinaId,
            ativo: true,
          },
        },
      });

      // --- PASSO 3: Lógica de Negócio para Protocolos Existentes ---
      if (protocoloAtivo) {
        // Se o protocolo ativo já está completo, decidimos o que fazer.
        if (protocoloAtivo.status === StatusCiclo.COMPLETO) {
          if (protocoloAtivo.requerReforcoAnual) {
            // Se permite reforço, "arquivamos" o protocolo antigo para criar um novo.
            await tx.protocoloVacinal.update({
              where: { id: protocoloAtivo.id },
              data: { ativo: false },
            });
            protocoloAtivo = null; // Força a criação de um novo protocolo no passo seguinte.
          } else {
            // Se não permite reforço, bloqueamos a operação.
            throw new BadRequestException(
              `O ciclo de vacinação para "${vacina.nome}" do felino "${felino.nome}" já está completo e não requer reforços.`,
            );
          }
        }
      }

      // --- PASSO 4: Cria um Novo Protocolo se Necessário ---
      // Isso acontece se for a primeira vez ou se o ciclo anterior foi arquivado.
      if (!protocoloAtivo) {
        protocoloAtivo = await tx.protocoloVacinal.create({
          data: {
            felinoId: dto.felinoId,
            vacinaId: dto.vacinaId,
            dosesNecessarias: dto.dosesNecessarias,
            intervaloEntreDosesEmDias: dto.intervaloEntreDosesEmDias,
            requerReforcoAnual: dto.requerReforcoAnual,
            status: StatusCiclo.PENDENTE,
            ativo: true, // Garante que o novo protocolo seja o ativo.
          },
        });
      }

      // --- PASSO 5: Cria o Registro da Dose no Protocolo Ativo ---
      await tx.aplicacaoVacina.create({
        data: {
          laboratorio: dto.laboratorio,
          lote: dto.lote,
          medVet: dto.medVet,
          protocoloVacinalId: protocoloAtivo.id,
          valorPago: dto.valorPago,
        },
      });

      // --- PASSO 6: Atualiza o Status do Protocolo Ativo ---
      const dosesAplicadas = await tx.aplicacaoVacina.count({
        where: { protocoloVacinalId: protocoloAtivo.id },
      });

      let novoStatus: StatusCiclo = StatusCiclo.EM_ANDAMENTO;
      let proximaData: Date | null = new Date();
      let dataLembreteProximoCiclo: Date | null = null;

      if (dosesAplicadas >= protocoloAtivo.dosesNecessarias) {
        novoStatus = StatusCiclo.COMPLETO;
        proximaData = null;
        if (protocoloAtivo.requerReforcoAnual) {
          dataLembreteProximoCiclo = new Date();
          dataLembreteProximoCiclo.setFullYear(
            dataLembreteProximoCiclo.getFullYear() + 1,
          );
        }
      } else {
        proximaData.setDate(
          proximaData.getDate() + protocoloAtivo.intervaloEntreDosesEmDias,
        );
      }

      const protocoloAtualizado = await tx.protocoloVacinal.update({
        where: { id: protocoloAtivo.id },
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
      include: { felino: true, vacina: true, aplicacoes: true },
    });
  }

  async BuscarUltimas5Aplicacoes(): Promise<AplicacaoVacina[]> {
    return this.prisma.aplicacaoVacina.findMany({
      orderBy: { dataAplicacao: 'desc' },
      take: 5,
      include: {
        protocoloVacinal: {
          include: {
            felino: true,
            vacina: true,
          },
        },
      },
    });
  }

  /**
   * Busca por protocolos concluídos que têm um reforço anual agendado para os próximos 30 dias.
   * @returns {Promise<ProtocoloVacinal[]>} Uma lista de protocolos com reforços anuais próximos,
   * incluindo dados do felino e da vacina.
   */
  async buscarProximosAgendamentos(): Promise<ProtocoloVacinal[]> {
    const hoje = new Date();

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);

    const daqui30Dias = new Date();
    daqui30Dias.setDate(hoje.getDate() + 30);

    const agendamentos = await this.prisma.protocoloVacinal.findMany({
      where: {
        OR: [
          // Condição 1: Doses com ciclos em andamento
          {
            status: StatusCiclo.EM_ANDAMENTO,
            dataProximaVacina: { gte: amanha, lte: daqui30Dias },
          },
          //Condição 2: Protocolos completos que requerem reforços anauais
          {
            status: StatusCiclo.COMPLETO,
            requerReforcoAnual: true,
            dataLembreteProximoCiclo: { gte: amanha, lte: daqui30Dias },
          },
        ],
      },
      include: { felino: true, vacina: true, aplicacoes: true },
    });

    agendamentos.sort((a, b) => {
      const dataA = a.dataProximaVacina || a.dataLembreteProximoCiclo;
      const dataB = b.dataProximaVacina || b.dataLembreteProximoCiclo;

      // --- INÍCIO DA CORREÇÃO ---

      // Se o item 'a' não tiver uma data válida, jogue-o para o final da lista.
      if (!dataA) return 1;
      // Se o item 'b' não tiver uma data válida, jogue-o para o final da lista.
      if (!dataB) return -1;

      // Se chegamos aqui, TypeScript tem certeza que dataA e dataB são datas válidas.
      // Agora a comparação é segura.
      return new Date(dataA).getTime() - new Date(dataB).getTime();

      // --- FIM DA CORREÇÃO ---
    });
    return agendamentos;
  }

  /**
   * Calcula e retorna os principais indicadores de desempenho (KPIs) para o dashboard de vacinas.
   *
   * @description
   * Este método é otimizado para performance, executando quatro consultas de contagem independentes
   * em paralelo usando `Promise.all`. Ele fornece uma 'fotografia' em tempo real do estado de
   * todo o sistema de vacinação, garantindo que os números exibidos no dashboard sejam sempre
   * precisos e atualizados no momento da requisição.
   *
   * @returns {Promise<object>} Uma Promise que resolve para um objeto com os seguintes KPIs:
   * - `aplicado`: (number) O número total de doses de vacina que já foram aplicadas.
   * - `agendado`: (number) Protocolos `EM_ANDAMENTO` ou `PENDENTE` com data de próxima dose para hoje ou no futuro.
   * - `atrasado`: (number) Protocolos oficialmente marcados como `ATRASADO` ou que estão `EM_ANDAMENTO` mas com a data da próxima dose no passado (atrasos em tempo real).
   * - `ciclosCompletos`: (number) Protocolos cujo ciclo de doses já foi finalizado.
   */
  async buscarKpis(): Promise<Object> {
    const hoje = new Date();

    const [totalAplicadas, totalAgendados, totalAtrasado, totalCompleto] =
      await Promise.all([
        // KPI 1: Doses Aplicadas
        // Simplesmente conta todos os registros na tabela de aplicações de vacina.
        this.prisma.aplicacaoVacina.count(),

        // KPI 2: Agendados
        // Conta protocolos que ainda não terminaram E cuja próxima dose é hoje ou em uma data futura.
        this.prisma.protocoloVacinal.count({
          where: {
            status: { in: [StatusCiclo.EM_ANDAMENTO, StatusCiclo.PENDENTE] },
            dataProximaVacina: { gte: hoje },
          },
        }),

        // KPI 3: Atrasados
        // Conta duas categorias de atraso em tempo real:
        // 1. Os que o Cron Job já marcou oficialmente como ATRASADO.
        // 2. Os que ainda estão EM_ANDAMENTO, mas a data da próxima dose já passou hoje.
        this.prisma.protocoloVacinal.count({
          where: {
            OR: [
              {
                status: StatusCiclo.ATRASADO,
              },
              {
                status: StatusCiclo.EM_ANDAMENTO,
                dataProximaVacina: { lt: hoje },
              },
            ],
          },
        }),

        // KPI 4: Ciclos Completos
        // Conta todos os protocolos que já foram finalizados.
        this.prisma.protocoloVacinal.count({
          where: { status: StatusCiclo.COMPLETO },
        }),
      ]);
    const data = {
      aplicado: totalAplicadas,
      agendados: totalAgendados,
      atrasados: totalAtrasado,
      ciclosCompletos: totalCompleto,
    };

    return data;
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
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
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
