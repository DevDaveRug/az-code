import { prisma } from "@/lib/prisma";
import { prochaineRelance, joursRestants, couleurUrgence } from "@/lib/relance";
import type { Statut } from "@prisma/client";

export const dynamic = "force-dynamic";

const LIBELLE_STATUT: Record<Statut, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  GAGNE: "Gagné",
  PERDU: "Perdu"
};

const COULEUR_STATUT: Record<Statut, string> = {
  NOUVEAU: "bg-blue-100 text-blue-900",
  EN_COURS: "bg-orange-100 text-orange-900",
  GAGNE: "bg-green-100 text-green-900",
  PERDU: "bg-slate-100 text-slate-700"
};

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function Home({ searchParams }: { searchParams: { vue?: string } }) {
  const vueRelance = searchParams.vue === "relance";

  const prospects = await prisma.prospect.findMany({
    orderBy: vueRelance ? { dernierContact: "asc" } : { dateEntree: "desc" },
    include: { entreprise: { select: { id: true, nom: true } } }
  });

  const today = new Date();
  const rows = prospects
    .map((p) => {
      const pr = prochaineRelance(p);
      const jr = joursRestants(pr, today);
      return { ...p, prochaine: pr, jours: jr };
    })
    .filter((p) => (vueRelance ? p.jours !== null && p.jours <= 0 : true));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {vueRelance ? "Prospects à relancer" : "Tous les prospects"}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        {vueRelance
          ? `${rows.length} prospect(s) à relancer aujourd'hui ou en retard.`
          : `${rows.length} prospect(s) au total.`}
      </p>

      {rows.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          Aucun prospect. <a href="/nouveau" className="underline">Ajouter le premier</a>.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="text-left py-2 pr-4">Nom</th>
                <th className="text-left py-2 pr-4">Entreprise</th>
                <th className="text-left py-2 pr-4">Statut</th>
                <th className="text-left py-2 pr-4">Dernier contact</th>
                <th className="text-left py-2 pr-4">Prochaine relance</th>
                <th className="text-left py-2 pr-4">Jours</th>
                <th className="text-left py-2 pr-4">Contact</th>
                <th className="text-left py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={`border-b ${couleurUrgence(p.jours)}`} style={{ borderColor: "var(--border)" }}>
                  <td className="py-2 pr-4 font-medium">{p.prenom} {p.nom}</td>
                  <td className="py-2 pr-4">{p.entreprise?.nom ?? "-"}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${COULEUR_STATUT[p.statut]}`}>
                      {LIBELLE_STATUT[p.statut]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{formatDate(p.dernierContact)}</td>
                  <td className="py-2 pr-4">{formatDate(p.prochaine)}</td>
                  <td className="py-2 pr-4 font-mono">{p.jours ?? "-"}</td>
                  <td className="py-2 pr-4 text-xs">
                    <a href={`mailto:${p.email}`} className="underline">{p.email}</a>
                    {p.telephone && <><br /><span style={{ color: "var(--muted)" }}>{p.telephone}</span></>}
                  </td>
                  <td className="py-2 pr-4">
                    <a href={`/prospects/${p.id}`} className="text-blue-600 underline text-xs">Détail →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
