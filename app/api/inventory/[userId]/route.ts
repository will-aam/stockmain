// app/api/inventory/[userId]/route.ts
/**
 * Rota de API para gerenciar o inventário de um usuário específico.
 * Fornece endpoints para buscar o catálogo (GET) e limpar dados (DELETE).
 *
 * ROTA PROTEGIDA: Esta rota valida o Token JWT antes de executar.
 */

import { NextResponse, NextRequest } from "next/server"; // Importamos o NextRequest
import { prisma } from "@/lib/prisma";
import { Produto } from "@prisma/client";
import { validateAuth } from "@/lib/auth"; // 1. IMPORTAMOS O GUARDIÃO

/**
 * Busca o catálogo de produtos e códigos de barras de um usuário.
 * @param request - O objeto da requisição (para lermos os headers).
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON com a lista de produtos e códigos de barras.
 */
export async function GET(
  request: NextRequest, // 2. Mudamos de Request para NextRequest
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido." },
        { status: 400 }
      );
    }

    // 3. CHAMAMOS O GUARDIÃO PRIMEIRO
    await validateAuth(request, userId);

    // 4. Se a autenticação passar, a lógica original continua...
    const userBarCodes = await prisma.codigoBarras.findMany({
      where: { usuario_id: userId },
      include: { produto: true },
    });

    const userProducts = userBarCodes
      .map((bc) => bc.produto)
      .filter((p): p is Produto => p !== null);

    return NextResponse.json({
      products: userProducts,
      barCodes: userBarCodes,
    });
  } catch (error: any) {
    // 5. Capturamos erros de autenticação ou do banco
    const status =
      error.message.includes("Acesso não autorizado") ||
      error.message.includes("Acesso negado")
        ? error.message.includes("negado")
          ? 403
          : 401
        : 500;

    console.error("Erro ao buscar dados de inventário:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: status }
    );
  }
}

/**
 * Exclui todos os dados de inventário (produtos, códigos, contagens) de um usuário.
 * @param request - O objeto da requisição (para lermos os headers).
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON de sucesso ou erro.
 */
export async function DELETE(
  request: NextRequest, // 6. Mudamos de Request para NextRequest
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido." },
        { status: 400 }
      );
    }

    // 7. CHAMAMOS O GUARDIÃO PRIMEIRO
    await validateAuth(request, userId);

    // 8. EXECUÇÃO ATÔMICA (Tudo ou Nada)
    // O $transaction garante que se o passo 3 falhar, o passo 1 é desfeito.
    await prisma.$transaction([
      // Ordem de exclusão (respeitando chaves estrangeiras, embora cascade ajude):

      // 1. Remove os itens contados (filhos de contagem)
      prisma.itemContado.deleteMany({
        where: { contagem: { usuario_id: userId } },
      }),

      // 2. Remove as contagens (pais dos itens contados)
      prisma.contagem.deleteMany({
        where: { usuario_id: userId },
      }),

      // 3. Remove códigos de barras (filhos de produto)
      prisma.codigoBarras.deleteMany({
        where: { usuario_id: userId },
      }),

      // 4. Remove produtos (raiz)
      prisma.produto.deleteMany({
        where: { usuario_id: userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Dados do inventário excluídos com sucesso (Transação Segura).",
    });
  } catch (error: any) {
    // 9. Capturamos erros de autenticação ou do banco
    const status =
      error.message.includes("Acesso não autorizado") ||
      error.message.includes("Acesso negado")
        ? error.message.includes("negado")
          ? 403
          : 401
        : 500;

    console.error("Erro ao limpar dados do inventário:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: status }
    );
  }
}
