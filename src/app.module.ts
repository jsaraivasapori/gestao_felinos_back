import { Module } from '@nestjs/common';
import { FelinoModule } from './felino/felino.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [FelinoModule, PrismaModule],
})
export class AppModule {}
