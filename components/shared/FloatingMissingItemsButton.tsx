"use client";

import * as React from "react";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import { PackageMinus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMissingItemsButtonProps {
  onClick: () => void;
  itemCount: number;
}

export function FloatingMissingItemsButton({
  onClick,
  itemCount,
}: FloatingMissingItemsButtonProps) {
  // Only render if there are items missing
  if (itemCount === 0) {
    return null;
  }

  return (
    <Draggable
      bounds="parent"
      handle=".handle"
      defaultPosition={{ x: 0, y: 0 }}
      grid={[25, 25]}
      scale={1}
    >
      <div
        className="fixed bottom-4 right-4 z-50 cursor-move"
        style={{ touchAction: "none" }} // Prevents page scroll on mobile when dragging
      >
        <Button
          onClick={onClick}
          className={cn(
            "handle flex items-center justify-center rounded-full shadow-lg p-3",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "transition-transform transform hover:scale-110"
          )}
          aria-label="Ver itens em falta"
        >
          <PackageMinus className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
        </Button>
      </div>
    </Draggable>
  );
}
