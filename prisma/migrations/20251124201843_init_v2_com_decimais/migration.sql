-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessoes" (
    "id" SERIAL NOT NULL,
    "codigo_acesso" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMP(3),
    "anfitriao_id" INTEGER NOT NULL,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."participantes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "entrou_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movimentos" (
    "id" SERIAL NOT NULL,
    "id_movimento_cliente" TEXT NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "participante_id" INTEGER,
    "codigo_barras" TEXT NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produtos_sessao" (
    "id" SERIAL NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "codigo_produto" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "saldo_sistema" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "codigo_barras" TEXT,

    CONSTRAINT "produtos_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produtos" (
    "id" SERIAL NOT NULL,
    "codigo_produto" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "saldo_estoque" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."codigos_de_barras" (
    "codigo_de_barras" TEXT NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "codigos_de_barras_pkey" PRIMARY KEY ("codigo_de_barras","usuario_id")
);

-- CreateTable
CREATE TABLE "public"."contagens" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data_contagem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "local_estoque" TEXT NOT NULL DEFAULT 'loja-1',
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "observacoes" TEXT,

    CONSTRAINT "contagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_contados" (
    "id" SERIAL NOT NULL,
    "contagem_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "codigo_de_barras" TEXT NOT NULL,
    "quant_loja" INTEGER NOT NULL DEFAULT 0,
    "quant_estoque" INTEGER NOT NULL DEFAULT 0,
    "saldo_estoque_inicial" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_contados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contagens_salvas" (
    "id" SERIAL NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "conteudo_csv" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "contagens_salvas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_codigo_acesso_key" ON "public"."sessoes"("codigo_acesso");

-- CreateIndex
CREATE UNIQUE INDEX "movimentos_id_movimento_cliente_key" ON "public"."movimentos"("id_movimento_cliente");

-- CreateIndex
CREATE INDEX "movimentos_sessao_id_codigo_barras_idx" ON "public"."movimentos"("sessao_id", "codigo_barras");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sessao_sessao_id_codigo_produto_key" ON "public"."produtos_sessao"("sessao_id", "codigo_produto");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_produto_usuario_id_key" ON "public"."produtos"("codigo_produto", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "itens_contados_contagem_id_produto_id_key" ON "public"."itens_contados"("contagem_id", "produto_id");

-- AddForeignKey
ALTER TABLE "public"."sessoes" ADD CONSTRAINT "sessoes_anfitriao_id_fkey" FOREIGN KEY ("anfitriao_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."participantes" ADD CONSTRAINT "participantes_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentos" ADD CONSTRAINT "movimentos_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentos" ADD CONSTRAINT "movimentos_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "public"."participantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos_sessao" ADD CONSTRAINT "produtos_sessao_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos" ADD CONSTRAINT "produtos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."codigos_de_barras" ADD CONSTRAINT "codigos_de_barras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."codigos_de_barras" ADD CONSTRAINT "codigos_de_barras_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contagens" ADD CONSTRAINT "contagens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_contados" ADD CONSTRAINT "itens_contados_contagem_id_fkey" FOREIGN KEY ("contagem_id") REFERENCES "public"."contagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_contados" ADD CONSTRAINT "itens_contados_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contagens_salvas" ADD CONSTRAINT "contagens_salvas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
