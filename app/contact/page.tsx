"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Navigation } from "@/components/navigation"
import { toast } from "@/hooks/use-toast"
import { Package, Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle, Users, Zap } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Mensagem enviada com sucesso!",
      description: "Entraremos em contato em até 24 horas.",
    })

    setFormData({
      name: "",
      email: "",
      company: "",
      subject: "",
      message: "",
    })
    setIsSubmitting(false)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "contato@stock.com.br",
      description: "Resposta em até 24 horas",
    },
    {
      icon: Phone,
      title: "Telefone",
      content: "+55 (11) 9999-9999",
      description: "Seg-Sex, 9h às 18h",
    },
    {
      icon: MapPin,
      title: "Endereço",
      content: "São Paulo, SP - Brasil",
      description: "Atendimento remoto",
    },
    {
      icon: Clock,
      title: "Horário",
      content: "9h às 18h",
      description: "Segunda a Sexta-feira",
    },
  ]

  const faqItems = [
    {
      question: "Como funciona o período de teste gratuito?",
      answer:
        "Você pode usar todas as funcionalidades básicas do Stock gratuitamente, sem limite de tempo. Para recursos premium, oferecemos 14 dias de teste gratuito.",
    },
    {
      question: "Posso usar o Stock offline?",
      answer: "Sim! O Stock funciona offline e sincroniza automaticamente quando você se conecta à internet novamente.",
    },
    {
      question: "Quantos dispositivos posso usar?",
      answer: "No plano gratuito, você pode usar em 1 dispositivo. No plano Premium, não há limite de dispositivos.",
    },
    {
      question: "Como importar meus produtos existentes?",
      answer:
        "Você pode importar produtos via arquivo CSV. Oferecemos um template e instruções detalhadas para facilitar o processo.",
    },
    {
      question: "O Stock funciona em tablets e smartphones?",
      answer:
        "Sim! O Stock é otimizado para funcionar perfeitamente em tablets e smartphones, com interface responsiva.",
    },
    {
      question: "Como funciona o suporte técnico?",
      answer:
        "Oferecemos suporte por email para todos os usuários. Usuários Premium têm suporte prioritário com resposta em até 4 horas.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b dark:border-gray-700">
        <Navigation />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
              <MessageCircle className="h-4 w-4 mr-2" />
              Fale Conosco
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
            Estamos Aqui para Ajudar
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Tem dúvidas sobre o Stock? Precisa de suporte? Nossa equipe está pronta para atendê-lo da melhor forma
            possível.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Send className="h-6 w-6 mr-3" />
                  Envie sua Mensagem
                </CardTitle>
                <CardDescription>Preencha o formulário abaixo e entraremos em contato em até 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Nome da sua empresa (opcional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="Sobre o que você gostaria de falar?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Descreva sua dúvida ou solicitação em detalhes..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{info.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300">{info.content}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{info.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Suporte Especializado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Suporte Premium</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Usuários Premium têm suporte prioritário com resposta em até 4 horas
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Chat ao Vivo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Em breve: chat ao vivo para suporte instantâneo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Perguntas Frequentes</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Encontre respostas rápidas para as dúvidas mais comuns sobre o Stock
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                FAQ - Dúvidas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-300">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
