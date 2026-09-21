import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { envoyerEmailConfirmation, notifierTelegramSiUrgent } from "@/lib/notify";
import { Urgence } from "@prisma/client";

export const dynamic = "force-dynamic";

const URGENCES: Urgence[] = ["BASSE", "MOYENNE", "HAUTE", "CRITIQUE"];

export async function GET() {
  const demandes = await prisma.demande.findMany({
    include: { client: true },
    orderBy: [{ dateDemande: "desc" }],
  });
  return NextResponse.json({ demandes });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nomClient = (body.nomClient ?? "").toString().trim();
    const emailClient = (body.emailClient ?? "").toString().trim().toLowerCase();
    const telephoneClient = body.telephoneClient ? body.telephoneClient.toString().trim() : null;
    const description = (body.description ?? "").toString().trim();
    const urgenceClientRaw = (body.urgenceClient ?? "MOYENNE").toString().toUpperCase();

    if (!nomClient || !emailClient || !description) {
      return NextResponse.json({ error: "Nom, email et description requis." }, { status: 400 });
    }
    if (!URGENCES.includes(urgenceClientRaw as Urgence)) {
      return NextResponse.json({ error: "Urgence invalide." }, { status: 400 });
    }
    const urgenceClient = urgenceClientRaw as Urgence;

    // Matching client existant par email, sinon creation
    let client = await prisma.client.findUnique({ where: { email: emailClient } });
    if (!client) {
      client = await prisma.client.create({
        data: { nom: nomClient, email: emailClient, telephone: telephoneClient },
      });
    }

    const demande = await prisma.demande.create({
      data: {
        clientId: client.id,
        description,
        urgenceClient,
        urgenceReelle: urgenceClient, // copie initiale, editable par proprietaire
        nomClientTemp: nomClient,
        emailClientTemp: emailClient,
        telephoneClientTemp: telephoneClient,
      },
    });

    const ref = `DR#${demande.id}`;

    // Async notifs (fire & forget)
    envoyerEmailConfirmation({ to: emailClient, ref, nom: nomClient, description, urgenceClient }).catch(console.error);
    notifierTelegramSiUrgent({ urgenceReelle: urgenceClient, ref, nom: nomClient, description }).catch(console.error);

    return NextResponse.json({ ok: true, id: demande.id, ref }, { status: 201 });
  } catch (e) {
    console.error("POST /api/demandes", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
