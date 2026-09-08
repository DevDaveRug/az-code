import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatterViaN8n } from "@/lib/n8n-format";
import { redirect } from "next/navigation";

async function creerCr(formData: FormData) {
  "use server";

  const notesBrutes = String(formData.get("notesBrutes") ?? "").trim();
  if (!notesBrutes) return;

  const resultat = await formatterViaN8n(notesBrutes);

  const cr = await prisma.cr.create({
    data: {
      notesBrutes,
      crFormate: resultat.crFormate,
      dateRdv: resultat.dateRdv ? new Date(resultat.dateRdv) : null,
      interlocuteur: resultat.interlocuteur,
      sujet: resultat.sujet,
      modeleLlm: resultat.modeleLlm,
    },
  });

  redirect(`/cr/${cr.id}`);
}

export default async function AccueilPage() {
  const recents = await prisma.cr.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, createdAt: true, interlocuteur: true, sujet: true, dateRdv: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <span className="text-or text-xs font-bold tracking-widest uppercase">
          Boite à outils souveraine -- brique v0.2
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-100">
          CR-RDV formaté en un clic
        </h1>
        <p className="mt-2 text-slate-400 leading-relaxed">
          Colle tes notes brutes de RDV. Récupère un compte rendu structuré à 2 colonnes
          (ce que le client a demandé / ce que tu dois faire) prêt à envoyer.
        </p>
      </header>

      <form action={creerCr} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Notes brutes du RDV</span>
          <textarea
            name="notesBrutes"
            required
            rows={14}
            placeholder="Colle ici tes notes brutes -- pas besoin de formatage, l'IA s'en occupe."
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-100 focus:border-or focus:outline-none focus:ring-1 focus:ring-or"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-or px-6 py-3 font-bold text-noir hover:bg-yellow-400"
        >
          Formater le CR
        </button>
      </form>

      {recents.length > 0 && (
        <section className="mt-12 border-t border-slate-800 pt-8">
          <h2 className="text-lg font-semibold text-slate-200">CR récents</h2>
          <ul className="mt-4 space-y-2">
            {recents.map((cr) => (
              <li key={cr.id}>
                <Link
                  href={`/cr/${cr.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-900 p-3 hover:border-or"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium text-slate-100">
                      {cr.interlocuteur ?? "Interlocuteur à préciser"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(cr.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {cr.sujet && <p className="mt-1 text-sm text-slate-400">{cr.sujet}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-16 border-t border-slate-800 pt-6 text-xs text-slate-500">
        <p>
          Code souverain -- brique de la boite à outils construite défi par défi.{" "}
          <a
            href="https://github.com/DevDaveRug/az-code/tree/main/defis/cr-rdv-souverain"
            className="text-or underline"
          >
            Source
          </a>
          {" | "}
          <Link href="/prompt" className="text-or underline">
            Prompt LLM réutilisable
          </Link>
        </p>
      </footer>
    </main>
  );
}
