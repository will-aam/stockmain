"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Crown,
  Download,
  History,
  Cloud,
  Shield,
  Users,
  Smartphone,
  BarChart3,
  Headphones,
  X,
  Star,
  Zap,
} from "lucide-react"
import Link from "next/link"

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

export function PremiumUpgradeModal({ isOpen, onClose, feature }: PremiumUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly")

  const premiumFeatures = [
    {
      icon: Download,
      title: "Exportação Completa",
      description: "Exporte contagens em CSV, PDF e Excel com relatórios detalhados",
      highlight: feature === "export",
    },
    {
      icon: History,
      title: "Histórico Ilimitado",
      description: "Acesse todo o histórico de contagens e movimentações",
      highlight: feature === "history",
    },
    {
      icon: Cloud,
      title: "Backup na Nuvem",
      description: "Seus dados seguros e sincronizados automaticamente",
      highlight: false,
    },
    {
      icon: Users,
      title: "Multi-usuário",
      description: "Acesso simultâneo para toda sua equipe",
      highlight: false,
    },
    {
      icon: Smartphone,
      title: "Sincronização",
      description: "Acesse de qualquer dispositivo com dados sempre atualizados",
      highlight: false,
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Dashboards e análises detalhadas do seu estoque",
      highlight: false,
    },
    {
      icon: Shield,
      title: "Segurança Premium",
      description: "Criptografia avançada e backups redundantes",
      highlight: false,
    },
    {
      icon: Headphones,
      title: "Suporte Prioritário",
      description: "Atendimento especializado via chat, email e telefone",
      highlight: false,
    },
  ]

  const monthlyPrice = 29
  const yearlyPrice = 290
  const yearlyDiscount = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Desbloqueie Todo o Potencial do Stock
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Transforme sua gestão de estoque com recursos profissionais
          </DialogDescription>
        </DialogHeader>

        {/* Destaque do recurso específico */}
        {feature && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {feature === "export" ? (
                  <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {feature === "export" ? "Exportação Premium" : "Histórico Completo"}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {feature === "export"
                    ? "Exporte seus dados em múltiplos formatos com relatórios profissionais"
                    : "Acesse todo o histórico de movimentações e análises detalhadas"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de recursos */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {premiumFeatures.map((feature, index) => (
            <Card
              key={index}
              className={`p-4 transition-all duration-200 ${
                feature.highlight ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md" : "hover:shadow-md"
              }`}
            >
              <CardContent className="p-0">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      feature.highlight ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <feature.icon
                      className={`h-5 w-5 ${
                        feature.highlight ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-1 ${
                        feature.highlight ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        feature.highlight ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {feature.description}
                    </p>
                  </div>
                  {feature.highlight && (
                    <Badge variant="default" className="bg-blue-500">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seletor de planos */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPlan === "monthly"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setSelectedPlan("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  selectedPlan === "yearly"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Anual
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs px-1">-{yearlyDiscount}%</Badge>
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              R$ {selectedPlan === "monthly" ? monthlyPrice : Math.round(yearlyPrice / 12)}
              <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/mês</span>
            </div>
            {selectedPlan === "yearly" && (
              <div className="text-sm text-green-600 dark:text-green-400 mb-2">
                Economize R$ {monthlyPrice * 12 - yearlyPrice} por ano
              </div>
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPlan === "monthly" ? "Cobrança mensal" : `R$ ${yearlyPrice} cobrados anualmente`}
            </div>
          </div>
        </div>

        {/* Garantias */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Garantia 30 dias</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Ativação imediata</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <X className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Cancele quando quiser</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 h-12 text-lg font-semibold">
            <Link href="/register">
              <Crown className="h-5 w-5 mr-2" />
              Assinar Premium
            </Link>
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 bg-transparent">
            Continuar Grátis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
