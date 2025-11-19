// lib/auth.ts
/**
 * Descrição: Utilitário de autenticação e autorização.
 * Responsabilidade: Validar o Token JWT (agora via Cookie) e verificar se o
 * usuário autenticado tem permissão para acessar o recurso solicitado.
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers"; // IMPORTANTE: Importamos a leitura de cookies

/**
 * Define a estrutura do payload que esperamos de dentro do nosso Token JWT.
 */
interface TokenPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Valida o token JWT e autoriza o acesso ao recurso.
 *
 * @param request - O objeto da requisição.
 * @param paramsUserId - O ID do usuário vindo da URL.
 * @returns O payload do token se for válido.
 * @throws Lança um erro se a autenticação ou autorização falhar.
 */
export async function validateAuth(
  request: NextRequest,
  paramsUserId: number
): Promise<TokenPayload> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET não está configurado.");
    throw new Error("Erro interno do servidor.");
  }

  // --- MUDANÇA PRINCIPAL AQUI ---
  // 1. Tentamos ler o token do cookie "authToken"
  // O navegador envia isso automaticamente, o JS não precisa fazer nada.
  const token = cookies().get("authToken")?.value;

  if (!token) {
    // Se não tem cookie, o usuário não está logado
    throw new Error("Acesso não autorizado: Sessão expirada ou inválida.");
  }

  let payload: TokenPayload;

  try {
    // 2. Verifica se o token é válido (assinatura e validade)
    payload = jwt.verify(token, jwtSecret) as TokenPayload;
  } catch (error) {
    throw new Error("Acesso não autorizado: Token inválido.");
  }

  // 3. Verifica se o ID do token bate com o ID da URL
  if (payload.userId !== paramsUserId) {
    throw new Error(
      "Acesso negado: Você não tem permissão para acessar este recurso."
    );
  }

  return payload;
}

/**
 * Cria uma resposta de erro padronizada para SSE (Server-Sent Events).
 */
export function createSseErrorResponse(
  controller: ReadableStreamDefaultController<any>,
  encoder: TextEncoder,
  message: string,
  status: number
) {
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
  );
  controller.close();
}
