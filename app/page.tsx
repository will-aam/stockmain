"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  Scan,
  Upload,
  Download,
  History,
  BarChart3,
  Shield,
  CheckCircle,
  Star,
  ArrowRight,
  Smartphone,
  Cloud,
  FileSpreadsheet,
  Database,
  Settings,
  Crown,
  Sparkles,
} from "lucide-react";

// O PAI TA ON

export default function systemPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      category: "Conferência de Estoque",
      items: [
        {
          icon: Scan,
          title: "Scanner de Código de Barras",
          description: "Escaneie códigos de barras com a câmera do dispositivo",
        },
        {
          icon: Smartphone,
          title: "Interface Mobile Otimizada",
          description: "Design responsivo perfeito para tablets e smartphones",
        },
        {
          icon: Package,
          title: "Cadastro Rápido",
          description: "Registre produtos não encontrados instantaneamente",
        },
        {
          icon: Settings,
          title: "Múltiplos Locais",
          description: "Gerencie diferentes lojas e depósitos",
        },
      ],
    },
    {
      category: "Gestão de Dados",
      items: [
        {
          icon: Upload,
          title: "Importação CSV",
          description: "Importe produtos em massa via arquivo CSV",
        },
        {
          icon: Database,
          title: "Armazenamento Local",
          description: "Dados salvos localmente para acesso offline",
        },
        {
          icon: Cloud,
          title: "Sincronização",
          description: "Sincronize dados entre dispositivos",
          premium: true,
        },
        {
          icon: Shield,
          title: "Backup Automático",
          description: "Backup automático dos dados na nuvem",
          premium: true,
        },
      ],
    },
    {
      category: "Relatórios e Análises",
      items: [
        {
          icon: Download,
          title: "Exportação de Contagens",
          description: "Exporte relatórios em CSV e PDF",
          premium: true,
        },
        {
          icon: BarChart3,
          title: "Dashboard Analítico",
          description: "Visualize estatísticas e tendências",
          premium: true,
        },
        {
          icon: History,
          title: "Histórico Completo",
          description: "Acesse histórico de todas as contagens",
          premium: true,
        },
        {
          icon: FileSpreadsheet,
          title: "Relatórios Personalizados",
          description: "Crie relatórios customizados por período",
          premium: true,
        },
      ],
    },
  ];

  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      description: "Perfeito para pequenos negócios",
      features: [
        "Scanner de código de barras",
        "Cadastro rápido de produtos",
        "Importação CSV básica",
        "Armazenamento local",
        "Interface mobile otimizada",
        "Suporte por email",
      ],
      cta: "Começar Gratuitamente",
      href: "/",
      popular: false,
    },
    {
      name: "Premium",
      price: "R$ 29",
      period: "/mês",
      description: "Para empresas que precisam de mais recursos",
      features: [
        "Todos os recursos gratuitos",
        "Exportação de contagens (CSV/PDF)",
        "Histórico completo de contagens",
        "Backup automático na nuvem",
        "Sincronização entre dispositivos",
        "Dashboard analítico avançado",
        "Relatórios personalizados",
        "Suporte prioritário",
        "Múltiplos usuários",
      ],
      cta: "Assinar Premium",
      href: "/register",
      popular: true,
    },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Gerente de Loja",
      company: "Supermercado Central",
      content:
        "O Stock revolucionou nossa gestão de inventário. Reduzimos o tempo de contagem em 70%.",
      rating: 5,
    },
    {
      name: "João Santos",
      role: "Proprietário",
      company: "Farmácia Saúde",
      content:
        "Interface intuitiva e funciona perfeitamente no tablet. Recomendo para qualquer negócio.",
      rating: 5,
    },
    {
      name: "Ana Costa",
      role: "Coordenadora de Estoque",
      company: "Loja de Roupas Fashion",
      content:
        "Os relatórios detalhados nos ajudam a tomar decisões mais assertivas sobre o estoque.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <header className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b dark:border-gray-700">
        <Navigation />
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="flex justify-center mb-6">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Sistema de Inventário Inteligente
                </Badge>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
                Revolucione seu
                <br />
                Controle de Estoque
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Sistema completo de inventário com scanner de código de barras,
                relatórios inteligentes e sincronização em tempo real.
                Simplifique sua gestão de estoque hoje mesmo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                >
                  <Link href="/">
                    <Package className="h-5 w-5 mr-2" />
                    Começar Gratuitamente
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 text-lg border-2 bg-transparent"
                >
                  <Link href="/about">
                    Saiba Mais
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Recursos Completos para sua Empresa
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Descubra todas as funcionalidades que tornam o Stock a melhor
                escolha para gestão de inventário
              </p>
            </div>

            {features.map((category, categoryIndex) => (
              <div key={category.category} className="mb-16">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.items.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Card
                        key={index}
                        className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                          feature.premium
                            ? "border-amber-200 dark:border-amber-800"
                            : ""
                        }`}
                      >
                        {feature.premium && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="pb-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                              feature.premium
                                ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20"
                                : "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20"
                            }`}
                          >
                            <Icon
                              className={`h-6 w-6 ${
                                feature.premium
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            />
                          </div>
                          <CardTitle className="text-lg">
                            {feature.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-gray-600 dark:text-gray-300">
                            {feature.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Planos que Crescem com seu Negócio
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Escolha o plano ideal para suas necessidades. Comece
                gratuitamente e faça upgrade quando precisar.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    plan.popular
                      ? "border-2 border-blue-500 dark:border-blue-400 shadow-lg scale-105"
                      : "hover:-translate-y-1"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-sm font-medium">
                      Mais Popular
                    </div>
                  )}
                  <CardHeader className={plan.popular ? "pt-12" : ""}>
                    <div className="text-center">
                      <CardTitle className="text-2xl font-bold">
                        {plan.name}
                      </CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {plan.period}
                        </span>
                      </div>
                      <CardDescription className="mt-2 text-lg">
                        {plan.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className={`w-full py-3 text-lg ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Development Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <div className="flex items-center mb-6">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Desenvolvimento Sob Medida
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Precisa de Algo Específico?
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  O Stock atende a maioria das necessidades de inventário, mas
                  sabemos que cada empresa é única. Se você precisa de
                  funcionalidades específicas ou integrações personalizadas,
                  nossa equipe pode desenvolver a solução perfeita para seu
                  negócio.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Integrações Personalizadas
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Conecte com seus sistemas ERP, WMS ou outras ferramentas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Relatórios Específicos
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Relatórios customizados para suas necessidades únicas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Funcionalidades Exclusivas
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Desenvolva recursos únicos para seu processo de trabalho
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Suporte Dedicado
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Equipe técnica dedicada ao seu projeto
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form */}
              <div>
                <Card className="shadow-xl border-2 border-purple-100 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <CardTitle className="text-2xl text-center">
                      Solicite seu Orçamento
                    </CardTitle>
                    <CardDescription className="text-center">
                      Descreva sua necessidade e nossa equipe entrará em contato
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        toast({
                          title: "Solicitação enviada!",
                          description:
                            "Nossa equipe entrará em contato em até 24 horas para discutir seu projeto.",
                        });
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-name">Nome *</Label>
                          <input
                            id="custom-name"
                            placeholder="Seu nome"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-email">Email *</Label>
                          <input
                            id="custom-email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-company">Empresa</Label>
                        <input
                          id="custom-company"
                          placeholder="Nome da sua empresa"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-phone">Telefone</Label>
                        <input
                          id="custom-phone"
                          placeholder="(11) 99999-9999"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-requirement">
                          Descreva sua Necessidade *
                        </Label>
                        <textarea
                          id="custom-requirement"
                          placeholder="Descreva detalhadamente a funcionalidade ou integração que você precisa..."
                          rows={4}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-timeline">Prazo Desejado</Label>
                        <select
                          id="custom-timeline"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600"
                        >
                          <option value="">Selecione um prazo</option>
                          <option value="urgente">
                            Urgente (até 2 semanas)
                          </option>
                          <option value="rapido">Rápido (até 1 mês)</option>
                          <option value="normal">Normal (até 2 meses)</option>
                          <option value="flexivel">
                            Flexível (acima de 2 meses)
                          </option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Solicitar Orçamento Personalizado
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Empresas de todos os tamanhos confiam no Stock para gerenciar
                seus inventários
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role} • {testimonial.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para Revolucionar seu Inventário?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Junte-se a milhares de empresas que já otimizaram sua gestão de
                estoque com o Stock. Comece gratuitamente hoje mesmo!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="px-8 py-3 text-lg"
                >
                  <Link href="/">
                    <Package className="h-5 w-5 mr-2" />
                    Começar Gratuitamente
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                >
                  <Link href="/contact">Falar com Vendas</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Stock</span>
              </div>
              <p className="text-gray-400">
                Sistema inteligente de inventário para empresas modernas.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Sistema
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-white transition-colors"
                  >
                    Preços
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contato
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Termos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Stock. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
