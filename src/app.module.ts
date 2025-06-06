import { Module } from '@nestjs/common';
import { FelinoModule } from './felino/felino.module';
import { PrismaModule } from './prisma/prisma.module';
import { VoluntarioModule } from './voluntario/voluntario.module';

@Module({
  imports: [FelinoModule, PrismaModule, VoluntarioModule],
})
export class AppModule {}
