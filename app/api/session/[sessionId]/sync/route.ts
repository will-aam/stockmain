import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    const { participantId, movements } = await request.json();

    // --- 1. ESCRITA (WRITE) ---
    // Só tentamos salvar no banco SE houver movimentos novos.
    if (movements && Array.isArray(movements) && movements.length > 0) {
      await prisma.movimento.createMany({
        data: movements.map((mov: any) => ({
          id_movimento_cliente: mov.id,
          sessao_id: sessionId,
          participante_id: participantId,
          codigo_barras: mov.codigo_barras,
          quantidade: mov.quantidade,
          data_hora: new Date(mov.timestamp),
        })),
        skipDuplicates: true, // Proteção contra duplicidade (Idempotência)
      });
    }

    // --- 2. LEITURA (READ) - O "Modo Espião" ---
    // AQUI MUDOU: Ao invés de buscar só o que foi afetado agora,
    // buscamos o saldo ATUALIZADO de TODOS os itens contados na sessão.
    // Isso garante que, se o Alex bipou lá longe, você recebe a atualização aqui.

    const saldosGerais = await prisma.movimento.groupBy({
      by: ["codigo_barras"],
      where: {
        sessao_id: sessionId,
      },
      _sum: {
        quantidade: true,
      },
    });

    // Se não tiver nada contado na sessão inteira, retorna vazio
    if (saldosGerais.length === 0) {
      return NextResponse.json({
        success: true,
        updatedProducts: [],
      });
    }

    // Extrai os códigos para buscar os detalhes do produto (nome, etc)
    const listaDeCodigos = saldosGerais
      .map((s) => s.codigo_barras)
      .filter((c): c is string => c !== null);

    const produtosDados = await prisma.produtoSessao.findMany({
      where: {
        sessao_id: sessionId,
        codigo_barras: { in: listaDeCodigos },
      },
      select: { codigo_produto: true, codigo_barras: true },
    });

    // --- 3. FORMATAR RESPOSTA ---
    const updatedProducts = saldosGerais.map((saldo) => {
      const prodInfo = produtosDados.find(
        (p) => p.codigo_barras === saldo.codigo_barras
      );

      return {
        codigo_barras: saldo.codigo_barras,
        // Garante que temos um ID de produto, mesmo que seja provisório
        codigo_produto: prodInfo?.codigo_produto || saldo.codigo_barras,
        saldo_contado: saldo._sum.quantidade || 0,
      };
    });

    return NextResponse.json({
      success: true,
      updatedProducts, // Entrega a lista completa e atualizada
    });
  } catch (error: any) {
    console.error("Erro na sincronização:", error);
    return NextResponse.json(
      { error: "Erro ao processar sincronização." },
      { status: 500 }
    );
  }
}
