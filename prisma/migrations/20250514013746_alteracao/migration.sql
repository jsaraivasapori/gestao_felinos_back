/*
  Warnings:

  - You are about to drop the column `dataResgte` on the `Felinos` table. All the data in the column will be lost.
  - Added the required column `dataResgate` to the `Felinos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Felinos" DROP COLUMN "dataResgte",
ADD COLUMN     "dataResgate" DATE NOT NULL;
