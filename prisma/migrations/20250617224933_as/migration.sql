/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Vacinas` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `nome` on the `Vacinas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Vacinas" DROP COLUMN "nome",
ADD COLUMN     "nome" VARCHAR(50) NOT NULL;

-- DropEnum
DROP TYPE "Vacina";

-- CreateIndex
CREATE UNIQUE INDEX "Vacinas_nome_key" ON "Vacinas"("nome");
