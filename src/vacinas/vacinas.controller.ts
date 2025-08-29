import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VacinasService } from './vacinas.service';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';
import { RegistrarVacinacaoDto } from './dto/registar-vacina.dto';
import { get } from 'http';

@Controller('vacinas')
export class VacinasController {
  constructor(private readonly vacinasService: VacinasService) {}

  //====================================================================================
  // CONTROLADORES DE VACINAÇÃO. CRIAR PRIEMIRA DOSE E CRIAR DOSES SUBSEQUENTES
  //====================================================================================

  @Post('registrar')
  async registrar(@Body() registrarVacinacaoDto: RegistrarVacinacaoDto) {
    return this.vacinasService.registrar(registrarVacinacaoDto);
  }

  @Get('felino/:felinoId')
  buscarPorFelino(@Param('felinoId', ParseUUIDPipe) felinoId: string) {
    return this.vacinasService.buscarPorFelino(felinoId);
  }

  @Get('alertas')
  buscarAlertas() {
    return this.vacinasService.alertas();
  }

  @Get('reforcos-anauais')
  buscarReforcosAnuais() {
    return this.vacinasService.buscarProximosAgendamentos();
  }

  @Get('ultimas-aplicacoes')
  buscarUltimasAplicacoes() {
    return this.vacinasService.BuscarUltimas5Aplicacoes();
  }
  @Get('kpis')
  buscarKpis() {
    return this.vacinasService.buscarKpis();
  }

  //==========================================================================================
  // Controladores para Vacinas. Criar, mostrar e editar cadastro de vacinas no sistema
  //==========================================================================================
  @Post()
  async create(@Body() createVacinaDto: CreateVacinaDto) {
    return this.vacinasService.create(createVacinaDto);
  }

  @Get()
  async findAll() {
    return this.vacinasService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vacinasService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVacinaDto: UpdateVacinaDto,
  ) {
    return this.vacinasService.update(id, updateVacinaDto);
  }
}
