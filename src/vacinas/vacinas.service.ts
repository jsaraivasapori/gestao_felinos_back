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
import { RegistrarDoseSubsequenteDto } from './dto/vacinacao/vacinacao-subsequente-create-dto';

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
  async registrarPrimeiraDose(primeiraVacina: CreateVacinacaoDto) {
    return this.prisma.$transaction(async (tx) => {
      // Validação 1: Garante que o felino e a vacina informados realmente existem no banco.
      const felinoExiste = await tx.felinos.findUnique({
        where: { id: primeiraVacina.felinoId },
      });
      if (!felinoExiste) {
        throw new BadRequestException(
          `Felino com o ID ${primeiraVacina.felinoId} não encontrado`,
        );
      }

      const vacinaExiste = await tx.vacinas.findUnique({
        where: { id: primeiraVacina.vacinaId },
      });
      if (!vacinaExiste) {
        throw new BadRequestException(
          `Vacina com o ID ${primeiraVacina.vacinaId} não encontrada`,
        );
      }

      // Validação 2: Garante que não existe um protocolo "em aberto" para este mesmo felino e vacina.
      const protocoloNaoConcluido = await tx.protocoloVacinal.findFirst({
        where: {
          felinoId: primeiraVacina.felinoId,
          vacinaId: primeiraVacina.vacinaId,
          status: {
            in: [
              StatusCiclo.PENDENTE,
              StatusCiclo.EM_ANDAMENTO,
              StatusCiclo.ATRASADO,
            ],
          },
        },
      });

      if (protocoloNaoConcluido) {
        throw new BadRequestException(
          `Já existe um protocolo em andamento com status '${protocoloNaoConcluido.status}'. Finalize-o antes de iniciar um novo.`,
        );
      }

      // Lógica 1: Determina o status inicial do ciclo.
      const statusAtual =
        primeiraVacina.dosesNecessarias === 1
          ? StatusCiclo.COMPLETO
          : StatusCiclo.EM_ANDAMENTO;

      // Lógica 2: Calcula as datas futuras com base no status.
      let proximaDose: Date | null = null;
      let lembreteProximoCiclo: Date | null = null;

      if (statusAtual === StatusCiclo.EM_ANDAMENTO) {
        // Se o ciclo tem múltiplas doses, calcula a data da próxima dose interna.
        proximaDose = new Date();
        proximaDose.setDate(
          proximaDose.getDate() + primeiraVacina.intervaloEntreDosesEmDias,
        );
      } else if (
        statusAtual === StatusCiclo.COMPLETO &&
        primeiraVacina.requerReforcoAnual // Apenas se for dose única E anual.
      ) {
        // Se for dose única e anual, já calcula o lembrete para o próximo ano.
        lembreteProximoCiclo = new Date();
        lembreteProximoCiclo.setFullYear(
          lembreteProximoCiclo.getFullYear() + 1,
        );
      }

      // Passo 1 da Transação: Cria o protocolo primeiro para obter seu ID.
      const protocoloVacinal = await tx.protocoloVacinal.create({
        data: {
          felinoId: primeiraVacina.felinoId,
          vacinaId: primeiraVacina.vacinaId,
          dosesNecessarias: primeiraVacina.dosesNecessarias,
          intervaloEntreDosesEmDias: primeiraVacina.intervaloEntreDosesEmDias,
          requerReforcoAnual: primeiraVacina.requerReforcoAnual,
          status: statusAtual,
          dataProximaVacina: proximaDose,
          dataLembreteProximoCiclo: lembreteProximoCiclo,
        },
      });

      // Passo 2 da Transação: Cria o registro da dose aplicada, ligando-o ao protocolo.
      const vacinaRealizada = await tx.vacinacoesRealizadas.create({
        data: {
          felinoId: primeiraVacina.felinoId,
          vacinaId: primeiraVacina.vacinaId,
          lote: primeiraVacina.lote,
          laboratorio: primeiraVacina.laboratorio,
          medVet: primeiraVacina.medVet,
          valorPago: primeiraVacina.valorPago,
          protocoloVacinalId: protocoloVacinal.id, // Ligação crucial com o ciclo de tratamento.
        },
      });

      return { vacinaRealizada, protocoloVacinal };
    });
  }

  /**
   * Registra uma dose subsequente (2ª, 3ª, etc.) e atualiza o protocolo existente.
   * Finaliza o ciclo se a última dose for aplicada e agenda o lembrete anual se necessário.
   * @param doseSubsequente DTO com os dados da dose aplicada.
   * @returns Um objeto contendo a nova vacina aplicada e o protocolo atualizado.
   */
  async aplicarDosesSubsequentes(doseSubsequente: RegistrarDoseSubsequenteDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Encontra o protocolo que está aguardando uma dose.
      const protocolo = await tx.protocoloVacinal.findFirst({
        where: {
          felinoId: doseSubsequente.felinoId,
          vacinaId: doseSubsequente.vacinaId,
          status: {
            in: [StatusCiclo.ATRASADO, StatusCiclo.EM_ANDAMENTO],
          },
        },
      });

      if (!protocolo) {
        throw new NotFoundException(
          'Nenhum protocolo em andamento encontrado para este felino e vacina.',
        );
      }

      // 2. Cria o registro da nova dose, ligando-a ao seu ciclo.
      const novaVacinacao = await tx.vacinacoesRealizadas.create({
        data: {
          felinoId: doseSubsequente.felinoId,
          vacinaId: doseSubsequente.vacinaId,
          laboratorio: doseSubsequente.laboratorio,
          lote: doseSubsequente.lote,
          medVet: doseSubsequente.medVet,
          valorPago: doseSubsequente.valorPago,
          protocoloVacinalId: protocolo.id,
        },
      });

      // 3. Conta o total de doses aplicadas NESTE ciclo específico.
      const dosesRealizadasCount = await tx.vacinacoesRealizadas.count({
        where: {
          protocoloVacinalId: protocolo.id,
        },
      });

      // 4. Prepara as variáveis para a atualização do protocolo.
      let proximaDose: Date | null = null;
      let lembreteProximoCiclo: Date | null = null;
      let novoStatus: StatusCiclo = StatusCiclo.EM_ANDAMENTO;

      // 5. Decide o que fazer com base na contagem de doses.
      if (dosesRealizadasCount >= protocolo.dosesNecessarias) {
        // --- O CICLO TERMINOU ---
        novoStatus = StatusCiclo.COMPLETO;
        proximaDose = null; // Não há próxima dose neste ciclo.

        // Se o protocolo for anual, calcula a data de lembrete para o próximo ano.
        if (protocolo.requerReforcoAnual) {
          lembreteProximoCiclo = new Date();
          lembreteProximoCiclo.setFullYear(
            lembreteProximoCiclo.getFullYear() + 1,
          );
        }
      } else {
        // --- O CICLO CONTINUA ---
        novoStatus = StatusCiclo.EM_ANDAMENTO; // Garante que, se estava ATRASADO, volte ao normal.
        proximaDose = new Date(); // A partir da data da aplicação atual
        proximaDose.setDate(
          proximaDose.getDate() + protocolo.intervaloEntreDosesEmDias,
        );
      }

      // 6. Atualiza o protocolo com os novos dados.
      const protocoloAtualizado = await tx.protocoloVacinal.update({
        where: { id: protocolo.id },
        data: {
          status: novoStatus,
          dataProximaVacina: proximaDose,
          dataLembreteProximoCiclo: lembreteProximoCiclo,
        },
      });

      return { novaVacinacao, protocoloAtualizado };
    });
  }

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
