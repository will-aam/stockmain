import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Produto } from "@prisma/client"; // Corrigido de 'Product' para 'Produto'

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

    const userBarCodes = await prisma.codigoBarras.findMany({
      where: { usuario_id: userId },
      include: { produto: true },
    });

    const userProducts = userBarCodes
      .map((bc) => bc.produto)
      .filter((p): p is Produto => p !== null);

    const activeCount = await prisma.contagem.findFirst({
      where: { usuario_id: userId, status: "em_andamento" },
      include: {
        itens_contados: {
          include: {
            produto: true,
          },
        },
      },
    });

    const productCountsForFrontend =
      activeCount?.itens_contados.map((item) => ({
        id: item.id,
        codigo_de_barras: item.codigo_de_barras,
        codigo_produto: item.produto.codigo_produto,
        descricao: item.produto.descricao,
        saldo_estoque: item.saldo_estoque_inicial,
        quant_loja: item.quant_loja,
        quant_estoque: item.quant_estoque,
        total: item.total,
        local_estoque: activeCount.local_estoque,
        data_hora: item.data_hora.toISOString(),
      })) || [];

    return NextResponse.json({
      products: userProducts,
      barCodes: userBarCodes,
      productCounts: productCountsForFrontend,
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
  // (Esta função DELETE permanece a mesma)
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }
    await prisma.$transaction([
      prisma.itemContado.deleteMany({
        where: { contagem: { usuario_id: userId } },
      }),
      prisma.contagem.deleteMany({ where: { usuario_id: userId } }),
      prisma.codigoBarras.deleteMany({ where: { usuario_id: userId } }),
      prisma.produto.deleteMany({ where: { usuario_id: userId } }),
    ]);
    return NextResponse.json({
      success: true,
      message: "Todos os dados da sessão foram limpos.",
    });
  } catch (error) {
    console.error("Erro ao limpar dados do inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao limpar dados" },
      { status: 500 }
    );
  }
}
