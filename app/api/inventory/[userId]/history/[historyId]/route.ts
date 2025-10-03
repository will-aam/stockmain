import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- FUNÇÃO DELETE PARA UM ITEM ESPECÍFICO DO HISTÓRICO ---
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string; historyId: string } } // Recebe o userId e o historyId
) {
  try {
    const userId = parseInt(params.userId, 10);
    const historyId = parseInt(params.historyId, 10);

    if (isNaN(userId) || isNaN(historyId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Apaga o item do histórico que corresponde ao ID do item e ao ID do usuário (por segurança)
    await prisma.contagemSalva.delete({
      where: {
        id: historyId,
        usuario_id: userId,
      },
    });

    return NextResponse.json(
      { message: "Item do histórico excluído com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir item do histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir item" },
      { status: 500 }
    );
  }
}
