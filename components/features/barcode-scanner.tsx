"use client";

import { useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      // CORRIGIDO AQUI:
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.warn("Não foi possível reproduzir o som de feedback.");
    }
  };

  const handleScanResult = useCallback(
    (result: string) => {
      playBeep();
      onScan(result);
    },
    [onScan]
  );

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    const videoElement = videoRef.current;

    const startScanner = async () => {
      try {
        const videoInputDevices =
          await codeReaderRef.current?.listVideoInputDevices();
        if (!videoInputDevices || videoInputDevices.length === 0) {
          alert("Nenhum dispositivo de câmera foi encontrado.");
          onClose();
          return;
        }

        const rearCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("traseira") ||
            device.label.toLowerCase().includes("environment")
        );
        const deviceId = rearCamera?.deviceId || videoInputDevices[0]?.deviceId;

        if (videoElement) {
          await codeReaderRef.current?.decodeFromVideoDevice(
            deviceId,
            videoElement,
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
        onClose();
      }
    };

    startScanner();

    return () => {
      codeReaderRef.current?.reset();
    };
  }, [onClose, handleScanResult]);

  return (
    <div className="space-y-3 mt-4 p-4 border rounded-lg bg-black">
      <div className="relative overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          className="w-full h-48 object-cover"
          autoPlay
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-1/2 border-2 border-red-500/70 rounded-lg" />
          <Loader2 className="h-8 w-8 text-white/70 animate-spin absolute" />
        </div>
      </div>
      <Button
        onClick={onClose}
        variant="destructive"
        className="w-full mobile-button"
      >
        Parar Câmera
      </Button>
    </div>
  );
}
