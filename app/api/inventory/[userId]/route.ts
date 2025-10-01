import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const activeCount = await prisma.contagem.findFirst({
      where: {
        usuario_id: userId,
        status: "em_andamento",
      },
      include: {
        itens_contados: true,
      },
    });

    // <<< LÓGICA CORRIGIDA AQUI >>>
    // Agora buscamos os códigos de barras E incluímos o produto relacionado
    const userBarCodes = await prisma.codigoBarras.findMany({
      where: {
        usuario_id: userId,
      },
      include: {
        produto: true, // A MÁGICA ACONTECE AQUI
      },
    });

    // A lista de produtos agora é derivada dos códigos de barras
    const userProducts = userBarCodes
      .map((bc) => bc.produto)
      .filter((p) => p !== null);

    return NextResponse.json({
      products: userProducts,
      barCodes: userBarCodes,
      productCounts: activeCount?.itens_contados || [],
    });
  } catch (error) {
    console.error("Erro ao buscar dados de inventário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// NOVA FUNÇÃO ADICIONADA
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

    // Usamos uma transação para garantir que tudo seja deletado
    await prisma.$transaction([
      // Deleta primeiro os itens que têm dependências
      prisma.itemContado.deleteMany({
        where: { contagem: { usuario_id: userId } },
      }),
      prisma.contagem.deleteMany({
        where: { usuario_id: userId },
      }),
      prisma.codigoBarras.deleteMany({
        where: { usuario_id: userId },
      }),
      prisma.produto.deleteMany({
        where: { usuario_id: userId },
      }),
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
