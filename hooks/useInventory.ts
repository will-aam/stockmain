// hooks/useInventory.ts
/**
 * Descrição: Hook customizado para gerenciamento centralizado do inventário.
 * Responsabilidade: Orquestrar todo o estado e a lógica relacionada à contagem de estoque.
 * Isso inclui o carregamento do catálogo de produtos, a gestão de contagens (loja e estoque),
 * a importação/exportação de dados via CSV, o processamento de códigos de barras,
 * o cálculo de itens faltantes e a persistência dos dados no localStorage e no histórico.
 * Este hook é a principal fonte de verdade para os componentes da interface de inventário.
 */

"use client";

// --- React Hooks ---
import { useState, useEffect, useMemo, useCallback } from "react";

// --- Bibliotecas e Hooks Personalizados ---
import { toast } from "@/hooks/use-toast";
import * as Papa from "papaparse";
// --- IMPORTAÇÃO ADICIONADA ---
import { evaluate } from "mathjs"; // <--- 1. ADICIONE ESTE IMPORT

// --- Tipos ---
import type { Product, BarCode, ProductCount, TempProduct } from "@/lib/types";

// --- Constantes de Configuração ---
/** Tamanho mínimo que um código de barras deve ter para ser considerado válido, filtrando leituras parciais ou ruído. */
const MIN_BARCODE_LENGTH = 8;

// --- Funções Auxiliares ---
/**
 * Carrega as contagens do localStorage para um usuário específico.
 */
