// src/app/api/inventory/[userId]/history/route.ts
/**
 * Rota de API para gerenciar a coleção de histórico de um usuário.
 * Lida com a listagem (GET) e a criação (POST) de contagens salvas.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Busca todo o histórico de contagens de um usuário.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON com a lista de contagens.
 */
export async function GET(
  request: Request,
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

    const savedCounts = await prisma.contagemSalva.findMany({
      where: { usuario_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(savedCounts);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

/**
 * Salva uma nova contagem no histórico do usuário.
 * @param request - Requisição com o nome do arquivo e conteúdo CSV.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON com o novo registro criado.
 */
export async function POST(
  request: Request,
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

    const { fileName, csvContent } = await request.json();
    if (!fileName || !csvContent) {
      return NextResponse.json(
        { error: "Nome do arquivo e conteúdo são obrigatórios." },
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
    console.error("Erro ao salvar contagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
