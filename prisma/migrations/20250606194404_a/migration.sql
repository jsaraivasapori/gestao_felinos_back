/*
  Warnings:

  - You are about to drop the column `bairo` on the `Voluntarios` table. All the data in the column will be lost.
  - Added the required column `bairro` to the `Voluntarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Voluntarios" DROP COLUMN "bairo",
ADD COLUMN     "bairro" VARCHAR(255) NOT NULL;
