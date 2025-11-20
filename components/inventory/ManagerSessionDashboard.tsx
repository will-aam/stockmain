// components/inventory/ManagerSessionDashboard.tsx
/**
 * Descrição: Painel de Controle do Gestor (Multiplayer) - VERSÃO FINAL E COMPLETA
 * Responsabilidade:
 * 1. Criar/Monitorar Sessões.
 * 2. Importar produtos.
 * 3. Visualizar Faltantes.
 * 4. ENCERRAR SESSÃO (Habilitado!).
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

export function ManagerSessionDashboard({
  userId,
}: ManagerSessionDashboardProps) {
  const [activeSession, setActiveSession] = useState<SessaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false); // Estado para o botão de encerrar
  const [newSessionName, setNewSessionName] = useState("");

  // Estado de Importação
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // Estado de Produtos e Faltantes
  const [sessionProducts, setSessionProducts] = useState<ProductSessao[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<SessaoData | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // --- 1. Carregar Sessões ---
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

  // --- 2. Carregar Produtos da Sessão Ativa ---
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
      console.error("Erro ao carregar produtos da sessão:", error);
    }
  }, []);

  // --- Polling Unificado ---
  useEffect(() => {
    loadSessions();
    const interval = setInterval(() => {
      loadSessions();
      if (activeSessionRef.current) {
        loadSessionProducts(activeSessionRef.current.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadSessions, loadSessionProducts]);

  // --- 3. Calcular Faltantes ---
  const missingItems = useMemo(() => {
    return sessionProducts
      .filter((p) => p.saldo_contado === 0)
      .map((p) => ({
        codigo_de_barras: p.codigo_barras || p.codigo_produto,
        descricao: p.descricao,
        faltante: p.saldo_sistema,
      }));
  }, [sessionProducts]);

  // --- Ações ---

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
        description: "Agora importe os produtos para começar.",
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

  // --- AÇÃO DE ENCERRAR (NOVO!) ---
  const handleEndSession = async () => {
    if (!activeSession) return;

    const confirm = window.confirm(
      "Tem certeza? Isso vai finalizar a contagem, bloquear novos envios e gerar o relatório final no seu Histórico."
    );
    if (!confirm) return;

    setIsEnding(true);
    try {
      const response = await fetch(
        `/api/inventory/${userId}/session/${activeSession.id}/end`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao encerrar.");
      }

      toast({
        title: "Sessão Finalizada! 🏁",
        description: "O relatório completo foi salvo na aba Histórico.",
        className: "bg-green-600 text-white border-none",
      });

      // Limpa a sessão ativa da tela
      setActiveSession(null);
      setSessionProducts([]);
      // Recarrega para garantir que o estado está limpo
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
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Falha no upload");
      if (!response.body) throw new Error("Sem resposta do servidor");

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

            if (data.type === "progress") {
              setImportStatus(`Importando: ${data.imported} itens...`);
            } else if (data.type === "complete") {
              toast({
                title: "Sucesso!",
                description: `${data.importedCount} produtos carregados na sala.`,
              });
              setImportStatus("");
              loadSessions();
              loadSessionProducts();
            } else if (data.error) {
              throw new Error(data.error);
            }
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
      <Card className="max-w-md mx-auto border-dashed border-2 border-primary/30 bg-gradient-to-br from-muted/10 to-background shadow-sm rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Modo Equipe
          </CardTitle>
          <CardDescription className="text-sm">
            Crie uma sala para contagem colaborativa de estoque.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sessionName" className="text-sm">
              Nome da Sessão (Opcional)
            </Label>
            <Input
              id="sessionName"
              placeholder="Ex: Inventário Dezembro"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <Button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="w-full h-9 text-sm"
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
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[400px] max-w-2xl mx-auto"
    >
      <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-background to-muted/20 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-primary/5">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">{activeSession.nome}</CardTitle>
              <CardDescription className="text-xs mt-1">
                Criada em{" "}
                {new Date(activeSession.criado_em).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-xs bg-green-500/80">
              Ativa
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {/* Código de Acesso - Mais condensado e moderno */}
          <div className="bg-background p-4 rounded-lg border border-primary/10 shadow-sm text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Código de Acesso
            </p>
            <div
              className="text-4xl font-mono tracking-widest text-primary cursor-pointer select-all"
              onClick={() => copyToClipboard(activeSession.codigo_acesso)}
            >
              {activeSession.codigo_acesso}
            </div>
            <div className="flex justify-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => copyToClipboard(activeSession.codigo_acesso)}
              >
                <Copy className="mr-1 h-3 w-3" /> Copiar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
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
          </div>

          {/* Estatísticas - Grid compacto */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background p-2 rounded-md border text-center">
              <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {activeSession._count.participantes}
              </div>
              <div className="text-xs text-muted-foreground">Pessoas</div>
            </div>
            <div className="bg-background p-2 rounded-md border text-center">
              <Activity className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {activeSession._count.movimentos}
              </div>
              <div className="text-xs text-muted-foreground">Bipes</div>
            </div>
            <div className="bg-background p-2 rounded-md border text-center">
              <RefreshCw className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {activeSession._count.produtos}
              </div>
              <div className="text-xs text-muted-foreground">Itens</div>
            </div>
          </div>

          {/* Importação - Mais condensada */}
          <div className="bg-background p-3 rounded-md border border-dashed border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <FileText className="h-4 w-4 text-primary" />
                Importar Catálogo
              </h4>
              {activeSession._count.produtos > 0 && (
                <Badge variant="outline" className="text-xs border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                  {activeSession._count.produtos} itens
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleSessionImport}
                disabled={isImporting}
                className="text-xs h-8 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {isImporting && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  {importStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Carregue o CSV para iniciar a contagem.
            </p>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 p-3 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              loadSessions();
              loadSessionProducts();
            }}
            disabled={isEnding}
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Atualizar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            onClick={handleEndSession}
            disabled={isEnding}
          >
            {isEnding ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <StopCircle className="mr-1 h-3 w-3" />
            )}
            Encerrar
          </Button>
        </CardFooter>
      </Card>

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
    </div>
  );
}
