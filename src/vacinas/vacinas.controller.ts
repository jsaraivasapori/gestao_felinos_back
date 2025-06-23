import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VacinasService } from './vacinas.service';
import { CreateVacinaDto } from './dto/create-vacina.dto';
import { UpdateVacinaDto } from './dto/update-vacina.dto';

@Controller('vacinas')
export class VacinasController {
  constructor(private readonly vacinasService: VacinasService) {}

  @Post()
  create(@Body() createVacinaDto: CreateVacinaDto) {
    return this.vacinasService.create(createVacinaDto);
  }

  @Get()
  findAll() {
    return this.vacinasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vacinasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVacinaDto: UpdateVacinaDto) {
    return this.vacinasService.update(+id, updateVacinaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vacinasService.remove(+id);
  }
}
