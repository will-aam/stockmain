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

    // 8. Se a autenticação passar, a lógica original continua...
    await prisma.itemContado.deleteMany({
      where: { contagem: { usuario_id: userId } },
    });

    await prisma.contagem.deleteMany({
      where: { usuario_id: userId },
    });

    await prisma.codigoBarras.deleteMany({
      where: { usuario_id: userId },
    });

    await prisma.produto.deleteMany({
      where: { usuario_id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Dados do inventário excluídos com sucesso.",
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
