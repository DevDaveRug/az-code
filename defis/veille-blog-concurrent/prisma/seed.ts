import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Idempotent : rejoue a chaque deploiement sans creer de doublon.
async function main() {
  await prisma.source.upsert({
    where: { fluxRss: "https://www.lanutrition.fr/rss.xml" },
    update: {},
    create: { nom: "lanutrition.fr", fluxRss: "https://www.lanutrition.fr/rss.xml", usage: "Demo Claire (nutrition)" },
  });
}

main().finally(() => prisma.$disconnect());