const loadCountsFromLocalStorage = (userId: number | null): ProductCount[] => {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(`productCounts-${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar contagens do localStorage:", error);
    return [];
  }
};

// --- Hook Principal ---
/**
 * Hook customizado que gerencia o estado e as operações do inventário.
 * @param userId - O ID do usuário logado, usado para personalizar e persistir os dados.
 * @returns Um objeto contendo o estado do inventário e funções para manipulá-lo.
 */
export const useInventory = ({ userId }: { userId: number | null }) => {
  // --- Estado do Componente ---
  const [products, setProducts] = useState<Product[]>([]);
  const [barCodes, setBarCodes] = useState<BarCode[]>([]);
  const [tempProducts, setTempProducts] = useState<TempProduct[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [currentProduct, setCurrentProduct] = useState<
    Product | TempProduct | null
  >(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countingMode, setCountingMode] = useState<"loja" | "estoque">("loja");
  const [productCounts, setProductCounts] = useState<ProductCount[]>([]);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isCameraViewActive, setIsCameraViewActive] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showMissingItemsModal, setShowMissingItemsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // NOVO ESTADO PARA O MODO DEMO
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- Lógica de Carregamento e Sincronização ---
  /**
   * Carrega o catálogo de produtos e códigos de barras do banco de dados para um usuário.
   */
  const loadCatalogFromDb = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/${userId}`);

      if (!response.ok) {
        // Nova validação de sessão
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão expirada. Token inválido.");
        }
        throw new Error("Falha ao carregar a lista de itens.");
      }

      const data = await response.json();
      setProducts(data.products || []);
      setBarCodes(data.barCodes || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar catálogo",
        description: error.message,
        variant: "destructive",
      });
      if (error.message.includes("Sessão") || error.message.includes("Token")) {
        sessionStorage.removeItem("currentUserId");
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // useEffect para carregar os dados iniciais (catálogo e contagens) quando o hook é montado ou o userId muda.
  useEffect(() => {
    loadCatalogFromDb();
    setProductCounts(loadCountsFromLocalStorage(userId));
  }, [userId, loadCatalogFromDb]);

  // useEffect para sincronizar as contagens com o localStorage sempre que o estado `productCounts` é atualizado.
  useEffect(() => {
    if (userId) {
      localStorage.setItem(
        `productCounts-${userId}`,
        JSON.stringify(productCounts)
      );
    }
  }, [productCounts, userId]);

  // --- Lógica de Cálculo e Processamento ---
  /**
   * Memoiza a lista de itens que NÃO FORAM CONTADOS.
   * A lógica foi corrigida para identificar produtos com quantidade contada igual a zero.
   */
  const missingItems = useMemo(() => {
    const productCountMap = new Map(
      productCounts.map((pc) => [pc.codigo_produto, pc])
    );

    return products
      .map((product) => {
        const countedItem = productCountMap.get(product.codigo_produto);
        const countedQuantity =
          Number(countedItem?.quant_loja ?? 0) +
          Number(countedItem?.quant_estoque ?? 0);

        // Um item é considerado "faltante" se NENHUMA unidade foi contada.
        if (countedQuantity > 0) {
          return null; // Se foi contado, não pertence a esta lista.
        }

        const barCode = barCodes.find((bc) => bc.produto_id === product.id);
        const saldoEstoque = Number(product.saldo_estoque) || 0;

        // Se não foi contado, a quantidade "faltante" a ser exibida é o saldo total do sistema.
        return {
          codigo_de_barras: barCode?.codigo_de_barras || "N/A",
          descricao: product.descricao,
          faltante: saldoEstoque,
        };
      })
      .filter(
        (
          item
        ): item is {
          codigo_de_barras: string;
          descricao: string;
          faltante: number;
        } => item !== null
      );
  }, [products, productCounts, barCodes]);

  /**
   * --- FUNÇÃO ATUALIZADA: Cálculo Seguro com MathJS ---
   * Avalia uma expressão matemática em formato de string de forma segura.
   * @param expression - A string da expressão matemática (ex: "10+5*2").
   * @returns Um objeto com o resultado, um booleano de validade e uma mensagem de erro, se houver.
   */
  const calculateExpression = useCallback(
    (
      expression: string
    ): { result: number; isValid: boolean; error?: string } => {
      try {
        // Substitui vírgula por ponto para o padrão internacional
        const cleanExpression = expression.replace(/,/g, ".");

        // O evaluate do mathjs resolve a conta com segurança (sem usar eval)
        const result = evaluate(cleanExpression);

        if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
          return {
            result: 0,
            isValid: false,
            error: "Resultado inválido",
          };
        }

        // Retorna arredondado para 2 casas decimais
        return { result: Math.round(result * 100) / 100, isValid: true };
      } catch (error) {
        return {
          result: 0,
          isValid: false,
          error: "Erro de sintaxe na expressão",
        };
      }
    },
    []
  );

  // --- Manipuladores de Eventos (Callbacks) ---
  /**
   * Adiciona ou atualiza a contagem de um produto.
   * (Esta função não chama API, apenas o localStorage, o que está correto)
   */
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

        existingItem.total =
          Number(existingItem.quant_loja) +
          Number(existingItem.quant_estoque) -
          Number(existingItem.saldo_estoque);

        updatedCounts[existingIndex] = existingItem;
        return updatedCounts;
      } else {
        const saldoAsNumber = Number(currentProduct.saldo_estoque);
        const newCount: ProductCount = {
          id: Date.now(),
          codigo_de_barras: scanInput,
          codigo_produto: currentProduct.codigo_produto,
          descricao: currentProduct.descricao,
          saldo_estoque: saldoAsNumber,
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
    calculateExpression,
    countingMode,
    scanInput,
  ]);

  /**
   * Limpa todos os dados do inventário (localStorage e servidor).
   */
  const handleClearAllData = useCallback(async () => {
    if (!userId) return;
    try {
      setProductCounts([]);
      localStorage.removeItem(`productCounts-${userId}`);

      // ALTERADO: Headers removidos
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

  /**
   * Remove um item específico da lista de contagens.
   * (Apenas local, não chama API, o que está correto)
   */
  const handleRemoveCount = useCallback((id: number) => {
    setProductCounts((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Item removido da contagem" });
  }, []);

  /**
   * NOVA FUNÇÃO: Ativa o modo demo
   */
  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    toast({
      title: "Modo Demo Ativado 🚀",
      description: "Escaneie qualquer Item real para testar.",
      className: "bg-blue-600 text-white border-none",
    });
  }, []);

  /**
   * Processa o código de barras escaneado ou digitado.
   * MODIFICADA PARA INCLUIR A LÓGICA DO MODO DEMO
   */
  const handleScan = useCallback(() => {
    const code = scanInput.trim();
    if (code === "" || code.length < MIN_BARCODE_LENGTH) {
      return;
    }

    // 1. Tenta encontrar o produto normalmente
    const barCode = barCodes.find((bc) => bc.codigo_de_barras === code);
    if (barCode?.produto) {
      setCurrentProduct(barCode.produto);
      return;
    }

    // 2. Verifica se já é um produto temporário
    const tempProduct = tempProducts.find((tp) => tp.codigo_de_barras === code);
    if (tempProduct) {
      setCurrentProduct(tempProduct);
      return;
    }

    // 3. LÓGICA MÁGICA DO MODO DEMO
    if (isDemoMode) {
      // Gera um saldo aleatório entre 10 e 100 para simular o sistema
      const randomStock = Math.floor(Math.random() * 90) + 10;

      // Cria um produto "fake" na memória
      const demoProduct: Product = {
        id: Date.now(), // ID provisório
        codigo_produto: `DEMO-${code.slice(-4)}`,
        descricao: `Item de Teste (Cód: ${code.slice(-4)})`,
        saldo_estoque: randomStock,
      };

      // Cria o vínculo do código de barras
      const demoBarCode: BarCode = {
        codigo_de_barras: code,
        produto_id: demoProduct.id,
        produto: demoProduct,
      };

      // Adiciona aos estados locais (sem salvar no banco)
      setProducts((prev) => [...prev, demoProduct]);
      setBarCodes((prev) => [...prev, demoBarCode]);
      setCurrentProduct(demoProduct);

      toast({
        title: "Produto Simulado Criado! ✨",
        description: `Sistema diz que tem ${randomStock} unidades. Quanto você conta?`,
        className: "bg-green-600 text-white border-none",
      });
      return;
    }

    // 4. Se não achou e não é demo, cria como temporário (fluxo original)
    const newTempProduct: TempProduct = {
      id: `TEMP-${code}`,
      codigo_de_barras: code,
      codigo_produto: `TEMP-${code}`,
      descricao: `Novo Item`,
      saldo_estoque: 0,
      isTemporary: true,
    };
    setTempProducts((prev) => [...prev, newTempProduct]);
    setCurrentProduct(newTempProduct);
    toast({
      title: "Item não cadastrado",
      description:
        "Digite a quantidade para adicionar este novo item à contagem.",
    });
  }, [scanInput, barCodes, tempProducts, isDemoMode]);

  /**
   * Manipula o resultado do escaneamento via câmera.
   */
  const handleBarcodeScanned = useCallback((barcode: string) => {
    setIsCameraViewActive(false);
    setScanInput(barcode);
    setTimeout(() => {
      const quantityEl = document.getElementById("quantity");
      if (quantityEl) {
        quantityEl.focus();
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (!scanInput) {
      setCurrentProduct(null);
      return;
    }

    if (scanInput.trim().length < MIN_BARCODE_LENGTH) {
      return;
    }

    handleScan();
  }, [scanInput, handleScan]);

  /**
   * Manipula o evento de tecla no campo de quantidade.
   */
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
        } else if (currentProduct) {
          handleAddCount();
          const barcodeEl = document.getElementById("barcode");
          if (barcodeEl) {
            barcodeEl.focus();
          }
        }
      }
    },
    [quantityInput, calculateExpression, currentProduct, handleAddCount]
  );

  /**
   * Gera e faz o download de um arquivo CSV template para importação de produtos.
   */
  const downloadTemplateCSV = useCallback(() => {
    const templateData = [
      {
        codigo_de_barras: "7891234567890",
        codigo_produto: "PROD001",
        descricao: "Item Exemplo 1",
        saldo_estoque: "100",
      },
      {
        codigo_de_barras: "7891234567891",
        codigo_produto: "PROD002",
        descricao: "Item Exemplo 2",
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
    link.download = "template_itens.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  /**
   * Memoiza as estatísticas das contagens (totais de loja e estoque).
   */
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

  /**
   * Carrega o histórico de contagens salvas do servidor.
   */
  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      // ALTERADO: Headers removidos
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

  /**
   * Exclui um item específico do histórico de contagens.
   */
  const handleDeleteHistoryItem = useCallback(
    async (historyId: number) => {
      if (!userId) return;

      try {
        // ALTERADO: Headers removidos
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

  /**
   * Gera os dados completos para o relatório, incluindo itens contados e não contados.
   */
  const generateCompleteReportData = useCallback(() => {
    const countedItemsData = productCounts.map((item) => ({
      codigo_de_barras: item.codigo_de_barras,
      codigo_produto: item.codigo_produto,
      descricao: item.descricao,
      saldo_estoque: item.saldo_estoque,
      quant_loja: item.quant_loja,
      quant_estoque: item.quant_estoque,
      total: item.total,
    }));

    const countedProductCodes = new Set(
      productCounts
        .filter((p) => !p.codigo_produto.startsWith("TEMP-"))
        .map((pc) => pc.codigo_produto)
    );

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
          total: -saldo,
        };
      });

    const combinedData = [...countedItemsData, ...uncountedItemsData];

    combinedData.sort((a, b) => a.descricao.localeCompare(b.descricao));

    return combinedData;
  }, [products, productCounts, barCodes]);

  /**
   * Exporta os dados completos da contagem para um arquivo CSV.
   */
  const exportToCsv = useCallback(() => {
    if (products.length === 0 && productCounts.length === 0) {
      toast({
        title: "Nenhum item para exportar",
        description: "Importe um catálogo ou conte um item primeiro.",
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
  }, [products, productCounts, generateCompleteReportData]);

  /**
   * Exibe o modal para salvar a contagem, após validar se há dados para salvar.
   */
  const handleSaveCount = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Erro de Usuário",
        description: "Sessão inválida. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    if (products.length === 0 && productCounts.length === 0) {
      toast({
        title: "Nada para salvar",
        description:
          "Não há catálogo carregado nem itens contados para salvar.",
        variant: "destructive",
      });
      return;
    }

    setShowSaveModal(true);
  }, [userId, products.length, productCounts.length]);

  /**
   * Executa o salvamento da contagem no servidor, incluindo a geração do nome do arquivo com data.
   */
  const executeSaveCount = useCallback(
    async (baseName: string) => {
      if (!userId) return;

      setIsSaving(true);
      try {
        const dataToExport = generateCompleteReportData();

        const csvContent = Papa.unparse(dataToExport, {
          header: true,
          delimiter: ";",
          quotes: true,
        });

        const date = new Date();
        const dateSuffix = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
        const fileName = `${baseName.trim()}_${dateSuffix}.csv`;

        // ALTERADO: Headers de autorização removidos, mantém apenas Content-Type
        const response = await fetch(`/api/inventory/${userId}/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileName, csvContent }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Falha ao salvar a contagem no servidor."
          );
        }

        toast({
          title: "Sucesso!",
          description: "Sua contagem foi salva no histórico.",
        });

        await loadHistory();
        setShowSaveModal(false);
      } catch (error: any) {
        toast({
          title: "Erro ao salvar",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [userId, generateCompleteReportData, loadHistory]
  );

  // --- Objeto de Retorno ---
  return {
    products,
    barCodes,
    tempProducts,
    scanInput,
    setScanInput,
    quantityInput,
    setQuantityInput,
    currentProduct,
    csvErrors,
    isLoading,
    isSaving,
    countingMode,
    setCountingMode,
    productCounts,
    showClearDataModal,
    setShowClearDataModal,
    isCameraViewActive,
    setIsCameraViewActive,
    productCountsStats,
    handleClearAllData,
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
    executeSaveCount,
    handleDeleteHistoryItem,
    showMissingItemsModal,
    setShowMissingItemsModal,
    missingItems,
    showSaveModal,
    setShowSaveModal,
    setCsvErrors,
    setIsLoading,
    loadCatalogFromDb,
    enableDemoMode,
    isDemoMode,
  };
};
