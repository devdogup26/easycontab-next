-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "RegimeTributario" AS ENUM ('SIMPLES_NACIONAL', 'NORMAL');

-- CreateEnum
CREATE TYPE "SituacaoFiscal" AS ENUM ('REGULAR', 'REGULARIZADO', 'IRREGULAR');

-- CreateEnum
CREATE TYPE "TipoObrigacao" AS ENUM ('DCTFWEB', 'EFD_ICMS_IPI', 'DEFIS', 'DMED', 'ECD_SPED', 'ECF_SPED', 'EFD_CONTRIBUICOES', 'ESOCIAL', 'PGDAS', 'REINF_R2099', 'REINF_R4099');

-- CreateEnum
CREATE TYPE "StatusObrigacao" AS ENUM ('ENTREGUE', 'NAO_ENTREGUE', 'INCONSISTENCIA', 'EM_PROCESSAMENTO', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoParcelamento" AS ENUM ('PGFN', 'NAO_PREVIDENCIARIO', 'SIMPLES_NACIONAL', 'SIMPLIFICADO', 'PREVIDENCIARIO');

-- CreateEnum
CREATE TYPE "StatusCertificado" AS ENUM ('VALIDO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoProcuracao" AS ENUM ('COMPLETA', 'PARCIAL', 'LIMITADA');

-- CreateEnum
CREATE TYPE "StatusProcuracao" AS ENUM ('VALIDA', 'VENCIDA', 'CANCELADA', 'SEM_PROCURACAO');

-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('NOTIFICACAO', 'INTIMACAO', 'TERMO_EXCLUSAO', 'INFORMATIVA', 'OTIMOS');

-- CreateEnum
CREATE TYPE "RelevanciaMensagem" AS ENUM ('RELEVANTE', 'NAO_RELEVANTE');

-- CreateEnum
CREATE TYPE "EnumAuditoria" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "Contador" (
    "id" TEXT NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL,
    "documento" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "crc" TEXT,
    "cna" TEXT,
    "inscricaoEstadual" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT NOT NULL DEFAULT '',
    "cep" TEXT,
    "logoUrl" TEXT,
    "responsavel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "perfilId" TEXT,
    "contadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteFinal" (
    "id" TEXT NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL,
    "documento" TEXT NOT NULL,
    "nomeRazao" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "estadoCivil" TEXT,
    "inscricaoEstadual" TEXT,
    "regime" "RegimeTributario" NOT NULL,
    "contadorId" TEXT NOT NULL,
    "situacaoFiscal" "SituacaoFiscal" NOT NULL,
    "logradouro" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "responsavelTecnico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteFinal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obrigacao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoObrigacao" NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dataVencimento" TIMESTAMP(3),
    "status" "StatusObrigacao" NOT NULL,
    "reciboUrl" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obrigacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcelamento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoParcelamento" NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "parcelasEmAtraso" INTEGER NOT NULL DEFAULT 0,
    "valorAtraso" DECIMAL(15,2),
    "inicio" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcelamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cnpj" TEXT,
    "validade" TIMESTAMP(3) NOT NULL,
    "responsavel" TEXT,
    "status" "StatusCertificado" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procuracao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoProcuracao" NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "status" "StatusProcuracao" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" "TipoMensagem" NOT NULL,
    "relevancia" "RelevanciaMensagem" NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "contadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "usuarioNome" TEXT NOT NULL,
    "contadorId" TEXT NOT NULL,
    "acao" "EnumAuditoria" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "dadosAntigos" JSONB,
    "dadosNovos" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PerfilPermissoes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PerfilPermissoes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contador_documento_key" ON "Contador"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Contador_slug_key" ON "Contador"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Contador_email_key" ON "Contador"("email");

-- CreateIndex
CREATE INDEX "Contador_documento_idx" ON "Contador"("documento");

-- CreateIndex
CREATE INDEX "Contador_crc_idx" ON "Contador"("crc");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_contadorId_idx" ON "Usuario"("contadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_token_key" ON "Sessao"("token");

-- CreateIndex
CREATE INDEX "Sessao_token_idx" ON "Sessao"("token");

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFinal_documento_key" ON "ClienteFinal"("documento");

-- CreateIndex
CREATE INDEX "ClienteFinal_contadorId_idx" ON "ClienteFinal"("contadorId");

-- CreateIndex
CREATE INDEX "ClienteFinal_documento_idx" ON "ClienteFinal"("documento");

-- CreateIndex
CREATE INDEX "Obrigacao_clienteId_idx" ON "Obrigacao"("clienteId");

-- CreateIndex
CREATE INDEX "Obrigacao_tipo_ano_mes_idx" ON "Obrigacao"("tipo", "ano", "mes");

-- CreateIndex
CREATE INDEX "Obrigacao_status_idx" ON "Obrigacao"("status");

-- CreateIndex
CREATE INDEX "Obrigacao_dataVencimento_idx" ON "Obrigacao"("dataVencimento");

-- CreateIndex
CREATE INDEX "Parcelamento_clienteId_idx" ON "Parcelamento"("clienteId");

-- CreateIndex
CREATE INDEX "Parcelamento_tipo_idx" ON "Parcelamento"("tipo");

-- CreateIndex
CREATE INDEX "Certificado_clienteId_idx" ON "Certificado"("clienteId");

-- CreateIndex
CREATE INDEX "Certificado_validade_idx" ON "Certificado"("validade");

-- CreateIndex
CREATE INDEX "Procuracao_clienteId_idx" ON "Procuracao"("clienteId");

-- CreateIndex
CREATE INDEX "Procuracao_validade_idx" ON "Procuracao"("validade");

-- CreateIndex
CREATE INDEX "Mensagem_clienteId_idx" ON "Mensagem"("clienteId");

-- CreateIndex
CREATE INDEX "Mensagem_relevancia_lida_idx" ON "Mensagem"("relevancia", "lida");

-- CreateIndex
CREATE INDEX "Perfil_contadorId_idx" ON "Perfil"("contadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_nome_contadorId_key" ON "Perfil"("nome", "contadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_codigo_key" ON "Permissao"("codigo");

-- CreateIndex
CREATE INDEX "Auditoria_contadorId_createdAt_idx" ON "Auditoria"("contadorId", "createdAt");

-- CreateIndex
CREATE INDEX "Auditoria_entidade_entidadeId_idx" ON "Auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_acao_idx" ON "Auditoria"("acao");

-- CreateIndex
CREATE INDEX "_PerfilPermissoes_B_index" ON "_PerfilPermissoes"("B");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_contadorId_fkey" FOREIGN KEY ("contadorId") REFERENCES "Contador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteFinal" ADD CONSTRAINT "ClienteFinal_contadorId_fkey" FOREIGN KEY ("contadorId") REFERENCES "Contador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obrigacao" ADD CONSTRAINT "Obrigacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteFinal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcelamento" ADD CONSTRAINT "Parcelamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteFinal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteFinal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procuracao" ADD CONSTRAINT "Procuracao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteFinal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteFinal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_contadorId_fkey" FOREIGN KEY ("contadorId") REFERENCES "Contador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PerfilPermissoes" ADD CONSTRAINT "_PerfilPermissoes_A_fkey" FOREIGN KEY ("A") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PerfilPermissoes" ADD CONSTRAINT "_PerfilPermissoes_B_fkey" FOREIGN KEY ("B") REFERENCES "Permissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
