// components/inventory/ParticipantView.tsx
/**
 * Descrição: Interface "Pro" para o Colaborador.
 * Responsabilidade: Replicar a experiência completa da ConferenceTab,
 * mas conectada ao sistema multiplayer e com visualização de Itens Faltantes.
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParticipantInventory } from "@/hooks/useParticipantInventory";
import { BarcodeScanner } from "@/components/features/barcode-scanner";

// --- Componentes Compartilhados (Novos) ---
import { MissingItemsModal } from "@/components/shared/missing-items-modal";
import { FloatingMissingItemsButton } from "@/components/shared/FloatingMissingItemsButton";

// --- UI ---
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// --- Ícones ---
import {
  Scan,
  Store,
  Package,
  Camera,
  Plus,
  Search,
  Calculator,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

interface ParticipantViewProps {
  sessionData: any;
  onLogout: () => void;
}

// Função auxiliar de cálculo
const calculateExpression = (
  expression: string
): { result: number; isValid: boolean; error?: string } => {
  try {
    const cleanExpression = expression.replace(/\s/g, "").replace(",", ".");
    if (!/^[0-9+\-*/().]+$/.test(cleanExpression))
      return { result: 0, isValid: false, error: "Caracteres inválidos" };
    const result = new Function("return " + cleanExpression)();
    if (typeof result !== "number" || isNaN(result) || !isFinite(result))
      return { result: 0, isValid: false, error: "Resultado inválido" };
    return { result: Math.round(result * 100) / 100, isValid: true };
  } catch (error) {
    return { result: 0, isValid: false, error: "Erro ao calcular" };
  }
};

