// components/shared/Navigation.tsx
/**
 * Descrição: Componente de Navegação Principal (Cabeçalho).
 * Responsabilidade: Renderizar o cabeçalho fixo da aplicação com o logo, links de ação
 * (como a contagem e a limpeza de dados), o botão de logout e o seletor de tema.
 * Inclui um efeito visual que adiciona uma linha gradiente quando a página é rolada.
 */

"use client";

// --- React Hooks ---
import { useState, useEffect } from "react";

// --- Componentes e Hooks Personalizados ---
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";

// --- Ícones e Componentes de UI ---
import { Trash2, LogOut } from "lucide-react";
import { Button } from "../ui/button";

// --- Interfaces e Tipos ---
/**
 * Props para o componente Navigation.
 */
interface NavigationProps {
  setShowClearDataModal: (show: boolean) => void;
}

/**
 * Componente Navigation.
 * Gerencia o estado de rolagem da página para alterar o estilo do cabeçalho
 * e fornece as principais ações de navegação e controle da aplicação.
 */
export function Navigation({ setShowClearDataModal }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Função para realizar o logout do usuário.
   * Remove o ID do usuário e o token de autenticação da sessão e recarrega a página para limpar o estado da aplicação.
   */
  const handleLogout = () => {
    sessionStorage.removeItem("currentUserId");
    sessionStorage.removeItem("authToken"); // Adicione esta linha
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo da Aplicação */}
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Countifly
          </span>

          {/* Container para os botões de ação e controle */}
          <div className="flex items-center space-x-2">
            {/* Botão para acionar o modal de limpeza de dados. */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowClearDataModal(true)}
              aria-label="Limpar dados"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5 text-yellow-500" />
            </Button>

            <ThemeToggleButton />
          </div>
        </div>
      </div>
    </header>
  );
}
