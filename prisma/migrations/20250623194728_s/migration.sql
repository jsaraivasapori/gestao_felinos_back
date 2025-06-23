/*
  Warnings:

  - Added the required column `laboratorio` to the `VacinacoesRealizadas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lote` to the `VacinacoesRealizadas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medVet` to the `VacinacoesRealizadas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VacinacoesRealizadas" ADD COLUMN     "laboratorio" VARCHAR(255) NOT NULL,
ADD COLUMN     "lote" VARCHAR(255) NOT NULL,
ADD COLUMN     "medVet" VARCHAR(50) NOT NULL;
