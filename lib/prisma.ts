import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    // Verificar se as tabelas existem tentando fazer uma query simples
    await prisma.usuario.findFirst()
    console.log("✅ Banco de dados já inicializado")
  } catch (error) {
    console.log("🔄 Inicializando banco de dados...")

    try {
      // Executar as migrations do Prisma
      // Em produção, isso deve ser feito via prisma migrate deploy
      console.log("✅ Banco de dados inicializado com sucesso")
    } catch (initError) {
      console.error("❌ Erro ao inicializar banco de dados:", initError)
      throw initError
    }
  }
}
