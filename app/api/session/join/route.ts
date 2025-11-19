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

    // 1. Buscar a sessão pelo código
    // Convertemos para maiúsculo para facilitar (case-insensitive na prática)
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
          error:
            "Esta sessão não está aceitando novos participantes (Status: " +
            sessao.status +
            ").",
        },
        { status: 403 }
      );
    }

    // 2. Registrar o Participante
    // Se o usuário já existir com esse nome nessa sessão, poderíamos retornar o mesmo ID,
    // mas por simplicidade e para evitar conflitos de nomes iguais, criamos um novo registro
    // ou assumimos que nomes duplicados são pessoas diferentes (o ID é o que importa).
    const participante = await prisma.participante.create({
      data: {
        nome: name,
        sessao_id: sessao.id,
        status: "ATIVO",
      },
    });

    // 3. Retornar sucesso com dados vitais
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
