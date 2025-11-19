// app/api/inventory/[userId]/session/[sessionId]/import/route.ts
/**
 * Rota de Importação de Produtos para uma Sessão Específica.
 * Responsabilidade: Ler um CSV e preencher a tabela 'ProdutoSessao'.
 * Utiliza SSE (Server-Sent Events) para feedback de progresso em tempo real.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Papa from "papaparse";
import { validateAuth, createSseErrorResponse } from "@/lib/auth";

interface CsvRow {
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; sessionId: string } }
) {
  const userId = parseInt(params.userId, 10);
  const sessionId = parseInt(params.sessionId, 10);
  const encoder = new TextEncoder();

  if (isNaN(userId) || isNaN(sessionId)) {
    return new Response("IDs inválidos.", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Validação de Segurança
        await validateAuth(request, userId);

        // 2. Verificar se a sessão existe e pertence ao usuário
        const sessao = await prisma.sessao.findUnique({
          where: { id: sessionId },
        });

        if (!sessao || sessao.gestor_id !== userId) {
          throw new Error("Sessão não encontrada ou acesso negado.");
        }

        // 3. Processar Upload
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
          createSseErrorResponse(
            controller,
            encoder,
            "Nenhum arquivo enviado.",
            400
          );
          return;
        }

        const csvText = await file.text();
        const parseResult = Papa.parse<CsvRow>(csvText, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
          createSseErrorResponse(controller, encoder, "Erro ao ler CSV.", 400);
          return;
        }

        const totalRows = parseResult.data.length;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start", total: totalRows })}\n\n`
          )
        );

        let importedCount = 0;
        let errorCount = 0;

        // 4. Iterar e Salvar no Banco
        for (const [index, row] of parseResult.data.entries()) {
          // Tratamento básico de dados
          const saldo = parseFloat(row.saldo_estoque?.replace(",", ".") || "0");
          const codProduto = row.codigo_produto?.trim();
          const codBarras = row.codigo_de_barras?.trim();
          const descricao = row.descricao?.trim();

          if (isNaN(saldo) || !codProduto) {
            errorCount++;
            continue;
          }

          try {
            // Upsert: Cria ou Atualiza o produto DENTRO desta sessão
            await prisma.produtoSessao.upsert({
              where: {
                sessao_id_codigo_produto: {
                  sessao_id: sessionId,
                  codigo_produto: codProduto,
                },
              },
              update: {
                descricao: descricao,
                saldo_sistema: Math.floor(saldo), // Assumindo inteiros para contagem
                codigo_barras: codBarras, // Atualiza o código de barras se vier no CSV
              },
              create: {
                sessao_id: sessionId,
                codigo_produto: codProduto,
                descricao: descricao || "Sem descrição",
                saldo_sistema: Math.floor(saldo),
                codigo_barras: codBarras,
              },
            });

            importedCount++;
          } catch (error) {
            console.error(`Erro na linha ${index}:`, error);
            errorCount++;
          }

          // Enviar progresso a cada 10 itens (ou a cada 1 se preferir tempo real fluido)
          if (index % 10 === 0 || index === totalRows - 1) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "progress",
                  current: index + 1,
                  total: totalRows,
                  imported: importedCount,
                  errors: errorCount,
                })}\n\n`
              )
            );
          }
        }

        // 5. Finalizar
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "complete",
              importedCount,
              errorCount,
            })}\n\n`
          )
        );
      } catch (error: any) {
        console.error("Erro na importação da sessão:", error);
        createSseErrorResponse(
          controller,
          encoder,
          error.message || "Erro interno.",
          500
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
