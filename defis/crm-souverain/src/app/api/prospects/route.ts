import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Statut, Source } from "@prisma/client";
import { prochaineRelance, joursRestants } from "@/lib/relance";

export const dynamic = "force-dynamic";

// GET /api/prospects?vue=relance
export async function GET(request: Request) {
  const url = new URL(request.url);
  const vue = url.searchParams.get("vue");

  const prospects = await prisma.prospect.findMany({
    orderBy: vue === "relance" ? { dernierContact: "asc" } : { dateEntree: "desc" }
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
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body JSON requis" }, { status: 400 });
  }

  const { prenom, nom, email, entreprise, telephone, source, notes } = body as Record<string, unknown>;

  if (!prenom || !nom || !email) {
    return NextResponse.json({ error: "prenom, nom, email requis" }, { status: 400 });
  }

  const prospect = await prisma.prospect.create({
    data: {
      prenom: String(prenom),
      nom: String(nom),
      email: String(email),
      entreprise: entreprise ? String(entreprise) : null,
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
