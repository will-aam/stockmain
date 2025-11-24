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

export async function POST(request: Request) {
  try {
    const { code, name } = await request.json();

    if (!code || !name) {
      return NextResponse.json(
        { error: "Código da sala e nome são obrigatórios." },
        { status: 400 }
      );
    }

    // 1. Buscar a sessão pelo código (Case Insensitive)
    const sessao = await prisma.sessao.findUnique({
      where: { codigo_acesso: code.toUpperCase() },
    });

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessão não encontrada. Verifique o código." },
        { status: 404 }
      );
    }

    if (sessao.status !== "ABERTA") {
      return NextResponse.json(
        {
          error: `Esta sessão não está aceitando novos participantes (Status: ${sessao.status}).`,
        },
        { status: 403 }
      );
    }

    // 2. CORREÇÃO: Verificar se o participante JÁ EXISTE nesta sessão
    let participante = await prisma.participante.findFirst({
      where: {
        sessao_id: sessao.id,
        nome: name, // Busca pelo nome (Ex: "Anfitrião (Você)" ou "Alex")
      },
    });

    // 3. Lógica "Find or Create"
    if (participante) {
      // Se já existe, apenas garantimos que ele está marcado como ATIVO novamente
      if (participante.status !== "ATIVO") {
        participante = await prisma.participante.update({
          where: { id: participante.id },
          data: { status: "ATIVO" },
        });
      }
      // Não criamos nada novo, apenas usamos o 'participante' encontrado
    } else {
      // Se não existe, aí sim criamos um novo
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
