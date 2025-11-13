// app/api/auth/route.ts
/**
 * Rota de API para autenticação de usuário.
 * Autentica um usuário com base no email e senha.
 * Retorna um Token JWT seguro contendo o ID do usuário.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // 1. IMPORTAMOS O JWT

/**
 * Manipula a requisição POST para autenticar o usuário.
 * @param request - Requisição contendo o email e senha no corpo JSON.
 * @returns Resposta JSON com o token JWT ou um erro.
 */
export async function POST(request: Request) {
  try {
    // 2. VERIFICAMOS SE O SEGREDO JWT ESTÁ CONFIGURADO NO .env
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET não está configurado no .env");
      return NextResponse.json(
        { error: "Erro de configuração do servidor." },
        { status: 500 }
      );
    }

    // 3. Recebe email e senha do frontend
    const { email, senha } = await request.json();

    if (
      !email ||
      typeof email !== "string" ||
      !senha ||
      typeof senha !== "string"
    ) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // 4. Busca usuário no banco pelo email
    const user = await prisma.usuario.findUnique({
      where: { email: email },
    });

    // 5. Se o usuário não for encontrado
    if (!user) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    // 6. Compara a senha enviada com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    // 7. Se a senha for inválida
    if (!senhaValida) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    // 8. Sucesso! O email existe E a senha bate.
    // AGORA CRIAMOS O TOKEN (O "CRACHÁ")
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // O que vai dentro do crachá
      jwtSecret, // A chave secreta que você criou
      { expiresIn: "1d" } // Validade do crachá (1 dia)
    );

    // 9. Retornamos o token e o userId (ambos são úteis para o frontend)
    return NextResponse.json({ success: true, userId: user.id, token: token });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
