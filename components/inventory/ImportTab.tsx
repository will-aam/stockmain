// components/inventory/ImportTab.tsx
/**
 * Descrição: Aba para importação de produtos via arquivo CSV com progresso real.
 * Responsabilidade: Fornecer a interface para o upload de arquivos CSV, exibir instruções detalhadas,
 * mostrar o progresso de importação em tempo real via Server-Sent Events (SSE),
 * exibir erros de validação e listar os produtos que foram importados com sucesso.
 * Inclui funcionalidades para baixar um template e para visualizar os dados em uma tabela responsiva.
 * Inclui guia de onboarding mobile com "Link Mágico" para compartilhamento.
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
import { ScrollArea } from "@/components/ui/scroll-area"; // Importamos o ScrollArea

// --- Ícones ---
// Adicionamos Share2 e Link para a funcionalidade de compartilhamento
import {
  Upload,
  Download,
  AlertCircle,
  Info,
  Monitor,
  Share2,
  Link as LinkIcon,
  Zap, // Adicionado ícone Zap para o botão de demo
} from "lucide-react";

// --- Tipos ---
import type { Product, BarCode } from "@/lib/types";
import { toast } from "@/hooks/use-toast"; // Importamos o toast para feedback

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
  onStartDemo: () => void; // Nova prop para o botão de demo
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
  isMobile?: boolean; // Nova prop para indicar se é mobile
}

/**
 * Subcomponente que exibe as instruções para formatar o arquivo CSV.
 * @param downloadTemplateCSV - Função para baixar o arquivo template.
 * @param isMobile - Indica se está em modo mobile (opcional).
 */
