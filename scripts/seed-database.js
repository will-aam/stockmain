// Script para popular o banco de dados com dados de exemplo
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function seedDatabase() {
  console.log("🌱 Iniciando população do banco de dados...")

  try {
    // Criar usuário administrador
    const hashedPassword = await bcrypt.hash("admin123", 12)

    const adminUser = await prisma.usuario.upsert({
      where: { email: "admin@sistema.com" },
      update: {},
      create: {
        email: "admin@sistema.com",
        senha_hash: hashedPassword,
      },
    })

    console.log("👤 Usuário admin criado/atualizado")

    // Produtos de exemplo
    const produtos = [
      { codigo_produto: "113639", descricao: "AGUA H2O LIMONETO 500ML", saldo_estoque: 50 },
      { codigo_produto: "113640", descricao: "REFRIGERANTE COLA 350ML", saldo_estoque: 30 },
      { codigo_produto: "113641", descricao: "SUCO LARANJA 1L", saldo_estoque: 25 },
      { codigo_produto: "113642", descricao: "BISCOITO CHOCOLATE 200G", saldo_estoque: 40 },
      { codigo_produto: "113643", descricao: "LEITE INTEGRAL 1L", saldo_estoque: 35 },
      { codigo_produto: "113644", descricao: "CAFE TORRADO 500G", saldo_estoque: 20 },
      { codigo_produto: "113645", descricao: "AÇUCAR CRISTAL 1KG", saldo_estoque: 60 },
      { codigo_produto: "113646", descricao: "ARROZ BRANCO 5KG", saldo_estoque: 15 },
      { codigo_produto: "113647", descricao: "FEIJAO PRETO 1KG", saldo_estoque: 25 },
      { codigo_produto: "113648", descricao: "MACARRAO ESPAGUETE 500G", saldo_estoque: 45 },
    ]

    // Códigos de barras correspondentes
    const codigosBarras = [
      "7892840812850",
      "7892840812851",
      "7892840812852",
      "7892840812853",
      "7892840812854",
      "7892840812855",
      "7892840812856",
      "7892840812857",
      "7892840812858",
      "7892840812859",
    ]

    // Inserir produtos e códigos de barras
    for (let i = 0; i < produtos.length; i++) {
      const produto = await prisma.produto.upsert({
        where: { codigo_produto: produtos[i].codigo_produto },
        update: {},
        create: produtos[i],
      })

      await prisma.codigoBarras.upsert({
        where: { codigo_de_barras: codigosBarras[i] },
        update: {},
        create: {
          codigo_de_barras: codigosBarras[i],
          produto_id: produto.id,
        },
      })
    }

    console.log(`📦 ${produtos.length} produtos inseridos/atualizados`)
    console.log(`🏷️ ${codigosBarras.length} códigos de barras inseridos/atualizados`)
    console.log("✅ Banco de dados populado com sucesso!")
    console.log("📧 Email: admin@sistema.com")
    console.log("🔑 Senha: admin123")
  } catch (error) {
    console.error("❌ Erro ao popular banco de dados:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase().catch((error) => {
  console.error(error)
  process.exit(1)
})
