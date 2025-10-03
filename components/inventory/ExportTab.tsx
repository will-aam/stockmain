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
  setShowClearDataModal: (show: boolean) => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  products,
  tempProducts,
  productCounts,
  productCountsStats,
  exportToCsv,
  handleSaveCount,
  setShowClearDataModal,
}) => {
  return (
    <>
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
                {products.length + tempProducts.length}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Produtos Importados
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
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {Math.max(
                  0,
                  products.length + tempProducts.length - productCounts.length
                )}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Itens Faltantes
              </p>
            </div>
          </div>
          {(products.length > 0 || tempProducts.length > 0) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progresso da Contagem
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {productCounts.length} de{" "}
                  {products.length + tempProducts.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (productCounts.length /
                        (products.length + tempProducts.length || 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Ações de Contagem
          </CardTitle>
          <CardDescription>
            Exporte os dados da contagem ou salve no histórico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToCsv} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar para CSV
            </Button>
            <Button onClick={handleSaveCount}>
              <CloudUpload className="mr-2 h-4 w-4" />
              Salvar Contagem
            </Button>
          </div>
          {productCounts.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table className="responsive-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Sistema
                    </TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCounts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.descricao}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.saldo_estoque}
                      </TableCell>
                      <TableCell>{item.quant_loja}</TableCell>
                      <TableCell>{item.quant_estoque}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.total === 0
                              ? "secondary"
                              : item.total > 0
                              ? "default"
                              : "destructive"
                          }
                        >
                          {item.total > 0 ? "+" : ""}
                          {item.total}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma contagem para exportar</p>
              <p className="text-sm">
                Realize contagens na aba "Conferência" primeiro
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

ExportTab.displayName = "ExportTab";
