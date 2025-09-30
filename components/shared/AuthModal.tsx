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
import { LockKeyhole } from "lucide-react";

interface AuthModalProps {
  onUnlock: () => void;
}

const HARDCODED_PASSWORD = "1234";

export function AuthModal({ onUnlock }: AuthModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (password === HARDCODED_PASSWORD) {
      setError("");
      onUnlock();
    } else {
      setError("Senha incorreta. Tente novamente.");
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
            Por favor, insira a senha para acessar o sistema de inventário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUnlock} className="w-full">
            Desbloquear
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
