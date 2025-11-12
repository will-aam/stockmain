// src/app/page.tsx
/**
 * Descrição: Página principal do Sistema de Inventário.
 * Responsabilidade: Gerenciar o estado principal da aplicação, incluindo a autenticação do usuário,
 * a navegação entre abas (Conferência, Importar, Exportar, Histórico) e orquestra os componentes
 * modais e a lógica de contagem de estoque.
 */

"use client";

// --- React Hooks ---
import { useState, useEffect, useRef } from "react";

// --- Componentes de UI ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Hooks Personalizados ---
import { useInventory } from "@/hooks/useInventory";

// --- Componentes de Lógica e Modais ---
import { AuthModal } from "@/components/shared/AuthModal";
import { ConferenceTab } from "@/components/inventory/ConferenceTab";
import { ImportTab } from "@/components/inventory/ImportTab";
import { ExportTab } from "@/components/inventory/ExportTab";
import { HistoryTab } from "@/components/inventory/HistoryTab";
import { ClearDataModal } from "@/components/shared/clear-data-modal";
import { Navigation } from "@/components/shared/navigation";
import { MissingItemsModal } from "@/components/shared/missing-items-modal";
import { SaveCountModal } from "@/components/shared/save-count-modal";
import { FloatingMissingItemsButton } from "@/components/shared/FloatingMissingItemsButton";

// --- Ícones ---
import {
  Loader2,
  Upload,
  Download,
  History as HistoryIcon,
  Scan,
} from "lucide-react";

// Força a renderização dinâmica no lado do cliente, evitando cache estático da página.
export const dynamic = "force-dynamic";

/**
 * Componente principal do Sistema de Inventário.
 * Controla o fluxo da aplicação, desde a autenticação até a interação com as funcionalidades de estoque.
 */
