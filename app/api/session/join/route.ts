// app/api/session/join/route.ts
/**
 * Rota Pública para Colaboradores entrarem em uma Sessão.
 * Responsabilidade:
 * 1. Receber o código da sala e o nome do colaborador.
 * 2. Validar se a sala existe e está ABERTA.
 * 3. Criar o registro do Participante.
 * 4. Retornar os dados necessários para o frontend iniciar a contagem.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- CONFIGURAÇÕES DE SEGURANÇA ---
const MAX_PARTICIPANTS_PER_SESSION = 10; // Limite seguro para o Polling de 5s
const MAX_NAME_LENGTH = 30; // Nomes muito longos quebram o layout
const MAX_CODE_LENGTH = 10; // Códigos de sessão são curtos

export async function POST(request: Request) {
  try {
    // 1. Sanitização e Validação de Entrada
    // Evita injeção de payloads gigantes ou tipos errados
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    let { code, name } = body;

    // Limpeza básica
    if (typeof code !== "string") code = "";
    if (typeof name !== "string") name = "";

    code = code.trim().toUpperCase().slice(0, MAX_CODE_LENGTH);
    name = name.trim().slice(0, MAX_NAME_LENGTH); // Corta o nome se for gigante

    // Validação final
    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: "Código da sala inválido." },
        { status: 400 }
      );
    }

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "O nome deve ter pelo menos 2 letras." },
        { status: 400 }
      );
    }

    // 2. Buscar a sessão
    const sessao = await prisma.sessao.findUnique({
      where: { codigo_acesso: code },
      include: {
        _count: {
          select: { participantes: true },
        },
      },
    });

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessão não encontrada. Verifique o código." },
        { status: 404 }
      );
    }

    if (sessao.status !== "ABERTA") {
      return NextResponse.json(
        { error: `Esta sessão está ${sessao.status.toLowerCase()}.` },
        { status: 403 }
      );
    }

    // 3. Lógica "Find or Create" (Com verificação de Limite)

    // Primeiro, verificamos se esse usuário JÁ existe (reconexão)
    let participante = await prisma.participante.findFirst({
      where: {
        sessao_id: sessao.id,
        nome: name,
      },
    });

    if (participante) {
      // SE JÁ EXISTE: Apenas reativa e deixa entrar (não conta para o limite de NOVOS)
      if (participante.status !== "ATIVO") {
        participante = await prisma.participante.update({
          where: { id: participante.id },
          data: { status: "ATIVO" },
        });
      }
    } else {
      // SE É NOVO: Verifica se a sala está cheia antes de criar
      // Contamos apenas os ativos para ser justo
      const totalAtivos = await prisma.participante.count({
        where: { sessao_id: sessao.id, status: "ATIVO" },
      });

      if (totalAtivos >= MAX_PARTICIPANTS_PER_SESSION) {
        return NextResponse.json(
          { error: "A sala atingiu o limite máximo de participantes." },
          { status: 429 } // Too Many Requests
        );
      }

      // Cria o novo participante
      participante = await prisma.participante.create({
        data: {
          nome: name,
          sessao_id: sessao.id,
          status: "ATIVO",
        },
      });
    }

    // 4. Retornar sucesso
    return NextResponse.json({
      success: true,
      session: {
        id: sessao.id,
        nome: sessao.nome,
        codigo: sessao.codigo_acesso,
      },
      participant: {
        id: participante.id,
        nome: participante.nome,
      },
    });
  } catch (error: any) {
    console.error("Erro ao entrar na sessão:", error);
    return NextResponse.json(
      { error: "Erro interno ao tentar entrar na sala." },
      { status: 500 }
    );
  }
}
