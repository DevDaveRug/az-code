import { PrismaClient, Statut, Source } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.prospect.deleteMany();

  await prisma.prospect.createMany({
    data: [
      {
        prenom: "Alice",
        nom: "Martin",
        entreprise: "Cabinet Legrand",
        email: "alice.martin@legrand.example",
        telephone: "+33 6 00 00 00 12",
        statut: Statut.NOUVEAU,
        source: Source.LINKEDIN,
        dateEntree: new Date("2026-08-25"),
        dernierContact: new Date("2026-08-25"),
        notes: "A répondu au DM LinkedIn, demande d'infos sur l'offre. Rappeler cette semaine."
      },
      {
        prenom: "Bob",
        nom: "Durand",
        entreprise: "TechFlow SAS",
        email: "b.durand@techflow.example",
        telephone: "+33 6 00 00 00 34",
        statut: Statut.EN_COURS,
        source: Source.RECOMMANDATION,
        dateEntree: new Date("2026-08-10"),
        dernierContact: new Date("2026-08-20"),
        notes: "Envoi de la maquette prévu. Il attend un devis avant fin de mois. Sensible au prix.",
        montantPotentiel: 1500
      },
      {
        prenom: "Chloé",
        nom: "Dubois",
        entreprise: "Studio Zenith",
        email: "c.dubois@zenith.example",
        telephone: "+33 6 00 00 00 56",
        statut: Statut.GAGNE,
        source: Source.SITE,
        dateEntree: new Date("2026-08-05"),
        dernierContact: new Date("2026-08-30"),
        notes: "Contrat signé le 30/8. Onboarding la semaine du 8/9.",
        montantPotentiel: 2500
      },
      {
        prenom: "Emma",
        nom: "Petit",
        entreprise: "MarketPro",
        email: "e.petit@marketpro.example",
        telephone: "+33 6 00 00 00 78",
        statut: Statut.PERDU,
        source: Source.LINKEDIN,
        dateEntree: new Date("2026-08-08"),
        dernierContact: new Date("2026-08-22"),
        notes: "Pas de budget cette année. À rappeler début 2027 si l'offre évolue."
      }
    ]
  });

  const count = await prisma.prospect.count();
  console.log(`Seed OK - ${count} prospects insérés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
