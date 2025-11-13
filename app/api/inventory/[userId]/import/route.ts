// app/api/inventory/[userId]/import/route.ts
/**
 * Rota de API para importação de produtos com progresso real via Server-Sent Events (SSE).
 * Processa o upload, valida os dados e insere no banco, enviando atualizações de progresso
 * para o cliente em tempo real.
 *
 * ROTA PROTEGIDA: Esta rota valida o Token JWT antes de executar a importação.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Papa from "papaparse";
import { Prisma } from "@prisma/client";
// 1. IMPORTAMOS NOSSOS UTILITÁRIOS DE AUTENTICAÇÃO
import { validateAuth, createSseErrorResponse } from "@/lib/auth";

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
  const encoder = new TextEncoder(); // Movemos o encoder para fora

  // Verificação inicial do ID (antes de criar o stream)
  if (isNaN(userId)) {
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
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 2. CHAMAMOS O GUARDIÃO DE AUTENTICAÇÃO PRIMEIRO
        // Isso verifica o token e se o ID do token bate com o ID da URL.
        await validateAuth(request, userId);

        // 3. SE A AUTENTICAÇÃO PASSAR, A LÓGICA DE IMPORTAÇÃO CONTINUA...
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

        // ... (RESTANTE DA LÓGICA DE IMPORTAÇÃO ORIGINAL) ...
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
            const product = await prisma.produto.upsert({
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

            await prisma.codigoBarras.upsert({
              where: {
                codigo_de_barras_usuario_id: {
                  codigo_de_barras: row.codigo_de_barras,
                  usuario_id: userId,
                },
              },
              update: {
                produto_id: product.id,
              },
              create: {
                codigo_de_barras: row.codigo_de_barras,
                produto_id: product.id,
                usuario_id: userId,
              },
            });

            await prisma.codigoBarras.deleteMany({
              where: {
                produto_id: product.id,
                usuario_id: userId,
                NOT: {
                  codigo_de_barras: row.codigo_de_barras,
                },
              },
            });

            importedCount++;
          } catch (error: any) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              console.log(
                `Código de barras duplicado no banco (P2002), ignorando linha: ${row.codigo_de_barras}`
              );
              errorCount++;
            } else {
              console.error(`Erro ao processar linha ${index + 2}:`, error);
              errorCount++;
            }
          }

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
        // 4. USAMOS O HELPER DE ERRO SSE
        // Se o erro for do 'validateAuth' (ex: token inválido)
        if (
          error.message.includes("Acesso não autorizado") ||
          error.message.includes("Acesso negado")
        ) {
          // Usamos o status 401 (Unauthorized) ou 403 (Forbidden)
          const status = error.message.includes("negado") ? 403 : 401;
          createSseErrorResponse(controller, encoder, error.message, status);
        } else {
          // Se for um erro interno da importação
          console.error("Erro na importação de CSV:", error);
          createSseErrorResponse(
            controller,
            encoder,
            "Erro interno do servidor.",
            500
          );
        }
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
