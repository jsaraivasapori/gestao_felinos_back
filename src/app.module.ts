import { Module } from '@nestjs/common';
import { FelinoModule } from './felino/felino.module';
import { PrismaModule } from './prisma/prisma.module';
import { VoluntarioModule } from './voluntario/voluntario.module';
import { UsuariosModule } from './usuarios/usuario.module';

@Module({
  imports: [FelinoModule, PrismaModule, VoluntarioModule, UsuariosModule],
})
export class AppModule {}
