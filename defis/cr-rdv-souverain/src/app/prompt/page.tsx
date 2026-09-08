import Link from "next/link";

const PROMPT_TEXT = `Tu es un assistant qui formate des notes brutes de rendez-vous en compte rendu structuré.

RÈGLE ABSOLUE : tu ne modifies JAMAIS le contenu factuel des notes. Tu réorganises et clarifies uniquement.

Ton output doit contenir EXACTEMENT 4 sections dans cet ordre :

1- En-tête
   - Date du RDV (extrais-la des notes ; si absente, écris "Date : à préciser")
   - Interlocuteur (extrais nom + entreprise si présents ; sinon "Interlocuteur : à préciser")
   - Sujet (1 ligne max, résume l'objet du RDV)

2- Tableau à 2 colonnes -- section principale
   Colonne gauche : "Ce que le client a demandé"
   Colonne droite : "Ce que je dois faire"

   Règles de remplissage :
   - Chaque ligne du tableau relie UNE demande à UNE action de suivi
   - Si une demande n'appelle aucune action de ma part (info seulement), écris "Rien à faire, note pour mémoire"
   - Si une action apparait sans demande explicite du client (mais que je dois la faire), écris "Point soulevé de ma part" en colonne gauche
   - Si la demande est ambigüe, écris entre parenthèses "(à confirmer)" à côté

3- Points d'attention
   - Uniquement les tensions, désaccords, points bloquants ou risques mentionnés dans les notes
   - Si aucun, écris "Aucun point d'attention détecté"
   - Une ligne par point

4- Prochaine étape
   - La suite concrète : appel, envoi, RDV, livrable, décision
   - Format : "Action -- Date/échéance -- Qui"
   - Si non défini dans les notes, écris "Prochaine étape à définir de mon côté"

FORMAT DE SORTIE : Markdown pur, aucun emoji, tutoiement, phrases courtes. Le tableau utilise la syntaxe Markdown standard \`| Colonne 1 | Colonne 2 |\`. Aucun préambule ("Voici votre CR..."), aucun postambule ("N'hésitez pas..."). Livre uniquement le CR formaté, prêt à copier.

NOTES BRUTES DU RDV :
[coller les notes ici]`;

export default function PromptPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6">
        <Link href="/" className="text-or text-sm hover:underline">&larr; Retour</Link>
      </nav>

      <header className="mb-6">
        <span className="text-or text-xs font-bold tracking-widest uppercase">
          Livrable central du défi
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-100">
          Prompt LLM réutilisable
        </h1>
        <p className="mt-2 text-slate-400">
          Copie ce prompt et colle-le dans ton IA (Claude, ChatGPT, Gemini, Mistral, OpenRouter).
          Puis colle tes notes brutes à la fin. Aucun outil à installer, aucun compte à créer.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-2">Prompt à copier</h2>
        <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200 leading-relaxed">
          {PROMPT_TEXT}
        </pre>
      </section>

      <section className="mt-10 rounded-lg border border-or/40 bg-or/5 p-4">
        <h3 className="font-semibold text-or">Comment ça marche</h3>
        <ol className="mt-2 space-y-1 text-sm text-slate-300 list-inside list-decimal">
          <li>Ouvre l&apos;IA de ton choix (Claude, ChatGPT, Gemini, Mistral, ou un workflow n8n / OpenRouter)</li>
          <li>Colle le prompt ci-dessus</li>
          <li>Colle tes notes brutes juste après <code className="text-or">NOTES BRUTES DU RDV :</code></li>
          <li>L&apos;IA retourne un CR structuré prêt à copier dans ton CRM / mail / Notion</li>
        </ol>
      </section>

      <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
        Version 1.0.0 -- 2026-09-08 -- Souverain, portable, versionné.{" "}
        <a
          className="text-or underline"
          href="https://github.com/DevDaveRug/az-code/blob/main/defis/cr-rdv-souverain/PROMPT_LLM.md"
        >
          Source GitHub
        </a>
      </footer>
    </main>
  );
}
