import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Função GET: Busca o histórico de contagens salvas para um usuário
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

    // CORREÇÃO AQUI: de ContagemSalva para contagemSalva
    const savedCounts = await prisma.contagemSalva.findMany({
      where: {
        usuario_id: userId,
      },
      orderBy: {
        created_at: "desc", // Ordena da mais recente para a mais antiga
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

// Função POST: Salva uma nova contagem no histórico
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

    // CORREÇÃO AQUI: de ContagemSalva para contagemSalva
    const newSavedCount = await prisma.contagemSalva.create({
      data: {
        nome_arquivo: fileName,
        conteudo_csv: csvContent,
        usuario_id: userId,
      },
    });

    return NextResponse.json(newSavedCount, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Erro ao salvar contagem no histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar no histórico" },
      { status: 500 }
    );
  }
}
