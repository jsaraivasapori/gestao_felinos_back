/*
  Warnings:

  - You are about to drop the column `dataLembreteProximoCiclo` on the `ProtocoloVacinal` table. All the data in the column will be lost.
  - You are about to drop the `VacinacoesRealizadas` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[felinoId,vacinaId]` on the table `ProtocoloVacinal` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dosesNecessarias` on table `ProtocoloVacinal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intervaloEntreDosesEmDias` on table `ProtocoloVacinal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "VacinacoesRealizadas" DROP CONSTRAINT "VacinacoesRealizadas_felinoId_fkey";

-- DropForeignKey
ALTER TABLE "VacinacoesRealizadas" DROP CONSTRAINT "VacinacoesRealizadas_protocoloVacinalId_fkey";

-- DropForeignKey
ALTER TABLE "VacinacoesRealizadas" DROP CONSTRAINT "VacinacoesRealizadas_vacinaId_fkey";

-- AlterTable
ALTER TABLE "ProtocoloVacinal" DROP COLUMN "dataLembreteProximoCiclo",
ALTER COLUMN "dosesNecessarias" SET NOT NULL,
ALTER COLUMN "intervaloEntreDosesEmDias" SET NOT NULL;

-- DropTable
DROP TABLE "VacinacoesRealizadas";

-- CreateTable
CREATE TABLE "AplicacaoVacina" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "laboratorio" VARCHAR(255) NOT NULL,
    "lote" VARCHAR(255) NOT NULL,
    "medVet" VARCHAR(50) NOT NULL,
    "dataAplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorPago" REAL,
    "protocoloVacinalId" UUID NOT NULL,

    CONSTRAINT "AplicacaoVacina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtocoloVacinal_felinoId_vacinaId_key" ON "ProtocoloVacinal"("felinoId", "vacinaId");

-- AddForeignKey
ALTER TABLE "AplicacaoVacina" ADD CONSTRAINT "AplicacaoVacina_protocoloVacinalId_fkey" FOREIGN KEY ("protocoloVacinalId") REFERENCES "ProtocoloVacinal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
