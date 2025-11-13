// components/inventory/ImportTab.tsx
/**
 * Descrição: Aba para importação de produtos via arquivo CSV com progresso real.
 * Responsabilidade: Fornecer a interface para o upload de arquivos CSV, exibir instruções detalhadas,
 * mostrar o progresso de importação em tempo real via Server-Sent Events (SSE),
 * exibir erros de validação e listar os produtos que foram importados com sucesso.
 * Inclui funcionalidades para baixar um template e para visualizar os dados em uma tabela responsiva.
 */

"use client";

import type React from "react";
import { useState } from "react";

// --- Componentes de UI ---
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- Ícones ---
import { Upload, Download, AlertCircle, Info } from "lucide-react";

// --- Tipos ---
import type { Product, BarCode } from "@/lib/types";

// --- Interfaces e Tipos ---
/**
 * Props para o componente ImportTab.
 */
interface ImportTabProps {
  // Props necessárias para a lógica de upload com progresso (SSE)
  userId: number | null;
  setIsLoading: (loading: boolean) => void;
  setCsvErrors: (errors: string[]) => void;
  loadCatalogFromDb: () => Promise<void>;

  // Props de estado para exibição na UI
  isLoading: boolean;
  csvErrors: string[];
  products: Product[];
  barCodes: BarCode[];
  downloadTemplateCSV: () => void;
}

// --- Subcomponentes ---
/**
 * Props para o subcomponente ProductTableRow.
 */
interface ProductTableRowProps {
  product: Product;
  barCode?: BarCode;
}

/**
 * Subcomponente que renderiza uma única linha na tabela de produtos.
 * @param product - O objeto Product a ser exibido.
 * @param barCode - O objeto BarCode associado ao produto (opcional).
 */
const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  barCode,
}) => (
  <TableRow>
    <TableCell className="font-medium">{product.codigo_produto}</TableCell>
    <TableCell>{product.descricao}</TableCell>
    <TableCell>
      <Badge variant="outline">{product.saldo_estoque}</Badge>
    </TableCell>
    <TableCell className="font-mono text-sm hidden sm:table-cell">
      {barCode?.codigo_de_barras || "-"}
    </TableCell>
  </TableRow>
);
ProductTableRow.displayName = "ProductTableRow";

/**
 * Props para o subcomponente CsvInstructions.
 */
interface CsvInstructionsProps {
  downloadTemplateCSV: () => void;
}

/**
 * Subcomponente que exibe as instruções para formatar o arquivo CSV.
 * @param downloadTemplateCSV - Função para baixar o arquivo template.
 */
const CsvInstructions: React.FC<CsvInstructionsProps> = ({
  downloadTemplateCSV,
}) => (
  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
    <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-3">
      Instruções
    </h3>
    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
      <li>
        • <strong>Separador:</strong> Use ponto e vírgula (;) entre as colunas
      </li>
      <li>
        • <strong>Código de barras:</strong> Formate a coluna como NÚMERO
      </li>
      <li>
        • <strong>Saldo estoque:</strong> Use apenas números inteiros
      </li>
      <li>
        • <strong>Codificação:</strong> Salve o arquivo em UTF-8
      </li>
      <li>
        • <strong>Cabeçalho:</strong> Primeira linha deve conter os nomes das
        colunas
      </li>
    </ul>
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-blue-600 dark:text-blue-400">
        <div className="relative bg-gray-950 text-gray-100 rounded-md p-3 font-mono text-xs border border-gray-800 mt-3">
          <button
            onClick={() => {
              const textoVisual =
                "codigo_de_barras;codigo_produto;descricao;saldo_estoque";
              navigator.clipboard.writeText(textoVisual).then(() => {
                const btn = document.getElementById("copy-btn");
                if (btn) {
                  btn.textContent = "Copiado!";
                  setTimeout(() => (btn.textContent = "Copiar"), 2000);
                }
              });
            }}
            id="copy-btn"
            className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2 py-1 rounded transition-all"
          >
            Copiar
          </button>
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {`codigo_de_barras;codigo_produto;descricao;saldo_estoque`}
          </pre>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={downloadTemplateCSV}
        className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30 bg-transparent"
      >
        <Download className="h-3 w-3 mr-1" />
        Baixar Template
      </Button>
    </div>
  </div>
);
CsvInstructions.displayName = "CsvInstructions";

// --- Componente Principal ---
/**
 * Componente ImportTab.
 * Orquestra a interface de importação com progresso real.
 */
