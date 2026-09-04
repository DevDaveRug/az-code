import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prochaineRelance, joursRestants } from "@/lib/relance";
import { derniereInteractionAt } from "@/lib/interactions";

export const dynamic = "force-dynamic";

// GET /api/prospects/[id]
// Retourne le prospect avec son entreprise et ses interactions (triées par date desc),
// enrichi de la dernière interaction calculée + prochaine relance.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      entreprise: true,
      interactions: { orderBy: { date: "desc" } }
    }
  });

  if (!prospect) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const derniereInter = derniereInteractionAt(prospect, prospect.interactions);
  const pr = prochaineRelance({ statut: prospect.statut, dernierContact: derniereInter });
  const jr = joursRestants(pr);

  return NextResponse.json({
    ...prospect,
    derniereInteractionAt: derniereInter,
    prochaineRelance: pr,
    joursRestants: jr
  });
}
