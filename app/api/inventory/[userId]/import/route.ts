// src/app/api/inventory/[userId]/import/route.ts
/**
 * Rota de API para importação de produtos com progresso real via Server-Sent Events (SSE).
 * Processa o upload, valida os dados e insere no banco, enviando atualizações de progresso
 * para o cliente em tempo real.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Papa from "papaparse";
import { Prisma } from "@prisma/client";

interface CsvRow {
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: string;
}

/**
 * Manipula a requisição POST para importar um arquivo CSV com SSE.
 * @param request - Requisição contendo o arquivo CSV em FormData.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns Um objeto Response com streaming para os eventos de progresso.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = parseInt(params.userId, 10);
  if (isNaN(userId)) {
    // Em SSE, enviamos um evento de erro
    return new Response(
      `data: ${JSON.stringify({ error: "ID de usuário inválido." })}\n\n`,
      {
        status: 400,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  // Cria um stream de resposta writable para enviar eventos
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        if (!file) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Nenhum arquivo enviado.",
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const csvText = await file.text();
        const parseResult = Papa.parse<CsvRow>(csvText, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Erro ao analisar o CSV.",
                details: parseResult.errors,
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const totalRows = parseResult.data.length;
        let importedCount = 0;
        let errorCount = 0;

        // Envia o total de linhas para o cliente calcular a porcentagem
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start", total: totalRows })}\n\n`
          )
        );

        for (const [index, row] of parseResult.data.entries()) {
          const saldoNumerico = parseFloat(row.saldo_estoque.replace(",", "."));
          if (
            isNaN(saldoNumerico) ||
            !row.codigo_produto ||
            !row.codigo_de_barras
          ) {
            errorCount++;
            continue;
          }

          try {
            await prisma.$transaction(async (tx) => {
              const product = await tx.produto.upsert({
                where: {
                  codigo_produto_usuario_id: {
                    codigo_produto: row.codigo_produto,
                    usuario_id: userId,
                  },
                },
                update: {
                  descricao: row.descricao,
                  saldo_estoque: saldoNumerico,
                },
                create: {
                  codigo_produto: row.codigo_produto,
                  descricao: row.descricao,
                  saldo_estoque: saldoNumerico,
                  usuario_id: userId,
                },
              });

              await tx.codigoBarras.deleteMany({
                where: { produto_id: product.id },
              });

              await tx.codigoBarras.create({
                data: {
                  codigo_de_barras: row.codigo_de_barras,
                  produto_id: product.id,
                  usuario_id: userId,
                },
              });
            });

            importedCount++;
          } catch (error: any) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              console.log(
                `Código de barras duplicado no banco, ignorando linha: ${row.codigo_de_barras}`
              );
              errorCount++;
            } else {
              console.error("Erro inesperado na transação:", error);
              throw error;
            }
          }

          // Envia o progresso atual para o cliente
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

        // Envia o evento final de sucesso
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
        console.error("Erro na importação de CSV:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: "Erro interno do servidor.",
            })}\n\n`
          )
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
