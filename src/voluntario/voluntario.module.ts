import { Module } from '@nestjs/common';
import { VoluntarioService } from './voluntario.service';
import { VoluntarioController } from './voluntario.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [VoluntarioController],
  providers: [VoluntarioService],
  imports: [PrismaModule],
})
export class VoluntarioModule {}
