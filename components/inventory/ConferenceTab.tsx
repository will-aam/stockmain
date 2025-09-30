import type React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scan, Store, Package, Camera, Plus, Trash2 } from "lucide-react";
import type { Product, TempProduct, ProductCount, Location } from "@/lib/types";

// Props para o componente
interface ConferenceTabProps {
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  locations: Location[];
  countingMode: "loja" | "estoque";
  setCountingMode: (mode: "loja" | "estoque") => void;
  scanInput: string;
  setScanInput: (value: string) => void;
  handleScan: () => void;
  setShowBarcodeScanner: (show: boolean) => void;
  currentProduct: Product | TempProduct | null;
  quantityInput: string;
  setQuantityInput: (value: string) => void;
  handleQuantityKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAddCount: () => void;
  productCounts: ProductCount[];
  handleRemoveCount: (id: string) => void;
}

const ProductCountItem = ({
  item,
  onRemove,
}: {
  item: ProductCount;
  onRemove: (id: string) => void;
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="flex-1">
      <p className="font-medium text-sm">{item.descricao}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Código: {item.codigo_produto} | Sistema: {item.saldo_estoque}
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
  selectedLocation,
  setSelectedLocation,
  locations,
  countingMode,
  setCountingMode,
  scanInput,
  setScanInput,
  handleScan,
  setShowBarcodeScanner,
  currentProduct,
  quantityInput,
  setQuantityInput,
  handleQuantityKeyPress,
  handleAddCount,
  productCounts,
  handleRemoveCount,
}) => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scan className="h-5 w-5 mr-2" /> Scanner de Código de Barras
          </CardTitle>
          <CardDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4" />
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={countingMode === "loja" ? "default" : "outline"}
                  className="mobile-button"
                  onClick={() => setCountingMode("loja")}
                >
                  <Store className="h-3 w-3 mr-1" /> Loja
                </Button>
                <Button
                  variant={countingMode === "estoque" ? "default" : "outline"}
                  className="mobile-button"
                  onClick={() => setCountingMode("estoque")}
                >
                  <Package className="h-3 w-3 mr-1" /> Estoque
                </Button>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras</Label>
            <div className="flex space-x-2">
              <Input
                id="barcode"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Digite ou escaneie o código"
                className="flex-1 mobile-optimized"
                onKeyPress={(e) => e.key === "Enter" && handleScan()}
              />
              <Button onClick={handleScan}>
                <Scan className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowBarcodeScanner(true)}
                variant="outline"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {currentProduct && (
            <div
              className={`p-4 border rounded-lg ${
                "isTemporary" in currentProduct && currentProduct.isTemporary
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
                    Código: {currentProduct.codigo_produto}
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
              Quantidade {countingMode === "loja" ? "em Loja" : "em Estoque"}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                (Ex: 24+24 ou 10*3)
              </span>
            </Label>
            <Input
              id="quantity"
              type="text"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              onKeyPress={handleQuantityKeyPress}
              placeholder="Digite quantidade ou expressão (24+24)"
              min="0"
              className="mobile-optimized font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 bold">
              Pressione Enter para calcular expressões matemáticas
            </p>
          </div>
          <Button
            onClick={handleAddCount}
            className="w-full mobile-button"
            disabled={!currentProduct || !quantityInput}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Contagem de {countingMode === "loja" ? "Loja" : "Estoque"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Produtos Contados ({productCounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {productCounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum produto contado ainda</p>
                <p className="text-sm">
                  Escaneie um código de barras para começar
                </p>
              </div>
            ) : (
              productCounts.map((item) => (
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
