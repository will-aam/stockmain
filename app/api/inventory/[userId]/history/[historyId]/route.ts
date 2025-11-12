// app/api/inventory/[userId]/history/[historyId]/route.ts
/**
 * Rota de API para gerenciar um item específico do histórico.
 * Lida com a exclusão (DELETE) de uma contagem salva.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Exclui um item específico do histórico de um usuário.
 * @param params - Parâmetros da rota, incluindo o userId e o historyId.
 * @returns JSON de sucesso ou erro.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string; historyId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    const historyId = parseInt(params.historyId, 10);

    if (isNaN(userId) || isNaN(historyId)) {
      return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
    }

    // Exclui o item, garantindo que pertença ao usuário para segurança.
    await prisma.contagemSalva.delete({
      where: {
        id: historyId,
        usuario_id: userId,
      },
    });

    return NextResponse.json(
      { message: "Item do histórico excluído com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir item do histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
