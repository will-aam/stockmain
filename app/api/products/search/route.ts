import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get("barcode")

    if (!barcode) {
      return NextResponse.json({ error: "Código de barras é obrigatório" }, { status: 400 })
    }

    const barCodeEntry = await prisma.codigoBarras.findUnique({
      where: { codigo_de_barras: barcode },
      include: {
        produto: true,
      },
    })

    if (!barCodeEntry || !barCodeEntry.produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      produto: barCodeEntry.produto,
      codigo_de_barras: barcode,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
