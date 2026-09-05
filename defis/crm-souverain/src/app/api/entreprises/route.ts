import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/entreprises?q=... (recherche par nom, insensible casse et accents)
// Utilisé par le dropdown searchable custom côté UI.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const entreprises = await prisma.entreprise.findMany({
    where: q ? { nom: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { nom: "asc" },
    take: 50,
    select: {
      id: true,
      nom: true,
      secteur: true,
      taille: true
    }
  });

  return NextResponse.json({ count: entreprises.length, entreprises });
}

// POST /api/entreprises
// Crée une entreprise. Utilisé quand un prospect est créé avec une entreprise pas encore en base
// (option "créer une nouvelle entreprise" dans le dropdown searchable custom).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.nom || typeof body.nom !== "string") {
    return NextResponse.json({ error: "nom (string) requis" }, { status: 400 });
  }

  const entreprise = await prisma.entreprise.create({
    data: {
      nom: String(body.nom).trim(),
      secteur: body.secteur ? String(body.secteur).trim() : null,
      taille: body.taille ? String(body.taille).trim() : null,
      site: body.site ? String(body.site).trim() : null,
      adresse: body.adresse ? String(body.adresse).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null
    }
  });

  return NextResponse.json(entreprise, { status: 201 });
}
