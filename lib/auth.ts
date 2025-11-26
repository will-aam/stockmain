// lib/auth.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface TokenPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
  iss?: string; // Novo campo
  aud?: string; // Novo campo
}

// Constantes de segurança (Devem ser iguais na emissão e validação)
const JWT_ISSUER = "countifly-system";
const JWT_AUDIENCE = "countifly-users";

export async function validateAuth(
  request: NextRequest,
  paramsUserId: number
): Promise<TokenPayload> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET não está configurado.");
    throw new Error("Erro interno do servidor.");
  }

  const token = cookies().get("authToken")?.value;

  if (!token) {
    throw new Error("Acesso não autorizado: Sessão expirada ou inválida.");
  }

  let payload: TokenPayload;

  try {
    // CORREÇÃO DE SEGURANÇA: Validações explícitas
    payload = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"], // 1. Trava o algoritmo (evita downgrade)
      issuer: JWT_ISSUER, // 2. Garante que foi VOCÊ que emitiu
      audience: JWT_AUDIENCE, // 3. Garante que o token é para este uso
    }) as TokenPayload;
  } catch (error) {
    throw new Error("Acesso não autorizado: Token inválido ou violado.");
  }

  if (payload.userId !== paramsUserId) {
    throw new Error(
      "Acesso negado: Você não tem permissão para acessar este recurso."
    );
  }

  return payload;
}

// Helper de erro SSE (mantido igual)
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
