// next.config.mjs
import { execSync } from "child_process";

/** @type {import('next').NextConfig} */

// --- CÁLCULO AUTOMÁTICO DA VERSÃO (SemVer via Git) ---
let appVersion = "v1.0.0"; // Valor padrão (fallback caso não tenha git)

try {
  // 1. Pega o número total de commits do branch atual
  const commitCount = parseInt(
    execSync("git rev-list --count HEAD").toString().trim()
  );

  // 2. Aplica a lógica: a cada 100 commits sobe 1 versão minor
  const major = 1;
  const minor = Math.floor(commitCount / 100);
  const patch = commitCount % 100;

  appVersion = `v${major}.${minor}.${patch}`;

  // Log para você ver no terminal quando iniciar
  console.log(
    `🔹 Versão Gerada: ${appVersion} (Total Commits: ${commitCount})`
  );
} catch (e) {
  console.warn("⚠️ Não foi possível ler o Git. Usando versão padrão v1.0.0");
}
// -----------------------------------------------------

const nextConfig = {
  // Expõe a variável para o Frontend
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },

  // Suas configurações existentes (Mantidas)
  experimental: {
    optimizePackageImports: ["lucide-react", "@/components/ui"],
  },

  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }
    return config;
  },

  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
  },

  compress: true,

  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(ico|png|jpg|jpeg|gif|webp|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
