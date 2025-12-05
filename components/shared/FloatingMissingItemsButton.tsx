// components/shared/FloatingMissingItemsButton.tsx
/**
 * Descrição: Botão flutuante e arrastável para itens faltantes.
 * Melhorias:
 * 1. Adicionado AnimatePresence para animações suaves de entrada/saída (Pop-in/Pop-out).
 * 2. Adicionado whileHover e whileTap para feedback tátil.
 * 3. Lógica de renderização movida para dentro do JSX para permitir a animação de saída.
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion"; // Importamos AnimatePresence
import { Button } from "@/components/ui/button";
import { PackageMinus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMissingItemsButtonProps {
  onClick: () => void;
  itemCount: number;
  dragConstraintsRef: React.RefObject<HTMLDivElement>;
}

export function FloatingMissingItemsButton({
  onClick,
  itemCount,
  dragConstraintsRef,
}: FloatingMissingItemsButtonProps) {
  // Removemos o "if (itemCount === 0) return null" daqui de cima
  // para permitir que o AnimatePresence gerencie a saída do componente.

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          key="floating-missing-btn" // Chave única para o React rastrear a animação
          // --- Configurações de Animação ---
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          // --- Configurações de Arraste ---
          drag
          dragConstraints={dragConstraintsRef}
          dragMomentum={false}
          // --- Estilos ---
          className="fixed bottom-24 right-6 z-[60] cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          <Button
            onClick={onClick}
            variant="outline"
            className={cn(
              "relative h-14 w-14 rounded-full shadow-xl border-2", // Aumentei a sombra
              "bg-amber-500 text-white border-white dark:border-amber-900",
              "hover:bg-amber-600 hover:scale-105 transition-all", // Transição suave do botão
              "dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700",
              "flex items-center justify-center p-0"
            )}
            aria-label={`Mostrar ${itemCount} itens faltantes`}
          >
            <PackageMinus className="h-7 w-7" />

            {/* Badge de Contagem (Animado também) */}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={itemCount} // Anima sempre que o número mudar
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-background shadow-sm"
            >
              {itemCount}
            </motion.span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
