// app/api/inventory/[userId]/session/route.ts
/**
 * Rota de API para Gerenciamento de Sessões (Multiplayer).
 * Responsabilidade:
 * 1. POST: Criar uma nova sessão e gerar um código de acesso único.
 * 2. GET: Listar todas as sessões do usuário (Anfitrião).
 */

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuth } from "@/lib/auth";

// Função utilitária para gerar códigos curtos e fáceis (ex: "A1B2C3")
function generateSessionCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper de erro padronizado (para não repetir código)
const handleAuthError = (error: any, context: string) => {
  const status =
    error.message.includes("Acesso não autorizado") ||
    error.message.includes("Acesso negado")
      ? error.message.includes("negado")
        ? 403
        : 401
      : 500;

  console.error(`Erro em ${context}:`, error.message);
  return NextResponse.json(
    { error: error.message || "Erro interno." },
    { status }
  );
};

/**
 * Cria uma nova sessão de contagem.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido." },
        { status: 400 }
      );
    }

    // 1. Segurança: Apenas o dono da conta pode criar sessões
    await validateAuth(request, userId);

    const body = await request.json();
    // Se não vier nome, usamos a data atual como padrão
    const nomeSessao =
      body.nome || `Inventário ${new Date().toLocaleDateString("pt-BR")}`;

    // 2. Gerar código único (com verificação de colisão)
    let codigo = generateSessionCode();
    let exists = await prisma.sessao.findUnique({
      where: { codigo_acesso: codigo },
    });

    while (exists) {
      codigo = generateSessionCode();
      exists = await prisma.sessao.findUnique({
        where: { codigo_acesso: codigo },
      });
    }

    // 3. Criar a Sessão no Banco
    const novaSessao = await prisma.sessao.create({
      data: {
        nome: nomeSessao,
        codigo_acesso: codigo,
        anfitriao_id: userId,
        status: "ABERTA",
      },
    });

    return NextResponse.json(novaSessao, { status: 201 });
  } catch (error: any) {
    return handleAuthError(error, "criar sessão");
  }
}

/**
 * Lista as sessões do Anfitrião.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId, 10);
    if (isNaN(userId))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await validateAuth(request, userId);

    const sessoes = await prisma.sessao.findMany({
      where: { anfitriao_id: userId },
      orderBy: { criado_em: "desc" },
      include: {
        _count: {
          select: { participantes: true, produtos: true, movimentos: true },
        },
      },
    });

    return NextResponse.json(sessoes);
  } catch (error: any) {
    return handleAuthError(error, "listar sessões");
  }
}
