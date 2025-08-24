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

    // Verificar se usuário já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Usuário já existe" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await prisma.usuario.create({
      data: {
        email,
        senha_hash: hashedPassword,
      },
    })

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "24h",
    })

    return NextResponse.json({
      user: { id: newUser.id, email: newUser.email },
      token,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
