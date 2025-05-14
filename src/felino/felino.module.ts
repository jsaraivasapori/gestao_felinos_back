import { Module } from '@nestjs/common';
import { FelinoService } from './felino.service';
import { FelinoController } from './felino.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FelinoController],
  providers: [FelinoService],
  imports: [PrismaModule],
})
export class FelinoModule {}
