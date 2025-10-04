import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const headersList = headers();
  const authorization = headersList.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const productResult = await prisma.produto.deleteMany({
      where: {
        created_at: {
          lt: twentyFourHoursAgo, // lt = less than (menor que)
        },
      },
    });

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
