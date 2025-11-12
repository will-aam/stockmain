// src/components/shared/save-count-modal.tsx
/**
 * Descrição: Modal para Salvar a Contagem de Inventário.
 * Responsabilidade: Exibir um diálogo que permite ao usuário digitar um nome para o arquivo
 * da contagem atual antes de salvá-lo. Gerencia o estado do input e a comunicação
 * com a função de salvamento externa, fornecendo feedback de carregamento.
 */

"use client";

// --- React Hooks ---
import { useState } from "react";

// --- Componentes de UI ---
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Ícones ---
import { Save, Loader2 } from "lucide-react";

// --- Interfaces e Tipos ---
/**
 * Props para o componente SaveCountModal.
 */
interface SaveCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string) => void;
  isLoading: boolean;
}

/**
 * Componente SaveCountModal.
 * Renderiza um modal para que o usuário possa nomear e confirmar o salvamento da contagem.
 */
export function SaveCountModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SaveCountModalProps) {
  const [fileName, setFileName] = useState("contagem");

  /**
   * Função para lidar com o clique no botão de salvar.
   * Verifica se o nome do arquivo não está vazio e chama a função de callback `onConfirm`.
   */
  const handleSave = () => {
    if (fileName.trim()) {
      onConfirm(fileName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[425px] rounded-lg">
        {/* Cabeçalho do modal com título e descrição. */}
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center">
            <Save className="mr-2 h-5 w-5" />
            Salvar Contagem
          </DialogTitle>
          <DialogDescription>
            Digite um nome para este relatório. A data será adicionada
            automaticamente (ex: nome_AAAA-MM-DD.csv).
          </DialogDescription>
        </DialogHeader>

        {/* Corpo do modal com o campo de input para o nome do arquivo. */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-left sm:text-right">
              Nome
            </Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="sm:col-span-3"
              placeholder="Ex: inventario_loja_a"
              disabled={isLoading}
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        {/* Rodapé do modal com os botões de cancelar e salvar. */}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={!fileName.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
