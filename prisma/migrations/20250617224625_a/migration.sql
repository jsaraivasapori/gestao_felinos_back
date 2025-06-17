-- CreateEnum
CREATE TYPE "StatusCiclo" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'ATRASADO', 'COMPLETO');

-- CreateEnum
CREATE TYPE "Vacina" AS ENUM ('raiva', 'viralV3', 'viralV4', 'viralV5');

-- AlterTable
ALTER TABLE "Usuarios" ALTER COLUMN "dataAtualziacao" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Vacinas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" "Vacina" NOT NULL,

    CONSTRAINT "Vacinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacinacoesRealizadas" (
    "felinoId" UUID NOT NULL,
    "vacinaId" UUID NOT NULL,
    "dataApliccao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorPago" REAL NOT NULL,

    CONSTRAINT "VacinacoesRealizadas_pkey" PRIMARY KEY ("felinoId","vacinaId","dataApliccao")
);

-- CreateTable
CREATE TABLE "ProtocoloVacinal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "felinoId" UUID NOT NULL,
    "vacinaId" UUID NOT NULL,
    "dosesNecessarias" SMALLINT NOT NULL,
    "intervaloEntreDosesEmDias" SMALLINT NOT NULL,
    "status" "StatusCiclo" NOT NULL,

    CONSTRAINT "ProtocoloVacinal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtocoloVacinal_felinoId_vacinaId_key" ON "ProtocoloVacinal"("felinoId", "vacinaId");

-- AddForeignKey
ALTER TABLE "VacinacoesRealizadas" ADD CONSTRAINT "VacinacoesRealizadas_felinoId_fkey" FOREIGN KEY ("felinoId") REFERENCES "Felinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacinacoesRealizadas" ADD CONSTRAINT "VacinacoesRealizadas_vacinaId_fkey" FOREIGN KEY ("vacinaId") REFERENCES "Vacinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloVacinal" ADD CONSTRAINT "ProtocoloVacinal_felinoId_fkey" FOREIGN KEY ("felinoId") REFERENCES "Felinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloVacinal" ADD CONSTRAINT "ProtocoloVacinal_vacinaId_fkey" FOREIGN KEY ("vacinaId") REFERENCES "Vacinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
