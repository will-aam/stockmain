// components/shared/navigation.tsx
/**
 * Descrição: Componente de Navegação Principal (Cabeçalho).
 * Responsabilidade: Renderizar o cabeçalho com o ícone de Perfil.
 * O Perfil abre um Menu Lateral (Navbar) contendo: Importar (apenas mobile), Tema e Logout.
 */

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Trash2,
  LogOut,
  User,
  Upload,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

// Hook personalizado para detectar dispositivos móveis
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

interface NavigationProps {
  setShowClearDataModal: (show: boolean) => void;
  onNavigate?: (tab: string) => void;
}

export function Navigation({
  setShowClearDataModal,
  onNavigate,
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUserId");
    sessionStorage.removeItem("authToken");
    window.location.reload();
  };

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
    setIsProfileMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm transition-shadow duration-200",
          isScrolled ? "shadow-sm" : ""
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Countifly
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowClearDataModal(true)}
                aria-label="Limpar dados"
                className="text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileMenuOpen(true)}
                className="relative rounded-full bg-secondary/50 hover:bg-secondary text-primary border border-border"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isProfileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setIsProfileMenuOpen(false)}
          />

          <div className="relative w-full max-w-xs bg-background h-full shadow-2xl animate-in slide-in-from-right-full duration-300 flex flex-col">
            {/* Topo do Menu - Perfil e Ações */}
            <div className="p-6 bg-gradient-to-b from-background to-muted/30">
              <div className="flex flex-col items-center space-y-4">
                {/* Ícone de Perfil (clicável para fechar) */}
                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="relative rounded-full bg-secondary/50 w-16 h-16 flex items-center justify-center border-2 border-border hover:border-primary transition-colors"
                >
                  <User className="h-8 w-8 text-primary" />
                </button>

                {/* Botão de Sair da Conta */}
                <Button
                  variant="destructive"
                  className="w-full max-w-xs"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </Button>

                {/* Versão */}
                <p className="text-xs text-muted-foreground">
                  Countifly v1.0 • Logado
                </p>
              </div>
            </div>

            {/* Corpo do Menu - Lista de Opções */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              {/* Opção de Importar - Apenas em dispositivos móveis */}
              {isMobile && (
                <button
                  onClick={() => handleNavigate("import")}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">Importar Produtos</p>
                      <p className="text-sm text-muted-foreground">
                        Carregar CSV do ERP
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </button>
              )}

              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                      {theme === "dark" ? (
                        <Moon className="h-6 w-6" />
                      ) : (
                        <Sun className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Aparência</p>
                      <p className="text-sm text-muted-foreground">
                        {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
                      </p>
                    </div>
                  </div>
                  {/* Switch de tema corrigido */}
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                        theme === "dark" ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          theme === "dark" ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
