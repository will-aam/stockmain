// app/api/session/[sessionId]/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 1. Buscar produtos cadastrados na sessão
    const produtosSessao = await prisma.produtoSessao.findMany({
      where: { sessao_id: sessionId },
    });

    // 2. Calcular o saldo atual (Soma dos movimentos)
    // Agrupamos por código de barras para ser rápido
    const movimentos = await prisma.movimento.groupBy({
      by: ["codigo_barras"],
      where: { sessao_id: sessionId },
      _sum: {
        quantidade: true,
      },
    });

    // Mapa rápido para consulta: CodigoBarras -> Quantidade Total
    const saldosMap = new Map<string, number>();
    movimentos.forEach((m) => {
      if (m.codigo_barras) {
        saldosMap.set(m.codigo_barras, m._sum.quantidade || 0);
      }
    });

    // 3. Combinar dados
    const resultado = produtosSessao.map((prod) => {
      // Tenta achar saldo pelo código de barras principal do produto
      // (Nota: num cenário real complexo, um produto pode ter vários códigos,
      // mas aqui simplificamos para o código principal cadastrado)
      const totalContado = saldosMap.get(prod.codigo_barras || "") || 0;

      return {
        codigo_produto: prod.codigo_produto,
        codigo_barras: prod.codigo_barras,
        descricao: prod.descricao,
        saldo_sistema: prod.saldo_sistema,
        saldo_contado: totalContado,
      };
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error("Erro ao listar produtos da sessão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
