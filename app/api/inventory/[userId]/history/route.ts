// app/api/inventory/[userId]/history/route.ts
/**
 * Rota de API para gerenciar a coleção de histórico de um usuário.
 * Lida com a listagem (GET) e a criação (POST) de contagens salvas.
 *
 * ROTA PROTEGIDA: Esta rota valida o Token JWT antes de executar.
 */

import { NextResponse, NextRequest } from "next/server"; // Importamos o NextRequest
import { prisma } from "@/lib/prisma";
import { validateAuth } from "@/lib/auth"; // 1. IMPORTAMOS O GUARDIÃO

/**
 * Busca todo o histórico de contagens de um usuário.
 * @param request - O objeto da requisição (para lermos os headers).
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON com a lista de contagens.
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
    const savedCounts = await prisma.contagemSalva.findMany({
      where: { usuario_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(savedCounts);
  } catch (error: any) {
    // 5. Capturamos erros de autenticação ou do banco
    const status =
      error.message.includes("Acesso não autorizado") ||
      error.message.includes("Acesso negado")
        ? error.message.includes("negado")
          ? 403
          : 401
        : 500; // Erro interno se não for de auth

    console.error("Erro ao buscar histórico:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: status }
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
  } catch (error: any) {
    // 9. Capturamos erros de autenticação ou do banco
    const status =
      error.message.includes("Acesso não autorizado") ||
      error.message.includes("Acesso negado")
        ? error.message.includes("negado")
          ? 403
          : 401
        : 500; // Erro interno se não for de auth

    console.error("Erro ao salvar contagem:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: status }
    );
  }
}
