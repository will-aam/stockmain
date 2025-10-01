import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Papa from "papaparse";
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

    let importedCount = 0;

    // --- INÍCIO DA CORREÇÃO ---
    // Em vez de uma transação gigante, processamos cada linha individualmente.
    for (const row of parseResult.data) {
      const saldoNumerico = parseInt(row.saldo_estoque, 10);
      if (
        isNaN(saldoNumerico) ||
        !row.codigo_produto ||
        !row.codigo_de_barras
      ) {
        continue; // Pula linhas mal formatadas
      }

      // Agora, usamos uma transação separada para cada linha do CSV.
      // Isso é muito mais rápido e evita que a conexão expire.
      await prisma.$transaction(async (tx) => {
        // 1. Atualiza ou cria o produto
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

        // 2. Apaga códigos de barras antigos associados a este produto
        await tx.codigoBarras.deleteMany({
          where: { produto_id: product.id },
        });

        // 3. Cria o novo código de barras
        await tx.codigoBarras.create({
          data: {
            codigo_de_barras: row.codigo_de_barras,
            produto_id: product.id,
            usuario_id: userId,
          },
        });
      });

      importedCount++;
    }
    // --- FIM DA CORREÇÃO ---

    return NextResponse.json({ success: true, importedCount });
  } catch (error) {
    console.error("Erro na importação de CSV:", error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return NextResponse.json(
      { error: "Erro interno do servidor ao importar arquivo." },
      { status: 500 }
    );
  }
}
