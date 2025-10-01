import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const body = await request.json();
    const { product, quantity, countingMode } = body;

    if (!product || typeof quantity !== "number" || !countingMode) {
      return NextResponse.json(
        { error: "Dados da requisição incompletos" },
        { status: 400 }
      );
    }

    // --- LÓGICA ROBUSTA E SIMPLIFICADA ---

    // 1. Encontra ou cria a sessão de contagem ativa
    let contagem = await prisma.contagem.findFirst({
      where: { usuario_id: userId, status: "em_andamento" },
    });
    if (!contagem) {
      contagem = await prisma.contagem.create({
        data: { usuario_id: userId, status: "em_andamento" },
      });
    }

    // 2. Garante que o produto e seu código de barras existam no banco
    const produtoNoBanco = await prisma.produto.upsert({
      where: {
        codigo_produto_usuario_id: {
          codigo_produto: product.codigo_produto,
          usuario_id: userId,
        },
      },
      update: { descricao: product.descricao }, // Atualiza a descrição caso tenha mudado
      create: {
        codigo_produto: product.codigo_produto,
        descricao: product.descricao,
        saldo_estoque: product.saldo_estoque,
        usuario_id: userId,
      },
    });

    await prisma.codigoBarras.upsert({
      where: { codigo_de_barras: product.codigo_de_barras },
      update: { produto_id: produtoNoBanco.id },
      create: {
        codigo_de_barras: product.codigo_de_barras,
        produto_id: produtoNoBanco.id,
        usuario_id: userId,
      },
    });

    // 3. Procura por um item já contado para este produto nesta contagem
    const itemContadoExistente = await prisma.itemContado.findUnique({
      where: {
        contagem_id_produto_id: {
          contagem_id: contagem.id,
          produto_id: produtoNoBanco.id,
        },
      },
    });

    let itemAtualizado;

    if (itemContadoExistente) {
      // Se JÁ EXISTE: calcula os novos totais e atualiza
      const novaQuantLoja =
        itemContadoExistente.quant_loja +
        (countingMode === "loja" ? quantity : 0);
      const novaQuantEstoque =
        itemContadoExistente.quant_estoque +
        (countingMode === "estoque" ? quantity : 0);

      itemAtualizado = await prisma.itemContado.update({
        where: { id: itemContadoExistente.id },
        data: {
          quant_loja: novaQuantLoja,
          quant_estoque: novaQuantEstoque,
          total:
            novaQuantLoja +
            novaQuantEstoque -
            itemContadoExistente.saldo_estoque_inicial,
        },
      });
    } else {
      // Se NÃO EXISTE: cria o registro pela primeira vez
      itemAtualizado = await prisma.itemContado.create({
        data: {
          contagem_id: contagem.id,
          produto_id: produtoNoBanco.id,
          codigo_de_barras: product.codigo_de_barras,
          quant_loja: countingMode === "loja" ? quantity : 0,
          quant_estoque: countingMode === "estoque" ? quantity : 0,
          saldo_estoque_inicial: produtoNoBanco.saldo_estoque,
          total: quantity - produtoNoBanco.saldo_estoque,
        },
      });
    }

    return NextResponse.json(itemAtualizado);
  } catch (error) {
    console.error("Erro CRÍTICO ao salvar contagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor. Verifique os logs." },
      { status: 500 }
    );
  }
}
