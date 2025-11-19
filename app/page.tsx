// app/page.tsx
/**
 * Descrição: Página principal do Sistema de Inventário.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventory } from "@/hooks/useInventory";
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
import {
  Loader2,
  Upload,
  Download,
  History as HistoryIcon,
  Scan,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function InventorySystem() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("scan");
  const [isLoading, setIsLoading] = useState(true);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUserId = sessionStorage.getItem("currentUserId");
    const savedToken = sessionStorage.getItem("authToken");

    if (savedUserId && savedToken) {
      setCurrentUserId(parseInt(savedUserId, 10));
    } else {
      sessionStorage.removeItem("currentUserId");
      sessionStorage.removeItem("authToken");
    }
    setIsLoading(false);
  }, []);

  const inventory = useInventory({ userId: currentUserId });

  const handleUnlock = (userId: number, token: string) => {
    sessionStorage.setItem("currentUserId", userId.toString());
    sessionStorage.setItem("authToken", token);
    setCurrentUserId(userId);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUserId) {
    return <AuthModal onUnlock={handleUnlock} />;
  }

  return (
    <>
      <div ref={mainContainerRef} className="relative min-h-screen">
        {/* Passamos onNavigate para o Navigation controlar as abas via Menu de Perfil */}
        <Navigation
          setShowClearDataModal={inventory.setShowClearDataModal}
          onNavigate={setActiveTab}
        />

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-32 sm:pt-16 sm:pb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {/* --- Navegação Desktop (CORRIGIDO) --- */}
            {/* Aqui mantemos as 4 abas originais, incluindo Importar */}
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

            {/* Conteúdos das abas */}
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
                // AQUI ESTÁ A MÁGICA:
                onStartDemo={() => {
                  inventory.enableDemoMode(); // 1. Ativa a flag de demo
                  setActiveTab("scan"); // 2. Joga o usuário para a tela de scanner
                }}
              />
            </TabsContent>

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

            <TabsContent value="history" className="space-y-6">
              <HistoryTab userId={currentUserId} />
            </TabsContent>
          </Tabs>
        </main>

        {/* Modais */}
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

        {activeTab === "scan" && (
          <FloatingMissingItemsButton
            itemCount={inventory.missingItems.length}
            onClick={() => inventory.setShowMissingItemsModal(true)}
            dragConstraintsRef={mainContainerRef}
          />
        )}
      </div>

      {/* --- Navegação Mobile (Bottom Bar) --- */}
      {/* Mantém apenas 3 botões: Conferir, Exportar, Histórico. */}
      <div className="sm:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[320px]">
        <div className="flex items-center justify-between px-6 py-2 bg-background/80 backdrop-blur-xl rounded-full shadow-2xl border border-border/50 mx-4">
          <button
            onClick={() => setActiveTab("scan")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "scan"
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scan className={activeTab === "scan" ? "h-6 w-6" : "h-5 w-5"} />
            <span className="text-[10px] font-medium">Conferir</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "export"
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download
              className={activeTab === "export" ? "h-6 w-6" : "h-5 w-5"}
            />
            <span className="text-[10px] font-medium">Exportar</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "history"
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HistoryIcon
              className={activeTab === "history" ? "h-6 w-6" : "h-5 w-5"}
            />
            <span className="text-[10px] font-medium">Histórico</span>
          </button>
        </div>
      </div>
    </>
  );
}