export function ParticipantView({
  sessionData,
  onLogout,
}: ParticipantViewProps) {
  // --- Hook de Lógica Multiplayer ---
  const {
    products,
    queueSize,
    isSyncing,
    scanInput,
    setScanInput,
    quantityInput,
    setQuantityInput,
    currentProduct,
    handleScan,
    handleAddMovement,
    forceSync,
    missingItems, // <--- Agora temos acesso a isso!
  } = useParticipantInventory({ sessionData });

  // --- Estados Locais da UI ---
  const [countingMode, setCountingMode] = useState<"loja" | "estoque">("loja");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMissingModal, setShowMissingModal] = useState(false); // <--- Estado do Modal

  // Referências
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // <--- Ref para o botão flutuante

  // Foca na quantidade ao encontrar produto
  useEffect(() => {
    if (currentProduct && quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  }, [currentProduct]);

  // --- Handlers ---

  const handleCameraScan = (code: string) => {
    setIsCameraActive(false);
    setScanInput(code);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validValue = value.replace(/[^0-9+\-*/\s.]/g, "");
    setQuantityInput(validValue);
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitCount();
    }
  };

  const submitCount = () => {
    if (!currentProduct || !quantityInput) return;

    let finalQuantity: number;
    const hasOperators = /[+\-*/]/.test(quantityInput);

    if (hasOperators) {
      const calculation = calculateExpression(quantityInput);
      if (!calculation.isValid) {
        toast({
          title: "Erro",
          description: calculation.error,
          variant: "destructive",
        });
        return;
      }
      finalQuantity = calculation.result;
    } else {
      const parsed = parseFloat(quantityInput.replace(",", "."));
      if (isNaN(parsed)) return;
      finalQuantity = parsed;
    }

    handleAddMovement(finalQuantity);
  };

  const handleFinishSession = () => {
    toast({
      title: "Contagem Finalizada! 🎉",
      description: "Obrigado pelo seu trabalho. O Anfitrião foi notificado.",
      className: "bg-green-600 text-white border-none",
    });
    setTimeout(onLogout, 2000);
  };

  // --- Lista Filtrada ---
  const filteredProducts = useMemo(() => {
    let items = products.filter((p) => p.saldo_contado > 0 || searchQuery);

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.descricao.toLowerCase().includes(lowerQuery) ||
          (item.codigo_barras && item.codigo_barras.includes(lowerQuery)) ||
          item.codigo_produto.includes(lowerQuery)
      );
    }

    return items.sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [products, searchQuery]);

  // --- Renderização ---
  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-6 lg:grid lg:grid-cols-2 p-4 pb-24 max-w-7xl mx-auto min-h-screen"
    >
      {/* --- Cabeçalho Mobile --- */}
      <div className="lg:col-span-2 flex justify-between items-center mb-2">
        <div>
          <h2 className="font-bold text-lg">
            Olá, {sessionData.participant.nome} 👋
          </h2>
          <p className="text-xs text-muted-foreground">
            Sessão: {sessionData.session.nome}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={queueSize === 0 ? "outline" : "secondary"}
            className="gap-1"
          >
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : queueSize === 0 ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-amber-500" />
            )}
            {queueSize > 0 ? `${queueSize} Pendentes` : "Online"}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* --- Card 1: Scanner --- */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center mb-2">
            <Scan className="h-5 w-5 mr-2 text-primary" /> Scanner
          </CardTitle>
          <CardDescription>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button
                onClick={handleFinishSession}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar Minha Contagem
              </Button>

              <div className="flex w-full sm:w-auto gap-2 bg-muted p-1 rounded-md">
                <Button
                  variant={countingMode === "loja" ? "default" : "ghost"}
                  className="flex-1 sm:flex-none h-8"
                  onClick={() => setCountingMode("loja")}
                >
                  <Store className="h-3 w-3 mr-2" /> Loja
                </Button>
                <Button
                  variant={countingMode === "estoque" ? "default" : "ghost"}
                  className="flex-1 sm:flex-none h-8"
                  onClick={() => setCountingMode("estoque")}
                >
                  <Package className="h-3 w-3 mr-2" /> Estoque
                </Button>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCameraActive ? (
            <BarcodeScanner
              onScan={handleCameraScan}
              onClose={() => setIsCameraActive(false)}
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
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Digite ou escaneie..."
                    className="flex-1 mobile-optimized h-12 text-lg"
                    onKeyPress={(e) => e.key === "Enter" && handleScan()}
                    autoFocus
                  />
                  <Button onClick={handleScan} className="h-12 px-4">
                    <Scan className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => setIsCameraActive(true)}
                    variant="outline"
                    className="h-12 px-4"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {currentProduct && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">
                        Produto Encontrado
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium leading-tight">
                        {currentProduct.descricao}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Cód: {currentProduct.codigo_produto}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        Total Contado
                      </span>
                      <p className="text-2xl font-bold text-blue-600">
                        {currentProduct.saldo_contado}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quantity">
                    Quantidade em {countingMode === "loja" ? "Loja" : "Estoque"}
                  </Label>
                  <Calculator className="h-4 w-4 text-gray-500" />
                </div>

                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    ref={quantityInputRef}
                    type="text"
                    inputMode="text"
                    value={quantityInput}
                    onChange={handleQuantityChange}
                    onKeyPress={handleQuantityKeyPress}
                    placeholder="Qtd ou 5+5..."
                    className="flex-1 mobile-optimized font-mono text-lg h-12 font-bold text-center"
                  />
                  <Button
                    onClick={submitCount}
                    className="h-12 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    disabled={!currentProduct || !quantityInput}
                  >
                    <Plus className="h-5 w-5 mr-1" /> ADICIONAR
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Card 2: Lista de Itens --- */}
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg">
              Itens na Sessão ({filteredProducts.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar item contado..."
                className="pl-10 pr-4 h-10 bg-muted/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden min-h-[300px]">
          <div className="space-y-2 h-full overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Nenhum item encontrado</p>
                <p className="text-sm">Comece a bipar para preencher a lista</p>
              </div>
            ) : (
              filteredProducts.map((item) => (
                <div
                  key={item.codigo_produto}
                  className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-sm truncate leading-tight mb-1">
                      {item.descricao}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {item.codigo_barras || item.codigo_produto}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-sm h-8 px-3 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {item.saldo_contado}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- MODAIS E BOTÃO FLUTUANTE --- */}

      {/* Botão Flutuante (Só aparece se tiver itens faltantes) */}
      <FloatingMissingItemsButton
        itemCount={missingItems.length}
        onClick={() => setShowMissingModal(true)}
        dragConstraintsRef={containerRef}
      />

      {/* Modal de Itens Faltantes */}
      <MissingItemsModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        items={missingItems}
      />
    </div>
  );
}
