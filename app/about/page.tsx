"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Target,
  Eye,
  Heart,
  Users,
  Zap,
  Shield,
  Globe,
  Award,
  TrendingUp,
  Code,
  Smartphone,
  Cloud,
  Database,
} from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Foco no Cliente",
      description:
        "Desenvolvemos soluções pensando sempre nas necessidades reais dos nossos usuários.",
    },
    {
      icon: Zap,
      title: "Inovação Constante",
      description:
        "Buscamos sempre as melhores tecnologias para oferecer a melhor experiência.",
    },
    {
      icon: Shield,
      title: "Confiabilidade",
      description:
        "Seus dados estão seguros conosco. Priorizamos a segurança em tudo que fazemos.",
    },
    {
      icon: Heart,
      title: "Simplicidade",
      description:
        "Acreditamos que tecnologia deve simplificar, não complicar os processos.",
    },
  ];

  const technologies = [
    {
      icon: Code,
      name: "Next.js",
      description: "Framework React para aplicações web modernas",
    },
    {
      icon: Smartphone,
      name: "PWA",
      description: "Progressive Web App para experiência mobile nativa",
    },
    {
      icon: Cloud,
      name: "Cloud Storage",
      description: "Armazenamento seguro na nuvem",
    },
    {
      icon: Database,
      name: "Real-time Sync",
      description: "Sincronização em tempo real entre dispositivos",
    },
  ];

  const stats = [
    { number: "10K+", label: "Empresas Atendidas" },
    { number: "1M+", label: "Produtos Escaneados" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Suporte" },
  ];

  return (
    <div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
              <Package className="h-4 w-4 mr-2" />
              Sobre o Stock
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
            Revolucionando a Gestão de Inventário
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Somos uma empresa brasileira focada em desenvolver soluções
            tecnológicas que simplificam a gestão de estoque para empresas de
            todos os tamanhos.
          </p>
        </section>

        {/* Mission, Vision, Values */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Nossa Missão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Democratizar o acesso a ferramentas profissionais de gestão de
                inventário, tornando-as acessíveis e fáceis de usar para
                empresas de todos os portes.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Nossa Visão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Ser a principal plataforma de gestão de inventário no Brasil,
                reconhecida pela inovação, simplicidade e eficiência.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl">Nossos Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Transparência, inovação, foco no cliente e compromisso com a
                excelência em tudo que desenvolvemos.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Detail */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Nossos Valores em Ação
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Cada decisão que tomamos é guiada por nossos valores fundamentais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Technologies */}
        <section className="mb-16 bg-white/50 dark:bg-gray-800/50 rounded-2xl p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tecnologias que Utilizamos
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Utilizamos as melhores e mais modernas tecnologias para garantir
              performance e confiabilidade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <Card
                  key={index}
                  className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">{tech.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tech.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Números que Falam por Si
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nosso crescimento reflete a confiança que nossos clientes
              depositam em nós
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <Users className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nossa Equipe
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Somos um time apaixonado por tecnologia e comprometido em criar
              soluções que realmente fazem a diferença no dia a dia das empresas
              brasileiras.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-0 px-4 py-2"
              >
                <Code className="h-4 w-4 mr-2" />
                Desenvolvedores
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-0 px-4 py-2"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analistas de Negócio
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-0 px-4 py-2"
              >
                <Award className="h-4 w-4 mr-2" />
                Especialistas em UX
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-0 px-4 py-2"
              >
                <Globe className="h-4 w-4 mr-2" />
                Suporte Técnico
              </Badge>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
