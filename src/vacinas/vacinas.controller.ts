import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VacinasService } from './vacinas.service';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';
import { CreateVacinacaoDto } from './dto/vacinacao/vacinacao-create-dto';
import { RegistrarDoseSubsequenteDto } from './dto/vacinacao/vacinacao-subsequente-create-dto';

@Controller('vacinas')
export class VacinasController {
  constructor(private readonly vacinasService: VacinasService) {}

  //====================================================================================
  // CONTROLADORES DE VACINAÇÃO. CRIAR PRIEMIRA DOSE E CRIAR DOSES SUBSEQUENTES
  //====================================================================================

  @Get('vacinacao')
  async getAllVaccinations() {
    return this.vacinasService.getAllVaccination();
  }
  @Post('vacinacao')
  async createNewVaccination(@Body() createVacinacaoDto: CreateVacinacaoDto) {
    return this.vacinasService.registrarPrimeiraDose(createVacinacaoDto);
  }

  @Post('vacinacao/nova-dose')
  async createNewDose(
    @Body() registrarDoseSubsequenteDto: RegistrarDoseSubsequenteDto,
  ) {
    return this.vacinasService.aplicarDosesSubsequentes(
      registrarDoseSubsequenteDto,
    );
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
  async findOne(@Param('id') id: string) {
    return this.vacinasService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacinaDto: UpdateVacinaDto,
  ) {
    return this.vacinasService.update(id, updateVacinaDto);
  }
}
