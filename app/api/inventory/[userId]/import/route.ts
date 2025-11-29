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
 * Manipula a requisição POST para importar um arquivo CSV.
 * @param request - Requisição contendo o arquivo CSV em FormData.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns Um objeto Response com streaming para os eventos de progresso.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = parseInt(params.userId, 10);
  const encoder = new TextEncoder(); // Movemos o encoder para fora para otimização

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
        let importedCount = 0;
        let errorCount = 0;

        // Envia o total de linhas para o cliente calcular a porcentagem
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start", total: totalRows })}\n\n`
          )
        );

        // Loop de processamento de cada linha do CSV
        for (const [index, row] of parseResult.data.entries()) {
          const saldoNumerico = parseFloat(
            row.saldo_estoque?.replace(",", ".") || "0"
          );
          const codProduto = row.codigo_produto?.trim();
          const codBarras = row.codigo_de_barras?.trim();
          const descricao = row.descricao?.trim();

          if (isNaN(saldoNumerico) || !codProduto || !codBarras) {
            errorCount++;
            // Envia progresso mesmo com erro para o cliente saber que a linha foi processada
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
            ); // <--- PONTO E VÍRGULA ADICIONADO AQUI (Correção 1)
            continue;
          }

          try {
            // --- INÍCIO DA REFATORAÇÃO: Atomicidade por Linha ---
            // Todas as operações para esta linha estão dentro de uma única transação.
            // Se qualquer uma falhar, tudo o que foi feito nesta linha é desfeito (rollback).
            await prisma.$transaction(async (tx) => {
              // 1. Upsert do Produto
              const product = await tx.produto.upsert({
                where: {
                  codigo_produto_usuario_id: {
                    codigo_produto: codProduto,
                    usuario_id: userId,
                  },
                },
                update: {
                  descricao: descricao,
                  saldo_estoque: saldoNumerico,
                },
                create: {
                  codigo_produto: codProduto,
                  descricao: descricao,
                  saldo_estoque: saldoNumerico,
                  usuario_id: userId,
                },
              });

              // 2. Upsert do Código de Barras Principal
              await tx.codigoBarras.upsert({
                where: {
                  codigo_de_barras_usuario_id: {
                    codigo_de_barras: codBarras,
                    usuario_id: userId,
                  },
                },
                update: {
                  produto_id: product.id,
                },
                create: {
                  codigo_de_barras: codBarras,
                  produto_id: product.id,
                  usuario_id: userId,
                },
              });

              // 3. Limpeza de vínculos antigos (se o código mudou de produto, por exemplo)
              await tx.codigoBarras.deleteMany({
                where: {
                  produto_id: product.id,
                  usuario_id: userId,
                  NOT: {
                    codigo_de_barras: codBarras,
                  },
                },
              });
            });
            // --- FIM DA TRANSAÇÃO ---

            importedCount++;
          } catch (error: any) {
            // O tratamento de erro original continua válido aqui.
            // Se a transação falhar, ela será capturada aqui.
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              console.log(
                `Conflito de chave única (P2002) na linha ${
                  index + 2
                }, ignorando.`
              );
              errorCount++;
            } else {
              console.error(`Erro ao processar a linha ${index + 2}:`, error);
              errorCount++;
            }
          }

          // Envia o progresso após o processamento de cada linha (sucesso ou erro)
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
          ); // <--- PONTO E VÍRGULA ADICIONADO AQUI (Correção 2)

          // Pequeno atraso para não sobrecarregar o cliente
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        // Envia o evento final de conclusão
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
          createSseErrorResponse(controller, encoder, error.message, 401);
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
