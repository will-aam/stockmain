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

    // Loop de segurança caso o código gerado já exista (raro, mas possível)
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
    console.error("Erro ao criar sessão:", error);
    const status = error.message.includes("Acesso") ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Erro interno." },
      { status }
    );
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
    console.error("Erro ao listar sessões:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
