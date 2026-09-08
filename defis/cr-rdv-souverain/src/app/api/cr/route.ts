import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatterViaN8n } from "@/lib/n8n-format";

export const runtime = "nodejs";

// POST /api/cr
// Body : { "notesBrutes": "..." }
// Retour : { id, crFormate, dateRdv, interlocuteur, sujet, modeleLlm }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { notesBrutes?: unknown };
    const notesBrutes = typeof body.notesBrutes === "string" ? body.notesBrutes.trim() : "";

    if (!notesBrutes) {
      return NextResponse.json({ error: "notesBrutes vide" }, { status: 400 });
    }

    const resultat = await formatterViaN8n(notesBrutes);

    const cr = await prisma.cr.create({
      data: {
        notesBrutes,
        crFormate: resultat.crFormate,
        dateRdv: resultat.dateRdv ? new Date(resultat.dateRdv) : null,
        interlocuteur: resultat.interlocuteur,
        sujet: resultat.sujet,
        modeleLlm: resultat.modeleLlm,
      },
      select: {
        id: true,
        crFormate: true,
        dateRdv: true,
        interlocuteur: true,
        sujet: true,
        modeleLlm: true,
        createdAt: true,
      },
    });

    return NextResponse.json(cr, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/cr -- liste les 20 CR les plus récents
export async function GET() {
  const crs = await prisma.cr.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      dateRdv: true,
      interlocuteur: true,
      sujet: true,
      modeleLlm: true,
    },
  });
  return NextResponse.json(crs);
}
