// src/app/api/inventory/[userId]/import/route.ts
/**
 * Rota de API para importação de produtos via arquivo CSV.
 * Processa o upload, valida os dados (incluindo duplicatas) e insere no banco de dados.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Papa from "papaparse";
import { Prisma } from "@prisma/client";

/** Estrutura esperada para uma linha do arquivo CSV de importação. */
interface CsvRow {
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: string;
}

/**
 * Manipula o upload e a importação de um arquivo CSV.
 * @param request - Requisição contendo o arquivo CSV em FormData.
 * @param params - Parâmetros da rota, incluindo o userId.
 * @returns JSON com sucesso e a contagem de itens importados, ou detalhes do erro.
 */
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parseResult = Papa.parse<CsvRow>(csvText, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "Erro ao analisar o CSV.", details: parseResult.errors },
        { status: 400 }
      );
    }

    // Verifica duplicatas de códigos de barras dentro do próprio arquivo.
    const barcodes = new Map<string, number[]>();
    parseResult.data.forEach((row, index) => {
      const lineNumber = index + 2; // +2 para compensar header e index 0-based
      const barcode = row.codigo_de_barras;
      if (barcode) {
        if (!barcodes.has(barcode)) {
          barcodes.set(barcode, []);
        }
        barcodes.get(barcode)?.push(lineNumber);
      }
    });

    const duplicates = Array.from(barcodes.entries())
      .filter(([_, lines]) => lines.length > 1)
      .map(([barcode, lines]) => ({
        codigo_de_barras: barcode,
        linhas: lines,
      }));

    if (duplicates.length > 0) {
      return NextResponse.json(
        {
          error: "Códigos de barras duplicados encontrados no arquivo.",
          details: duplicates,
        },
        { status: 400 }
      );
    }

    let importedCount = 0;
    // Itera sobre as linhas válidas e as insere no banco em uma transação.
    for (const row of parseResult.data) {
      const saldoNumerico = parseFloat(row.saldo_estoque.replace(",", "."));
      if (
        isNaN(saldoNumerico) ||
        !row.codigo_produto ||
        !row.codigo_de_barras
      ) {
        continue;
      }

      try {
        // Transação para garantir a atomicidade da operação (produto + código de barras).
        await prisma.$transaction(async (tx) => {
          // Upsert do produto (cria ou atualiza).
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

          // Remove códigos de barras antigos para este produto antes de inserir o novo.
          await tx.codigoBarras.deleteMany({
            where: { produto_id: product.id },
          });

          // Insere o novo código de barras.
          await tx.codigoBarras.create({
            data: {
              codigo_de_barras: row.codigo_de_barras,
              produto_id: product.id,
              usuario_id: userId,
            },
          });
        });

        importedCount++;
      } catch (error) {
        // Trata erro de duplicidade de chave única no banco (ex: código de barras já existe para outro produto).
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          console.log(
            `Código de barras duplicado no banco, ignorando: ${row.codigo_de_barras}`
          );
        } else {
          console.error("Erro inesperado na transação:", error);
          throw error;
        }
      }
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error) {
    console.error("Erro na importação de CSV:", error);

    // Trata erros conhecidos do Prisma (como duplicidade no banco).
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[])?.join(", ");
        return NextResponse.json(
          {
            error: `Erro de duplicidade no banco.`,
            details: `Já existe um registro com o mesmo valor no campo: ${target}.`,
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro interno do servidor ao importar." },
      { status: 500 }
    );
  }
}
