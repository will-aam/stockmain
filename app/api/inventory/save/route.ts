import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorização necessário" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    const { items, local_estoque } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Itens são obrigatórios" }, { status: 400 })
    }

    // Criar contagem e itens em transação
    const result = await prisma.$transaction(async (tx) => {
      const contagem = await tx.contagem.create({
        data: {
          usuario_id: decoded.userId,
          local_estoque: local_estoque || "loja-1",
          status: "concluida",
        },
      })

      const itensContados = await Promise.all(
        items.map((item: any) =>
          tx.itemContado.create({
            data: {
              contagem_id: contagem.id,
              produto_id: item.produto_id,
              codigo_de_barras: item.codigo_de_barras,
              quantidade_contada: item.quantidade_contada,
              saldo_estoque: item.saldo_estoque,
              total: item.total,
            },
          }),
        ),
      )

      return { contagem, itensContados }
    })

    return NextResponse.json({
      message: "Contagem salva com sucesso",
      contagem: result.contagem,
      itens: result.itensContados,
    })
  } catch (error) {
    console.error("Save inventory error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
