"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CloudOff, Cloud } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Esconder após 3 segundos quando voltar online
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    // Verificar status inicial
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) {
      setShowIndicator(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div className="offline-indicator">
      <Badge variant={isOnline ? "default" : "destructive"} className="shadow-lg transition-all duration-300">
        {isOnline ? (
          <>
            <Cloud className="h-3 w-3 mr-1" />
            Conectado
          </>
        ) : (
          <>
            <CloudOff className="h-3 w-3 mr-1" />
            Modo Offline
          </>
        )}
      </Badge>
    </div>
  )
}
