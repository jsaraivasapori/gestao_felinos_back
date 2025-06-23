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

@Controller('vacinas')
export class VacinasController {
  constructor(private readonly vacinasService: VacinasService) {}

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
