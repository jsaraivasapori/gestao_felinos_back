/*
  Warnings:

  - Added the required column `protocoloVacinalId` to the `VacinacoesRealizadas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VacinacoesRealizadas" ADD COLUMN     "protocoloVacinalId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "VacinacoesRealizadas" ADD CONSTRAINT "VacinacoesRealizadas_protocoloVacinalId_fkey" FOREIGN KEY ("protocoloVacinalId") REFERENCES "ProtocoloVacinal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