export const ImportTab: React.FC<ImportTabProps> = ({
  // Props para a lógica de upload com progresso (SSE)
  userId,
  setIsLoading,
  setCsvErrors,
  loadCatalogFromDb,
  // Props de estado para exibição na UI
  isLoading,
  csvErrors,
  products,
  barCodes,
  downloadTemplateCSV,
}) => {
  // --- Estado Local para o Progresso da Importação ---
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    imported: number;
    errors: number;
  }>({
    current: 0,
    total: 0,
    imported: 0,
    errors: 0,
  });

  const [isImporting, setIsImporting] = useState(false);

  /**
   * Função para lidar com o upload do arquivo usando a stream de resposta do Fetch.
   * @param e - Evento de mudança do input de arquivo.
   */
  const handleCsvUploadWithProgress = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Verificar se o token de autenticação existe
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setCsvErrors(["Erro de autenticação. Faça login novamente."]);
      setIsImporting(false);
      setIsLoading(false);
      return;
    }

    setIsImporting(true);
    setCsvErrors([]);
    setImportProgress({
      current: 0,
      total: 0,
      imported: 0,
      errors: 0,
    });
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/inventory/${userId}/import`, {
        method: "POST",
        body: formData,
        headers: {
          // ADICIONADO: Header de autorização com o token
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Tenta ler o erro do corpo da resposta, se houver
        const errorData = await response.json().catch(() => ({
          error: "Falha na requisição de upload.",
        }));
        throw new Error(errorData.error || "Falha ao enviar o arquivo.");
      }

      if (!response.body) {
        throw new Error(
          "A resposta da requisição não contém um corpo (stream)."
        );
      }

      // Processar a stream de Server-Sent Events (SSE) vinda do POST
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          // O stream terminou.
          break;
        }

        buffer += value;
        const lines = buffer.split("\n");

        // Mantém a última linha no buffer, pois pode estar incompleta
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Processa apenas linhas que são eventos de dados SSE
          if (line.startsWith("data: ")) {
            const dataString = line.substring(6);
            const data = JSON.parse(dataString);

            if (data.error) {
              let errorMessage = data.error;
              if (
                data.details &&
                Array.isArray(data.details) &&
                data.details.length > 0
              ) {
                const detailsString = data.details
                  .map(
                    (d: { codigo_de_barras: string; linhas: number[] }) =>
                      `Código: ${d.codigo_de_barras} (Linhas: ${d.linhas.join(
                        ", "
                      )})`
                  )
                  .join("; ");
                errorMessage = `${data.error} Detalhes: ${detailsString}`;
              }
              setCsvErrors([errorMessage]);
              setIsImporting(false);
              setIsLoading(false);
              reader.releaseLock(); // Libera o leitor
              return; // Para a execução
            }

            if (data.type === "start") {
              setImportProgress({
                current: 0,
                total: data.total,
                imported: 0,
                errors: 0,
              });
            } else if (data.type === "progress") {
              // Usa uma atualização funcional para evitar estado obsoleto (stale state)
              setImportProgress((prev) => ({
                ...prev,
                current: data.current,
                total: data.total,
                imported: data.imported,
                errors: data.errors,
              }));
            } else if (data.type === "complete") {
              console.log(
                `Importação concluída! ${data.importedCount} itens importados.`
              );
              setIsImporting(false);
              setIsLoading(false);
              await loadCatalogFromDb(); // Espera o recarregamento dos dados
              reader.releaseLock();
              return; // Importação bem-sucedida, sai do loop
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Erro no handleCsvUploadWithProgress:", error);
      setCsvErrors([error.message || "Ocorreu um erro durante a importação."]);
      setIsImporting(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Card principal para o upload de arquivos e instruções. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Produtos
          </CardTitle>
          <CardDescription>Faça upload de um arquivo CSV</CardDescription>

          {/* Seção de instruções: exibida diretamente em desktop ou dentro de um Dialog em mobile. */}
          <div className="hidden sm:block mt-4">
            <CsvInstructions downloadTemplateCSV={downloadTemplateCSV} />
          </div>

          <div className="sm:hidden mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Info className="h-4 w-4 mr-2" />
                  Ver Instruções para o CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] rounded-lg">
                <DialogHeader>
                  <DialogTitle>Instruções para o arquivo CSV</DialogTitle>
                </DialogHeader>
                <div className="-mx-4 px-4">
                  <CsvInstructions downloadTemplateCSV={downloadTemplateCSV} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de input para o upload do arquivo CSV. */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleCsvUploadWithProgress}
              disabled={isLoading || isImporting}
              // Adiciona uma key para forçar o reset do input
              key={isImporting ? "importing" : "idle"}
            />
            {/* Renderizar a barra de progresso se existir e o upload estiver ativo. */}
            {isImporting && importProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importando...</span>
                  <span>{`${importProgress.current} / ${importProgress.total}`}</span>
                </div>
                <Progress
                  value={(importProgress.current / importProgress.total) * 100}
                  className="w-full"
                />
              </div>
            )}
            {/* Skeleton exibido durante o processamento inicial (antes do 'start' ou se o total for 0) */}
            {isImporting && importProgress.total === 0 && (
              <Skeleton className="h-4 w-full" />
            )}

            {/* Skeleton antigo (removido para evitar confusão com o de cima) */}
            {/* {isLoading && !isImporting && <Skeleton className="h-4 w-full" />} */}
          </div>

          {/* Seção de alerta para exibir erros de validação do CSV. */}
          {!isImporting && csvErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Erros encontrados:</p>
                  {csvErrors.map((error, index) => (
                    <p key={index} className="text-sm">
                      {error}
                    </p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo da quantidade de produtos cadastrados com sucesso. */}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                Produtos cadastrados
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {products.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renderização condicional: exibe a tabela de produtos ou uma mensagem de estado vazio. */}
      {products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabela responsiva com a lista de produtos importados. */}
            <div className="max-h-96 overflow-y-auto">
              <Table className="responsive-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Código de Barras
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    // Encontra o código de barras correspondente para exibir na tabela.
                    const barCode = barCodes.find(
                      (bc) => bc.produto_id === product.id
                    );
                    return (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        barCode={barCode}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Mostra o estado vazio apenas se não estiver importando
        !isImporting && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum produto cadastrado</p>
                <p className="text-sm">Importe um arquivo CSV para começar</p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
};

ImportTab.displayName = "ImportTab";
