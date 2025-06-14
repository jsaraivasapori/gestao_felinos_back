/*
  Warnings:

  - The `dataResgate` column on the `Felinos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Felinos" DROP COLUMN "dataResgate",
ADD COLUMN     "dataResgate" TIMESTAMP(3);
