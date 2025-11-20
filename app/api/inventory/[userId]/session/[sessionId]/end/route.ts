// app/api/inventory/[userId]/session/[sessionId]/end/route.ts
/**
 * Rota para Encerrar uma Sessão de Contagem.
 * Responsabilidade:
 * 1. Mudar status da sessão para FINALIZADA (bloqueia novos envios).
 * 2. Calcular o inventário final (Soma de Movimentos).
 * 3. Gerar CSV comparativo (Sistema vs Contagem).
 * 4. Salvar no Histórico do Usuário.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuth } from "@/lib/auth";
import * as Papa from "papaparse";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; sessionId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    const sessionId = parseInt(params.sessionId, 10);

    if (isNaN(userId) || isNaN(sessionId)) {
      return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
    }

    // 1. Segurança
    await validateAuth(request, userId);

    // 2. Buscar a sessão e verificar propriedade
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessionId },
    });

    if (!sessao || sessao.gestor_id !== userId) {
      return NextResponse.json(
        { error: "Sessão não encontrada ou acesso negado." },
        { status: 404 }
      );
    }

    if (sessao.status === "FINALIZADA") {
      return NextResponse.json(
        { error: "Esta sessão já foi finalizada." },
        { status: 400 }
      );
    }

    // 3. Coletar Dados para Consolidação

    // A. Produtos do Catálogo da Sessão (O que o sistema esperava)
    const produtosSessao = await prisma.produtoSessao.findMany({
      where: { sessao_id: sessionId },
    });

    // B. Movimentos Agrupados (O que foi contado de fato)
    const contagens = await prisma.movimento.groupBy({
      by: ["codigo_barras"],
      where: { sessao_id: sessionId },
      _sum: {
        quantidade: true,
      },
    });

    // 4. Processar e Cruzar Dados
    // Mapa para acesso rápido: Codigo -> Quantidade Contada
    const mapaContagem = new Map<string, number>();
    contagens.forEach((c) => {
      if (c.codigo_barras) {
        mapaContagem.set(c.codigo_barras, c._sum.quantidade || 0);
      }
    });

    // Lista final combinada
    const relatorioFinal = produtosSessao.map((prod) => {
      const codigo = prod.codigo_barras || prod.codigo_produto; // Fallback se não tiver EAN
      const qtdContada = mapaContagem.get(codigo) || 0;
      const diferenca = qtdContada - prod.saldo_sistema;

      // Remove do mapa para sabermos se sobrou algo (itens não cadastrados)
      if (codigo) mapaContagem.delete(codigo);

      return {
        codigo_barras: codigo,
        codigo_produto: prod.codigo_produto,
        descricao: prod.descricao,
        saldo_sistema: prod.saldo_sistema,
        contagem: qtdContada,
        diferenca: diferenca,
      };
    });

    // Adicionar itens que foram contados mas NÃO estavam no catálogo (Sobra/Erro)
    for (const [codigo, qtd] of mapaContagem.entries()) {
      relatorioFinal.push({
        codigo_barras: codigo,
        codigo_produto: "DESCONHECIDO",
        descricao: `Item não cadastrado (${codigo})`,
        saldo_sistema: 0,
        contagem: qtd,
        diferenca: qtd,
      });
    }

    // 5. Gerar CSV
    const csvContent = Papa.unparse(relatorioFinal, {
      header: true,
      delimiter: ";",
    });

    // 6. Transação de Encerramento
    // - Fecha a sessão
    // - Salva no histórico
    const nomeArquivo = `${sessao.nome.replace(/\s+/g, "_")}_FINAL.csv`;

    await prisma.$transaction([
      prisma.sessao.update({
        where: { id: sessionId },
        data: {
          status: "FINALIZADA",
          finalizado_em: new Date(),
        },
      }),
      prisma.contagemSalva.create({
        data: {
          usuario_id: userId,
          nome_arquivo: nomeArquivo,
          conteudo_csv: csvContent,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Sessão encerrada e relatório salvo no histórico.",
    });
  } catch (error: any) {
    console.error("Erro ao encerrar sessão:", error);
    return NextResponse.json(
      { error: "Erro interno ao finalizar sessão." },
      { status: 500 }
    );
  }
}
