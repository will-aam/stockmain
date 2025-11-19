// app/api/auth/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers"; // Importamos a gestão de cookies do Next.js

export async function POST(request: Request) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: "Erro de configuração do servidor." },
        { status: 500 }
      );
    }

    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    // Cria o token (o "crachá")
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1d",
    });

    // --- AQUI ESTÁ A MUDANÇA ---
    // Definimos o cookie no navegador. O 'httpOnly: true' impede que o JavaScript leia este cookie.
    const cookieStore = cookies();
    cookieStore.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Em produção (HTTPS), só trafega criptografado
      sameSite: "strict", // Protege contra ataques CSRF
      maxAge: 60 * 60 * 24, // 1 dia em segundos
      path: "/", // Válido em todas as páginas
    });

    // Retornamos sucesso, mas SEM o token no corpo. O navegador já recebeu o cookie.
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
