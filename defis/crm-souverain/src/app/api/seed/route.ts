import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Statut, Source, TypeInteraction } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/seed
// Reset + repopulate : 4 entreprises + 4 prospects + interactions historisées.
// Idempotent : safe to call multiple times.
// v0.2 : ajoute les entreprises (FK) et interactions (log chronologique).
export async function POST() {
  // Ordre de suppression : reverse FK (Interaction dépend de Prospect qui dépend de Entreprise).
  await prisma.interaction.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.entreprise.deleteMany();

  const legrand = await prisma.entreprise.create({
    data: {
      nom: "Cabinet Legrand",
      secteur: "Juridique",
      taille: "PME",
      site: "https://legrand.example",
      adresse: "12 rue de la République, 69001 Lyon",
      notes: "Cabinet d'avocats spécialisé droit des affaires. 15 collaborateurs."
    }
  });
  const techflow = await prisma.entreprise.create({
    data: {
      nom: "TechFlow SAS",
      secteur: "SaaS B2B",
      taille: "TPE",
      site: "https://techflow.example",
      adresse: "3 rue du Sentier, 75002 Paris",
      notes: "Éditeur SaaS gestion de projet. Équipe de 8, en croissance."
    }
  });
  const zenith = await prisma.entreprise.create({
    data: {
      nom: "Studio Zenith",
      secteur: "Design",
      taille: "TPE",
      site: "https://zenith.example",
      adresse: "24 rue de Rivoli, 75004 Paris",
      notes: "Studio design produit et branding. Fondatrice + 3 designers."
    }
  });
  const marketpro = await prisma.entreprise.create({
    data: {
      nom: "MarketPro",
      secteur: "Marketing",
      taille: "PME",
      site: "https://marketpro.example",
      adresse: "8 avenue de la Grande Armée, 75017 Paris",
      notes: "Agence marketing digital. 20 collaborateurs."
    }
  });

  const alice = await prisma.prospect.create({
    data: {
      prenom: "Alice", nom: "Martin", email: "alice.martin@legrand.example",
      telephone: "+33 6 00 00 00 12", entrepriseId: legrand.id,
      statut: Statut.NOUVEAU, source: Source.LINKEDIN,
      dateEntree: new Date("2026-08-25"), dernierContact: new Date("2026-08-25"),
      notes: "A répondu au DM LinkedIn, demande d'infos sur l'offre. Rappeler cette semaine."
    }
  });
  const bob = await prisma.prospect.create({
    data: {
      prenom: "Bob", nom: "Durand", email: "b.durand@techflow.example",
      telephone: "+33 6 00 00 00 34", entrepriseId: techflow.id,
      statut: Statut.EN_COURS, source: Source.RECOMMANDATION,
      dateEntree: new Date("2026-08-10"), dernierContact: new Date("2026-08-28"),
      notes: "Envoi de la maquette prévu. Il attend un devis avant fin de mois. Sensible au prix.",
      montantPotentiel: 1500
    }
  });
  const chloe = await prisma.prospect.create({
    data: {
      prenom: "Chloé", nom: "Dubois", email: "c.dubois@zenith.example",
      telephone: "+33 6 00 00 00 56", entrepriseId: zenith.id,
      statut: Statut.GAGNE, source: Source.SITE,
      dateEntree: new Date("2026-08-05"), dernierContact: new Date("2026-08-30"),
      notes: "Contrat signé le 30/8. Onboarding la semaine du 8/9.",
      montantPotentiel: 2500
    }
  });
  const emma = await prisma.prospect.create({
    data: {
      prenom: "Emma", nom: "Petit", email: "e.petit@marketpro.example",
      telephone: "+33 6 00 00 00 78", entrepriseId: marketpro.id,
      statut: Statut.PERDU, source: Source.LINKEDIN,
      dateEntree: new Date("2026-08-08"), dernierContact: new Date("2026-08-22"),
      notes: "Pas de budget cette année. À rappeler début 2027 si l'offre évolue."
    }
  });

  await prisma.interaction.createMany({
    data: [
      { prospectId: alice.id, type: TypeInteraction.LI, date: new Date("2026-08-24"), resume: "DM LinkedIn initial (source LKDN_SC_METHODE)", resultat: "A répondu positivement dans les 20 min", nextStep: "Envoyer le lien de la maquette de présentation" },
      { prospectId: alice.id, type: TypeInteraction.LI, date: new Date("2026-08-25"), resume: "Réponse : demande d'infos sur l'offre complète", resultat: "Intéressée par le pack Complet", nextStep: "Rappeler cette semaine pour caler un appel de découverte" },

      { prospectId: bob.id, type: TypeInteraction.LI, date: new Date("2026-08-10"), resume: "Introduction via recommandation de Julien P.", resultat: "Réponse enthousiaste, ouvert à un appel", nextStep: "Envoyer un lien de RDV" },
      { prospectId: bob.id, type: TypeInteraction.RDV, date: new Date("2026-08-14"), resume: "Appel découverte 30 min", resultat: "Budget 1200-1800 EUR, besoin sur la gestion de tickets support", nextStep: "Envoyer maquette custom" },
      { prospectId: bob.id, type: TypeInteraction.EMAIL, date: new Date("2026-08-20"), resume: "Envoi maquette + proposition financière 1500 EUR", resultat: "Accusé de réception", nextStep: "Relancer sous 8 jours si pas de réponse" },
      { prospectId: bob.id, type: TypeInteraction.EMAIL, date: new Date("2026-08-28"), resume: "Relance douce (question sur la maquette)", resultat: "Il demande un délai jusqu'à fin de mois pour arbitrer avec associé", nextStep: "Rappel prévu 05/09" },

      { prospectId: chloe.id, type: TypeInteraction.EMAIL, date: new Date("2026-08-05"), resume: "Réponse au formulaire de contact du site", resultat: "Demande un devis pour refonte visuelle CRM", nextStep: "Envoyer proposition" },
      { prospectId: chloe.id, type: TypeInteraction.RDV, date: new Date("2026-08-12"), resume: "Appel découverte 45 min", resultat: "Alignement produit + design, timing serré (livraison 30/9)", nextStep: "Envoyer contrat" },
      { prospectId: chloe.id, type: TypeInteraction.EMAIL, date: new Date("2026-08-22"), resume: "Envoi contrat 2500 EUR", resultat: "Contrat lu, quelques points à clarifier", nextStep: "Appel de finalisation" },
      { prospectId: chloe.id, type: TypeInteraction.APPEL, date: new Date("2026-08-30"), resume: "Signature contrat via visio + Docusign", resultat: "Contrat signé, acompte 50% reçu", nextStep: "Lancer onboarding lundi 8/9" },

      { prospectId: emma.id, type: TypeInteraction.LI, date: new Date("2026-08-08"), resume: "DM LinkedIn (source LKDN_SC_RESEAU)", resultat: "Réponse polie, intérêt de principe", nextStep: "Envoyer un cas client similaire (agence marketing)" },
      { prospectId: emma.id, type: TypeInteraction.EMAIL, date: new Date("2026-08-15"), resume: "Envoi cas client MarketPro", resultat: "Réponse : intéressant mais pas prioritaire", nextStep: "Relancer dans 1 semaine" },
      { prospectId: emma.id, type: TypeInteraction.APPEL, date: new Date("2026-08-22"), resume: "Rappel : disponibilité budget 2026 ?", resultat: "Aucun budget disponible sur 2026, priorités internes", nextStep: "Repositionner début 2027" }
    ]
  });

  const [nbEnt, nbPros, nbInt] = await Promise.all([
    prisma.entreprise.count(),
    prisma.prospect.count(),
    prisma.interaction.count()
  ]);
  return NextResponse.json({
    ok: true,
    entreprises: nbEnt,
    prospects: nbPros,
    interactions: nbInt,
    message: `Seed v0.2 OK - ${nbEnt} entreprises, ${nbPros} prospects, ${nbInt} interactions`
  }, { status: 200 });
}

// GET /api/seed - same as POST for convenience (curl without -X)
export async function GET() {
  return POST();
}
