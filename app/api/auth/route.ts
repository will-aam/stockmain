// app/api/auth/route.ts
/**
 * Rota de API para autenticação de usuário.
 * Autentica um usuário com base no email fornecido como "senha".
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Manipula a requisição POST para autenticar o usuário.
 * @param request - Requisição contendo o email no corpo JSON.
 * @returns Resposta JSON com sucesso e ID do usuário ou erro.
 */
export async function POST(request: Request) {
  try {
    // Desestrutura o email do corpo da requisição.
    const { password: userEmail } = await request.json();

    if (!userEmail || typeof userEmail !== "string") {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    // Busca usuário no banco pelo email.
    const user = await prisma.usuario.findUnique({
      where: { email: userEmail },
    });

    // Usuário não encontrado.
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 401 }
      );
    }

    // Apenas autentica, não cria usuários.
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
