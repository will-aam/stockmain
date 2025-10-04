"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function InventorySystem() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("scan");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUserId = sessionStorage.getItem("currentUserId");
    if (savedUserId) {
      setCurrentUserId(parseInt(savedUserId, 10));
    }
    setIsLoading(false);
  }, []);

  const inventory = useInventory({ userId: currentUserId });

  const handleUnlock = (userId: number) => {
    sessionStorage.setItem("currentUserId", userId.toString());
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
      <Navigation setShowClearDataModal={inventory.setShowClearDataModal} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scan">Conferência</TabsTrigger>
              <TabsTrigger value="import">Importar</TabsTrigger>
              <TabsTrigger value="export">Exportar</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
          </div>

          <div className="sm:hidden">
            <Select onValueChange={setActiveTab} value={activeTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma aba" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scan">Conferência</SelectItem>
                <SelectItem value="import">Importar</SelectItem>
                <SelectItem value="export">Exportar</SelectItem>
                <SelectItem value="history">Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              handleCsvUpload={inventory.handleCsvUpload}
              isLoading={inventory.isLoading}
              csvErrors={inventory.csvErrors}
              products={inventory.products}
              barCodes={inventory.barCodes}
              downloadTemplateCSV={inventory.downloadTemplateCSV}
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
    </>
  );
}
