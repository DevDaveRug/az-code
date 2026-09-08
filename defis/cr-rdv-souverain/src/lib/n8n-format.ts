// Appel du webhook n8n qui formate les notes brutes en CR structuré via OpenRouter.
// Le prompt système (PROMPT_LLM.md) vit côté n8n -- une amélioration du prompt bénéficie
// à tous les clients sans redeploy de l'app Next.js.
//
// Le webhook n8n doit retourner un JSON de la forme :
// {
//   "crFormate": "## CR RDV -- ...",  // markdown complet
//   "dateRdv": "2026-09-08T15:00:00Z" | null,
//   "interlocuteur": "Marie Dupont (Acme SARL)" | null,
//   "sujet": "refonte site vitrine" | null,
//   "modeleLlm": "anthropic/claude-sonnet-5"
// }

export interface N8nCrResult {
  crFormate: string;
  dateRdv: string | null;
  interlocuteur: string | null;
  sujet: string | null;
  modeleLlm: string;
}

export async function formatterViaN8n(notesBrutes: string): Promise<N8nCrResult> {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url || !secret) {
    throw new Error("N8N_WEBHOOK_URL et N8N_WEBHOOK_SECRET requis dans .env.local");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": secret,
    },
    body: JSON.stringify({
      notesBrutes,
      modeleLlm: process.env.LLM_MODEL_DEFAULT ?? "anthropic/claude-sonnet-5",
    }),
    // 45s -- laisse du temps au LLM
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`n8n webhook a repondu ${response.status} : ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as Partial<N8nCrResult>;

  if (!data.crFormate || typeof data.crFormate !== "string") {
    throw new Error("Reponse n8n invalide : crFormate manquant ou non-string");
  }

  return {
    crFormate: data.crFormate,
    dateRdv: data.dateRdv ?? null,
    interlocuteur: data.interlocuteur ?? null,
    sujet: data.sujet ?? null,
    modeleLlm: data.modeleLlm ?? "unknown",
  };
}
