"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PackageMinus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMissingItemsButtonProps {
  onClick: () => void;
  itemCount: number;
  // 1. Defina o tipo da nova prop
  dragConstraintsRef: React.RefObject<HTMLDivElement>;
}

export function FloatingMissingItemsButton({
  onClick,
  itemCount,
  dragConstraintsRef, // 2. Receba a prop
}: FloatingMissingItemsButtonProps) {
  // Do not render the button if there are no missing items
  if (itemCount === 0) {
    return null;
  }

  return (
    <motion.div
      drag
      dragConstraints={dragConstraintsRef} // 3. Use a ref aqui
      dragMomentum={false} // Prevents the button from "sliding" after drag
      // --- ALTERAÇÃO AQUI ---
      // 1. Mantido 'right-6' para ficar no lado.
      // 2. 'bottom-6' mudei para 'bottom-24' (para ficar acima da barra de navegação).
      // 3. 'z-50' mudei para 'z-[60]' (para ficar na FRENTE da barra de navegação).
      className="fixed bottom-24 right-6 z-[60] cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }} // Prevents page scroll on mobile when dragging
    >
      <Button
        onClick={onClick}
        variant="outline"
        className={cn(
          "relative h-14 w-14 rounded-full shadow-lg",
          "bg-amber-500 text-white",
          "hover:bg-amber-800 focus:ring-2 focus:ring-amber-800",
          "dark:bg-amber-600 dark:text-white dark:hover:bg-amber-800",
          "flex items-center justify-center"
        )}
        aria-label={`Mostrar ${itemCount} itens faltantes`}
      >
        <PackageMinus className="!h-8 !w-8" />{" "}
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          {itemCount}
        </span>
      </Button>
    </motion.div>
  );
}
