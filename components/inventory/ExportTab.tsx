import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, Download, FileSpreadsheet, Package } from "lucide-react";
import type { Product, TempProduct, ProductCount } from "@/lib/types";

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

export const ExportTab: React.FC<ExportTabProps> = ({
  products,
  tempProducts,
  productCounts,
  productCountsStats,
  exportToCsv,
  handleSaveCount,
  setShowMissingItemsModal,
}) => {
  const missingItemsCount = Math.max(
    0,
    products.length -
      productCounts.filter((p) => !p.codigo_produto.startsWith("TEMP-")).length
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Resumo da Contagem
          </CardTitle>
          <CardDescription>
            Visão geral do progresso da contagem atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {products.length}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Produtos no Catálogo
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {productCounts.length}
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Produtos Contados
              </p>
            </div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Ações de Contagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* --- CORREÇÃO APLICADA AQUI --- */}
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
