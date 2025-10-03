"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, History as HistoryIcon, FileText } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";

// Define que o componente vai receber a propriedade userId
interface HistoryTabProps {
  userId: number | null;
}

export function HistoryTab({ userId }: HistoryTabProps) {
  // Passa a userId recebida para o hook
  const { history, loadHistory } = useInventory({ userId });

  useEffect(() => {
    // Carrega o histórico apenas quando a userId estiver disponível
    if (userId) {
      loadHistory();
    }
  }, [userId, loadHistory]);

  const handleDownload = (fileName: string, csvContent: string) => {
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HistoryIcon className="mr-2" />
          Histórico de Contagens Salvas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{item.nome_arquivo}</p>
                    <p className="text-sm text-gray-500">
                      Salvo em: {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownload(item.nome_arquivo, item.conteudo_csv)
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Nenhuma contagem salva encontrada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
