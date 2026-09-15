// Vue liste : tous les inscrits, regroupés par date de masterclass.
// Sert la démo "voici les inscrits par session" + affiche le statut d'envoi email.

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // toujours frais côté SSR

function formatDateFR(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    EN_ATTENTE: "bg-slate-200 text-slate-700",
    ENVOYE: "bg-emerald-100 text-emerald-800",
    ERREUR: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    EN_ATTENTE: "En attente",
    ENVOYE: "Envoyé",
    ERREUR: "Erreur",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[statut] ?? map.EN_ATTENTE}`}>
      {label[statut] ?? statut}
    </span>
  );
}

export default async function Page() {
  const inscrits = await prisma.inscrit.findMany({
    orderBy: [{ dateMasterclass: "asc" }, { dateInscription: "asc" }],
  });

  // Regroupement par date de masterclass (ISO YYYY-MM-DD, garanti trié).
  const groupes = new Map<string, typeof inscrits>();
  for (const i of inscrits) {
    const key = i.dateMasterclass.toISOString().slice(0, 10);
    if (!groupes.has(key)) groupes.set(key, []);
    groupes.get(key)!.push(i);
  }

  return (
    <main>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Masterclass Inscriptions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Défi Alegria n°3 - MVP souverain (Next.js + Neon + Prisma + Resend)
          </p>
        </div>
        <Link
          href="/nouveau"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Ajouter un inscrit
        </Link>
      </header>

      {inscrits.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Aucun inscrit pour le moment. Ajoute quelqu&apos;un pour tester l&apos;envoi auto.
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(groupes.entries()).map(([dateIso, lignes]) => (
            <section key={dateIso}>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                Masterclass du {formatDateFR(new Date(dateIso))}{" "}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({lignes.length} inscrit{lignes.length > 1 ? "s" : ""})
                </span>
              </h2>
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Prénom</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Inscrit le</th>
                      <th className="px-4 py-2">Statut email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lignes.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-2 font-medium">{l.prenom}</td>
                        <td className="px-4 py-2 text-slate-600">{l.email}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {l.dateInscription.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-2">
                          <StatutBadge statut={l.statutEmail} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
