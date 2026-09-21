// Helpers email + Telegram, avec fallback console pour dev sans credentials.

type Urgence = "BASSE" | "MOYENNE" | "HAUTE" | "CRITIQUE";

export async function envoyerEmailConfirmation(params: {
  to: string;
  ref: string;
  nom: string;
  description: string;
  urgenceClient: Urgence;
}) {
  const subject = `Ta demande ${params.ref} est bien recue`;
  const body = `Bonjour ${params.nom},

Ta demande a bien ete recue. Voici le recapitulatif :

Description : ${params.description}
Niveau d urgence : ${params.urgenceClient}

On te recontacte des que possible.

Merci pour ta confiance.`;

  const mode = process.env.EMAIL_MODE ?? "console";

  if (mode === "console" || !process.env.RESEND_API_KEY) {
    console.log(`[EMAIL] to=${params.to} subject="${subject}" body="${body}"`);
    return { mode: "console", ok: true };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const { data, error } = await resend.emails.send({ from, to: params.to, subject, text: body });
  if (error) { console.error("Resend error", error); return { mode: "resend", ok: false, error }; }
  return { mode: "resend", ok: true, id: data?.id };
}

export async function notifierTelegramSiUrgent(params: {
  urgenceReelle: Urgence;
  ref: string;
  nom: string;
  description: string;
}) {
  if (params.urgenceReelle !== "HAUTE" && params.urgenceReelle !== "CRITIQUE") return { skipped: true };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = `Demande urgente ${params.ref} (${params.urgenceReelle}) de ${params.nom} :\n${params.description}`;

  const mode = process.env.TELEGRAM_MODE ?? "console";
  if (mode === "console" || !token || !chatId) {
    console.log(`[TELEGRAM] chatId=${chatId ?? "(missing)"} text="${text}"`);
    return { mode: "console", ok: true };
  }

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const json = await r.json().catch(() => ({}));
  return { mode: "telegram", ok: r.ok, response: json };
}
