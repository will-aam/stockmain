// src/components/inventory/ExportTab.tsx
/**
 * Descrição: Aba para exportação e salvamento da contagem de inventário.
 * Responsabilidade: Exibir um resumo do progresso da contagem, incluindo o total de itens no catálogo,
 * os itens já contados e os faltantes. Oferece ações para exportar os dados atuais
 * como um arquivo CSV e para salvar a contagem no histórico.
 */

import type React from "react";

// --- Componentes de UI ---
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// --- Ícones ---
import { CloudUpload, Download } from "lucide-react";

// --- Tipos ---
import type { Product, TempProduct, ProductCount } from "@/lib/types";

/**
 * Props para o componente ExportTab.
 */
interface ExportTabProps {
  products: Product[];
  tempProducts: TempProduct[];
  productCounts: ProductCount[];
  productCountsStats: {
    totalLoja: number;
    totalEstoque: number;
  };
  exportToCsv: () => void;
  handleSaveCount: () => void;
  setShowMissingItemsModal: (show: boolean) => void;
}

/**
 * Componente ExportTab.
 * Orquestra a exibição do resumo e os botões de ação para a contagem.
 */
export const ExportTab: React.FC<ExportTabProps> = ({
  products,
  tempProducts,
  productCounts,
  productCountsStats,
  exportToCsv,
  handleSaveCount,
  setShowMissingItemsModal,
}) => {
  /**
   * Calcula o número de itens que ainda não foram contados.
   * A lógica subtrai o total de itens contados (excluindo os temporários, que começam com "TEMP-")
   * do total de produtos no catálogo principal. O Math.max garante que o resultado não seja negativo.
   */
  const missingItemsCount = Math.max(
    0,
    products.length -
      productCounts.filter((p) => !p.codigo_produto.startsWith("TEMP-")).length
  );

  return (
    <div className="space-y-6">
      {/* Card de Resumo da Contagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Resumo da Contagem
          </CardTitle>
          <CardDescription>
            Visão geral do progresso da contagem atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Grid com os cards de estatísticas: Catálogo, Contados e Faltantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card de Itens no Catálogo */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {products.length}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Itens no Catálogo
              </p>
            </div>
            {/* Card de Itens Contados */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {productCounts.length}
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Itens Contados
              </p>
            </div>
            {/* Card de Itens Faltantes (Interativo) */}
            <div
              className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              onClick={() => setShowMissingItemsModal(true)}
            >
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {missingItemsCount}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Itens Faltantes
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Clique para ver a lista
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Ações de Contagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Ações de Contagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center gap-2">
            <Button onClick={exportToCsv} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleSaveCount} className="flex-1">
              <CloudUpload className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

ExportTab.displayName = "ExportTab";
