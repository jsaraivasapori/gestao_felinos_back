import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FelinoService } from './felino.service';
import { CreateFelinoDto } from './dto/create-felino.dto';
import { UpdateFelinoDto } from './dto/update-felino.dto';

@Controller('felino')
export class FelinoController {
  constructor(private readonly felinoService: FelinoService) {}

  @Post()
  async create(@Body() createFelinoDto: CreateFelinoDto) {
    return await this.felinoService.create(createFelinoDto);
  }

  @Get()
  async findAll() {
    return await this.felinoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.felinoService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFelinoDto: UpdateFelinoDto,
  ) {
    return await this.felinoService.update(id, updateFelinoDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.felinoService.remove(id);
  }
}