const CsvInstructions: React.FC<CsvInstructionsProps> = ({
  downloadTemplateCSV,
  isMobile = false, // Valor padrão é false (desktop)
}) => (
  <div className="space-y-4">
    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-3">
        Instruções
      </h3>
      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
        <li className="flex flex-col sm:flex-row sm:items-start">
          <span className="font-semibold mr-2">Separador:</span>
          <span>Use ponto e vírgula (;) entre as colunas</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-start">
          <span className="font-semibold mr-2">Código de barras:</span>
          <span>Formate a coluna como NÚMERO</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-start">
          <span className="font-semibold mr-2">Saldo estoque:</span>
          <span>Use apenas números inteiros</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-start">
          <span className="font-semibold mr-2">Codificação:</span>
          <span>Salve o arquivo em UTF-8</span>
        </li>
        <li className="flex flex-col sm:flex-row sm:items-start">
          <span className="font-semibold mr-2">Cabeçalho:</span>
          <span>Primeira linha deve conter os nomes das colunas</span>
        </li>
      </ul>
    </div>

    {/* Bloco de código - exibido apenas no desktop */}
    {!isMobile && (
      <div className="text-xs text-blue-600 dark:text-blue-400">
        <div className="relative bg-gray-950 text-gray-100 rounded-md p-3 font-mono text-xs border border-gray-800">
          <button
            onClick={() => {
              // Usamos \t para facilitar a colagem no Excel
              const textoParaAreaDeTransferencia =
                "codigo_de_barras\tcodigo_produto\tdescricao\tsaldo_estoque";
              navigator.clipboard
                .writeText(textoParaAreaDeTransferencia)
                .then(() => {
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
          <div className="overflow-x-auto pb-1">
            <pre className="whitespace-nowrap">
              {`codigo_de_barras;codigo_produto;descricao;saldo_estoque`}
            </pre>
          </div>
        </div>
      </div>
    )}

    <Button
      variant="outline"
      size="sm"
      onClick={downloadTemplateCSV}
      className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30 bg-transparent"
    >
      <Download className="h-3 w-3 mr-1" />
      Baixar Template
    </Button>
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
  onStartDemo, // Nova prop recebida
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

  // --- Funções de Compartilhamento (Link Mágico) ---
  /**
   * Tenta usar a API de compartilhamento nativa (Mobile) ou copia para a área de transferência.
   */
  const handleShareLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: "Acesse o Countifly no PC",
      text: "Link para acessar o sistema de inventário Countifly no computador:",
      url: url,
    };

    // Se o navegador suportar compartilhamento nativo (comum em mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Usuário cancelou o compartilhamento ou erro:", err);
      }
    } else {
      // Fallback: Copia o link
      handleCopyLink();
    }
  };

  /**
   * Copia o link atual para a área de transferência.
   */
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado!",
        description: "Cole no seu WhatsApp ou E-mail para abrir no PC.",
      });
    });
  };

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
          <CardDescription>
            <span className="hidden sm:inline">
              Faça upload de um arquivo CSV
            </span>
            <span className="sm:hidden">
              A importação é feita no computador
            </span>
          </CardDescription>

          {/* Seção de instruções: exibida diretamente em desktop ou dentro de um Dialog em mobile. */}
          <div className="hidden sm:block mt-4">
            <CsvInstructions
              downloadTemplateCSV={downloadTemplateCSV}
              isMobile={false}
            />
          </div>

          <div className="sm:hidden mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Info className="h-4 w-4 mr-2" />
                  Ver Instruções para o CSV
                </Button>
              </DialogTrigger>

              {/* Versão responsiva do DialogContent com altura dinâmica */}
              <DialogContent
                className={`
                  w-full
                  max-w-[calc(100vw-2rem)]  /* nunca passa da width da tela - 2rem */
                  sm:max-w-2xl              /* em telas maiores, limita para 2xl */
                  max-h-[85vh]              /* altura máxima, mas não fixa */
                  p-0                       /* tiramos o padding do container */
                  flex flex-col
                  overflow-hidden           /* impede scroll horizontal no próprio modal */
                `}
              >
                <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
                  <DialogTitle className="text-lg sm:text-xl break-words">
                    Instruções para o arquivo CSV
                  </DialogTitle>
                </DialogHeader>

                {/* Área rolável - agora com altura dinâmica */}
                <ScrollArea className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="max-w-full">
                    <CsvInstructions
                      downloadTemplateCSV={downloadTemplateCSV}
                      isMobile={true} // Indica que é a versão mobile
                    />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de input para o upload do arquivo CSV - Apenas desktop */}
          <div className="hidden sm:block space-y-2">
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
          </div>

          {/* Seção de alerta para exibir erros de validação do CSV. */}
          {!isImporting && csvErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Erros encontrados:</p>
                  {csvErrors.map((error, index) => (
                    <p key={index} className="text-sm break-words">
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
            <CardContent className="py-8 sm:py-12">
              {/* --- Guia de Onboarding para Mobile com Link Mágico --- */}
              {/* Exibido apenas em telas pequenas (block sm:hidden) */}
              <div className="block sm:hidden text-center space-y-6 pt-4">
                {/* Ícone e Título */}
                <div className="space-y-2">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Monitor className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    A configuração é no PC
                  </h3>
                </div>

                {/* Passo a passo (mantido igual ao anterior) */}
                <div className="text-left text-sm text-muted-foreground space-y-3 bg-muted/50 p-5 rounded-lg border border-border">
                  <p className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>
                      Acesse <strong>Countifly</strong> no seu computador.
                    </span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>
                      Baixe o template e preencha com dados do seu ERP.
                    </span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Importe o arquivo lá.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-bold text-primary">4.</span>
                    <span>Os dados aparecerão aqui magicamente ✨</span>
                  </p>
                </div>

                {/* --- NOVO BOTÃO DE DEMO --- */}
                <Button
                  onClick={onStartDemo}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md h-12"
                >
                  <Zap className="mr-2 h-5 w-5 fill-current" />
                  Testar Modo Demo Agora
                </Button>
                <p className="text-xs text-muted-foreground px-4">
                  Simule o app escaneando qualquer produto real perto de você.
                </p>

                {/* Link Mágico (mantido igual) */}
                <div className="pt-4 border-t border-border/60">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Quer abrir no PC agora? Envie o link para você mesmo:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleShareLink} className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="w-full"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>

              {/* --- Estado Vazio Padrão para Desktop --- */}
              {/* Exibido apenas em telas maiores (hidden sm:block) */}
              <div className="hidden sm:block text-center text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-lg">Nenhum produto cadastrado</p>
                <p className="text-sm">
                  Importe um arquivo CSV acima para começar
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
};

ImportTab.displayName = "ImportTab";
