"use client";

import type React from "react";

// 1. A importação de 'lazy' e 'Suspense' foi removida
import { useState, useEffect, useMemo, useCallback } from "react";

// Importações de componentes da UI (inalteradas)
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Scan,
  Download,
  History,
  Plus,
  Trash2,
  FileSpreadsheet,
  Store,
  AlertCircle,
  Package,
  Crown,
  Camera,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Papa, { type ParseResult } from "papaparse";

// 2. Modais importados diretamente (sem lazy loading)
import { QuickRegisterModal } from "@/components/modules/inventory-count/quick-register-modal";
import { ClearDataModal } from "@/components/shared/clear-data-modal";
import { BarcodeScanner } from "@/components/modules/inventory-count/barcode-scanner";
import { PremiumUpgradeModal } from "@/components/modules/premium/premium-upgrade-modal";

// Interfaces (inalteradas)
interface Product {
  id: number;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
}
interface BarCode {
  codigo_de_barras: string;
  produto_id: number;
  produto?: Product;
}
interface ProductCount {
  id: string;
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
  quant_loja: number;
  quant_estoque: number;
  total: number;
  local_estoque: string;
  data_hora: string;
}
interface InventoryHistory {
  id: number;
  data_contagem: string;
  usuario_email: string;
  total_itens: number;
  local_estoque: string;
  status: string;
}
interface CsvRow {
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: string;
}
interface TempProduct {
  id: string;
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
  isTemporary: true;
}

// Componentes Memoizados (inalterados)
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

const ProductTableRow = ({
  product,
  barCode,
}: {
  product: Product;
  barCode?: BarCode;
}) => (
  <TableRow>
    <TableCell className="font-medium">{product.codigo_produto}</TableCell>
    <TableCell>{product.descricao}</TableCell>
    <TableCell>
      <Badge variant="outline">{product.saldo_estoque}</Badge>
    </TableCell>
    <TableCell className="font-mono text-sm">
      {barCode?.codigo_de_barras || "-"}
    </TableCell>
  </TableRow>
);
ProductTableRow.displayName = "ProductTableRow";

