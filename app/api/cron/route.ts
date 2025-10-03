import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.codigoBarras.deleteMany({
      where: {
        created_at: {
          lt: twentyFourHoursAgo, // lt = less than (menor que)
        },
      },
    });

    console.log(`CRON JOB: ${result.count} códigos de barras antigos foram excluídos.`);

    return NextResponse.json({
      message: "Limpeza de códigos de barras antigos concluída.",
      deletedCount: result.count,
    });

  } catch (error) {
    console.error("Erro no CRON JOB de limpeza:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}