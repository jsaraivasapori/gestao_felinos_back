/*
  Warnings:

  - Added the required column `registrarPrimeiraDose` to the `ProtocoloVacinal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProtocoloVacinal" ADD COLUMN     "registrarPrimeiraDose" BOOLEAN NOT NULL;
