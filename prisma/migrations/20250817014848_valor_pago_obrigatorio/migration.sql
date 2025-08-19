/*
  Warnings:

  - Made the column `valorPago` on table `AplicacaoVacina` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AplicacaoVacina" ALTER COLUMN "valorPago" SET NOT NULL;
