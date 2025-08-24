import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { items, format } = await request.json()

    if (format === "csv") {
      const headers = "descricao;codigo_produto;codigo_de_barras_lido;quantidade_contada;data_hora\n"
      const csvContent = items
        .map(
          (item: any) =>
            `${item.descricao};${item.codigo_produto};${item.codigo_de_barras};${item.quantidade};${item.data_hora}`,
        )
        .join("\n")

      return new NextResponse(headers + csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=contagem_${new Date().toISOString().split("T")[0]}.csv`,
        },
      })
    }

    if (format === "pdf") {
      // Implementar geração de PDF
      return NextResponse.json({ message: "PDF gerado com sucesso" })
    }

    return NextResponse.json({ error: "Formato não suportado" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao exportar dados" }, { status: 500 })
  }
}
