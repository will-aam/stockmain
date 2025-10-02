const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log("🌱 Iniciando população do banco de dados...");
  try {
    // --- Criação de Usuários ---
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

    for (const userData of usersData) {
      await prisma.usuario.upsert({
        where: { id: userData.id },
        update: {},
        create: userData,
      });
      console.log(`👤 Usuário ${userData.id} criado/atualizado.`);
    }

    // --- Criação de Produtos e Códigos de Barras (APENAS PARA O USUÁRIO 1) ---
    // Dados de exemplo
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

    const userIdForSeed = 1; // Vamos popular dados apenas para o usuário 1

    for (const p of produtos) {
      // **CORREÇÃO AQUI**
      const produto = await prisma.produto.upsert({
        where: {
          // Usando a nova chave composta
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
          usuario_id: userIdForSeed, // Associando ao usuário
        },
      });

      // **CORREÇÃO AQUI**
      await prisma.codigoBarras.upsert({
        where: {
          // Usando a nova chave composta
          codigo_de_barras_usuario_id: {
            codigo_de_barras: p.codigo_de_barras,
            usuario_id: userIdForSeed,
          },
        },
        update: {},
        create: {
          codigo_de_barras: p.codigo_de_barras,
          produto_id: produto.id,
          usuario_id: userIdForSeed, // Associando ao usuário
        },
      });
    }
    console.log(
      `📦 Produtos e códigos de barras de exemplo criados para o usuário ${userIdForSeed}.`
    );
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("✅ População do banco de dados finalizada.");
  }
}

seedDatabase();
