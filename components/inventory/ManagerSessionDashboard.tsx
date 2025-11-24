// components/inventory/ManagerSessionDashboard.tsx
/**
 * Descrição: Painel de Controle do Anfitrião (Multiplayer) - VERSÃO FINAL (UI Ajustada)
 * Responsabilidade:
 * 1. Criar/Monitorar Sessões.
 * 2. Importar produtos (Com UI melhorada).
 * 3. Visualizar Faltantes.
 * 4. ENCERRAR SESSÃO.
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  Activity,
  Play,
  StopCircle,
  RefreshCw,
  Copy,
  Share2,
  FileText,
  CheckCircle2,
  Loader2,
  BarChart2,
  UploadCloud, // Ícone atualizado para dar mais destaque
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// --- Novos Imports ---
import { MissingItemsModal } from "@/components/shared/missing-items-modal";
import { FloatingMissingItemsButton } from "@/components/shared/FloatingMissingItemsButton";

interface ManagerSessionDashboardProps {
  userId: number;
}

interface SessaoData {
  id: number;
  nome: string;
  codigo_acesso: string;
  status: string;
  criado_em: string;
  _count: {
    participantes: number;
    produtos: number;
    movimentos: number;
  };
}

interface ProductSessao {
  codigo_produto: string;
  codigo_barras: string | null;
  descricao: string;
  saldo_sistema: number;
  saldo_contado: number;
}

interface RelatorioFinal {
  total_produtos: number;
  total_contados: number;
  total_faltantes: number;
  discrepancias: Array<{
    codigo_produto: string;
    descricao: string;
    saldo_sistema: number;
    saldo_contado: number;
    diferenca: number;
  }>;
  participantes: number;
  duracao: string;
  data_finalizacao: string;
}

export function ManagerSessionDashboard({
  userId,
}: ManagerSessionDashboardProps) {
  const [activeSession, setActiveSession] = useState<SessaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [sessionProducts, setSessionProducts] = useState<ProductSessao[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [relatorioFinal, setRelatorioFinal] = useState<RelatorioFinal | null>(
    null
  );
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<SessaoData | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // --- Carregar Sessões ---
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory/${userId}/session`);
      if (response.ok) {
        const data = await response.json();
        const current = data.find((s: any) => s.status === "ABERTA");
        setActiveSession(current || null);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    }
  }, [userId]);

  // --- Carregar Produtos ---
  const loadSessionProducts = useCallback(async (sessionId?: number) => {
    const targetId = sessionId || activeSessionRef.current?.id;
    if (!targetId) return;
    try {
      const response = await fetch(`/api/session/${targetId}/products`);
      if (response.ok) {
        const data = await response.json();
        setSessionProducts(data);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }, []);

  // --- Polling ---
  useEffect(() => {
    loadSessions();
    const interval = setInterval(() => {
      loadSessions();
      if (activeSessionRef.current) loadSessionProducts();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadSessions, loadSessionProducts]);

  // --- Calcular Faltantes ---
  const missingItems = useMemo(() => {
    return sessionProducts
      .filter((p) => p.saldo_contado === 0)
      .map((p) => ({
        codigo_de_barras: p.codigo_barras || p.codigo_produto,
        descricao: p.descricao,
        faltante: p.saldo_sistema,
      }));
  }, [sessionProducts]);

  // --- Criar Sessão ---
  const handleCreateSession = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/${userId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newSessionName || undefined }),
      });
      if (!response.ok) throw new Error("Falha ao criar sessão");
      toast({
        title: "Sessão Criada!",
        description: "Importe os produtos para começar.",
      });
      setNewSessionName("");
      loadSessions();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a sessão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Encerrar Sessão e Carregar Relatório ---
  const handleEndSession = async () => {
    if (!activeSession) return;
    if (
      !window.confirm(
        "Tem certeza? Isso finaliza a contagem e gera o relatório."
      )
    )
      return;

    setIsEnding(true);
    try {
      const endResponse = await fetch(
        `/api/inventory/${userId}/session/${activeSession.id}/end`,
        { method: "POST" }
      );
      if (!endResponse.ok) {
        const data = await endResponse.json();
        throw new Error(data.error || "Erro ao encerrar.");
      }

      // Carregar relatório final
      const reportResponse = await fetch(
        `/api/inventory/${userId}/session/${activeSession.id}/report`
      );
      if (!reportResponse.ok) throw new Error("Erro ao carregar relatório");
      const reportData: RelatorioFinal = await reportResponse.json();
      setRelatorioFinal(reportData);
      setShowRelatorioModal(true);

      toast({
        title: "Sessão Finalizada! 🏁",
        description: "Relatório gerado.",
      });
      setActiveSession(null);
      setSessionProducts([]);
      loadSessions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  // --- Importar ---
  const handleSessionImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    setIsImporting(true);
    setImportStatus("Iniciando upload...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `/api/inventory/${userId}/session/${activeSession.id}/import`,
        { method: "POST", body: formData }
      );
      if (!response.ok || !response.body) throw new Error("Falha no upload");
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const lines = value.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.substring(6));
            if (data.type === "progress")
              setImportStatus(`Importando: ${data.imported} itens...`);
            else if (data.type === "complete") {
              toast({
                title: "Sucesso!",
                description: `${data.importedCount} produtos carregados.`,
              });
              setImportStatus("");
              loadSessions();
              loadSessionProducts();
            } else if (data.error) throw new Error(data.error);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      setImportStatus("");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Código copiado." });
  };

  // --- Renderização ---

  if (!activeSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="max-w-md mx-auto border-none bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Modo Equipe
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Crie uma sala para contagem colaborativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            <div className="space-y-1.5">
              <Label htmlFor="sessionName" className="text-sm">
                Nome da Sessão
              </Label>
              <Input
                id="sessionName"
                placeholder="Ex: Inventário Dezembro"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="h-10 border-none bg-muted/50 focus-visible:ring-primary"
              />
            </div>
            <Button
              onClick={handleCreateSession}
              disabled={isLoading}
              className="w-full h-10"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Iniciar Sessão
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[400px] max-w-2xl mx-auto"
    >
      <AnimatePresence>
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Card className="border-none bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {activeSession.nome}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Criada em{" "}
                    {new Date(activeSession.criado_em).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 border-none">
                  Ativa
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Código de Acesso */}
              <motion.div
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Código de Acesso
                </p>
                <div
                  className="text-4xl font-mono tracking-widest text-primary cursor-pointer select-all"
                  onClick={() => copyToClipboard(activeSession.codigo_acesso)}
                >
                  {activeSession.codigo_acesso}
                </div>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(activeSession.codigo_acesso)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator
                          .share({
                            title: "Acesse o Inventário",
                            text: `Código: ${activeSession.codigo_acesso}`,
                            url: window.location.origin,
                          })
                          .catch(console.error);
                      } else {
                        copyToClipboard(
                          `${window.location.origin} (Código: ${activeSession.codigo_acesso})`
                        );
                      }
                    }}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: Users,
                    color: "blue-500",
                    value: activeSession._count.participantes,
                    label: "Pessoas",
                  },
                  {
                    icon: Activity,
                    color: "amber-500",
                    value: activeSession._count.movimentos,
                    label: "Bipes",
                  },
                  {
                    icon: RefreshCw,
                    color: "green-500",
                    value: activeSession._count.produtos,
                    label: "Itens",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                    className="bg-background/50 p-4 rounded-xl border border-muted/20 text-center"
                  >
                    <stat.icon
                      className={`h-5 w-5 text-${stat.color} mx-auto mb-2`}
                    />
                    <div className="text-2xl font-semibold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Importação - UI ATUALIZADA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                // Aumentei o padding para p-6
                className="bg-background/60 p-6 rounded-xl border border-dashed border-primary/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  {/* Título ligeiramente maior */}
                  <h4 className="text-base font-semibold flex items-center gap-2 text-primary">
                    <UploadCloud className="h-5 w-5" />
                    Importar Catálogo
                  </h4>
                  {activeSession._count.produtos > 0 && (
                    <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 border-none">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {activeSession._count.produtos} carregados
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleSessionImport}
                      disabled={isImporting}
                      // Mudança chave aqui: file:font-bold, file:text-primary, file:bg-primary/10, h-12
                      className="cursor-pointer text-sm h-12 file:mr-4 file:py-2 file:px-0 file:border-0 file:text-sm file:font-bold file:text-primary file:bg-transparent hover:file:text-primary/80 transition-all"
                    />
                  </div>

                  {isImporting && (
                    <span className="text-sm text-primary font-medium animate-pulse flex items-center gap-2 whitespace-nowrap">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {importStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Carregue o arquivo CSV (mesmo formato padrão) para que os
                  colaboradores vejam os produtos no celular.
                </p>
              </motion.div>
            </CardContent>

            <CardFooter className="p-6 flex justify-end gap-3 border-t border-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  loadSessions();
                  loadSessionProducts();
                }}
                disabled={isEnding}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                disabled={isEnding}
              >
                {isEnding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="mr-2 h-4 w-4" />
                )}
                Encerrar
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Componentes Flutuantes */}
      <FloatingMissingItemsButton
        itemCount={missingItems.length}
        onClick={() => setShowMissingModal(true)}
        dragConstraintsRef={containerRef}
      />
      <MissingItemsModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        items={missingItems}
      />

      {/* Modal de Relatório Final */}
      <Dialog open={showRelatorioModal} onOpenChange={setShowRelatorioModal}>
        <DialogContent className="max-w-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-none shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Relatório Final
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Sessão: {activeSession?.nome} • Finalizada em{" "}
              {relatorioFinal?.data_finalizacao}
            </DialogDescription>
          </DialogHeader>
          {relatorioFinal && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {relatorioFinal.total_produtos}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Produtos Totais
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {relatorioFinal.total_contados}
                  </div>
                  <div className="text-xs text-muted-foreground">Contados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {relatorioFinal.total_faltantes}
                  </div>
                  <div className="text-xs text-muted-foreground">Faltantes</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Discrepâncias</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {relatorioFinal.discrepancias.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="bg-background/50 p-3 rounded-md border border-muted/20"
                    >
                      <div className="text-sm font-medium">
                        {item.descricao}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sistema: {item.saldo_sistema} | Contado:{" "}
                        {item.saldo_contado} | Dif: {item.diferenca}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">
                    {relatorioFinal.participantes}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Participantes
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {relatorioFinal.duracao}
                  </div>
                  <div className="text-xs text-muted-foreground">Duração</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
