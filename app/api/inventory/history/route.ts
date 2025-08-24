import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorização necessário" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    const contagens = await prisma.contagem.findMany({
      where: {
        usuario_id: decoded.userId,
      },
      include: {
        usuario: {
          select: { email: true },
        },
        _count: {
          select: { itens_contados: true },
        },
      },
      orderBy: {
        data_contagem: "desc",
      },
    })

    const history = contagens.map((contagem) => ({
      id: contagem.id,
      data_contagem: contagem.data_contagem.toISOString(),
      usuario_email: contagem.usuario.email,
      total_itens: contagem._count.itens_contados,
      local_estoque: contagem.local_estoque,
      status: contagem.status,
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error("History error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
