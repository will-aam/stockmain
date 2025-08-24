// components/ThemeToggleButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // useEffect só roda no cliente, então garantimos que isMounted só será true no navegador.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Se o componente ainda não montou no cliente, não renderize nada para evitar o erro de hidratação.
  if (!isMounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
};
