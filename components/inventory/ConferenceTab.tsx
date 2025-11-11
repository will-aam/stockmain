// src/components/inventory/ConferenceTab.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CloudUpload,
  Scan,
  Store,
  Package,
  Camera,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product, TempProduct, ProductCount } from "@/lib/types";
import { BarcodeScanner } from "@/components/features/barcode-scanner";
import { useMemo } from "react";

interface ConferenceTabProps {
  countingMode: "loja" | "estoque";
  setCountingMode: (mode: "loja" | "estoque") => void;
  scanInput: string;
  setScanInput: (value: string) => void;
  handleScan: () => void;
  isCameraViewActive: boolean;
  setIsCameraViewActive: (show: boolean) => void;
  handleBarcodeScanned: (barcode: string) => void;
  currentProduct: Product | TempProduct | null;
  quantityInput: string;
  setQuantityInput: (value: string) => void;
  handleQuantityKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAddCount: () => void;
  productCounts: ProductCount[];
  handleRemoveCount: (id: number) => void;
  handleSaveCount: () => void;
}

const ProductCountItem = ({
  item,
  onRemove,
}: {
  item: ProductCount;
  onRemove: (id: number) => void;
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="flex-1">
      <p className="font-medium text-sm">{item.descricao}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Cód. Barras: {item.codigo_de_barras}| Sistema: {item.saldo_estoque}
      </p>
      <div className="flex items-center space-x-2 mt-1">
        <Badge variant="outline" className="text-xs">
          Loja: {item.quant_loja}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Estoque: {item.quant_estoque}
        </Badge>
        <Badge
          variant={
            item.total === 0
              ? "secondary"
              : item.total > 0
              ? "default"
              : "destructive"
          }
          className="text-xs"
        >
          Total: {item.total > 0 ? "+" : ""}
          {item.total}
        </Badge>
      </div>
    </div>
    <Button variant="outline" size="sm" onClick={() => onRemove(item.id)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);
ProductCountItem.displayName = "ProductCountItem";

export const ConferenceTab: React.FC<ConferenceTabProps> = ({
  countingMode,
  setCountingMode,
  scanInput,
  setScanInput,
  handleScan,
  isCameraViewActive,
  setIsCameraViewActive,
  handleBarcodeScanned,
  currentProduct,
  quantityInput,
  setQuantityInput,
  handleQuantityKeyPress,
  handleAddCount,
  productCounts,
  handleRemoveCount,
  handleSaveCount,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProductCounts = useMemo(() => {
    const sortedCounts = [...productCounts].sort((a, b) =>
      a.descricao.localeCompare(b.descricao)
    );

    if (!searchQuery) {
      return sortedCounts;
    }
    return sortedCounts.filter(
      (item) =>
        item.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.codigo_de_barras.includes(searchQuery)
    );
  }, [productCounts, searchQuery]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center mb-4">
            <Scan className="h-5 w-5 mr-2" /> Scanner
          </CardTitle>
          <CardDescription>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleSaveCount}
                  variant="outline"
                  className="flex-grow sm:flex-grow-0"
                >
                  <CloudUpload className="mr-2 h-4 w-4" />
                  Salvar Contagem
                </Button>

                <div className="flex flex-1 space-x-2 min-w-[200px]">
                  <Button
                    variant={countingMode === "loja" ? "default" : "outline"}
                    className="w-1/2"
                    onClick={() => setCountingMode("loja")}
                  >
                    <Store className="h-4 w-4 mr-2" /> Loja
                  </Button>
                  <Button
                    variant={countingMode === "estoque" ? "default" : "outline"}
                    className="w-1/2"
                    onClick={() => setCountingMode("estoque")}
                  >
                    <Package className="h-4 w-4 mr-2" /> Estoque
                  </Button>
                </div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCameraViewActive ? (
            <BarcodeScanner
              onScan={handleBarcodeScanned}
              onClose={() => setIsCameraViewActive(false)}
            />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <div className="flex space-x-2">
                  <Input
                    id="barcode"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={scanInput}
                    onChange={(e) => {
                      // Filtra para aceitar apenas dígitos
                      const numericValue = e.target.value.replace(/\D/g, "");
                      setScanInput(numericValue);
                    }}
                    placeholder="Digite ou escaneie"
                    className="flex-1 mobile-optimized"
                    onKeyPress={(e) => e.key === "Enter" && handleScan()}
                  />
                  <Button onClick={handleScan}>
                    <Scan className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setIsCameraViewActive(true)}
                    variant="outline"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {currentProduct && (
                <div
                  className={`p-4 border rounded-lg ${
                    "isTemporary" in currentProduct &&
                    currentProduct.isTemporary
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          "isTemporary" in currentProduct &&
                          currentProduct.isTemporary
                            ? "text-amber-800 dark:text-amber-200"
                            : "text-green-800 dark:text-green-200"
                        }`}
                      >
                        {"isTemporary" in currentProduct &&
                        currentProduct.isTemporary
                          ? "Produto Temporário"
                          : "Produto Encontrado"}
                      </h3>
                      <p
                        className={`text-sm ${
                          "isTemporary" in currentProduct &&
                          currentProduct.isTemporary
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        {currentProduct.descricao}
                      </p>
                      <p
                        className={`text-xs ${
                          "isTemporary" in currentProduct &&
                          currentProduct.isTemporary
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        Cód. Barras: {scanInput}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Estoque: {currentProduct.saldo_estoque}
                    </Badge>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantidade{" "}
                  {countingMode === "loja" ? "em Loja" : "em Estoque"}
                </Label>
                <Input
                  id="quantity"
                  type="text" // Mantém "text" para aceitar expressões como "2+2"
                  inputMode="numeric" // Sugere teclado numérico, mas permite "+"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  onKeyPress={handleQuantityKeyPress}
                  placeholder="Qtd ou expressão (ex: 24+24)"
                  min="0"
                  className="mobile-optimized font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 bold">
                  Pressione Enter para calcular
                </p>
              </div>
              <Button
                onClick={handleAddCount}
                className="w-full mobile-button"
                disabled={!currentProduct || !quantityInput}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contagem de{" "}
                {countingMode === "loja" ? "Loja" : "Estoque"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg">
              Itens Contados ({productCounts.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por descrição ou código..."
                className="pl-10 pr-4 h-10 text-sm bg-background border-input shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProductCounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  {searchQuery
                    ? `Nenhum produto encontrado para "${searchQuery}"`
                    : "Nenhum produto contado ainda"}
                </p>
                <p className="text-sm">
                  {!searchQuery && "Escaneie um código de barras para começar"}
                </p>
              </div>
            ) : (
              filteredProductCounts.map((item) => (
                <ProductCountItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveCount}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
ConferenceTab.displayName = "ConferenceTab";
