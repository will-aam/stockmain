import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Papa from "papaparse";
import { Prisma } from "@prisma/client";

interface CsvRow {
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: string;
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
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
        { error: "Erro ao analisar o CSV", details: parseResult.errors },
        { status: 400 }
      );
    }

    // --- Validação de Duplicados ---
    const barcodes = new Map<string, number[]>();
    parseResult.data.forEach((row, index) => {
      const lineNumber = index + 2;
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
    for (const row of parseResult.data) {
      const saldoNumerico = parseInt(row.saldo_estoque, 10);
      if (
        isNaN(saldoNumerico) ||
        !row.codigo_produto ||
        !row.codigo_de_barras
      ) {
        console.log("Linha ignorada por dados inválidos:", row);
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
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          console.log(
            `Código de barras duplicado no banco de dados, ignorando linha: ${row.codigo_de_barras}`
          );
        } else {
          console.error(
            "Erro inesperado durante a transação, importação interrompida:",
            error
          );
          throw error;
        }
      }
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error) {
    console.error("Erro na importação de CSV:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[])?.join(", ");
        return NextResponse.json(
          {
            error: `Erro de duplicidade no banco de dados.`,
            details: `Já existe um registro com o mesmo valor no campo: ${target}.`,
          },
          { status: 409 }
        );
      }
    } else if (error instanceof Error) {
      console.error(error.message);
    }

    return NextResponse.json(
      { error: "Erro interno do servidor ao importar arquivo." },
      { status: 500 }
    );
  }
}
