// app/api/inventory/[userId]/history/[historyId]/route.ts
/**
 * Rota de API para gerenciar um item específico do histórico.
 * Lida com a exclusão (DELETE) de uma contagem salva.
 *
 * ROTA PROTEGIDA: Esta rota valida o Token JWT antes de executar.
 */

import { NextResponse, NextRequest } from "next/server"; // Importamos o NextRequest
import { prisma } from "@/lib/prisma";
import { validateAuth } from "@/lib/auth"; // 1. IMPORTAMOS O GUARDIÃO

/**
 * Exclui um item específico do histórico de um usuário.
 * @param request - O objeto da requisição (para lermos os headers).
 * @param params - Parâmetros da rota, incluindo o userId e o historyId.
 * @returns JSON de sucesso ou erro.
 */
export async function DELETE(
  request: NextRequest, // 2. Mudamos de Request para NextRequest
  { params }: { params: { userId: string; historyId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    const historyId = parseInt(params.historyId, 10);

    if (isNaN(userId) || isNaN(historyId)) {
      return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
    }

    // 3. CHAMAMOS O GUARDIÃO PRIMEIRO
    await validateAuth(request, userId);

    // 4. Se a autenticação passar, a lógica original continua...
    // Exclui o item, garantindo que pertença ao usuário para segurança.
    await prisma.contagemSalva.delete({
      where: {
        id: historyId,
        usuario_id: userId, // Esta verificação dupla é ótima (auth + query)
      },
    });

    return NextResponse.json(
      { message: "Item do histórico excluído com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    // 5. Capturamos erros de autenticação ou do banco
    const status =
      error.message.includes("Acesso não autorizado") ||
      error.message.includes("Acesso negado")
        ? error.message.includes("negado")
          ? 403
          : 401
        : 500; // Erro interno se não for de auth

    console.error("Erro ao excluir item do histórico:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: status }
    );
  }
}
