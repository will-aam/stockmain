// lib/auth.ts
/**
 * Descrição: Utilitário de autenticação e autorização.
 * Responsabilidade: Validar o Token JWT (autenticação) e verificar se o
 * usuário autenticado tem permissão para acessar o recurso solicitado (autorização).
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
 * Esta função é o nosso "guardião" de API.
 *
 * @param request - O objeto da requisição (para lermos os headers).
 * @param paramsUserId - O ID do usuário vindo da URL (ex: /api/inventory/123).
 * @returns O payload do token se for válido.
 * @throws Lança um erro se a autenticação ou autorização falhar.
 */
export async function validateAuth(
  request: NextRequest,
  paramsUserId: number
): Promise<TokenPayload> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    // Este é um erro de servidor, não do cliente
    console.error("JWT_SECRET não está configurado.");
    throw new Error("Erro interno do servidor.");
  }

  // 1. Pega o "crachá" (token) do header
  const authorizationHeader = request.headers.get("Authorization");
  if (!authorizationHeader) {
    throw new Error("Acesso não autorizado: Token não fornecido.");
  }

  const token = authorizationHeader.split("Bearer ")[1];
  if (!token) {
    throw new Error("Acesso não autorizado: Formato do token inválido.");
  }

  let payload: TokenPayload;

  try {
    // 2. Verifica se o crachá é válido (usando o segredo)
    payload = jwt.verify(token, jwtSecret) as TokenPayload;
  } catch (error) {
    throw new Error("Acesso não autorizado: Token inválido ou expirado.");
  }

  // 3. Verifica se o ID do crachá (quem você É) é o mesmo ID da URL (quem você DIZ ser)
  if (payload.userId !== paramsUserId) {
    throw new Error(
      "Acesso negado: Você não tem permissão para acessar este recurso."
    );
  }

  // Se chegou até aqui, o usuário está autenticado E autorizado.
  return payload;
}

/**
 * Cria uma resposta de erro padronizada para SSE (Server-Sent Events).
 * @param controller - O controlador do stream.
 * @param encoder - O TextEncoder.
 * @param message - A mensagem de erro.
 * @param status - O código de status HTTP.
 */
export function createSseErrorResponse(
  controller: ReadableStreamDefaultController<any>,
  encoder: TextEncoder,
  message: string,
  status: number
) {
  // Em SSE, o erro é enviado como um evento de dados com status 200,
  // mas o frontend (ImportTab) vai ler a propriedade 'error'.
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
  );
  controller.close();
}
