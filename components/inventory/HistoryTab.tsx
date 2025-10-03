"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  History as HistoryIcon,
  FileText,
  Trash2, // Ícone da lixeira importado
} from "lucide-react";
import { useInventory } from "@/hooks/useInventory";

interface HistoryTabProps {
  userId: number | null;
}

export function HistoryTab({ userId }: HistoryTabProps) {
  // A prop handleDeleteHistoryItem é recebida do hook useInventory
  const { history, loadHistory, handleDeleteHistoryItem } = useInventory({
    userId,
  });

  useEffect(() => {
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
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2"
              >
                <div className="flex items-center flex-grow min-w-0">
                  <FileText className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p
                      className="font-medium truncate"
                      title={item.nome_arquivo}
                    >
                      {item.nome_arquivo}
                    </p>
                    <p className="text-sm text-gray-500">
                      Salvo em: {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(item.nome_arquivo, item.conteudo_csv)
                    }
                  >
                    <Download className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Baixar</span>
                  </Button>
                  {/* --- BOTÃO DE EXCLUIR ADICIONADO --- */}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteHistoryItem(item.id)}
                    aria-label="Excluir item do histórico"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
