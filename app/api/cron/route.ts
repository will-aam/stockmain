import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(request: Request) {
  // Pega o header 'authorization' da requisição
  const headersList = headers();
  const authorization = headersList.get("authorization");

  // Verifica se a chave secreta enviada é a mesma do nosso .env
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    // Se não for, retorna um erro de não autorizado
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Se a chave estiver correta, continua com a lógica de limpeza
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.codigoBarras.deleteMany({
      where: {
        created_at: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    console.log(
      `CRON JOB: ${result.count} códigos de barras antigos foram excluídos.`
    );

    return NextResponse.json({
      message: "Limpeza de códigos de barras antigos concluída.",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Erro no CRON JOB de limpeza:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
