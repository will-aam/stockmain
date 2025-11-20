// app/api/inventory/[userId]/session/[sessionId]/report/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { userId: string; sessionId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    const sessionId = parseInt(params.sessionId, 10);

    if (isNaN(userId) || isNaN(sessionId))
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });

    await validateAuth(request as any, userId);

    // 1. Buscar a sessão
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessionId },
      include: {
        _count: { select: { participantes: true } },
      },
    });

    if (!sessao)
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 }
      );

    // 2. Buscar produtos (Sistema)
    const produtosSessao = await prisma.produtoSessao.findMany({
      where: { sessao_id: sessionId },
    });

    // 3. Buscar contagens (Real)
    const movimentos = await prisma.movimento.groupBy({
      by: ["codigo_barras"],
      where: { sessao_id: sessionId },
      _sum: { quantidade: true },
    });

    // 4. Consolidar dados
    const mapaContagem = new Map<string, number>();
    movimentos.forEach((m) => {
      if (m.codigo_barras)
        mapaContagem.set(m.codigo_barras, m._sum.quantidade || 0);
    });

    let totalProdutos = 0;
    let totalContados = 0;
    let totalFaltantes = 0;
    const discrepancias = [];

    // Processar produtos do catálogo
    for (const prod of produtosSessao) {
      totalProdutos++;
      const codigo = prod.codigo_barras || prod.codigo_produto;
      const qtdContada = mapaContagem.get(codigo) || 0;

      if (qtdContada > 0) totalContados++;
      else totalFaltantes++;

      const diferenca = qtdContada - prod.saldo_sistema;

      if (diferenca !== 0) {
        discrepancias.push({
          codigo_produto: prod.codigo_produto,
          descricao: prod.descricao,
          saldo_sistema: prod.saldo_sistema,
          saldo_contado: qtdContada,
          diferenca: diferenca,
        });
      }

      if (codigo) mapaContagem.delete(codigo);
    }

    // Processar sobras (itens contados que não estavam no catálogo)
    for (const [codigo, qtd] of mapaContagem.entries()) {
      totalContados++; // Tecnicamente foi contado
      discrepancias.push({
        codigo_produto: "DESCONHECIDO",
        descricao: `Item não cadastrado (${codigo})`,
        saldo_sistema: 0,
        saldo_contado: qtd,
        diferenca: qtd,
      });
    }

    // Calcular duração
    const inicio = new Date(sessao.criado_em).getTime();
    const fim = sessao.finalizado_em
      ? new Date(sessao.finalizado_em).getTime()
      : Date.now();
    const diffMs = fim - inicio;
    const diffMins = Math.floor(diffMs / 60000);
    const duracao = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;

    return NextResponse.json({
      total_produtos: totalProdutos,
      total_contados: totalContados,
      total_faltantes: totalFaltantes,
      discrepancias: discrepancias.sort(
        (a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca)
      ), // Ordenar por maior erro
      participantes: sessao._count.participantes,
      duracao: duracao,
      data_finalizacao: sessao.finalizado_em
        ? new Date(sessao.finalizado_em).toLocaleString("pt-BR")
        : "Agora",
    });
  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
