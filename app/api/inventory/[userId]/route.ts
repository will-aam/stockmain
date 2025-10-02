import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Produto } from "@prisma/client";

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

    // A API agora busca apenas o catálogo de produtos e códigos de barras.
    // A contagem é gerenciada 100% no lado do cliente.
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
      // A chave productCounts não é mais enviada, pois não é responsabilidade da API.
    });
  } catch (error) {
    console.error("Erro ao buscar dados de inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    console.log(
      `--- Iniciando exclusão de dados para o usuário: ${userId} ---`
    );
    const deletedItems = await prisma.itemContado.deleteMany({
      where: { contagem: { usuario_id: userId } },
    });
    console.log(`Itens Contados excluídos: ${deletedItems.count}`);

    // Passo 2: Excluir Contagens
    const deletedCounts = await prisma.contagem.deleteMany({
      where: { usuario_id: userId },
    });
    console.log(`Contagens excluídas: ${deletedCounts.count}`);

    // Passo 3: Excluir Códigos de Barras
    const deletedBarcodes = await prisma.codigoBarras.deleteMany({
      where: { usuario_id: userId },
    });
    console.log(`Códigos de Barras excluídos: ${deletedBarcodes.count}`);

    // Passo 4: Excluir Produtos
    const deletedProducts = await prisma.produto.deleteMany({
      where: { usuario_id: userId },
    });
    console.log(`Produtos excluídos: ${deletedProducts.count}`);

    console.log(`--- Fim da exclusão para o usuário: ${userId} ---`);

    return NextResponse.json({
      success: true,
      message: "Todos os dados do inventário foram limpos.",
    });
  } catch (error) {
    console.error("Erro detalhado ao limpar dados do inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao limpar dados" },
      { status: 500 }
    );
  }
}
