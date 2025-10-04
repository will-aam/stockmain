"use client";

import { useState, useEffect } from "react";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Stock
          </span>

          <div className="flex items-center space-x-2">
            {/* 2. O botão agora usa a função recebida via props */}
            <Button
              variant="ghost" // Estilo mais sutil para o cabeçalho
              size="icon" // Deixa o botão quadrado, só com o ícone
              onClick={() => setShowClearDataModal(true)}
              aria-label="Limpar dados"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>
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
