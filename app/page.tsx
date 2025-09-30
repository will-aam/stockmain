"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventory } from "@/hooks/useInventory";
import { AuthModal } from "@/components/shared/AuthModal";
import { ConferenceTab } from "@/components/inventory/ConferenceTab";
import { ImportTab } from "@/components/inventory/ImportTab";
import { ExportTab } from "@/components/inventory/ExportTab";
import { HistoryTab } from "@/components/inventory/HistoryTab";
import { BarcodeScanner } from "@/components/features/barcode-scanner";
import { ClearDataModal } from "@/components/shared/clear-data-modal";

export const dynamic = "force-dynamic";

export default function InventorySystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const inventory = useInventory();

  const handleUnlock = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthModal onUnlock={handleUnlock} />;
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mobile-tabs-list">
            <TabsTrigger value="scan">Conferência</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <ConferenceTab {...inventory} />
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
              selectedLocation={inventory.selectedLocation}
              locations={inventory.locations}
              setShowClearDataModal={inventory.setShowClearDataModal}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </main>

      {inventory.showBarcodeScanner && (
        <BarcodeScanner
          onScan={inventory.handleBarcodeScanned}
          onClose={() => inventory.setShowBarcodeScanner(false)}
          isActive={inventory.showBarcodeScanner}
        />
      )}

      {inventory.showClearDataModal && (
        <ClearDataModal
          onClose={() => inventory.setShowClearDataModal(false)}
          onConfirm={inventory.handleClearAllData}
          isOpen={inventory.showClearDataModal}
        />
      )}
    </>
  );
}
