import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Função GET: Busca a lista de todo o histórico de um usuário
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
      where: { usuario_id: userId },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(savedCounts);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função POST: Cria um novo item no histórico
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
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
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
    console.error("Erro ao salvar contagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