export default function InventorySystem() {
  // --- Estado Local do Componente ---
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // Armazena o ID do usuário autenticado.
  const [activeTab, setActiveTab] = useState("scan"); // Controla qual aba está ativa no momento.
  const [isLoading, setIsLoading] = useState(true); // Indica se a verificação inicial do usuário está em andamento.
  const mainContainerRef = useRef<HTMLDivElement>(null); // Ref para o container principal, usada para restrições de arrastar.

  // --- Efeitos Colaterais ---
  // Verifica se há um usuário salvo na sessão ao carregar o componente.
  useEffect(() => {
    const savedUserId = sessionStorage.getItem("currentUserId");
    if (savedUserId) {
      setCurrentUserId(parseInt(savedUserId, 10));
    }
    setIsLoading(false);
  }, []);

  // --- Hook Personalizado de Inventário ---
  // Centraliza toda a lógica e o estado relacionado ao inventário.
  const inventory = useInventory({ userId: currentUserId });

  // --- Manipuladores de Eventos ---
  // Called after successful authentication to set the user ID in state and session storage.
  const handleUnlock = (userId: number) => {
    sessionStorage.setItem("currentUserId", userId.toString());
    setCurrentUserId(userId);
  };

  // --- Renderização Condicional: Carregamento e Autenticação ---
  // Exibe um loader enquanto a verificação do usuário é concluída.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Exibe o modal de autenticação caso nenhum usuário esteja logado.
  if (!currentUserId) {
    return <AuthModal onUnlock={handleUnlock} />;
  }

  // --- Estrutura JSX Principal da Aplicação ---
  return (
    <>
      <div ref={mainContainerRef} className="relative min-h-screen">
        {/* Barra de navegação superior com ações globais. */}
        <Navigation setShowClearDataModal={inventory.setShowClearDataModal} />

        {/* Conteúdo principal da página, com padding ajustado para não ser coberto pela barra flutuante em mobile. */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-32 sm:pt-16 sm:pb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {/* Lista de abas para navegação em desktop. */}
            <div className="hidden sm:block">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scan" className="flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Conferência
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2"
                >
                  <HistoryIcon className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Conteúdo da aba de Conferência. */}
            <TabsContent value="scan" className="space-y-6">
              <ConferenceTab
                countingMode={inventory.countingMode}
                setCountingMode={inventory.setCountingMode}
                scanInput={inventory.scanInput}
                setScanInput={inventory.setScanInput}
                handleScan={inventory.handleScan}
                isCameraViewActive={inventory.isCameraViewActive}
                setIsCameraViewActive={inventory.setIsCameraViewActive}
                handleBarcodeScanned={inventory.handleBarcodeScanned}
                currentProduct={inventory.currentProduct}
                quantityInput={inventory.quantityInput}
                setQuantityInput={inventory.setQuantityInput}
                handleQuantityKeyPress={inventory.handleQuantityKeyPress}
                handleAddCount={inventory.handleAddCount}
                productCounts={inventory.productCounts}
                handleRemoveCount={inventory.handleRemoveCount}
                handleSaveCount={inventory.handleSaveCount}
              />
            </TabsContent>

            {/* Conteúdo da aba de Importação. */}
            <TabsContent value="import" className="space-y-6">
              <ImportTab
                userId={currentUserId}
                setIsLoading={inventory.setIsLoading}
                setCsvErrors={inventory.setCsvErrors}
                loadCatalogFromDb={inventory.loadCatalogFromDb}
                isLoading={inventory.isLoading}
                csvErrors={inventory.csvErrors}
                products={inventory.products}
                barCodes={inventory.barCodes}
                downloadTemplateCSV={inventory.downloadTemplateCSV}
              />
            </TabsContent>

            {/* Conteúdo da aba de Exportação. */}
            <TabsContent value="export" className="space-y-6">
              <ExportTab
                products={inventory.products}
                tempProducts={inventory.tempProducts}
                productCounts={inventory.productCounts}
                productCountsStats={inventory.productCountsStats}
                exportToCsv={inventory.exportToCsv}
                handleSaveCount={inventory.handleSaveCount}
                setShowMissingItemsModal={inventory.setShowMissingItemsModal}
              />
            </TabsContent>

            {/* Conteúdo da aba de Histórico. */}
            <TabsContent value="history" className="space-y-6">
              <HistoryTab userId={currentUserId} />
            </TabsContent>
          </Tabs>
        </main>

        {/* --- Modais Condicionais --- */}
        {/* Renderizados com base no estado gerenciado pelo hook `useInventory`. */}
        {inventory.showClearDataModal && (
          <ClearDataModal
            isOpen={inventory.showClearDataModal}
            onClose={() => inventory.setShowClearDataModal(false)}
            onConfirm={inventory.handleClearAllData}
          />
        )}

        {inventory.showMissingItemsModal && (
          <MissingItemsModal
            isOpen={inventory.showMissingItemsModal}
            onClose={() => inventory.setShowMissingItemsModal(false)}
            items={inventory.missingItems}
          />
        )}

        {inventory.showSaveModal && (
          <SaveCountModal
            isOpen={inventory.showSaveModal}
            onClose={() => inventory.setShowSaveModal(false)}
            onConfirm={inventory.executeSaveCount}
            isLoading={inventory.isSaving}
          />
        )}

        {/* Botão flutuante para acessar a lista de itens faltantes, visível apenas na aba de conferência. */}
        {activeTab === "scan" && (
          <FloatingMissingItemsButton
            itemCount={inventory.missingItems.length}
            onClick={() => inventory.setShowMissingItemsModal(true)}
            dragConstraintsRef={mainContainerRef}
          />
        )}
      </div>

      {/* --- Navegação por Abas (Mobile) --- */}
      {/* Barra de navegação inferior fixa, visível apenas em telas pequenas. */}
      <div className="sm:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-1.5 bg-background/60 backdrop-blur-xl rounded-full shadow-2xl border border-border/50">
          <button
            onClick={() => setActiveTab("scan")}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all duration-200 ${
              activeTab === "scan"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground"
            }`}
          >
            <Scan className="h-5 w-5" />
            <span className="text-xs font-medium">Conferir</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all duration-200 ${
              activeTab === "export"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground"
            }`}
          >
            <Download className="h-5 w-5" />
            <span className="text-xs font-medium">Exportar</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all duration-200 ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground"
            }`}
          >
            <HistoryIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Histórico</span>
          </button>
        </div>
      </div>
    </>
  );
}
