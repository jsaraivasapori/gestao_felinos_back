/*
  Warnings:

  - You are about to alter the column `cep` on the `Voluntarios` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(8)`.

*/
-- AlterTable
ALTER TABLE "Voluntarios" ALTER COLUMN "cep" SET DATA TYPE VARCHAR(8);
