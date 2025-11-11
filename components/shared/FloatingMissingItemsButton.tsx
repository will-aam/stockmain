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
      className="fixed bottom-6 right-6 z-50 cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }} // Prevents page scroll on mobile when dragging
    >
      <Button
        onClick={onClick}
        variant="outline"
        size="icon"
        className={cn(
          "relative h-14 w-14 rounded-full shadow-lg",
          "bg-amber-500 text-white", // Use a distinct color for visibility
          "hover:bg-amber-600 focus:ring-2 focus:ring-amber-700",
          "dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700"
        )}
        aria-label={`Mostrar ${itemCount} itens faltantes`}
      >
        <PackageMinus className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          {itemCount}
        </span>
      </Button>
    </motion.div>
  );
}
