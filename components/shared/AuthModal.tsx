"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Loader2 } from "lucide-react";

interface AuthModalProps {
  // Agora onUnlock recebe o ID do usuário
  onUnlock: (userId: number) => void;
}

export function AuthModal({ onUnlock }: AuthModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao autenticar");
      }

      if (data.success && data.userId) {
        onUnlock(data.userId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <LockKeyhole className="mr-2 h-5 w-5" />
            Acesso Restrito
          </CardTitle>
          <CardDescription>
            Por favor, insira a senha de acesso para iniciar a sessão de
            contagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha da Sessão</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••"
              autoFocus
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUnlock}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Verificando..." : "Desbloquear"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