export default function InventorySystem() {
  // Hooks de estado (inalterados)
  const [products, setProducts] = useState<Product[]>([]);
  const [barCodes, setBarCodes] = useState<BarCode[]>([]);
  const [tempProducts, setTempProducts] = useState<TempProduct[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [currentProduct, setCurrentProduct] = useState<
    Product | TempProduct | null
  >(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("loja-1");
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>(
    []
  );
  const [countingMode, setCountingMode] = useState<"loja" | "estoque">("loja");
  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalFeature, setPremiumModalFeature] = useState<string>("");
  const [quickRegisterData, setQuickRegisterData] = useState({
    codigo_de_barras: "",
    descricao: "",
    quantidade: "",
  });

  // Memos e Callbacks (inalterados)
  const locations = useMemo(
    () => [
      { value: "loja-1", label: "Loja 1" },
      { value: "loja-2", label: "Loja 2" },
      { value: "deposito", label: "Depósito" },
      { value: "estoque-central", label: "Estoque Central" },
    ],
    []
  );

  const productCountsStats = useMemo(() => {
    const totalLoja = productCounts.reduce(
      (sum, item) => sum + item.quant_loja,
      0
    );
    const totalEstoque = productCounts.reduce(
      (sum, item) => sum + item.quant_estoque,
      0
    );
    const totalSistema = productCounts.reduce(
      (sum, item) => sum + item.saldo_estoque,
      0
    );
    const consolidado = totalLoja + totalEstoque - totalSistema;
    return { totalLoja, totalEstoque, totalSistema, consolidado };
  }, [productCounts]);

  useEffect(() => {
    const loadData = async () => {
      const savedData = localStorage.getItem("inventory-system-data");
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setProducts(data.products || []);
          setBarCodes(data.barCodes || []);
        } catch (error) {
          console.error("Erro ao carregar dados do localStorage:", error);
        }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const dataToSave = {
        products,
        barCodes,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("inventory-system-data", JSON.stringify(dataToSave));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [products, barCodes]);

  const handleClearAllData = useCallback(() => {
    localStorage.removeItem("inventory-system-data");
    setProducts([]);
    setBarCodes([]);
    setTempProducts([]);
    setProductCounts([]);
    setScanInput("");
    setQuantityInput("");
    setCurrentProduct(null);
    setCsvFile(null);
    setCsvErrors([]);
    setShowClearDataModal(false);
    toast({
      title: "Dados apagados",
      description: "Todos os dados foram removidos com sucesso",
      variant: "destructive",
    });
  }, []);

  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setCsvFile(file);
        processCsvFile(file);
      }
    },
    []
  );

  const processCsvFile = useCallback(
    (file: File) => {
      setIsLoading(true);
      Papa.parse<CsvRow>(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        worker: true,
        complete: (results: ParseResult<CsvRow>) => {
          const errors: string[] = [];
          const newProducts: Product[] = [];
          const newBarCodes: BarCode[] = [];
          const existingBarCodes = new Set(
            barCodes.map((bc) => bc.codigo_de_barras)
          );
          results.data.forEach((row: CsvRow, index: number) => {
            const {
              codigo_de_barras,
              codigo_produto,
              descricao,
              saldo_estoque,
            } = row;
            if (
              !codigo_de_barras ||
              !codigo_produto ||
              !descricao ||
              saldo_estoque === undefined
            ) {
              errors.push(`Linha ${index + 2}: Dados incompletos`);
              return;
            }
            if (existingBarCodes.has(codigo_de_barras)) {
              errors.push(
                `Linha ${
                  index + 2
                }: Código de barras ${codigo_de_barras} duplicado`
              );
              return;
            }
            const saldoNumerico = Number.parseInt(saldo_estoque);
            if (isNaN(saldoNumerico)) {
              errors.push(
                `Linha ${index + 2}: Saldo de estoque deve ser um número`
              );
              return;
            }
            const product = {
              id: Date.now() + index,
              codigo_produto,
              descricao,
              saldo_estoque: saldoNumerico,
            };
            newProducts.push(product);
            newBarCodes.push({
              codigo_de_barras,
              produto_id: product.id,
              produto: product,
            });
            existingBarCodes.add(codigo_de_barras);
          });
          setCsvErrors(errors);
          if (errors.length === 0 && newProducts.length > 0) {
            setProducts((prev) => [...prev, ...newProducts]);
            setBarCodes((prev) => [...prev, ...newBarCodes]);
            toast({
              title: `${newProducts.length} produtos importados com sucesso!`,
            });
          }
          setIsLoading(false);
        },
        error: (error) => {
          toast({
            title: "Erro",
            description: "Falha ao processar arquivo CSV",
            variant: "destructive",
          });
          setIsLoading(false);
        },
      });
    },
    [barCodes]
  );

  const handleScan = useCallback(() => {
    const barCode = barCodes.find((bc) => bc.codigo_de_barras === scanInput);
    if (barCode && barCode.produto) {
      setCurrentProduct(barCode.produto);
      toast({
        title: "Produto encontrado!",
        description: `${barCode.produto.descricao} - Estoque: ${barCode.produto.saldo_estoque}`,
      });
      return;
    }
    const tempProduct = tempProducts.find(
      (tp) => tp.codigo_de_barras === scanInput
    );
    if (tempProduct) {
      setCurrentProduct(tempProduct);
      toast({
        title: "Produto temporário encontrado!",
        description: `${tempProduct.descricao} - Cadastro rápido`,
      });
      return;
    }
    setQuickRegisterData({
      codigo_de_barras: scanInput,
      descricao: "",
      quantidade: "",
    });
    setShowQuickRegister(true);
  }, [scanInput, barCodes, tempProducts]);

  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      setScanInput(barcode);
      setShowBarcodeScanner(false);
      setTimeout(() => {
        const barCode = barCodes.find((bc) => bc.codigo_de_barras === barcode);
        if (barCode && barCode.produto) {
          setCurrentProduct(barCode.produto);
          toast({
            title: "Produto encontrado!",
            description: `${barCode.produto.descricao} - Estoque: ${barCode.produto.saldo_estoque}`,
          });
          return;
        }
        const tempProduct = tempProducts.find(
          (tp) => tp.codigo_de_barras === barcode
        );
        if (tempProduct) {
          setCurrentProduct(tempProduct);
          toast({
            title: "Produto temporário encontrado!",
            description: `${tempProduct.descricao} - Cadastro rápido`,
          });
          return;
        }
        setQuickRegisterData({
          codigo_de_barras: barcode,
          descricao: "",
          quantidade: "",
        });
        setShowQuickRegister(true);
      }, 100);
    },
    [barCodes, tempProducts]
  );

  const handleQuickRegister = useCallback(
    (data: {
      codigo_de_barras: string;
      descricao: string;
      quantidade: string;
    }) => {
      const newTempProduct: TempProduct = {
        id: `temp-${Date.now()}`,
        codigo_de_barras: data.codigo_de_barras,
        codigo_produto: `TEMP-${Date.now()}`,
        descricao: data.descricao,
        saldo_estoque: 0,
        isTemporary: true,
      };
      setTempProducts((prev) => [...prev, newTempProduct]);
      setCurrentProduct(newTempProduct);
      setQuantityInput(data.quantidade);
      setShowQuickRegister(false);
      toast({
        title: "Produto temporário cadastrado!",
        description: "Este produto não será salvo permanentemente",
      });
    },
    []
  );

  const calculateTotal = useCallback(
    (quantLoja: number, quantEstoque: number, saldoEstoque: number) => {
      return quantLoja + quantEstoque - saldoEstoque;
    },
    []
  );

  const calculateExpression = useCallback(
    (
      expression: string
    ): { result: number; isValid: boolean; error?: string } => {
      try {
        const cleanExpression = expression.replace(/\s/g, "");
        const validPattern = /^[0-9+\-*/().]+$/;
        if (!validPattern.test(cleanExpression)) {
          return {
            result: 0,
            isValid: false,
            error: "Caracteres inválidos na expressão",
          };
        }
        const consecutiveOperators = /[+\-*/]{2,}/;
        if (consecutiveOperators.test(cleanExpression)) {
          return {
            result: 0,
            isValid: false,
            error: "Operadores consecutivos não permitidos",
          };
        }
        const startsWithOperator = /^[+*/]/;
        const endsWithOperator = /[+\-*/]$/;
        if (
          startsWithOperator.test(cleanExpression) ||
          endsWithOperator.test(cleanExpression)
        ) {
          return {
            result: 0,
            isValid: false,
            error: "Expressão não pode começar ou terminar com operador",
          };
        }
        const result = new Function("return " + cleanExpression)();
        if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
          return { result: 0, isValid: false, error: "Resultado inválido" };
        }
        const roundedResult = Math.round(result * 100) / 100;
        return { result: roundedResult, isValid: true };
      } catch (error) {
        return {
          result: 0,
          isValid: false,
          error: "Erro ao calcular expressão",
        };
      }
    },
    []
  );

  const handleAddCount = useCallback(() => {
    if (!currentProduct || !quantityInput) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe a quantidade",
        variant: "destructive",
      });
      return;
    }
    let finalQuantity: number;
    const hasOperators = /[+\-*/]/.test(quantityInput);
    if (hasOperators) {
      const calculation = calculateExpression(quantityInput);
      if (!calculation.isValid) {
        toast({
          title: "Erro no cálculo",
          description: calculation.error || "Expressão matemática inválida",
          variant: "destructive",
        });
        return;
      }
      finalQuantity = calculation.result;
    } else {
      const parsed = Number.parseFloat(quantityInput);
      if (isNaN(parsed) || parsed < 0) {
        toast({
          title: "Erro",
          description: "Quantidade deve ser um número válido",
          variant: "destructive",
        });
        return;
      }
      finalQuantity = parsed;
    }
    const quantidade = Math.round(finalQuantity);
    const existingIndex = productCounts.findIndex(
      (item) => item.codigo_de_barras === scanInput
    );
    if (existingIndex >= 0) {
      const updatedCounts = [...productCounts];
      const existing = updatedCounts[existingIndex];
      if (countingMode === "loja") {
        existing.quant_loja += quantidade;
      } else {
        existing.quant_estoque += quantidade;
      }
      existing.total = calculateTotal(
        existing.quant_loja,
        existing.quant_estoque,
        existing.saldo_estoque
      );
      existing.data_hora = new Date().toLocaleString("pt-BR");
      setProductCounts(updatedCounts);
      const expressionText = hasOperators
        ? ` (${quantityInput} = ${quantidade})`
        : "";
      toast({
        title: `Quantidade somada!`,
        description: `${quantidade} adicionado ao ${countingMode}${expressionText}. Total ${countingMode}: ${
          countingMode === "loja" ? existing.quant_loja : existing.quant_estoque
        }`,
      });
    } else {
      const newCount: ProductCount = {
        id: Date.now().toString(),
        codigo_de_barras: scanInput,
        codigo_produto: currentProduct.codigo_produto,
        descricao: currentProduct.descricao,
        saldo_estoque: currentProduct.saldo_estoque,
        quant_loja: countingMode === "loja" ? quantidade : 0,
        quant_estoque: countingMode === "estoque" ? quantidade : 0,
        total: calculateTotal(
          countingMode === "loja" ? quantidade : 0,
          countingMode === "estoque" ? quantidade : 0,
          currentProduct.saldo_estoque
        ),
        local_estoque: selectedLocation,
        data_hora: new Date().toLocaleString("pt-BR"),
      };
      setProductCounts((prev) => [...prev, newCount]);
      const expressionText = hasOperators
        ? ` (${quantityInput} = ${quantidade})`
        : "";
      toast({
        title: `Quantidade de ${countingMode} adicionada!${expressionText}`,
      });
    }
    setScanInput("");
    setQuantityInput("");
    setCurrentProduct(null);
  }, [
    currentProduct,
    quantityInput,
    productCounts,
    scanInput,
    countingMode,
    selectedLocation,
    calculateTotal,
    calculateExpression,
  ]);

  const handleQuantityKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const expression = quantityInput.trim();
        if (!expression) return;
        const hasOperators = /[+\-*/]/.test(expression);
        if (hasOperators) {
          const calculation = calculateExpression(expression);
          if (calculation.isValid) {
            setQuantityInput(calculation.result.toString());
            toast({
              title: "Cálculo realizado!",
              description: `${expression} = ${calculation.result}`,
            });
          } else {
            toast({
              title: "Erro no cálculo",
              description: calculation.error || "Expressão matemática inválida",
              variant: "destructive",
            });
          }
        } else {
          if (currentProduct) {
            handleAddCount();
          }
        }
      }
    },
    [quantityInput, calculateExpression, currentProduct, handleAddCount]
  );

  const handleRemoveCount = useCallback((id: string) => {
    setProductCounts((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Item removido da contagem" });
  }, []);

  const exportToCsv = useCallback(() => {
    if (productCounts.length === 0) {
      toast({ title: "Nenhum item para exportar", variant: "destructive" });
      return;
    }
    const dataToExport = productCounts.map((item) => ({
      codigo_de_barras: item.codigo_de_barras,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      saldo_estoque: item.saldo_estoque,
      quant_loja: item.quant_loja,
      quant_estoque: item.quant_estoque,
      total: item.total,
    }));
    const csv = Papa.unparse(dataToExport, {
      header: true,
      delimiter: ";",
      quotes: true,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contagem_${selectedLocation}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: "CSV exportado com sucesso!" });
  }, [productCounts, selectedLocation]);

  const downloadTemplateCSV = useCallback(() => {
    const templateData = [
      {
        codigo_de_barras: "7891234567890",
        codigo_produto: "PROD001",
        descricao: "Produto Exemplo 1",
        saldo_estoque: "100",
      },
      {
        codigo_de_barras: "7891234567891",
        codigo_produto: "PROD002",
        descricao: "Produto Exemplo 2",
        saldo_estoque: "50",
      },
      {
        codigo_de_barras: "7891234567892",
        codigo_produto: "PROD003",
        descricao: "Produto Exemplo 3",
        saldo_estoque: "75",
      },
    ];
    const csv = Papa.unparse(templateData, {
      header: true,
      delimiter: ";",
      quotes: true,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_produtos.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: "Template CSV baixado com sucesso!" });
  }, []);

  const handlePremiumUpgrade = useCallback((feature: string) => {
    setPremiumModalFeature(feature);
    setShowPremiumModal(true);
  }, []);

  return (
    <div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan">Conferência</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="h-5 w-5 mr-2" />
                    Scanner de Código de Barras
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
                              <SelectItem
                                key={location.value}
                                value={location.value}
                              >
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={
                            countingMode === "loja" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCountingMode("loja")}
                        >
                          <Store className="h-3 w-3 mr-1" />
                          Loja
                        </Button>
                        <Button
                          variant={
                            countingMode === "estoque" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCountingMode("estoque")}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Estoque
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
                      Quantidade{" "}
                      {countingMode === "loja" ? "em Loja" : "em Estoque"}
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
                    className="w-full"
                    disabled={!currentProduct || !quantityInput}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Contagem de{" "}
                    {countingMode === "loja" ? "Loja" : "Estoque"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Produtos Contados ({productCounts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {productCounts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">
                          Nenhum produto contado ainda
                        </p>
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
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Importar Produtos
                </CardTitle>
                <CardDescription>
                  Faça upload de um arquivo CSV com formato:
                  codigo_de_barras;codigo_produto;descricao;saldo_estoque
                </CardDescription>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Instruções para o arquivo CSV
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>
                      • <strong>Separador:</strong> Use ponto e vírgula (;)
                      entre as colunas
                    </li>
                    <li>
                      • <strong>Código de barras:</strong> Formate a coluna como
                      NÚMERO (não texto)
                    </li>
                    <li>
                      • <strong>Saldo estoque:</strong> Use apenas números
                      inteiros
                    </li>
                    <li>
                      • <strong>Codificação:</strong> Salve o arquivo em UTF-8
                    </li>
                    <li>
                      • <strong>Cabeçalho:</strong> Primeira linha deve conter
                      os nomes das colunas
                    </li>
                  </ul>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      <strong>Exemplo:</strong>{" "}
                      codigo_de_barras;codigo_produto;descricao;saldo_estoque
                      <br />
                      7891234567890;PROD001;Produto Exemplo;100
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplateCSV}
                      className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30 bg-transparent"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Arquivo CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={isLoading}
                  />
                  {isLoading && <Skeleton className="h-4 w-full" />}
                </div>

                {csvErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Erros encontrados:</p>
                        {csvErrors.map((error, index) => (
                          <p key={index} className="text-sm">
                            {error}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      Produtos cadastrados
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {products.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {products.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Código de Barras</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => {
                          const barCode = barCodes.find(
                            (bc) => bc.produto_id === product.id
                          );
                          return (
                            <ProductTableRow
                              key={product.id}
                              product={product}
                              barCode={barCode}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum produto cadastrado</p>
                    <p className="text-sm">
                      Importe um arquivo CSV para começar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Recurso Premium</strong>
                    <p className="text-sm mt-1">
                      A exportação de contagens está disponível apenas para
                      assinantes premium. Faça upgrade para exportar seus dados
                      em CSV e PDF.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30 bg-transparent"
                    onClick={() => handlePremiumUpgrade("export")}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

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
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {products.length} permanentes + {tempProducts.length}{" "}
                      temporários
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {productCounts.length}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Produtos Contados
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {productCountsStats.totalLoja +
                        productCountsStats.totalEstoque}{" "}
                      unidades totais
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {Math.max(
                        0,
                        products.length +
                          tempProducts.length -
                          productCounts.length
                      )}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Itens Faltantes
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {productCounts.length === 0
                        ? "Nenhuma contagem iniciada"
                        : `${Math.round(
                            (productCounts.length /
                              (products.length + tempProducts.length)) *
                              100
                          )}% concluído`}
                    </p>
                  </div>
                </div>

                {products.length + tempProducts.length > 0 && (
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
                              (products.length + tempProducts.length)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {products.length + tempProducts.length > 0 &&
                  productCounts.length === 0 && (
                    <Alert className="mt-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <strong>Contagem não iniciada</strong>
                        <p className="text-sm mt-1">
                          Você tem {products.length + tempProducts.length}{" "}
                          produtos importados. Vá para a aba "Conferência" para
                          começar a contagem.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                {products.length + tempProducts.length > 0 &&
                  productCounts.length > 0 &&
                  productCounts.length <
                    products.length + tempProducts.length && (
                    <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>Contagem em andamento</strong>
                        <p className="text-sm mt-1">
                          Ainda restam{" "}
                          {products.length +
                            tempProducts.length -
                            productCounts.length}{" "}
                          produtos para contar. Continue na aba "Conferência"
                          para completar a contagem.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                {products.length + tempProducts.length > 0 &&
                  productCounts.length >=
                    products.length + tempProducts.length && (
                    <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Contagem completa!</strong>
                        <p className="text-sm mt-1">
                          Todos os produtos foram contados. Você pode exportar
                          os dados ou continuar adicionando mais contagens.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Exportar Contagem
                </CardTitle>
                <CardDescription>
                  Exporte os dados da contagem atual em CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    onClick={exportToCsv}
                    disabled={productCounts.length === 0}
                    className="h-12"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium">
                      Local:{" "}
                      {
                        locations.find((l) => l.value === selectedLocation)
                          ?.label
                      }
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date().toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {productCounts.length}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Produtos Contados
                    </p>
                  </div>
                </div>

                {productCounts.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Sistema</TableHead>
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
                            <TableCell>{item.saldo_estoque}</TableCell>
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
                    <p className="font-medium">
                      Nenhuma contagem para exportar
                    </p>
                    <p className="text-sm">
                      Realize contagens na aba "Conferência" primeiro
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Recurso Premium</strong>
                    <p className="text-sm mt-1">
                      Este recurso está disponível apenas para assinantes
                      premium. Faça upgrade para acessar o histórico completo de
                      contagens.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30 bg-transparent"
                    onClick={() => handlePremiumUpgrade("history")}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Histórico de Contagens
                </CardTitle>
                <CardDescription>
                  Visualize o histórico de contagens anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Histórico não disponível</p>
                  <p className="text-sm">
                    Faça upgrade para premium para acessar este recurso
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modais renderizados condicionalmente */}
      {showQuickRegister && (
        <QuickRegisterModal
          isOpen={showQuickRegister}
          onClose={() => setShowQuickRegister(false)}
          onSave={handleQuickRegister}
          initialData={quickRegisterData}
        />
      )}
      {showClearDataModal && (
        <ClearDataModal
          isOpen={showClearDataModal}
          onClose={() => setShowClearDataModal(false)}
          onConfirm={handleClearAllData}
        />
      )}
      {showBarcodeScanner && (
        <BarcodeScanner
          isActive={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onScan={handleBarcodeScanned}
        />
      )}
      {showPremiumModal && (
        <PremiumUpgradeModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          feature={premiumModalFeature}
        />
      )}
    </div>
  );
}
