// src/components/shared/AuthModal.tsx
/**
 * Descrição: Modal de Autenticação da Aplicação.
 * Responsabilidade: Exibir uma interface para que o usuário insira seu acesso e senha e desbloqueie o acesso
 * ao sistema. Gerencia o estado do formulário, a validação, a comunicação com a API de autenticação
 * e fornece feedback visual (carregamento, erros) para o usuário.
 */

"use client";

// --- React Hooks ---
import { useState } from "react";

// --- Componentes de UI ---
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Ícones e Utilitários ---
import { LockKeyhole, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Interfaces e Tipos ---
/**
 * Props para o componente AuthModal.
 * @param onUnlock - Função de callback chamada após a autenticação bem-sucedida, recebendo o ID do usuário e o token.
 */
interface AuthModalProps {
  onUnlock: (userId: number, token: string) => void; // Adicionamos o token aqui
}

/**
 * Componente AuthModal.
 * Renderiza um modal em tela cheia para autenticação, com animações de fundo e
 * um formulário de acesso e senha com validação e feedback visual.
 */
export function AuthModal({ onUnlock }: AuthModalProps) {
  // --- Estado do Componente ---
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Número de WhatsApp para solicitação de acesso (pode ser alterado)
  const whatsappNumber = "5579996638956"; // Substitua pelo número desejado

  /**
   * Função para processar o desbloqueio.
   * Envia o email e a senha para a API de autenticação, gerencia os estados de carregamento e erro,
   * e chama a função `onUnlock` em caso de sucesso.
   */
  const handleUnlock = async () => {
    if (!email.trim() || !senha.trim()) {
      setError("Por favor, insira o acesso e a senha");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao autenticar");
      }

      if (data.success && data.userId && data.token) {
        // Passamos os dois valores para a página principal
        onUnlock(data.userId, data.token);
      } else {
        // Se o token não veio por algum motivo, é um erro
        throw new Error(data.error || "Token de autenticação não recebido.");
      }
    } catch (err: any) {
      setError(err.message);
      setEmail("");
      setSenha("");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manipulador de evento de teclado.
   * Permite que o usuário envie o formulário pressionando a tecla "Enter".
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* --- Fundo Animado --- */}
      {/* Container principal com fundo semitransparante e desfoque. */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        {/* Elementos de fundo animados com cores do tema para um visual dinâmico. */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000" />
      </div>

      {/* --- Container do Modal --- */}
      {/* Container do modal com animação de entrada e ajustes responsivos. */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <Card className="relative overflow-hidden border shadow-2xl bg-card/95 backdrop-blur-xl">
          {/* Borda decorativa com gradiente usando a cor primária do tema. */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 opacity-10" />

          {/* Conteúdo do Modal */}
          <div className="relative">
            {/* Cabeçalho simplificado sem ícone */}
            <CardHeader className="text-center pb-2 px-4 sm:px-6 pt-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Acesso Restrito
              </CardTitle>

              <CardDescription className="text-muted-foreground mt-2 text-sm sm:text-base">
                Insira suas credenciais para acessar o sistema de contagem
              </CardDescription>
            </CardHeader>

            {/* Corpo do Modal com o formulário */}
            <CardContent className="space-y-6 px-4 sm:px-8">
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Acesso
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="seu-acesso@"
                  autoFocus
                  disabled={isLoading}
                  className="h-12 text-base border-input focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Senha da Sessão
                </Label>

                {/* Campo de input de senha com botão para mostrar/ocultar o texto. */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pr-12 h-12 text-base border-input focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Mensagem de erro, exibida com animação slide-in quando presente. */}
              {error && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <LockKeyhole className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Rodapé com o botão de envio */}
            <CardFooter className="px-4 sm:px-8 pb-8 pt-2">
              <Button
                onClick={handleUnlock}
                className={cn(
                  "w-full h-12 text-base font-medium transition-all duration-200",
                  "bg-primary hover:bg-primary/90",
                  "shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                )}
                disabled={isLoading || !email.trim() || !senha.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="mr-2 h-5 w-5" />
                    Desbloquear Acesso
                  </>
                )}
              </Button>
            </CardFooter>
          </div>

          {/* Linha decorativa inferior com a cor primária do tema. */}
          <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
        </Card>

        {/* Texto informativo adicional abaixo do modal. */}
        <p className="text-center text-xs text-muted-foreground mt-4 px-4">
          Área restrita • Acesso autorizado somente
        </p>

        {/* Link para solicitar acesso via WhatsApp */}
        <p className="text-center text-xs text-muted-foreground mt-2 px-4">
          Não possui acesso?{" "}
          <a
            href={`https://wa.me/${whatsappNumber}?text=Olá, tudo bem? Estou interessado em utilizar o sistema de contagem Countifly. Gostaria de solicitar meu acesso.`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Solicitar acesso
          </a>
        </p>
      </div>

      {/* Estilos CSS-in-JS para animações e ajustes responsivos específicos deste componente. */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Ajustes responsivos para telas muito pequenas. */
        @media (max-width: 360px) {
          .fixed {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
