/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Défi Alegria masterclass-inscriptions : runtime Node par défaut (Prisma + Resend).
  // Fix S136z : le file tracing de Next.js sur Vercel omet parfois le moteur Prisma
  // (.prisma/client/*.node) du bundle de la fonction serverless -> crash silencieux
  // à l'initialisation de PrismaClient (500 sans corps de réponse, même avec try/catch
  // dans le handler). Inclusion explicite recommandée par la doc Prisma.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    "/": ["./node_modules/.prisma/client/**/*"],
  },
};

module.exports = nextConfig;
