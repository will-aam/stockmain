// src/app/api/inventory/[userId]/route.ts
/**
 * Rota de API para gerenciar o inventário de um usuário específico.
 * Fornece endpoints para buscar o catálogo de produtos e limpar todos os dados do usuário.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Produto } from "@prisma/client";

/**
 * Busca o catálogo de produtos e códigos de barras de um usuário.
 * @param request - Objeto de requisição.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON com a lista de produtos e códigos de barras.
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

    // Busca os códigos de barras do usuário e inclui os produtos associados.
    const userBarCodes = await prisma.codigoBarras.findMany({
      where: { usuario_id: userId },
      include: { produto: true },
    });

    // Extrai e filtra os produtos para uma lista limpa.
    const userProducts = userBarCodes
      .map((bc) => bc.produto)
      .filter((p): p is Produto => p !== null);

    return NextResponse.json({
      products: userProducts,
      barCodes: userBarCodes,
    });
  } catch (error) {
    console.error("Erro ao buscar dados de inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

/**
 * Exclui todos os dados de inventário (produtos, códigos, contagens) de um usuário.
 * @param request - Objeto de requisição.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON de sucesso ou erro.
 */
export async function DELETE(
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

    // Executa a exclusão em cascata, respeitando as dependências do banco de dados.
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
  } catch (error) {
    console.error("Erro ao limpar dados do inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
