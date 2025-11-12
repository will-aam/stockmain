// src/app/api/cron/route.ts
/**
 * Rota de API para um CRON Job de limpeza.
 * Exclui produtos e códigos de barras com mais de 24 horas de criação.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Manipula a requisição GET para o CRON Job.
 * Verifica a autorização e executa a limpeza de dados antigos.
 * @param request - Requisição com o cabeçalho de autorização.
 * @returns Resposta JSON com o resultado da limpeza ou erro.
 */
export async function GET(request: Request) {
  const headersList = headers();
  const authorization = headersList.get("authorization");

  // Verifica o segredo de autorização do CRON.
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Define o limite de 24 horas no passado.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Exclui produtos antigos.
    const productResult = await prisma.produto.deleteMany({
      where: {
        created_at: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    // Exclui códigos de barras antigos.
    const barcodeResult = await prisma.codigoBarras.deleteMany({
      where: {
        created_at: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    console.log(
      `CRON JOB: ${productResult.count} produtos e ${barcodeResult.count} códigos de barras antigos foram excluídos.`
    );

    return NextResponse.json({
      message: "Limpeza de catálogos antigos concluída.",
      deletedProducts: productResult.count,
      deletedBarcodes: barcodeResult.count,
    });
  } catch (error) {
    console.error("Erro no CRON JOB de limpeza:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
