"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import Papa, { type ParseResult } from "papaparse";
import type {
  Product,
  BarCode,
  ProductCount,
  InventoryHistory,
  CsvRow,
  TempProduct,
  Location,
} from "@/lib/types";

export const useInventory = () => {
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
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const locations: Location[] = useMemo(
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
        error: (error: Error) => {
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

  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setCsvFile(file);
        processCsvFile(file);
      }
    },
    [processCsvFile]
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
    toast({
      title: "Produto não encontrado",
      description: `O código "${scanInput}" não está na sua base de dados.`,
      variant: "destructive",
    });
    setCurrentProduct(null);
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
        toast({
          title: "Produto não encontrado",
          description: `O código "${barcode}" não está na sua base de dados.`,
          variant: "destructive",
        });
        setCurrentProduct(null);
      }, 100);
    },
    [barCodes, tempProducts]
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

  // <<< INÍCIO DA ALTERAÇÃO >>>
  const exportToCsv = useCallback(() => {
    if (products.length === 0) {
      toast({
        title: "Nenhum item importado para exportar",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = products.map((product) => {
      const barCode = barCodes.find((bc) => bc.produto_id === product.id);
      const countedItem = productCounts.find(
        (pc) => pc.codigo_produto === product.codigo_produto
      );

      if (countedItem) {
        // Se o item foi contado, usa os dados da contagem
        return {
          codigo_de_barras: countedItem.codigo_de_barras,
          codigo_produto: countedItem.codigo_produto,
          descricao: countedItem.descricao,
          saldo_estoque: countedItem.saldo_estoque,
          quant_loja: countedItem.quant_loja,
          quant_estoque: countedItem.quant_estoque,
          total: countedItem.total,
        };
      } else {
        // Se o item não foi contado, zera as quantidades e calcula a diferença
        return {
          codigo_de_barras: barCode?.codigo_de_barras || "N/A",
          codigo_produto: product.codigo_produto,
          descricao: product.descricao,
          saldo_estoque: product.saldo_estoque,
          quant_loja: 0,
          quant_estoque: 0,
          total: -product.saldo_estoque,
        };
      }
    });

    const csv = Papa.unparse(dataToExport, {
      header: true,
      delimiter: ";",
      quotes: true,
    });
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contagem_${selectedLocation}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: "CSV exportado com sucesso!" });
  }, [products, barCodes, productCounts, selectedLocation]);
  // <<< FIM DA ALTERAÇÃO >>>

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
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_produtos.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: "Template CSV baixado com sucesso!" });
  }, []);

  return {
    products,
    barCodes,
    tempProducts,
    scanInput,
    setScanInput,
    quantityInput,
    setQuantityInput,
    currentProduct,
    csvFile,
    csvErrors,
    isLoading,
    selectedLocation,
    setSelectedLocation,
    inventoryHistory,
    countingMode,
    setCountingMode,
    productCounts,
    showClearDataModal,
    setShowClearDataModal,
    showBarcodeScanner,
    setShowBarcodeScanner,
    locations,
    productCountsStats,
    handleClearAllData,
    handleCsvUpload,
    processCsvFile,
    handleScan,
    handleBarcodeScanned,
    handleAddCount,
    handleQuantityKeyPress,
    handleRemoveCount,
    exportToCsv,
    downloadTemplateCSV,
  };
};
