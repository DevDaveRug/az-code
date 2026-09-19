// POST /api/inscrits : crée un inscrit + envoie l'email de confirmation.
// GET /api/inscrits   : liste (utile pour tests / API souveraine).
//
// La logique métier :
//   1. valider le payload
//   2. créer la ligne en DB avec statutEmail = EN_ATTENTE
//   3. envoyer l'email de confirmation
//   4. updater la ligne avec ENVOYE (ou ERREUR + message)
//   5. renvoyer l'inscrit final (avec son statut d'envoi)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";
import { StatutEmail } from "@prisma/client";

export const runtime = "nodejs"; // Prisma + Resend nécessitent Node.

type Payload = {
  prenom?: unknown;
  email?: unknown;
  dateMasterclass?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: NextRequest) {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!isNonEmptyString(body.prenom)) {
    return NextResponse.json({ error: "Prénom requis" }, { status: 400 });
  }
  if (!isNonEmptyString(body.email) || !isValidEmail(body.email)) {
    return NextResponse.json({ error: "Email valide requis" }, { status: 400 });
  }
  if (!isNonEmptyString(body.dateMasterclass)) {
    return NextResponse.json({ error: "Date de masterclass requise (YYYY-MM-DD)" }, { status: 400 });
  }
  const dateMc = new Date(body.dateMasterclass);
  if (Number.isNaN(dateMc.getTime())) {
    return NextResponse.json({ error: "Date de masterclass invalide" }, { status: 400 });
  }

  const created = await prisma.inscrit.create({
    data: {
      prenom: body.prenom.trim(),
      email: body.email.trim(),
      dateMasterclass: dateMc,
      statutEmail: StatutEmail.EN_ATTENTE,
    },
  });

  const sent = await sendConfirmationEmail({
    to: created.email,
    prenom: created.prenom,
    dateMasterclass: created.dateMasterclass,
  });

  const updated = await prisma.inscrit.update({
    where: { id: created.id },
    data: sent.ok
      ? { statutEmail: StatutEmail.ENVOYE, emailError: null }
      : { statutEmail: StatutEmail.ERREUR, emailError: sent.error },
  });

  return NextResponse.json(
    {
      id: updated.id,
      prenom: updated.prenom,
      email: updated.email,
      dateMasterclass: updated.dateMasterclass,
      emailStatus: updated.statutEmail,
      emailError: updated.emailError,
    },
    { status: 201 }
  );
}

export async function GET() {
  try {
    const inscrits = await prisma.inscrit.findMany({
      orderBy: [{ dateMasterclass: "asc" }, { dateInscription: "asc" }],
    });
    return NextResponse.json(inscrits);
  } catch (e) {
    // DEBUG TEMPORAIRE S136z -- a retirer une fois le 500 diagnostique.
    return NextResponse.json(
      { debugError: e instanceof Error ? e.message : String(e), debugStack: e instanceof Error ? e.stack : null },
      { status: 500 }
    );
  }
}
