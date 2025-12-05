// components/features/barcode-scanner.tsx
/**
 * Descrição: Componente de Scanner de Código de Barras OTIMIZADO.
 * Melhorias:
 * 1. Singleton para AudioContext (evita crash de memória).
 * 2. Feedback visual (borda verde) ao ler.
 * 3. Substituição de alert() por toast().
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Loader2, CameraOff } from "lucide-react";
import { toast } from "@/hooks/use-toast"; // Usando nosso hook de toast

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const MIN_BARCODE_LENGTH = 8;

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null); // Referência para o contexto de áudio

  // Controle de Debounce e Estado Visual
  const lastScannedRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const [isSuccess, setIsSuccess] = useState(false); // Para o feedback visual

  /**
   * Reproduz um som de "beep" de forma otimizada.
   * Reutiliza o AudioContext para evitar vazamento de memória.
   */
  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;
      // Navegadores bloqueiam áudio se não houver interação prévia, tentamos resumir
      if (context.state === "suspended") {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, context.currentTime); // Frequência um pouco mais alta e nítida

      // Configura volume para não estourar
      gainNode.gain.setValueAtTime(0.1, context.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.1);
    } catch (e) {
      console.warn("Áudio não suportado ou bloqueado.");
    }
  }, []);

  const handleScanResult = useCallback(
    (result: string) => {
      if (!result || result.length < MIN_BARCODE_LENGTH) return;

      const now = Date.now();

      // Debounce de 1.5s para evitar leituras duplas do mesmo item muito rápido
      if (
        lastScannedRef.current === result &&
        now - lastScanTimeRef.current < 1500
      ) {
        return;
      }

      lastScannedRef.current = result;
      lastScanTimeRef.current = now;

      // Feedback Imediato
      playBeep();
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 500); // Remove o efeito verde após 500ms

      onScan(result);
    },
    [onScan, playBeep]
  );

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    const videoElement = videoRef.current;

    const startScanner = async () => {
      try {
        const videoInputDevices =
          await codeReaderRef.current?.listVideoInputDevices();

        if (!videoInputDevices || videoInputDevices.length === 0) {
          toast({
            title: "Câmera não encontrada",
            description: "Nenhum dispositivo de vídeo detectado.",
            variant: "destructive",
          });
          onClose();
          return;
        }

        // Tenta pegar a câmera traseira, ou a última da lista (geralmente a melhor em Androids)
        const rearCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("traseira") ||
            device.label.toLowerCase().includes("environment")
        );

        // Fallback robusto: Traseira -> Última encontrada -> Primeira encontrada
        const deviceId =
          rearCamera?.deviceId ||
          videoInputDevices[videoInputDevices.length - 1]?.deviceId;

        if (videoElement) {
          await codeReaderRef.current?.decodeFromVideoDevice(
            deviceId,
            videoElement,
            (result, error) => {
              if (result) {
                handleScanResult(result.getText());
              }
              // Ignoramos erros de frame vazio, mas logamos erros críticos se não forem os padrões
              if (error && !(error instanceof NotFoundException)) {
                // Erros silenciosos de leitura são normais, não precisamos spammar o console
              }
            }
          );
        }
      } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        toast({
          title: "Erro de Acesso",
          description: "Verifique as permissões da câmera no navegador.",
          variant: "destructive",
        });
        onClose();
      }
    };

    startScanner();

    return () => {
      codeReaderRef.current?.reset();
      // Opcional: fechar o contexto de áudio ao desmontar, se desejar economia extrema
      // if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [onClose, handleScanResult]);

  return (
    <div className="space-y-3 mt-4 p-4 border rounded-lg bg-black/95 shadow-inner">
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 aspect-video">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isSuccess ? "opacity-80" : "opacity-100"
          }`}
          autoPlay
          playsInline
          muted // Importante para iOS permitir autoplay sem interação
        />

        {/* Overlay de Guia */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* O quadrado muda de cor quando bipa com sucesso */}
          <div
            className={`w-3/4 h-1/2 border-2 rounded-lg transition-colors duration-300 ${
              isSuccess
                ? "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                : "border-red-500/70 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            }`}
          />

          {/* Texto de ajuda sutil */}
          <p className="absolute bottom-4 text-xs text-white/70 font-medium bg-black/50 px-2 py-1 rounded">
            Posicione o código no centro
          </p>
        </div>
      </div>

      <Button
        onClick={onClose}
        variant="secondary"
        className="w-full mobile-button bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
      >
        <CameraOff className="mr-2 h-4 w-4" />
        Parar Câmera
      </Button>
    </div>
  );
}
