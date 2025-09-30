"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Store,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface CountedItem {
  id: string;
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
  quantidade_contada: number;
  total: number;
  local_estoque: string;
  data_hora: string;
}

interface CountingSummaryProps {
  lojaItems: CountedItem[];
  estoqueItems: CountedItem[];
  selectedLocation: string;
}

export function CountingSummary({
  lojaItems,
  estoqueItems,
  selectedLocation,
}: CountingSummaryProps) {
  const totalLoja = lojaItems.reduce(
    (sum, item) => sum + item.quantidade_contada,
    0
  );
  const totalEstoque = estoqueItems.reduce(
    (sum, item) => sum + item.quantidade_contada,
    0
  );
  const totalSistema = [...lojaItems, ...estoqueItems].reduce(
    (sum, item) => sum + item.saldo_estoque,
    0
  );
  const consolidado = totalLoja + totalEstoque - totalSistema;

  const getVarianceIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getVarianceColor = (value: number) => {
    if (value > 0) return "text-green-600 dark:text-green-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Resumo da Conferência
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Store className="h-4 w-4 mr-1 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalLoja}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Itens em Loja
            </p>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-4 w-4 mr-1 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalEstoque}
            </p>
            <p className="text-xs text-green-800 dark:text-green-200">
              Itens em Estoque
            </p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Calculator className="h-4 w-4 mr-1 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {totalSistema}
            </p>
            <p className="text-xs text-gray-800 dark:text-gray-200">
              Saldo Sistema
            </p>
          </div>

          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
            <div
              className={`flex items-center justify-center mb-2 ${getVarianceColor(
                consolidado
              )}`}
            >
              {getVarianceIcon(consolidado)}
            </div>
            <p
              className={`text-2xl font-bold ${getVarianceColor(consolidado)}`}
            >
              {consolidado > 0 ? "+" : ""}
              {consolidado}
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Diferença Final
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Fórmula de Cálculo:
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
            Loja ({totalLoja}) + Estoque ({totalEstoque}) - Sistema (
            {totalSistema}) = {consolidado > 0 ? "+" : ""}
            {consolidado}
          </p>
        </div>

        {(lojaItems.length > 0 || estoqueItems.length > 0) && (
          <div className="mt-4 flex justify-center">
            <Badge
              variant={
                consolidado === 0
                  ? "secondary"
                  : consolidado > 0
                  ? "default"
                  : "destructive"
              }
            >
              {consolidado === 0 && "✅ Conferência OK"}
              {consolidado > 0 && "📈 Sobra de Estoque"}
              {consolidado < 0 && "📉 Falta de Estoque"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
