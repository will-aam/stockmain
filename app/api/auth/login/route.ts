import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const user = await prisma.usuario.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.senha_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Senha inválida" }, { status: 401 })
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "24h",
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
