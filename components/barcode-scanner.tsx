"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, X, Scan, Zap } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isActive: boolean
  onClose: () => void
}

export function BarcodeScanner({ onScan, isActive, onClose }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error)
      alert("Não foi possível acessar a câmera. Verifique as permissões ou use a entrada manual.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      setIsScanning(true)
      setTimeout(() => {
        onScan(manualInput.trim())
        setManualInput("")
        setIsScanning(false)
      }, 300)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualInput(value)

    // Auto-submit quando o código tiver 13 dígitos (EAN-13)
    if (value.length === 13 && /^\d+$/.test(value)) {
      setIsScanning(true)
      setTimeout(() => {
        onScan(value)
        setManualInput("")
        setIsScanning(false)
      }, 300)
    }
  }

  useEffect(() => {
    if (isActive && inputRef.current) {
      // Focar no input quando o scanner abrir
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }

    return () => {
      stopCamera()
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center text-lg">
              <Scan className="h-5 w-5 mr-2" />
              Scanner de Código
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Digite ou escaneie o código de barras</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entrada Manual */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <Input
                ref={inputRef}
                value={manualInput}
                onChange={handleInputChange}
                placeholder="Digite o código de barras"
                className="barcode-input mobile-optimized pr-12"
                autoFocus
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {isScanning && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
                </div>
              )}
            </div>
            <Button type="submit" className="w-full mobile-button" disabled={!manualInput.trim() || isScanning}>
              {isScanning ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Processando...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Confirmar Código
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Scanner de Câmera */}
          {!isCameraActive ? (
            <Button onClick={startCamera} variant="outline" className="w-full mobile-button bg-transparent">
              <Camera className="h-4 w-4 mr-2" />
              Usar Câmera
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 bg-black rounded-lg object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-24 border-2 border-red-500 rounded-lg bg-transparent">
                    <div className="w-full h-full border border-red-300 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
              <Button onClick={stopCamera} variant="outline" className="w-full mobile-button bg-transparent">
                Parar Câmera
              </Button>
              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  Posicione o código de barras dentro do quadro
                </Badge>
              </div>
            </div>
          )}

          {/* Dicas de uso */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>
              💡 <strong>Dicas:</strong>
            </p>
            <p>• Códigos EAN-13 são processados automaticamente</p>
            <p>• Use Enter para confirmar códigos manuais</p>
            <p>• Mantenha boa iluminação para a câmera</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
