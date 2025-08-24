"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Crown, ArrowLeft, CreditCard, Shield, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function PaymentPage() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = () => {
    setIsProcessing(true)

    // Simular processamento do pagamento
    setTimeout(() => {
      setIsProcessing(false)
      toast({
        title: "Pagamento aprovado!",
        description: "Bem-vindo ao Premium! Redirecionando...",
      })

      // Redirecionar para o sistema
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/register"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link href="/landing" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Sistema de Estoque</span>
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/landing"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Início
              </Link>
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sistema
              </Link>
              <Link
                href="/about"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sobre
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contato
              </Link>
              <Link
                href="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Login
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                Premium
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Finalizar Pagamento</h1>
            <p className="text-gray-600 dark:text-gray-300">Último passo para ativar seu Premium</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Resumo do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="font-medium">Plano Premium</span>
                  <span className="font-bold">R$ 29,00</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Banco de dados na nuvem</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Histórico completo</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Backup automático</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Suporte prioritário</span>
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-gray-700">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600 dark:text-blue-400">R$ 29,00/mês</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Pagamento Seguro
                </CardTitle>
                <CardDescription>Processamento seguro via Stripe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm opacity-90">Cartão de Crédito</p>
                      <p className="text-lg font-mono">**** **** **** 1234</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Válido até</p>
                      <p className="font-mono">12/28</p>
                    </div>
                  </div>
                  <p className="text-sm opacity-90">João Silva</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Pagamento processado com segurança SSL</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Cancele a qualquer momento</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Cobrança mensal automática</span>
                  </div>
                </div>

                <Button onClick={handlePayment} className="w-full h-12 text-lg font-semibold" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando Pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Confirmar Pagamento - R$ 29,00
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Ao confirmar, você concorda com nossos termos de serviço e política de privacidade
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-blue-800 dark:text-blue-200">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Pagamento 100% seguro e criptografado</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
