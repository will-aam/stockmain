// src/scripts/seed-database.js
/**
 * Descrição: Script de População do Banco de Dados (Seed).
 * Responsabilidade: Criar dados iniciais no banco de dados para fins de desenvolvimento e teste.
 * Este script gera usuários de exemplo e um catálogo de produtos para um usuário específico.
 * É idempotente, ou seja, pode ser executado várias vezes sem causar erros ou duplicatas,
 * graças ao uso da função `upsert` do Prisma.
 *
 * Como usar:
 * 1. Certifique-se de que seu banco de dados está rodando e as migrations foram aplicadas.
 * 2. Execute o script a partir do terminal na raiz do projeto:
 *    node src/scripts/seed-database.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

/**
 * Função principal que orquestra a criação dos dados no banco.
 */
async function seedDatabase() {
  console.log("🌱 Iniciando população do banco de dados...");
  try {
    // --- 1. Criação de Usuários de Exemplo ---
    // Define uma lista de usuários com senhas hasheadas para segurança.
    const usersData = [
      {
        id: 1,
        email: "loja1@example.com",
        senha_hash: await bcrypt.hash("1234", 10),
      },
      {
        id: 2,
        email: "loja2@example.com",
        senha_hash: await bcrypt.hash("6789", 10),
      },
      {
        id: 3,
        email: "loja3@example.com",
        senha_hash: await bcrypt.hash("1111", 10),
      },
      {
        id: 4,
        email: "loja4@example.com",
        senha_hash: await bcrypt.hash("2222", 10),
      },
      {
        id: 5,
        email: "loja5@example.com",
        senha_hash: await bcrypt.hash("3333", 10),
      },
    ];

    // Usa `upsert` para criar o usuário se ele não existir, ou não fazer nada se já existir.
    for (const userData of usersData) {
      await prisma.usuario.upsert({
        where: { id: userData.id },
        update: {}, // Não atualiza nada se já existir.
        create: userData,
      });
      console.log(`👤 Usuário ${userData.id} criado/atualizado.`);
    }

    // --- 2. Criação de Produtos e Códigos de Barras (APENAS PARA O USUÁRIO 1) ---
    // Para simplificar, vamos popular o catálogo apenas para o primeiro usuário.
    const userIdForSeed = 1;
    const produtos = [
      {
        codigo_produto: "113639",
        descricao: "AGUA H2O LIMONETO 500ML",
        saldo_estoque: 50,
        codigo_de_barras: "7892840812850",
      },
      {
        codigo_produto: "105101",
        descricao: "AGUA H2OH LIMAO 500ML",
        saldo_estoque: 30,
        codigo_de_barras: "7892840812423",
      },
    ];

    for (const p of produtos) {
      // Cria o produto usando a chave única composta (codigo_produto + usuario_id).
      const produto = await prisma.produto.upsert({
        where: {
          codigo_produto_usuario_id: {
            codigo_produto: p.codigo_produto,
            usuario_id: userIdForSeed,
          },
        },
        update: {},
        create: {
          codigo_produto: p.codigo_produto,
          descricao: p.descricao,
          saldo_estoque: p.saldo_estoque,
          usuario_id: userIdForSeed,
        },
      });

      // Cria o código de barras associado ao produto, também usando sua chave composta.
      await prisma.codigoBarras.upsert({
        where: {
          codigo_de_barras_usuario_id: {
            codigo_de_barras: p.codigo_de_barras,
            usuario_id: userIdForSeed,
          },
        },
        update: {},
        create: {
          codigo_de_barras: p.codigo_de_barras,
          produto_id: produto.id,
          usuario_id: userIdForSeed,
        },
      });
    }
    console.log(
      `📦 Produtos e códigos de barras de exemplo criados para o usuário ${userIdForSeed}.`
    );
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error);
    process.exit(1); // Encerra o processo com erro
  } finally {
    await prisma.$disconnect(); // Garante que a conexão com o banco seja fechada.
    console.log("✅ População do banco de dados finalizada.");
  }
}

// Executa a função principal.
seedDatabase();
