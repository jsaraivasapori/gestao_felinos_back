-- CreateEnum
CREATE TYPE "Raca" AS ENUM ('sem_raca', 'siames', 'persa');

-- CreateTable
CREATE TABLE "Felinos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "idade" SMALLINT NOT NULL,
    "raca" "Raca" NOT NULL,
    "dataResgte" DATE NOT NULL,
    "dataAdocao" DATE NOT NULL,
    "fiv" BOOLEAN NOT NULL,
    "felv" BOOLEAN NOT NULL,
    "pif" BOOLEAN NOT NULL,
    "isolado" BOOLEAN NOT NULL,
    "observacao" TEXT NOT NULL,

    CONSTRAINT "Felinos_pkey" PRIMARY KEY ("id")
);
