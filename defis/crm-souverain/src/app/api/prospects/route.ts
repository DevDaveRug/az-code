import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Statut, Source } from "@prisma/client";
import { prochaineRelance, joursRestants } from "@/lib/relance";

export const dynamic = "force-dynamic";

// GET /api/prospects?vue=relance
// v0.2 : inclut la relation entreprise (id + nom) pour affichage direct côté client.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const vue = url.searchParams.get("vue");

  const prospects = await prisma.prospect.findMany({
    orderBy: vue === "relance" ? { dernierContact: "asc" } : { dateEntree: "desc" },
    include: { entreprise: { select: { id: true, nom: true, secteur: true } } }
  });

  const today = new Date();
  const enriched = prospects.map((p) => {
    const pr = prochaineRelance(p);
    return {
      ...p,
      prochaineRelance: pr,
      joursRestants: joursRestants(pr, today)
    };
  });

  const rows = vue === "relance" ? enriched.filter((p) => p.joursRestants !== null && p.joursRestants <= 0) : enriched;

  return NextResponse.json({ count: rows.length, prospects: rows });
}

// POST /api/prospects
// v0.2 : accepte entrepriseId (Int?) au lieu de entreprise (String).
// L'entreprise doit préexister -- pour créer une entreprise inline, appeler POST /api/entreprises
// d'abord et utiliser l'id retourné, OU passer par la server action de /nouveau qui gère la
// création inline (option "+ Créer nouvelle entreprise" du dropdown searchable).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body JSON requis" }, { status: 400 });
  }

  const { prenom, nom, email, entrepriseId, telephone, source, notes } = body as Record<string, unknown>;

  if (!prenom || !nom || !email) {
    return NextResponse.json({ error: "prenom, nom, email requis" }, { status: 400 });
  }

  // entrepriseId optionnel : Int > 0 ou null.
  let resolvedEntrepriseId: number | null = null;
  if (entrepriseId !== undefined && entrepriseId !== null) {
    const parsed = Number(entrepriseId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "entrepriseId doit être un entier positif ou null" }, { status: 400 });
    }
    const exists = await prisma.entreprise.findUnique({ where: { id: parsed }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: `entreprise #${parsed} introuvable` }, { status: 400 });
    }
    resolvedEntrepriseId = parsed;
  }

  const prospect = await prisma.prospect.create({
    data: {
      prenom: String(prenom),
      nom: String(nom),
      email: String(email),
      entrepriseId: resolvedEntrepriseId,
      telephone: telephone ? String(telephone) : null,
      source: (source as Source) ?? Source.AUTRE,
      notes: notes ? String(notes) : null,
      statut: Statut.NOUVEAU,
      dateEntree: new Date(),
      dernierContact: new Date()
    }
  });

  return NextResponse.json(prospect, { status: 201 });
}
