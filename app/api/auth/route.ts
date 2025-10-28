// src/app/api/auth/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Objeto hardcodedPasswords foi removido

export async function POST(request: Request) {
  try {
    // O valor recebido aqui será o email que o usuário digitou no campo senha
    const { password: userEmail } = await request.json();

    if (!userEmail || typeof userEmail !== "string") {
      return NextResponse.json(
        { error: "Email (digitado como senha) inválido" },
        { status: 400 }
      );
    }

    // Procura o usuário pelo email no banco de dados
    const user = await prisma.usuario.findUnique({
      where: {
        email: userEmail, // Busca na coluna 'email'
      },
    });

    // Se não encontrou o usuário com aquele email
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado com este email" },
        { status: 401 } // 401 significa "Não Autorizado"
      );
    }

    // Se encontrou o usuário, retorna o ID dele
    // Não precisamos mais criar o usuário aqui, pois ele já deve existir
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
