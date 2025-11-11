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
import { LockKeyhole, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  onUnlock: (userId: number) => void;
}

export function AuthModal({ onUnlock }: AuthModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError("Por favor, insira a senha");
      return;
    }

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
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background with system colors */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        {/* Animated background elements with system colors */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000" />
      </div>

      {/* Modal Container with responsive adjustments */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <Card className="relative overflow-hidden border shadow-2xl bg-card/95 backdrop-blur-xl">
          {/* Decorative gradient border using system primary color */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 opacity-10" />

          {/* Content */}
          <div className="relative">
            {/* Header with animated icon */}
            <CardHeader className="text-center pb-2 px-4 sm:px-6">
              <div className="mx-auto mb-4 relative">
                <div
                  className={cn(
                    "absolute inset-0 bg-primary/50 rounded-full blur-lg opacity-50 transition-all duration-300",
                    isFocused && "scale-110 opacity-75"
                  )}
                />
                <div className="relative bg-primary p-4 rounded-full shadow-lg">
                  <Shield className="h-8 w-8 text-primary-foreground animate-pulse" />
                </div>
              </div>

              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Acesso Restrito
              </CardTitle>

              <CardDescription className="text-muted-foreground mt-2 text-sm sm:text-base">
                Insira a senha para acessar o sistema de contagem
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-4 sm:px-8">
              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Senha da Sessão
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="••••••••"
                    autoFocus
                    disabled={isLoading}
                    className="pr-12 h-12 text-base border-input focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error message with animation */}
              {error && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <LockKeyhole className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="px-4 sm:px-8 pb-8 pt-2">
              <Button
                onClick={handleUnlock}
                className={cn(
                  "w-full h-12 text-base font-medium transition-all duration-200",
                  "bg-primary hover:bg-primary/90",
                  "shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                )}
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="mr-2 h-5 w-5" />
                    Desbloquear Acesso
                  </>
                )}
              </Button>
            </CardFooter>
          </div>

          {/* Bottom decorative line with system primary color */}
          <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
        </Card>

        {/* Additional info */}
        <p className="text-center text-xs text-muted-foreground mt-4 px-4">
          Área restrita • Acesso autorizado somente
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Responsive adjustments for small screens */
        @media (max-width: 360px) {
          .fixed {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
