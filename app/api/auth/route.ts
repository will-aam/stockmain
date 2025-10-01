import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vamos definir as senhas "mágicas" aqui por enquanto
const hardcodedPasswords: Record<string, number> = {
  "1234": 1, // Senha "1234" está associada ao usuário com ID 1
  "6789": 2, // Senha "6789" está associada ao usuário com ID 2
  "1111": 3, // Novo usuário
  "2222": 4, // Novo usuário
  "3333": 5, // Novo usuário
};

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Senha inválida" }, { status: 400 });
    }

    const userId = hardcodedPasswords[password];

    if (!userId) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 } // 401 significa "Não Autorizado"
      );
    }

    // Se a senha estiver correta, procuramos o usuário no banco de dados
    // (Isso é importante para futuras associações, por enquanto apenas confirma que existe)
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    // Se não houver um usuário correspondente no banco de dados, criamos um
    if (!user) {
      await prisma.usuario.create({
        data: {
          id: userId,
          email: `user${userId}@stock.system`, // Email de exemplo
          senha_hash: password, // ATENÇÃO: Em um sistema real, isso seria um hash criptografado
        },
      });
    }

    // Retorna o ID do usuário para o frontend saber qual "conta" usar
    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
