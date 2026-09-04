import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TypeInteraction } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/prospects/[id]/interactions
// Crée une interaction pour un prospect + met à jour prospect.dernierContact si l'interaction
// est plus récente que la valeur actuelle (garde l'index [statut, dernier_contact] utile).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.type || !body.date || !body.resume) {
    return NextResponse.json({ error: "type, date, resume requis" }, { status: 400 });
  }

  const typeStr = String(body.type) as TypeInteraction;
  if (!Object.values(TypeInteraction).includes(typeStr)) {
    return NextResponse.json({ error: `type invalide (attendu : ${Object.values(TypeInteraction).join(", ")})` }, { status: 400 });
  }

  const date = new Date(String(body.date));
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "date invalide (ISO 8601 attendu)" }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    select: { id: true, dernierContact: true }
  });
  if (!prospect) {
    return NextResponse.json({ error: "prospect not found" }, { status: 404 });
  }

  const [interaction] = await prisma.$transaction([
    prisma.interaction.create({
      data: {
        prospectId: id,
        type: typeStr,
        date,
        resume: String(body.resume),
        resultat: body.resultat ? String(body.resultat) : null,
        nextStep: body.nextStep ? String(body.nextStep) : null
      }
    }),
    // Met à jour prospect.dernierContact si l'interaction est plus récente.
    prisma.prospect.update({
      where: { id },
      data: {
        dernierContact: date > prospect.dernierContact ? date : prospect.dernierContact
      }
    })
  ]);

  return NextResponse.json(interaction, { status: 201 });
}
