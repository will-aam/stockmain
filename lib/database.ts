import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    // Verificar se as tabelas existem
    await prisma.usuario.findFirst()
    console.log("Banco de dados já inicializado")
  } catch (error) {
    console.log("Inicializando banco de dados...")
    // Executar migrations se necessário
    // O Prisma cuida da criação das tabelas automaticamente
  }
}
