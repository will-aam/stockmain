import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// A função GET continua a mesma, mas agora está em um arquivo diferente
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    const savedCounts = await prisma.contagemSalva.findMany({
      where: {
        usuario_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(savedCounts);
  } catch (error) {
    console.error("Erro ao buscar histórico de contagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar histórico" },
      { status: 500 }
    );
  }
}

// A função POST continua a mesma
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    const { fileName, csvContent } = await request.json();
    if (!fileName || !csvContent) {
      return NextResponse.json(
        { error: "Nome do arquivo e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    const newSavedCount = await prisma.contagemSalva.create({
      data: {
        nome_arquivo: fileName,
        conteudo_csv: csvContent,
        usuario_id: userId,
      },
    });

    return NextResponse.json(newSavedCount, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar contagem no histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar no histórico" },
      { status: 500 }
    );
  }
}

// --- NOVA FUNÇÃO DELETE ADICIONADA ---
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string; historyId: string } } // Recebe o historyId
) {
  try {
    const userId = parseInt(params.userId, 10);
    const historyId = parseInt(params.historyId, 10);

    if (isNaN(userId) || isNaN(historyId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Apaga o item do histórico que corresponde ao ID e ao usuário (por segurança)
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
