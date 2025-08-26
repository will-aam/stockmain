"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Package, Save, AlertTriangle } from "lucide-react";

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    codigo_de_barras: string;
    descricao: string;
    quantidade: string;
  }) => void;
  initialData: {
    codigo_de_barras: string;
    descricao: string;
    quantidade: string;
  };
}

export function QuickRegisterModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: QuickRegisterModalProps) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center text-lg">
              <Package className="h-5 w-5 mr-2" />
              Cadastro Rápido
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Item não encontrado no sistema
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras *</Label>
              <Input
                id="barcode"
                value={formData.codigo_de_barras}
                onChange={(e) =>
                  handleInputChange("codigo_de_barras", e.target.value)
                }
                placeholder="Digite o código de barras"
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                placeholder="Digite a descrição do produto"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade Encontrada *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantidade}
                onChange={(e) =>
                  handleInputChange("quantidade", e.target.value)
                }
                placeholder="Digite a quantidade"
                min="0"
                required
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar e Continuar
              </Button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                  Produto Temporário
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Este item será cadastrado apenas para esta sessão e não será
                  salvo permanentemente. Para cadastro definitivo, use a aba de
                  importação.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
