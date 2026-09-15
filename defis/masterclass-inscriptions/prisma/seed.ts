// Seed du défi masterclass-inscriptions.
// Reprend les 5 lignes de az-no-code/defis/masterclass-inscriptions/airtable/exemples.md
// pour que la démo code miroir la démo no-code.
// Anonymisation stricte SAUF ligne 5 (David lui-même, test explicite énoncé).

import { PrismaClient, StatutEmail } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Idempotent : on repart d'une table propre pour un seed reproductible.
  await prisma.inscrit.deleteMany({});

  const inscrits = [
    {
      prenom: "Alice",
      email: "alice.martin@legrand.example",
      dateMasterclass: new Date("2026-10-14"),
      statutEmail: StatutEmail.ENVOYE,
      notes: "Inscrite via LinkedIn (donnée fictive)",
    },
    {
      prenom: "Bob",
      email: "b.durand@techflow.example",
      dateMasterclass: new Date("2026-10-14"),
      statutEmail: StatutEmail.ENVOYE,
      notes: "Inscrit via le site (donnée fictive)",
    },
    {
      prenom: "Chloé",
      email: "c.dubois@zenith.example",
      dateMasterclass: new Date("2026-10-21"),
      statutEmail: StatutEmail.ENVOYE,
      notes: "Recommandation d'un ancien client (donnée fictive)",
    },
    {
      prenom: "Emma",
      email: "e.petit@marketpro.example",
      dateMasterclass: new Date("2026-11-05"),
      statutEmail: StatutEmail.EN_ATTENTE,
      notes: "Ajoutée juste avant la démo, doit passer à Envoyé après trigger (donnée fictive)",
    },
    {
      prenom: "David",
      email: "david@salescloser.fr",
      dateMasterclass: new Date("2026-10-14"),
      statutEmail: StatutEmail.ENVOYE,
      notes: "Test défi Alegria semaine 38 - inscription réelle demandée par l'énoncé",
    },
  ];

  for (const inscrit of inscrits) {
    await prisma.inscrit.create({ data: inscrit });
  }

  console.log(`Seed OK - ${inscrits.length} inscrits créés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
