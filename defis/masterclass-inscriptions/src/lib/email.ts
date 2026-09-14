// Envoi d'email de confirmation d'inscription à une masterclass.
// Défi Alegria n°3 : l'énoncé demande un email personnalisé (prénom + date) envoyé automatiquement dès qu'un inscrit est ajouté.
//
// Modes d'envoi :
//   EMAIL_MODE=resend  -> envoi réel via Resend
//   EMAIL_MODE=console -> log dans la console (dev local sans clé API)

import { Resend } from "resend";

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function sendConfirmationEmail(params: {
  to: string;
  prenom: string;
  dateMasterclass: Date;
}): Promise<SendResult> {
  const mode = process.env.EMAIL_MODE ?? "console";
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const dateFR = params.dateMasterclass.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const subject = `Ta place pour la masterclass du ${dateFR} est confirmée`;

  const body = [
    `Salut ${params.prenom},`,
    "",
    `Ta place pour la masterclass du ${dateFR} est confirmée.`,
    "",
    "Je t'envoie le lien de connexion + le programme détaillé quelques jours avant.",
    "",
    "Si tu as la moindre question d'ici là, réponds simplement à cet email.",
    "",
    "À très vite,",
    "David",
  ].join("\n");

  if (mode === "console") {
    console.log("---");
    console.log("[EMAIL_MODE=console] Simulé, aucun envoi réel.");
    console.log(`To      : ${params.to}`);
    console.log(`From    : ${from}`);
    console.log(`Subject : ${subject}`);
    console.log("Body    :");
    console.log(body);
    console.log("---");
    return { ok: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY manquant" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject,
      text: body,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
