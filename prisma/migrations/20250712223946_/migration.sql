/*
  Warnings:

  - You are about to drop the column `registrarPrimeiraDose` on the `ProtocoloVacinal` table. All the data in the column will be lost.
  - Added the required column `requerReforcoAnual` to the `ProtocoloVacinal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProtocoloVacinal" DROP COLUMN "registrarPrimeiraDose",
ADD COLUMN     "requerReforcoAnual" BOOLEAN NOT NULL;
