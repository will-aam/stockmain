"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventory } from "@/hooks/useInventory";
import { AuthModal } from "@/components/shared/AuthModal";
import { ConferenceTab } from "@/components/inventory/ConferenceTab";
import { ImportTab } from "@/components/inventory/ImportTab";
import { ExportTab } from "@/components/inventory/ExportTab";
import { HistoryTab } from "@/components/inventory/HistoryTab";
import { ClearDataModal } from "@/components/shared/clear-data-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default function InventorySystem() {
  // Trocamos isAuthenticated por currentUserId
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("scan");

  // O hook de inventário agora é condicional e receberá o ID do usuário
  // Por enquanto, apenas passamos um valor fixo, mas a estrutura está pronta
  const inventory = useInventory({ userId: currentUserId });

  const handleUnlock = (userId: number) => {
    setCurrentUserId(userId);
  };

  // Se não houver userId, mostra o modal de login
  if (!currentUserId) {
    return <AuthModal onUnlock={handleUnlock} />;
  }

  // Se houver, mostra a aplicação principal
  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
