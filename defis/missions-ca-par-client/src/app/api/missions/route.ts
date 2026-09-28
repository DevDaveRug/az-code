import { NextResponse } from "next/server";
import { Prisma, StatutMission } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUTS = Object.values(StatutMission);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const missions = await prisma.mission.findMany({
    include: { client: true },
    orderBy: [{ dateFin: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ missions });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const intitule = (body.intitule ?? "").toString().trim();
    const statut = (body.statut ?? "A_FAIRE").toString() as StatutMission;
    const montant = Number(body.montant);
    const dateFin = body.dateFin ? body.dateFin.toString() : null;
    const facture = body.facture === true;

    // Les types sont verifies ici : c'est ce qui manquait a la base d'origine
    if (!intitule) return erreur("L'intitulé de la mission est requis.");
    if (!STATUTS.includes(statut)) return erreur("Statut invalide.");
    if (!Number.isFinite(montant) || montant < 0 || montant > 1e10) return erreur("Montant invalide : un nombre en euros, sans lettre.");
    if (dateFin && (!DATE_ISO.test(dateFin) || Number.isNaN(Date.parse(`${dateFin}T00:00:00Z`)))) return erreur("Date de fin invalide.");

    // Client : choisi dans la liste, ou cree une seule fois (rapprochement par e-mail)
    let clientId: number;
    let clientExistant = true;
    if (body.clientId) {
      const client = await prisma.client.findUnique({ where: { id: Number(body.clientId) } });
      if (!client) return erreur("Client introuvable.");
      clientId = client.id;
    } else {
      const nom = (body.nouveauClient?.nom ?? "").toString().trim();
      const email = (body.nouveauClient?.email ?? "").toString().trim().toLowerCase();
      const contact = body.nouveauClient?.contact ? body.nouveauClient.contact.toString().trim() : null;
      if (!nom || !EMAIL.test(email)) return erreur("Nouveau client : nom et e-mail valide requis.");
      const existant = await prisma.client.findUnique({ where: { email } });
      clientExistant = Boolean(existant);
      clientId = existant ? existant.id : (await prisma.client.create({ data: { nom, email, contact } })).id;
    }

    const mission = await prisma.mission.create({
      data: {
        intitule,
        clientId,
        statut,
        montant: new Prisma.Decimal(montant.toFixed(2)),
        dateFin: dateFin ? new Date(`${dateFin}T00:00:00Z`) : null,
        facture,
      },
    });
    return NextResponse.json({ ok: true, id: mission.id, clientId, clientExistant }, { status: 201 });
  } catch (e) {
    console.error("POST /api/missions", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

function erreur(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
