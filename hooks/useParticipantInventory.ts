// hooks/useParticipantInventory.ts
/**
 * Descrição: Hook especializado para o modo "Colaborador" (Multiplayer).
 * Responsabilidade:
 * 1. Gerenciar a fila local de movimentos (bipagens).
 * 2. Sincronizar periodicamente com o servidor (enviar fila e receber atualizações).
 * 3. Garantir que a UI seja rápida (Optimistic UI) mesmo com internet instável.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

// Tipos
interface ProductSessao {
  codigo_produto: string;
  codigo_barras: string | null;
  descricao: string;
  saldo_sistema: number; // O saldo que veio do ERP
  saldo_contado: number; // O total contado por TODOS (vindo do servidor)
}

interface MovimentoFila {
  id: string; // ID temporário (uuid ou timestamp)
  codigo_barras: string;
  quantidade: number;
  timestamp: number;
}

interface UseParticipantInventoryProps {
  sessionData: {
    session: { id: number; codigo: string };
    participant: { id: number; nome: string };
  } | null;
}

export const useParticipantInventory = ({
  sessionData,
}: UseParticipantInventoryProps) => {
  // --- Estado ---
  const [products, setProducts] = useState<ProductSessao[]>([]);
  const [queue, setQueue] = useState<MovimentoFila[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Estado UI
  const [scanInput, setScanInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [currentProduct, setCurrentProduct] = useState<ProductSessao | null>(
    null
  );

  // Referências para o loop de sync não ficar preso em closures antigas
  const queueRef = useRef(queue);
  const sessionRef = useRef(sessionData);

  // Atualiza as refs quando o estado muda
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    sessionRef.current = sessionData;
  }, [sessionData]);

  // --- 1. Carga Inicial (Baixar Produtos da Sessão) ---
  const loadSessionProducts = useCallback(async () => {
    if (!sessionData) return;

    try {
      const response = await fetch(
        `/api/session/${sessionData.session.id}/products`
      );
      if (!response.ok) throw new Error("Erro ao carregar produtos.");

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    }
  }, [sessionData]);

  useEffect(() => {
    loadSessionProducts();
  }, [loadSessionProducts]);

  // --- 2. Lógica de Escaneamento (Local) ---

  const handleScan = useCallback(() => {
    if (!scanInput) return;
    const code = scanInput.trim();

    // Tenta achar o produto na lista carregada
    const product = products.find(
      (p) => p.codigo_barras === code || p.codigo_produto === code
    );

    if (product) {
      setCurrentProduct(product);
      // Foca no campo de quantidade (se houver lógica de UI para isso)
    } else {
      // Produto não encontrado na sessão
      toast({
        title: "Item não encontrado",
        description: "Este item não consta na lista desta sessão.",
        variant: "destructive",
      });
      setCurrentProduct(null);
    }
  }, [scanInput, products]);

  const handleAddMovement = useCallback(
    (qtd: number) => {
      if (!currentProduct || !sessionData) return;

      // 1. Cria o movimento
      const movimento: MovimentoFila = {
        id: crypto.randomUUID(), // ID único para evitar duplicação no envio
        codigo_barras:
          currentProduct.codigo_barras || currentProduct.codigo_produto,
        quantidade: qtd,
        timestamp: Date.now(),
      };

      // 2. Adiciona na fila local (UI Otimista)
      setQueue((prev) => [...prev, movimento]);

      // 3. Atualiza o saldo localmente para feedback imediato
      setProducts((prev) =>
        prev.map((p) => {
          if (p.codigo_produto === currentProduct.codigo_produto) {
            return { ...p, saldo_contado: (p.saldo_contado || 0) + qtd };
          }
          return p;
        })
      );

      // 4. Feedback e Limpeza
      toast({
        title: "Registrado!",
        description: `${qtd > 0 ? "+" : ""}${qtd} unidade(s)`,
      });
      setScanInput("");
      setQuantityInput("");
      setCurrentProduct(null);
    },
    [currentProduct, sessionData]
  );

  // --- 3. O "Carteiro Silencioso" (Sync Loop) ---

  const syncData = useCallback(async () => {
    if (!sessionRef.current || isSyncing) return;

    const currentQueue = queueRef.current;
    const hasDataToSend = currentQueue.length > 0;

    // Se não tem nada pra enviar, fazemos um "ping" a cada 10s só pra atualizar saldos.
    // Se tem dados, enviamos imediatamente.

    setIsSyncing(true);
    try {
      const response = await fetch(
        `/api/session/${sessionRef.current.session.id}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: sessionRef.current.participant.id,
            movements: currentQueue, // Envia tudo o que está pendente
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // SUCESSO:
        // 1. Limpar da fila os itens que foram enviados com sucesso
        if (hasDataToSend) {
          setQueue((prev) =>
            prev.filter(
              (item) => !currentQueue.find((sent) => sent.id === item.id)
            )
          );
        }

        // 2. Atualizar os saldos com a verdade absoluta do servidor
        // (Isso corrige eventuais divergências se outro usuário bipou o mesmo item)
        if (data.updatedProducts) {
          setProducts((prev) =>
            prev.map((localProd) => {
              const serverProd = data.updatedProducts.find(
                (sp: any) => sp.codigo_produto === localProd.codigo_produto
              );
              return serverProd
                ? { ...localProd, saldo_contado: serverProd.saldo_contado }
                : localProd;
            })
          );
        }

        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error("Erro de sincronização:", error);
      // Não fazemos nada com a fila. Os itens continuam lá e serão tentados na próxima vez.
    } finally {
      setIsSyncing(false);
    }
  }, []); // Dependências vazias, usa refs

  // Loop de Sincronização
  useEffect(() => {
    const intervalId = setInterval(() => {
      syncData();
    }, 5000); // Tenta sincronizar a cada 5 segundos

    return () => clearInterval(intervalId);
  }, [syncData]);

  return {
    // Dados
    products,
    queueSize: queue.length,
    isSyncing,
    lastSyncTime,

    // UI State
    scanInput,
    setScanInput,
    quantityInput,
    setQuantityInput,
    currentProduct,

    // Ações
    handleScan,
    handleAddMovement,
    forceSync: syncData, // Botão manual de "Sincronizar Agora"
  };
};
