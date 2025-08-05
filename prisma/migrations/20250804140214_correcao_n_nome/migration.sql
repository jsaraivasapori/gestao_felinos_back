/*
  Warnings:

  - The primary key for the `VacinacoesRealizadas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dataApliccao` on the `VacinacoesRealizadas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VacinacoesRealizadas" DROP CONSTRAINT "VacinacoesRealizadas_pkey",
DROP COLUMN "dataApliccao",
ADD COLUMN     "dataAplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "VacinacoesRealizadas_pkey" PRIMARY KEY ("felinoId", "vacinaId", "dataAplicacao");
