// components/inventory/ParticipantView.tsx
/**
 * Descrição: Interface principal para o Colaborador (Modo Multiplayer).
 * Responsabilidade:
 * 1. Permitir a contagem rápida de itens (Scanner + Manual).
 * 2. Exibir feedback imediato (UI Otimista) das ações.
 * 3. Mostrar status de sincronização (Fila pendente).
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useParticipantInventory } from "@/hooks/useParticipantInventory";
import { BarcodeScanner } from "@/components/features/barcode-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Camera,
} from "lucide-react";

interface ParticipantViewProps {
  sessionData: any;
  onLogout: () => void;
}

export function ParticipantView({
  sessionData,
  onLogout,
}: ParticipantViewProps) {
  const {
    products,
    queueSize,
    isSyncing,
    lastSyncTime,
    scanInput,
    setScanInput,
    quantityInput,
    setQuantityInput,
    currentProduct,
    handleScan,
    handleAddMovement,
    forceSync,
  } = useParticipantInventory({ sessionData });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Foca na quantidade quando um produto é encontrado
  useEffect(() => {
    if (currentProduct && quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  }, [currentProduct]);

  const handleCameraScan = (code: string) => {
    setIsCameraActive(false);
    setScanInput(code);
    // Pequeno timeout para garantir que o estado atualizou antes de processar
    setTimeout(() => {
      // Dispara a busca manualmente ou deixa o useEffect do hook reagir se você mudou a lógica lá.
      // Como o hook usa handleScan explicitamente, chamamos aqui se quisermos auto-processar:
      // Mas como scanInput é state, o ideal é que o usuário confirme ou que usemos um useEffect lá.
      // Para simplificar, apenas preenchemos e o usuário dá Enter ou clica em "Buscar".
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pb-24">
      {/* --- Cabeçalho Fixo --- */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg text-primary">Modo Colaborador</h1>
          <p className="text-xs text-muted-foreground">
            {sessionData.participant.nome} • {sessionData.session.nome}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="h-5 w-5 text-red-500" />
        </Button>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* --- Status de Sincronização --- */}
        <Card className="border-none shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              ) : queueSize === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {isSyncing
                  ? "Sincronizando..."
                  : queueSize === 0
                  ? "Tudo salvo"
                  : `${queueSize} pendentes`}
              </span>
            </div>
            {queueSize > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={forceSync}
                disabled={isSyncing}
              >
                Forçar Envio
              </Button>
            )}
          </CardContent>
        </Card>

        {/* --- Área de Scanner --- */}
        <Card className="overflow-hidden border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 p-4 pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-primary">
              <Scan className="mr-2 h-4 w-4" />
              Adicionar Item
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {isCameraActive ? (
              <BarcodeScanner
                onScan={handleCameraScan}
                onClose={() => setIsCameraActive(false)}
              />
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Código de barras..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleScan()}
                    className="text-lg h-12"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="h-12 w-12 shrink-0"
                    onClick={() => setIsCameraActive(true)}
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>

                {/* Botão Buscar (apenas se não tiver produto selecionado) */}
                {!currentProduct && scanInput && (
                  <Button className="w-full" onClick={handleScan}>
                    Buscar Produto
                  </Button>
                )}
              </>
            )}

            {/* --- Produto Encontrado --- */}
            {currentProduct && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-4 pt-2">
                <div className="p-3 bg-muted rounded-lg border">
                  <p className="font-bold text-lg leading-tight">
                    {currentProduct.descricao}
                  </p>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Cód: {currentProduct.codigo_produto}</span>
                    <span className="font-mono">
                      Total na Sessão:{" "}
                      <strong className="text-foreground">
                        {currentProduct.saldo_contado}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <p className="text-xs mb-1.5 font-medium ml-1">
                      Quantidade
                    </p>
                    <Input
                      ref={quantityInputRef}
                      type="number"
                      inputMode="numeric"
                      placeholder="1"
                      className="h-12 text-lg text-center font-bold"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const qtd = parseInt(quantityInput || "1", 10);
                          if (!isNaN(qtd)) handleAddMovement(qtd);
                        }
                      }}
                    />
                  </div>
                  <Button
                    className="h-12 px-6 font-bold text-lg shadow-lg shadow-primary/20"
                    onClick={() => {
                      const qtd = parseInt(quantityInput || "1", 10);
                      if (!isNaN(qtd)) handleAddMovement(qtd);
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Lista de Últimos Itens (Opcional, mas bom para feedback) --- */}
        <div className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            Sessão Ativa
          </h3>
          <div className="space-y-2">
            {products.filter((p) => p.saldo_contado > 0).length === 0 ? (
              <div className="text-center p-8 text-gray-400 text-sm">
                Nenhum item contado ainda.
              </div>
            ) : (
              products
                .filter((p) => p.saldo_contado > 0)
                .sort((a, b) => b.saldo_contado - a.saldo_contado) // Ordena pelos mais contados
                .slice(0, 5) // Mostra só os top 5 para não poluir
                .map((prod) => (
                  <div
                    key={prod.codigo_produto}
                    className="bg-card p-3 rounded-lg border shadow-sm flex justify-between items-center"
                  >
                    <span className="text-sm font-medium truncate max-w-[70%]">
                      {prod.descricao}
                    </span>
                    <Badge variant="secondary">x {prod.saldo_contado}</Badge>
                  </div>
                ))
            )}
            {products.filter((p) => p.saldo_contado > 0).length > 5 && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                ... e mais{" "}
                {products.filter((p) => p.saldo_contado > 0).length - 5} itens.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
