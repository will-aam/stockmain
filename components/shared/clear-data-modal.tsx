// src/components/shared/clear-data-modal.tsx
/**
 * Descrição: Modal de Confirmação de Exclusão de Dados.
 * Responsabilidade: Exibir um aviso crítico ao usuário, solicitando confirmação antes de
 * apagar permanentemente todos os dados locais da aplicação. Lista explicitamente
 * quais dados serão perdidos para garantir que o usuário tome uma decisão consciente.
 */

"use client";

// --- Componentes de UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Ícones ---
import { AlertTriangle, X, Trash2 } from "lucide-react";

// --- Interfaces e Tipos ---
/**
 * Props para o componente ClearDataModal.
 */
interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Componente ClearDataModal.
 * Renderiza um modal de confirmação que só é exibido quando a prop `isOpen` é verdadeira.
 */
export function ClearDataModal({
  isOpen,
  onClose,
  onConfirm,
}: ClearDataModalProps) {
  // O componente não renderiza nada se não estiver aberto, otimizando o desempenho.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        {/* Cabeçalho do modal com ícone de alerta e botão de fechar. */}
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-lg text-red-800 dark:text-red-200">
              Confirmar Exclusão
            </CardTitle>
          </div>
          {/* Botão para fechar o modal sem executar a ação. */}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Corpo do modal com a mensagem de aviso e a lista de dados que serão perdidos. */}
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Atenção:</strong> Ao prosseguir, todos os dados serão
              apagados permanentemente.
            </p>
            {/* Seção de destaque para reforçar a criticidade da ação e listar os dados afetados. */}
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Esta ação não pode ser desfeita. Todos os seguintes dados serão
                perdidos:
              </p>
              {/* Lista explícita para evitar ambiguidades. */}
              <ul className="mt-2 text-xs text-red-700 dark:text-red-300 space-y-1">
                <li>• Produtos cadastrados</li>
                <li>• Códigos de barras</li>
                <li>• Contagens realizadas</li>
                <li>• Configurações locais</li>
              </ul>
            </div>
          </div>

          {/* Rodapé com os botões de ação: Cancelar (seguro) e Apagar Tudo (destrutivo). */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar Tudo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
