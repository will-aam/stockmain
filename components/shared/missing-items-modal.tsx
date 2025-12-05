// components/shared/missing-items-modal.tsx
/**
 * Descrição: Modal para exibir a lista de itens faltantes na conferência.
 * Responsabilidade: Apresentar ao usuário uma lista detalhada de todos os produtos
 * que constam no catálogo mas não foram contados. O modal é exibido sob demanda
 * e permite que o usuário visualize o código de barras, a descrição e a quantidade
 * faltante de cada item.
 * Atualização: Adicionado fechamento via tecla ESC.
 */

"use client";

// --- React Hooks ---
import { useEffect } from "react";

// --- Componentes de UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Ícones ---
import { X, PackageMinus } from "lucide-react";

// --- Interfaces e Tipos ---
/**
 * Representa um item que está faltando na contagem.
 */
interface MissingItem {
  codigo_de_barras: string; // O código de barras do produto.
  descricao: string; // A descrição do produto.
  faltante: number; // A quantidade que falta ser contada.
}

/**
 * Props para o componente MissingItemsModal.
 */
interface MissingItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MissingItem[];
}

/**
 * Componente MissingItemsModal.
 * Renderiza um modal que lista os itens que não foram contados.
 * O componente não é renderizado se não estiver aberto ou se a lista de itens estiver vazia.
 */
export function MissingItemsModal({
  isOpen,
  onClose,
  items,
}: MissingItemsModalProps) {
  // Adiciona listener para a tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup ao desmontar ou fechar
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg mx-auto">
        {/* Cabeçalho do modal com ícone, título dinâmico e botão de fechar. */}
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <PackageMinus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-lg">
              Itens Faltantes ({items.length})
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Corpo do modal com a lista de itens ou mensagem de estado vazio. */}
        <CardContent>
          {items.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm leading-tight">
                      {item.descricao}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {item.codigo_de_barras}
                    </p>
                  </div>
                  <div className="text-right text-[11px] leading-4 text-amber-600 dark:text-amber-300">
                    <p className="font-semibold text-sm">
                      {item.faltante.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Todos os itens foram contados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
