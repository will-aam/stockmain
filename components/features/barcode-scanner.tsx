"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, Scan, Zap, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isActive: boolean;
  onClose: () => void;
}

export function BarcodeScanner({
  onScan,
  isActive,
  onClose,
}: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn("Não foi possível reproduzir o som de feedback.");
    }
  };

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  }, []);

  const handleScanResult = useCallback(
    (result: string) => {
      if (isScanning) return;

      setIsScanning(true);
      playBeep();

      setTimeout(() => {
        onScan(result);
        setManualInput("");
        setIsScanning(false);
        stopCamera();
      }, 300);
    },
    [onScan, stopCamera, isScanning]
  );

  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    codeReaderRef.current = new BrowserMultiFormatReader();

    try {
      const videoInputDevices =
        await codeReaderRef.current.listVideoInputDevices();
      const rearCamera = videoInputDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("traseira") ||
          device.label.toLowerCase().includes("environment")
      );
      const deviceId = rearCamera?.deviceId || videoInputDevices[0]?.deviceId;

      if (!deviceId) {
        // CORREÇÃO: Usa alert() em vez de throw new Error() para não quebrar a aplicação.
        alert(
          "Nenhuma câmera foi encontrada ou a permissão do navegador foi negada."
        );
        setIsCameraLoading(false);
        return;
      }

      setIsCameraActive(true);
      setIsCameraLoading(false);

      if (videoRef.current) {
        await codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleScanResult(result.getText());
            }
            if (error && !(error instanceof NotFoundException)) {
              if (
                error.name !== "FormatException" &&
                error.name !== "ChecksumException"
              ) {
                console.error("Erro de leitura do scanner:", error);
              }
            }
          }
        );
      }
    } catch (error) {
      console.error("Erro ao iniciar a câmera:", error);
      alert(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador para este site."
      );
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  }, [handleScanResult]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanResult(manualInput.trim());
    }
  };

  useEffect(() => {
    if (!isActive) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isActive, stopCamera]);

  if (!isActive) return null;

  // CORREÇÃO: A estrutura JSX foi completamente reescrita e verificada.
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center text-lg">
            <Scan className="h-5 w-5 mr-2" />
            Scanner
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCameraActive ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg">
                <video
                  ref={videoRef}
                  className="w-full h-48 bg-black object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1/2 border-2 border-red-500/70 rounded-lg" />
                </div>
              </div>
              <Button
                onClick={stopCamera}
                variant="destructive"
                className="w-full mobile-button"
              >
                Parar Câmera
              </Button>
            </div>
          ) : (
            <Button
              onClick={startCamera}
              variant="outline"
              className="w-full mobile-button bg-transparent"
              disabled={isCameraLoading}
            >
              {isCameraLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {isCameraLoading ? "Iniciando..." : "Usar Câmera"}
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Digite o código manualmente"
                className="barcode-input mobile-optimized pr-12 text-center"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isCameraActive || isScanning}
              />
              {isScanning && !isCameraActive && (
                <Zap className="h-4 w-4 text-blue-500 animate-pulse absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            <Button
              type="submit"
              className="w-full mobile-button"
              disabled={!manualInput.trim() || isScanning || isCameraActive}
            >
              Confirmar Código
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
