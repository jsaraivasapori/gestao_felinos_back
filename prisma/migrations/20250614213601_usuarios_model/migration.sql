-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('Administrador', 'Gerencial');

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "login" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualziacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);
