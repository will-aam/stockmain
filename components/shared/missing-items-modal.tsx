"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, PackageSearch } from "lucide-react";

interface MissingItem {
  codigo_de_barras: string;
  descricao: string;
}

interface MissingItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MissingItem[];
}

export function MissingItemsModal({
  isOpen,
  onClose,
  items,
}: MissingItemsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
              <PackageSearch className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-lg">
              Itens Faltantes ({items.length})
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{item.descricao}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {item.codigo_de_barras}
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
