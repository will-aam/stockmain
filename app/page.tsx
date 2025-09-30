"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [activeTab, setActiveTab] = useState("scan");
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Tabs para telas maiores (escondido em mobile) */}
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scan">Conferência</TabsTrigger>
              <TabsTrigger value="import">Importar</TabsTrigger>
              <TabsTrigger value="export">Exportar</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
          </div>

          {/* Select para telas menores (mobile) */}
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

          {/* Conteúdo das abas */}
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
