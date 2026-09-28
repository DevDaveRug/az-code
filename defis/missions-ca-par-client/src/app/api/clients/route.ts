import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CA_VIDE, calculerCaParClient } from "@/lib/ca";

export const dynamic = "force-dynamic";

export async function GET() {
  const [clients, missions] = await Promise.all([
    prisma.client.findMany({ orderBy: { nom: "asc" } }),
    prisma.mission.findMany({ select: { clientId: true, statut: true, montant: true, facture: true } }),
  ]);
  const ca = calculerCaParClient(missions.map((m) => ({ ...m, montant: m.montant.toNumber() })));
  return NextResponse.json({
    clients: clients.map((c) => ({ id: c.id, nom: c.nom, contact: c.contact, email: c.email, ...(ca.get(c.id) ?? CA_VIDE) })),
  });
}
