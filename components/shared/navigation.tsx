"use client";

import { useState, useEffect } from "react";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";
// 1. Importar o ícone de LogOut
import { Scan, Trash2, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

// 1. Define que o componente receberá a função como propriedade
interface NavigationProps {
  setShowClearDataModal: (show: boolean) => void;
}

export function Navigation({ setShowClearDataModal }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Adicionar a função de Logout
  const handleLogout = () => {
    sessionStorage.removeItem("currentUserId");
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Stock
          </span>

          <div className="flex items-center space-x-2">
            <Link
              href="https://stock-inventario-bd.netlify.app"
              target="_blank"
            >
              <Button
                variant="ghost" // Estilo mais sutil para o cabeçalho
                size="icon" // Deixa o botão quadrado, só com o ícone
                aria-label="Contagem"
              >
                <Scan className="h-5 w-5 text-blue-500" />
              </Button>
            </Link>
            <Button
              variant="ghost" // Estilo mais sutil para o cabeçalho
              size="icon" // Deixa o botão quadrado, só com o ícone
              onClick={() => setShowClearDataModal(true)}
              aria-label="Limpar dados"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>

            {/* --- 3. BOTÃO DE SAIR ADICIONADO AQUI --- */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5 text-yellow-500" />
            </Button>
            {/* --- FIM DO BOTÃO DE SAIR --- */}

            <ThemeToggleButton />
          </div>
        </div>
        {isScrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
        )}
      </div>
    </header>
  );
}
