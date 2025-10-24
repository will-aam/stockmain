import type React from "react";
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
import { Upload, Download, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Product, BarCode } from "@/lib/types";

interface ImportTabProps {
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  csvErrors: string[];
  products: Product[];
  barCodes: BarCode[];
  downloadTemplateCSV: () => void;
}

const ProductTableRow = ({
  product,
  barCode,
}: {
  product: Product;
  barCode?: BarCode;
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

const CsvInstructions = ({
  downloadTemplateCSV,
}: {
  downloadTemplateCSV: () => void;
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
        • <strong>Código de barras:</strong> Formate a coluna como NÚMERO (não
        texto)
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
      <li>
        • <strong>Código do Produto:</strong> Se não possuir, insira um valor
        numérico apenas para preenchimento do campo.
      </li>
    </ul>
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-blue-600 dark:text-blue-400">
        <div className="relative bg-gray-950 text-gray-100 rounded-md p-3 font-mono text-xs border border-gray-800 mt-3">
          <button
            onClick={() => {
              const textoVisual =
                "codigo_de_barras;codigo_produto;descricao;saldo_estoque";
              const textoCopiado =
                "codigo_de_barras\tcodigo_produto\tdescricao\tsaldo_estoque";
              navigator.clipboard.writeText(textoCopiado).then(() => {
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

export const ImportTab: React.FC<ImportTabProps> = ({
  handleCsvUpload,
  isLoading,
  csvErrors,
  products,
  barCodes,
  downloadTemplateCSV,
}) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Produtos
          </CardTitle>
          <CardDescription>Faça upload de um arquivo CSV</CardDescription>

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
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              disabled={isLoading}
            />
            {isLoading && <Skeleton className="h-4 w-full" />}
          </div>
          {csvErrors.length > 0 && (
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
      {products.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
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
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum produto cadastrado</p>
              <p className="text-sm">Importe um arquivo CSV para começar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

ImportTab.displayName = "ImportTab";
