"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import * as Papa from "papaparse";
import type { Product, BarCode, ProductCount, TempProduct } from "@/lib/types";

const loadCountsFromLocalStorage = (userId: number | null): ProductCount[] => {
  if (typeof window === "undefined" || !userId) {
    return [];
  }
  try {
    const savedCounts = localStorage.getItem(`productCounts-${userId}`);
    return savedCounts ? JSON.parse(savedCounts) : [];
  } catch (error) {
    console.error("Falha ao ler contagens do localStorage", error);
    return [];
  }
};

export const useInventory = ({ userId }: { userId: number | null }) => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [countingMode, setCountingMode] = useState<"loja" | "estoque">("loja");
  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isCameraViewActive, setIsCameraViewActive] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showMissingItemsModal, setShowMissingItemsModal] = useState(false);

  const loadCatalogFromDb = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/${userId}`);
      if (!response.ok)
        throw new Error("Falha ao carregar a lista de produtos.");
      const data = await response.json();
      setProducts(data.products || []);
      setBarCodes(data.barCodes || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar catálogo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCatalogFromDb();
    setProductCounts(loadCountsFromLocalStorage(userId));
  }, [userId, loadCatalogFromDb]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(
        `productCounts-${userId}`,
        JSON.stringify(productCounts)
      );
    }
  }, [productCounts, userId]);

  const missingItems = useMemo(() => {
    const countedProductCodes = new Set(
      productCounts.map((pc) => pc.codigo_produto)
    );
    return products
      .filter((p) => !countedProductCodes.has(p.codigo_produto))
      .map((product) => {
        const barCode = barCodes.find((bc) => bc.produto_id === product.id);
        return {
          codigo_de_barras: barCode?.codigo_de_barras || "N/A",
          descricao: product.descricao,
        };
      });
  }, [products, productCounts, barCodes]);

  const calculateExpression = useCallback(
    (
      expression: string
    ): { result: number; isValid: boolean; error?: string } => {
      try {
        const cleanExpression = expression.replace(/\s/g, "").replace(",", ".");
        if (!/^[0-9+\-*/().]+$/.test(cleanExpression))
          return {
            result: 0,
            isValid: false,
            error: "Caracteres inválidos na expressão",
          };
        const result = new Function("return " + cleanExpression)();
        if (typeof result !== "number" || isNaN(result) || !isFinite(result))
          return { result: 0, isValid: false, error: "Resultado inválido" };
        return { result: Math.round(result * 100) / 100, isValid: true };
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
    if (!currentProduct || !quantityInput) return;
    let finalQuantity: number;
    const hasOperators = /[+\-*/]/.test(quantityInput);
    if (hasOperators) {
      const calculation = calculateExpression(quantityInput);
      if (!calculation.isValid) {
        toast({
          title: "Erro no cálculo",
          description: calculation.error || "Expressão inválida",
          variant: "destructive",
        });
        return;
      }
      finalQuantity = calculation.result;
    } else {
      const parsed = Number.parseFloat(quantityInput.replace(",", "."));
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
    const quantidade = finalQuantity;
    setProductCounts((prevCounts) => {
      const existingIndex = prevCounts.findIndex(
        (item) => item.codigo_produto === currentProduct.codigo_produto
      );
      if (existingIndex >= 0) {
        const updatedCounts = [...prevCounts];
        const existingItem = { ...updatedCounts[existingIndex] };
        if (countingMode === "loja") existingItem.quant_loja += quantidade;
        else existingItem.quant_estoque += quantidade;

        // --- CORREÇÃO APLICADA AQUI ---
        // Forçamos a conversão de todos os valores para Número antes de calcular
        existingItem.total =
          Number(existingItem.quant_loja) +
          Number(existingItem.quant_estoque) -
          Number(existingItem.saldo_estoque);

        updatedCounts[existingIndex] = existingItem;
        return updatedCounts;
      } else {
        // --- E AQUI TAMBÉM, PARA GARANTIR ---
        const saldoAsNumber = Number(currentProduct.saldo_estoque);
        const newCount: ProductCount = {
          id: Date.now(),
          codigo_de_barras: scanInput,
          codigo_produto: currentProduct.codigo_produto,
          descricao: currentProduct.descricao,
          saldo_estoque: saldoAsNumber, // Garante que seja salvo como número
          quant_loja: countingMode === "loja" ? quantidade : 0,
          quant_estoque: countingMode === "estoque" ? quantidade : 0,
          total:
            (countingMode === "loja" ? quantidade : 0) +
            (countingMode === "estoque" ? quantidade : 0) -
            saldoAsNumber,
          local_estoque: "",
          data_hora: new Date().toISOString(),
        };
        return [...prevCounts, newCount];
      }
    });
    toast({ title: "Contagem adicionada!" });
    setScanInput("");
    setQuantityInput("");
    setCurrentProduct(null);
  }, [
    currentProduct,
    quantityInput,
    countingMode,
    scanInput,
    calculateExpression,
  ]);

  const handleClearAllData = useCallback(async () => {
    if (!userId) return;
    try {
      setProductCounts([]);
      localStorage.removeItem(`productCounts-${userId}`);

      const response = await fetch(`/api/inventory/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao limpar dados do servidor.");

      setProducts([]);
      setBarCodes([]);
      setTempProducts([]);
      setShowClearDataModal(false);
      toast({
        title: "Sucesso!",
        description: "Todos os dados foram removidos.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao limpar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId]);

  const handleRemoveCount = useCallback((id: number) => {
    setProductCounts((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Item removido da contagem" });
  }, []);

  const processCsvFile = useCallback(
    async (file: File) => {
      if (!userId) {
        toast({
          title: "Erro",
          description: "Sessão de usuário não encontrada.",
          variant: "destructive",
        });
        return;
      }
      setIsLoading(true);
      setCsvErrors([]);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch(`/api/inventory/${userId}/import`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Falha ao importar o arquivo CSV.");
        toast({
          title: "Sucesso!",
          description: `${data.importedCount} produtos foram importados.`,
        });
        await loadCatalogFromDb();
      } catch (error: any) {
        setCsvErrors([error.message]);
        toast({
          title: "Erro na importação",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [userId, loadCatalogFromDb]
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
    if (scanInput.trim() === "") return;
    const barCode = barCodes.find((bc) => bc.codigo_de_barras === scanInput);
    if (barCode?.produto) {
      setCurrentProduct(barCode.produto);
      return;
    }
    const tempProduct = tempProducts.find(
      (tp) => tp.codigo_de_barras === scanInput
    );
    if (tempProduct) {
      setCurrentProduct(tempProduct);
      return;
    }
    const newTempProduct: TempProduct = {
      id: `TEMP-${scanInput}`,
      codigo_de_barras: scanInput,
      codigo_produto: `TEMP-${scanInput}`,
      descricao: `Novo Produto (Cód: ${scanInput})`,
      saldo_estoque: 0,
      isTemporary: true,
    };
    setCurrentProduct(newTempProduct);
    toast({
      title: "Produto não cadastrado",
      description:
        "Digite a quantidade para adicionar este novo item à contagem.",
    });
  }, [scanInput, barCodes, tempProducts]);

  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      setIsCameraViewActive(false);
      setScanInput(barcode);
      setTimeout(() => handleScan(), 100);
    },
    [handleScan]
  );

  const handleQuantityKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const expression = quantityInput.trim();
        if (!expression) return;
        if (/[+\-*/]/.test(expression)) {
          const calculation = calculateExpression(expression);
          if (calculation.isValid)
            setQuantityInput(calculation.result.toString());
          else
            toast({
              title: "Erro no cálculo",
              description: calculation.error,
              variant: "destructive",
            });
        } else if (currentProduct) handleAddCount();
      }
    },
    [quantityInput, calculateExpression, currentProduct, handleAddCount]
  );

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
  }, []);

  const productCountsStats = useMemo(() => {
    const totalLoja = productCounts.reduce(
      (sum, item) => sum + item.quant_loja,
      0
    );
    const totalEstoque = productCounts.reduce(
      (sum, item) => sum + item.quant_estoque,
      0
    );
    return { totalLoja, totalEstoque };
  }, [productCounts]);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/inventory/${userId}/history`);
      if (!response.ok) {
        throw new Error("Falha ao carregar o histórico.");
      }
      const data = await response.json();
      setHistory(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId]);

  const handleDeleteHistoryItem = useCallback(
    async (historyId: number) => {
      if (!userId) return;

      try {
        const response = await fetch(
          `/api/inventory/${userId}/history/${historyId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Falha ao excluir o item do histórico.");
        }

        setHistory((prevHistory) =>
          prevHistory.filter((item) => item.id !== historyId)
        );

        toast({
          title: "Sucesso!",
          description: "O item foi removido do histórico.",
        });
      } catch (error: any) {
        toast({
          title: "Erro ao excluir",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [userId]
  );

  // --- NOVA FUNÇÃO CENTRALIZADA PARA GERAR O RELATÓRIO COMPLETO ---
  const generateCompleteReportData = useCallback(() => {
    // Pega os itens que já foram contados
    const countedItemsData = productCounts.map((item) => ({
      codigo_de_barras: item.codigo_de_barras,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      saldo_estoque: item.saldo_estoque,
      quant_loja: item.quant_loja,
      quant_estoque: item.quant_estoque,
      total: item.total,
    }));

    // Cria um mapa para saber quais produtos já foram contados
    const countedProductCodes = new Set(
      productCounts.map((pc) => pc.codigo_produto)
    );

    // Pega os itens do catálogo que NÃO foram contados e os formata com quantidades zeradas
    const uncountedItemsData = products
      .filter((p) => !countedProductCodes.has(p.codigo_produto))
      .map((product) => {
        const barCode = barCodes.find((bc) => bc.produto_id === product.id);
        const saldo = Number(product.saldo_estoque);
        return {
          codigo_de_barras: barCode?.codigo_de_barras || "N/A",
          codigo_produto: product.codigo_produto,
          descricao: product.descricao,
          saldo_estoque: saldo,
          quant_loja: 0,
          quant_estoque: 0,
          total: -saldo, // O total para itens não contados é o saldo negativo
        };
      });

    // Combina as duas listas: os contados e os não contados (zerados)
    return [...countedItemsData, ...uncountedItemsData];
  }, [products, productCounts, barCodes]);

  // --- FUNÇÕES DE EXPORTAR E SALVAR ATUALIZADAS ---
  const exportToCsv = useCallback(() => {
    if (products.length === 0) {
      toast({
        title: "Nenhum item para exportar",
        description: "Importe um catálogo primeiro.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = generateCompleteReportData();

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
    link.download = `contagem_completa_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [products, generateCompleteReportData]);

  const handleSaveCount = useCallback(async () => {
    if (!userId || products.length === 0) {
      toast({
        title: "Nada para salvar",
        description: "Não há um catálogo de produtos carregado.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = generateCompleteReportData();

    const csvContent = Papa.unparse(dataToExport, {
      header: true,
      delimiter: ";",
      quotes: true,
    });

    const fileName = `contagem_${new Date().toISOString().split("T")[0]}.csv`;

    try {
      const response = await fetch(`/api/inventory/${userId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, csvContent }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar a contagem no servidor.");
      }

      toast({
        title: "Sucesso!",
        description: "Sua contagem foi salva no histórico.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId, products, generateCompleteReportData]);

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
    countingMode,
    setCountingMode,
    productCounts,
    showClearDataModal,
    setShowClearDataModal,
    isCameraViewActive,
    setIsCameraViewActive,
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
    history,
    loadHistory,
    handleSaveCount,
    handleDeleteHistoryItem,
    showMissingItemsModal,
    setShowMissingItemsModal,
    missingItems,
  };
};
