-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('matutino', 'vespertino', 'noturno');

-- CreateTable
CREATE TABLE "Voluntarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "telefone" VARCHAR(12) NOT NULL,
    "turno" "Turno" NOT NULL,
    "largadouro" VARCHAR(255) NOT NULL,
    "bairo" VARCHAR(255) NOT NULL,
    "cidade" VARCHAR(255) NOT NULL,
    "cep" VARCHAR(255),
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voluntarios_pkey" PRIMARY KEY ("id")
);
