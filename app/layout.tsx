import type React from "react";
import type { Metadata, Viewport } from "next"; // 1. Importe Viewport
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Navigation } from "@/components/shared/navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stock-system.vercel.app"),
  title: "Stock - Sistema de Conferência de Estoque",
  description:
    "Sistema web responsivo para conferência de estoque com leitor de código de barras",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stock",
  },
  generator: "v0.dev",
  // Open Graph
  openGraph: {
    title: "Stock - Sistema de Conferência de Estoque",
    description:
      "Sistema web responsivo para conferência de estoque com leitor de código de barras",
    url: "https://stock-system.vercel.app",
    siteName: "Stock",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Stock - Sistema de Estoque",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Stock - Sistema de Conferência de Estoque",
    description:
      "Sistema web responsivo para conferência de estoque com leitor de código de barras",
    images: ["/icon-512x512.png"],
    creator: "@stock_system",
  },
  // Additional meta tags
  keywords: [
    "estoque",
    "inventário",
    "código de barras",
    "conferência",
    "sistema",
    "stock",
    "warehouse",
  ],
  authors: [{ name: "Stock System" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/icon-192x192.png"
          as="image"
          type="image/png"
        />
        <link
          rel="preload"
          href="/manifest.json"
          as="fetch"
          crossOrigin="anonymous"
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Stock" />

        {/* Apple Touch Icons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon-180x180.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-touch-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-touch-icon-120x120.png"
        />

        {/* Standard favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icon-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/icon-512x512.png"
        />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <header className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b dark:border-gray-700">
              <Navigation />
            </header>
            {children}
          </div>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
