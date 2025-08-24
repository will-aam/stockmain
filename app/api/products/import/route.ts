import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Papa from "papaparse"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 })
    }

    const text = await file.text()

    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        delimiter: ";",
        complete: async (results) => {
          const errors: string[] = []
          const productsToCreate: any[] = []
          const barCodesToCreate: any[] = []

          // Verificar códigos de barras existentes
          const existingBarCodes = await prisma.codigoBarras.findMany({
            select: { codigo_de_barras: true },
          })
          const existingBarCodesSet = new Set(existingBarCodes.map((bc) => bc.codigo_de_barras))

          results.data.forEach((row: any, index: number) => {
            const { codigo_de_barras, codigo_produto, descricao, saldo_estoque } = row

            if (!codigo_de_barras || !codigo_produto || !descricao || saldo_estoque === undefined) {
              errors.push(`Linha ${index + 2}: Dados incompletos`)
              return
            }

            if (existingBarCodesSet.has(codigo_de_barras)) {
              errors.push(`Linha ${index + 2}: Código de barras ${codigo_de_barras} duplicado`)
              return
            }

            const saldoNumerico = Number.parseInt(saldo_estoque)
            if (isNaN(saldoNumerico)) {
              errors.push(`Linha ${index + 2}: Saldo de estoque deve ser um número`)
              return
            }

            productsToCreate.push({
              codigo_produto,
              descricao,
              saldo_estoque: saldoNumerico,
            })

            barCodesToCreate.push({
              codigo_de_barras,
              codigo_produto, // Será relacionado após criar o produto
            })

            existingBarCodesSet.add(codigo_de_barras)
          })

          if (errors.length > 0) {
            resolve(NextResponse.json({ errors }, { status: 400 }))
            return
          }

          try {
            // Criar produtos e códigos de barras em transação
            const result = await prisma.$transaction(async (tx) => {
              const createdProducts = []
              const createdBarCodes = []

              for (let i = 0; i < productsToCreate.length; i++) {
                const product = await tx.produto.create({
                  data: productsToCreate[i],
                })
                createdProducts.push(product)

                const barCode = await tx.codigoBarras.create({
                  data: {
                    codigo_de_barras: barCodesToCreate[i].codigo_de_barras,
                    produto_id: product.id,
                  },
                })
                createdBarCodes.push(barCode)
              }

              return { products: createdProducts, barCodes: createdBarCodes }
            })

            resolve(
              NextResponse.json({
                message: `${result.products.length} produtos importados com sucesso`,
                products: result.products,
                barCodes: result.barCodes,
              }),
            )
          } catch (dbError) {
            console.error("Database error:", dbError)
            resolve(NextResponse.json({ error: "Erro ao salvar no banco de dados" }, { status: 500 }))
          }
        },
        error: (error) => {
          resolve(NextResponse.json({ error: "Erro ao processar arquivo CSV" }, { status: 400 }))
        },
      })
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
