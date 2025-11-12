// components/inventory/HistoryTab.tsx
/**
 * Descrição: Aba para visualizar o histórico de contagens de inventário.
 * Responsabilidade: Buscar, exibir, permitir o download e a exclusão de contagens salvas anteriormente.
 * Utiliza o hook `useInventory` para gerenciar o estado e as operações relacionadas ao histórico.
 */

"use client";

// --- React Hooks ---
import { useEffect } from "react";

// --- Componentes de UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Ícones ---
import {
  Download,
  History as HistoryIcon,
  FileText,
  Trash2,
} from "lucide-react";

// --- Hooks Personalizados ---
import { useInventory } from "@/hooks/useInventory";

/**
 * Props para o componente HistoryTab.
 */
interface HistoryTabProps {
  userId: number | null;
}

/**
 * Componente HistoryTab.
 * Exibe uma lista de contagens salvas, com opções para baixar o arquivo CSV ou excluí-lo do histórico.
 */
export function HistoryTab({ userId }: HistoryTabProps) {
  // Utiliza o hook personalizado para obter o histórico e as funções de manipulação.
  const { history, loadHistory, handleDeleteHistoryItem } = useInventory({
    userId,
  });

  // Carrega o histórico do usuário sempre que o componente for montado ou o `userId` mudar.
  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId, loadHistory]);

  /**
   * Função para realizar o download de um arquivo CSV no lado do cliente.
   * Cria um Blob com o conteúdo do CSV, adiciona uma BOM (Byte Order Mark) para compatibilidade com Excel,
   * gera um link temporário, simula um clique para iniciar o download e, em seguida, revoga o link para liberar memória.
   * @param fileName - O nome do arquivo que será baixado.
   * @param csvContent - O conteúdo do arquivo CSV em formato de string.
   */
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
        {/* Renderização condicional: exibe a lista se houver histórico, ou uma mensagem informativa. */}
        {history.length > 0 ? (
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2"
              >
                {/* Seção de informações do item. */}
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
                {/* Seção de botões de ação. */}
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

HistoryTab.displayName = "HistoryTab";
