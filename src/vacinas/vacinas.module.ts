import { Module } from '@nestjs/common';
import { VacinasService } from './vacinas.service';
import { VacinasController } from './vacinas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [VacinasController],
  providers: [VacinasService],
  imports: [PrismaModule],
})
export class VacinasModule {}
