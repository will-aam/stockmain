// components/inventory/ManagerSessionDashboard.tsx
/**
 * Descrição: Painel de Controle do Gestor (Multiplayer).
 * Responsabilidade:
 * 1. Permitir criar uma nova sessão de contagem.
 * 2. Exibir o CÓDIGO DA SALA para compartilhar com a equipe.
 * 3. Monitorar o progresso (número de participantes e movimentos).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

export function ManagerSessionDashboard({
  userId,
}: ManagerSessionDashboardProps) {
  const [activeSession, setActiveSession] = useState<SessaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");

  // --- Carregar Sessões ---
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory/${userId}/session`);
      if (response.ok) {
        const data = await response.json();
        // Pega a primeira sessão que estiver ABERTA
        const current = data.find((s: any) => s.status === "ABERTA");
        setActiveSession(current || null);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    }
  }, [userId]);

  // Polling para atualização em tempo real (a cada 10s)
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

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
        description: "Compartilhe o código com sua equipe.",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência.",
    });
  };

  // --- Renderização ---

  // 1. Estado: Nenhuma sessão ativa -> Mostrar formulário de criação
  if (!activeSession) {
    return (
      <Card className="border-dashed border-2 bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Modo Equipe (Multiplayer)
          </CardTitle>
          <CardDescription>
            Crie uma sala para que várias pessoas contem o estoque
            simultaneamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="sessionName">Nome da Contagem (Opcional)</Label>
            <Input
              id="sessionName"
              placeholder="Ex: Inventário Geral Dezembro"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateSession}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Iniciar Nova Sessão
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. Estado: Sessão Ativa -> Mostrar Dashboard
  return (
    <Card className="border-primary/50 shadow-md bg-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{activeSession.nome}</CardTitle>
            <CardDescription>
              Sessão Ativa • Criada em{" "}
              {new Date(activeSession.criado_em).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            EM ANDAMENTO
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Destaque do Código */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border text-center space-y-2 shadow-inner">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            Código de Acesso
          </p>
          <div
            className="text-5xl sm:text-6xl font-black tracking-widest text-primary cursor-pointer select-all"
            onClick={() => copyToClipboard(activeSession.codigo_acesso)}
          >
            {activeSession.codigo_acesso}
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(activeSession.codigo_acesso)}
            >
              <Copy className="mr-2 h-3 w-3" /> Copiar
            </Button>
            {/* Botão share nativo para mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: "Acesse o Inventário",
                      text: `Entre na sessão com o código: ${activeSession.codigo_acesso}`,
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

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-background p-3 rounded-lg border">
            <div className="flex justify-center mb-1">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">
              {activeSession._count.participantes}
            </div>
            <div className="text-xs text-muted-foreground">Pessoas</div>
          </div>
          <div className="bg-background p-3 rounded-lg border">
            <div className="flex justify-center mb-1">
              <Activity className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">
              {activeSession._count.movimentos}
            </div>
            <div className="text-xs text-muted-foreground">Bipes</div>
          </div>
          <div className="bg-background p-3 rounded-lg border">
            <div className="flex justify-center mb-1">
              <RefreshCw className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {activeSession._count.produtos}
            </div>
            <div className="text-xs text-muted-foreground">Itens Catálogo</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 pt-4 flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={loadSessions}>
          <RefreshCw className="mr-2 h-3 w-3" /> Atualizar
        </Button>
        {/* Este botão ainda será implementado na lógica de backend de encerramento */}
        <Button variant="destructive" size="sm" disabled>
          <StopCircle className="mr-2 h-4 w-4" /> Encerrar Sessão (Em breve)
        </Button>
      </CardFooter>
    </Card>
  );
}
