// src/lib/prisma.ts
/**
 * Descrição: Configuração e instância do cliente Prisma.
 * Responsabilidade: Exportar uma única instância (singleton) do Prisma Client para ser
 * utilizada em toda a aplicação. Isso evita a criação de múltiplas conexões com o banco de dados,
 * o que é especialmente importante em ambiente de desenvolvimento devido ao hot-reloading.
 * Inclui também uma função utilitária para verificar a conectividade com o banco.
 */

import { PrismaClient } from "@prisma/client";

// --- Implementação do Padrão Singleton ---

/**
 * Estende o tipo do objeto global para armazenar a instância do Prisma.
 * Este padrão singleton garante que apenas uma instância do cliente seja criada
 * durante o ciclo de vida da aplicação em modo de desenvolvimento, prevenindo
 * o esgotamento do pool de conexões a cada recarregamento do hot-reloading.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Instância global do Prisma Client.
 * Utiliza o operador de coalescência nula (??) para reutilizar uma instância existente
 * no objeto global ou criar uma nova se ela ainda não existir.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

/**
 * Anexa a instância do Prisma ao objeto global apenas em ambiente de desenvolvimento.
 * Em produção, cada instância da aplicação deve gerenciar seu próprio ciclo de vida
 * do cliente de forma mais controlada, e o hot-reloading não está presente.
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// --- Verificação de Conexão com o Banco ---

/**
 * Verifica a conectividade com o banco de dados e a existência das tabelas.
 * Responsabilidade: Executar uma operação simples para confirmar que a conexão está ativa
 * e que o schema do banco foi aplicado via migrations.
 *
 * Esta função NÃO executa migrations. Em um ambiente de produção, as migrations
 * devem ser executadas via linha de comando (ex: `prisma migrate deploy`) como parte
 * do processo de deploy da aplicação, seguindo as melhores práticas de CI/CD.
 *
 * @throws {Error} Lança um erro se a conexão com o banco de dados falhar.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Tenta buscar o primeiro usuário como uma forma de "ping" no banco de dados.
    // Se a query for bem-sucedida, significa que a conexão está ativa e a tabela 'usuario' existe.
    await prisma.usuario.findFirst();
    console.log("✅ Database connection successful and tables are accessible.");
  } catch (error) {
    // Se a query falhar, registra um erro detalhado no console para auxiliar na depuração.
    console.error(
      "❌ Database connection failed. Please ensure the following:"
    );
    console.error("  1. The database server is running and accessible.");
    console.error(
      "  2. Prisma migrations have been applied (run: 'npx prisma migrate deploy')."
    );
    console.error(
      "  3. The DATABASE_URL environment variable is correctly set and valid."
    );

    // Lança o erro para que a camada superior da aplicação possa tratá-lo adequadamente.
    throw new Error(
      "Database connection failed. Check the console for more details."
    );
  }
}
