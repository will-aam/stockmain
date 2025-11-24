// app/api/session/[sessionId]/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    const { participantId, movements } = await request.json();

    if (!movements || !Array.isArray(movements) || movements.length === 0) {
      // Se não tem movimentos, é apenas um "ping" para buscar atualizações.
      // Podemos retornar vazio ou implementar lógica de "long polling" no futuro.
      // Por enquanto, vamos retornar ok para não quebrar o cliente.
      return NextResponse.json({ success: true, updatedProducts: [] });
    }

    // 1. Salvar Movimentos com IDEMPOTÊNCIA
    // O Prisma vai tentar inserir. Se o id_movimento_cliente já existir, ele IGNORE essa linha específica.
    await prisma.movimento.createMany({
      data: movements.map((mov: any) => ({
        id_movimento_cliente: mov.id, // Mapeia o ID único gerado pelo cliente para o novo campo no banco
        sessao_id: sessionId,
        participante_id: participantId,
        codigo_barras: mov.codigo_barras,
        quantidade: mov.quantidade,
        data_hora: new Date(mov.timestamp), // Usa o horário que o usuário bipou
      })),
      skipDuplicates: true, // Ignora registros com id_movimento_cliente duplicado, garantindo idempotência
    });

    // 2. Recalcular Saldos dos Produtos Afetados
    // Precisamos devolver o saldo atualizado APENAS dos itens que foram mexidos,
    // para economizar banda.

    // Extrai códigos únicos afetados neste lote
    const codigosAfetados = Array.from(
      new Set(movements.map((m: any) => m.codigo_barras))
    );

    // Calcula o novo total geral para esses códigos
    const novosSaldos = await prisma.movimento.groupBy({
      by: ["codigo_barras"],
      where: {
        sessao_id: sessionId,
        codigo_barras: { in: codigosAfetados as string[] },
      },
      _sum: {
        quantidade: true,
      },
    });

    // Busca os dados cadastrais desses produtos para devolver formato completo (opcional, mas ajuda o front)
    const produtosDados = await prisma.produtoSessao.findMany({
      where: {
        sessao_id: sessionId,
        codigo_barras: { in: codigosAfetados as string[] },
      },
      select: { codigo_produto: true, codigo_barras: true },
    });

    // Formata a resposta
    const updatedProducts = novosSaldos.map((saldo) => {
      const prodInfo = produtosDados.find(
        (p) => p.codigo_barras === saldo.codigo_barras
      );
      return {
        codigo_barras: saldo.codigo_barras,
        // Se não achou vínculo, usa o código de barras como ID provisório
        codigo_produto: prodInfo?.codigo_produto || saldo.codigo_barras,
        saldo_contado: saldo._sum.quantidade || 0,
      };
    });

    return NextResponse.json({
      success: true,
      updatedProducts,
    });
  } catch (error: any) {
    console.error("Erro na sincronização:", error);
    return NextResponse.json(
      { error: "Erro ao processar sincronização." },
      { status: 500 }
    );
  }
}
