-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('Administrador', 'Gerencial');

-- CreateEnum
CREATE TYPE "StatusCiclo" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'ATRASADO', 'COMPLETO');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('matutino', 'vespertino', 'noturno');

-- CreateEnum
CREATE TYPE "Raca" AS ENUM ('sem_raca', 'siames', 'persa');

-- CreateTable
CREATE TABLE "Felinos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "idade" SMALLINT NOT NULL,
    "raca" "Raca" NOT NULL,
    "dataResgate" TIMESTAMP(3),
    "fiv" BOOLEAN NOT NULL,
    "felv" BOOLEAN NOT NULL,
    "pif" BOOLEAN NOT NULL,
    "isolado" BOOLEAN NOT NULL,
    "observacao" TEXT NOT NULL,

    CONSTRAINT "Felinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacinas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,

    CONSTRAINT "Vacinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacaoVacina" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "laboratorio" VARCHAR(255) NOT NULL,
    "lote" VARCHAR(255) NOT NULL,
    "medVet" VARCHAR(50) NOT NULL,
    "dataAplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorPago" REAL NOT NULL,
    "protocoloVacinalId" UUID NOT NULL,

    CONSTRAINT "AplicacaoVacina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocoloVacinal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "felinoId" UUID NOT NULL,
    "vacinaId" UUID NOT NULL,
    "dosesNecessarias" SMALLINT NOT NULL,
    "intervaloEntreDosesEmDias" SMALLINT NOT NULL,
    "status" "StatusCiclo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataProximaVacina" TIMESTAMP(3),
    "requerReforcoAnual" BOOLEAN NOT NULL,
    "dataLembreteProximoCiclo" TIMESTAMP(3),

    CONSTRAINT "ProtocoloVacinal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voluntarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(50) NOT NULL,
    "telefone" VARCHAR(12) NOT NULL,
    "turno" "Turno" NOT NULL,
    "largadouro" VARCHAR(255) NOT NULL,
    "bairro" VARCHAR(255) NOT NULL,
    "cidade" VARCHAR(255) NOT NULL,
    "cep" VARCHAR(8),
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voluntarios_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "Vacinas_nome_key" ON "Vacinas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocoloVacinal_felinoId_vacinaId_ativo_key" ON "ProtocoloVacinal"("felinoId", "vacinaId", "ativo");

-- AddForeignKey
ALTER TABLE "AplicacaoVacina" ADD CONSTRAINT "AplicacaoVacina_protocoloVacinalId_fkey" FOREIGN KEY ("protocoloVacinalId") REFERENCES "ProtocoloVacinal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloVacinal" ADD CONSTRAINT "ProtocoloVacinal_felinoId_fkey" FOREIGN KEY ("felinoId") REFERENCES "Felinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloVacinal" ADD CONSTRAINT "ProtocoloVacinal_vacinaId_fkey" FOREIGN KEY ("vacinaId") REFERENCES "Vacinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
