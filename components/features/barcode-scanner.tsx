// components/features/barcode-scanner.tsx
/**
 * Descrição: Componente de Scanner de Código de Barras.
 * Responsabilidade: Utiliza a câmera do dispositivo para escanear códigos de barras em tempo real.
 * Gerencia a inicialização da câmera, a seleção do dispositivo de vídeo (preferindo a câmera traseira),
 * o processamento do resultado e o feedback visual e sonoro ao usuário.
 */

"use client";

// --- React Hooks ---
import { useEffect, useRef, useCallback } from "react";

// --- Bibliotecas de Terceiros ---
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

// --- Componentes de UI e Ícones ---
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// --- Interfaces e Constantes ---
/**
 * Props para o componente BarcodeScanner.
 * @param onScan - Função de callback chamada quando um código de barras é lido com sucesso.
 * @param onClose - Função de callback para fechar o scanner e liberar a câmera.
 */
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

/** Tamanho mínimo para considerar um código de barras válido, filtrando leituras parciais ou ruído. */
const MIN_BARCODE_LENGTH = 8;

/**
 * Componente BarcodeScanner.
 * @param onScan - Função de callback para o resultado do escaneamento.
 * @param onClose - Função de callback para fechar o componente.
 */
export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  // --- Referências do DOM e Estado do Scanner ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // --- Controle de Debounce para Leituras ---
  // Armazena o último código escaneado para evitar leituras duplicadas consecutivas.
  const lastScannedRef = useRef<string | null>(null);
  // Armazena o timestamp da última leitura para implementar um intervalo de debounce.
  const lastScanTimeRef = useRef<number>(0);

  /**
   * Reproduz um som de "beep" para fornecer feedback auditivo ao usuário.
   * Utiliza a Web Audio API para gerar o som dinamicamente.
   * Inclui um bloco try/catch para evitar erros em navegadores que não suportam a API.
   */
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
    } catch (e) {
      console.warn("Não foi possível reproduzir o som de feedback.");
    }
  };

  /**
   * Manipula o resultado de um escaneamento bem-sucedido.
   * Implementa um mecanismo de debounce para ignorar leituras idênticas e muito próximas no tempo.
   * @param result - O texto do código de barras lido.
   */
  const handleScanResult = useCallback(
    (result: string) => {
      // Ignora códigos muito curtos, que podem ser ruído da câmera.
      if (!result || result.length < MIN_BARCODE_LENGTH) return;

      const now = Date.now();

      // Se for o mesmo código e a leitura ocorreu há menos de 1 segundo, ignora.
      if (
        lastScannedRef.current === result &&
        now - lastScanTimeRef.current < 1000
      ) {
        return;
      }

      // Atualiza as referências de debounce.
      lastScannedRef.current = result;
      lastScanTimeRef.current = now;

      // Executa as ações de feedback e notificação.
      playBeep();
      onScan(result);
      // Opcional: fechar a câmera automaticamente após uma leitura bem-sucedida.
      // onClose();
    },
    [onScan]
  );

  /**
   * useEffect para o ciclo de vida do scanner.
   * Responsável por inicializar o leitor, solicitar permissão da câmera,
   * iniciar o stream de vídeo e configurar a limpeza ao desmontar o componente.
   */
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    const videoElement = videoRef.current;

    /**
     * Função assíncrona para iniciar o scanner.
     * Lista os dispositivos de vídeo, seleciona a câmera traseira (se disponível)
     * e começa a decodificar códigos do stream de vídeo.
     */
    const startScanner = async () => {
      try {
        const videoInputDevices =
          await codeReaderRef.current?.listVideoInputDevices();
        if (!videoInputDevices || videoInputDevices.length === 0) {
          alert("Nenhum dispositivo de câmera foi encontrado.");
          onClose();
          return;
        }

        // Tenta encontrar a câmera traseira ("back", "environment", "traseira").
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
              // Se um código for encontrado, processa o resultado.
              if (result) {
                handleScanResult(result.getText());
              }
              // Ignora erros de "não encontrado", que são comuns e esperados durante o escaneamento.
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

    // Função de limpeza: reseta o leitor para parar a câmera e evitar vazamentos de memória.
    return () => {
      codeReaderRef.current?.reset();
    };
  }, [onClose, handleScanResult]);

  return (
    <div className="space-y-3 mt-4 p-4 border rounded-lg bg-black">
      <div className="relative overflow-hidden rounded-lg">
        {/* Elemento de vídeo onde o stream da câmera será renderizado. */}
        <video
          ref={videoRef}
          className="w-full h-48 object-cover"
          autoPlay
          playsInline
        />
        {/* Sobreposição visual para guiar o usuário e indicador de carregamento. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-1/2 border-2 border-red-500/70 rounded-lg" />
          <Loader2 className="h-8 w-8 text-white/70 animate-spin absolute" />
        </div>
      </div>
      {/* Botão para parar o scanner e liberar a câmera. */}
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
