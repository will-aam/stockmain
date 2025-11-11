"use client";

import { useState } from "react";
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
import { Save, Loader2 } from "lucide-react";

interface SaveCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string) => void;
  isLoading: boolean;
}

export function SaveCountModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SaveCountModalProps) {
  // O nome padrão é "contagem", como solicitado
  const [fileName, setFileName] = useState("contagem");

  const handleSave = () => {
    if (fileName.trim()) {
      onConfirm(fileName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[425px] rounded-lg">
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
