import { Module } from '@nestjs/common';
import { VacinasService } from './vacinas.service';
import { VacinasController } from './vacinas.controller';

@Module({
  controllers: [VacinasController],
  providers: [VacinasService],
})
export class VacinasModule {}
