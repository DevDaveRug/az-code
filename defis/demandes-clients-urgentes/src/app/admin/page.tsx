import { prisma } from "@/lib/prisma";

const ORDRE_URGENCE = ["CRITIQUE", "HAUTE", "MOYENNE", "BASSE"] as const;
const COULEUR_URGENCE: Record<string, string> = {
  BASSE: "bg-gray-200 text-gray-700",
  MOYENNE: "bg-yellow-200 text-yellow-900",
  HAUTE: "bg-orange-300 text-orange-900",
  CRITIQUE: "bg-red-500 text-white",
};
const COULEUR_STATUT: Record<string, string> = {
  NOUVEAU: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-yellow-100 text-yellow-800",
  BLOQUE: "bg-orange-100 text-orange-800",
  FAIT: "bg-green-100 text-green-800",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demandes = await prisma.demande.findMany({
    include: { client: true },
    orderBy: [{ statut: "asc" }, { dateDemande: "desc" }],
  });

  const total = demandes.length;
  const nouvelles = demandes.filter((d) => d.statut === "NOUVEAU").length;
  const critiques = demandes.filter((d) => d.urgenceReelle === "CRITIQUE" && d.statut !== "FAIT").length;
  const hautes = demandes.filter((d) => d.urgenceReelle === "HAUTE" && d.statut !== "FAIT").length;

  const parUrgence = [...demandes]
    .filter((d) => d.statut !== "FAIT")
    .sort((a, b) => {
      const oa = ORDRE_URGENCE.indexOf(a.urgenceReelle as (typeof ORDRE_URGENCE)[number]);
      const ob = ORDRE_URGENCE.indexOf(b.urgenceReelle as (typeof ORDRE_URGENCE)[number]);
      if (oa !== ob) return oa - ob;
      return b.dateDemande.getTime() - a.dateDemande.getTime();
    });

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Tes demandes clients</h1>
        <p className="text-gray-600">Priorisees par urgence, statuts a jour.</p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-8">
        <Kpi label="Total" valeur={total} />
        <Kpi label="Nouvelles" valeur={nouvelles} couleur="bg-blue-50" />
        <Kpi label="Critiques (ouvertes)" valeur={critiques} couleur="bg-red-50" />
        <Kpi label="Hautes (ouvertes)" valeur={hautes} couleur="bg-orange-50" />
      </section>

      <section className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Urgentes en premier</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Ref</th>
                <th className="p-2">Client</th>
                <th className="p-2">Description</th>
                <th className="p-2">Urgence</th>
                <th className="p-2">Date</th>
                <th className="p-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {parUrgence.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2 font-mono text-xs">#{d.id}</td>
                  <td className="p-2">{d.client?.nom ?? d.nomClientTemp}</td>
                  <td className="p-2 max-w-md truncate">{d.description}</td>
                  <td className="p-2"><span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${COULEUR_URGENCE[d.urgenceReelle]}`}>{d.urgenceReelle}</span></td>
                  <td className="p-2 text-xs text-gray-500">{d.dateDemande.toLocaleDateString("fr-FR")}</td>
                  <td className="p-2"><span className={`inline-block px-2 py-1 rounded text-xs ${COULEUR_STATUT[d.statut]}`}>{d.statut}</span></td>
                </tr>
              ))}
              {parUrgence.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">Aucune demande ouverte. Bravo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Kanban par statut</h2>
        <div className="grid grid-cols-4 gap-4">
          {(["NOUVEAU", "EN_COURS", "BLOQUE", "FAIT"] as const).map((s) => (
            <div key={s} className="bg-white rounded-lg shadow p-3">
              <h3 className={`text-sm font-semibold p-1 rounded mb-2 ${COULEUR_STATUT[s]}`}>{s} ({demandes.filter((d) => d.statut === s).length})</h3>
              <ul className="space-y-2">
                {demandes.filter((d) => d.statut === s).map((d) => (
                  <li key={d.id} className="border rounded p-2 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-gray-500">#{d.id}</span>
                      <span className={`px-1 rounded text-[10px] ${COULEUR_URGENCE[d.urgenceReelle]}`}>{d.urgenceReelle}</span>
                    </div>
                    <div className="font-semibold">{d.client?.nom ?? d.nomClientTemp}</div>
                    <div className="text-gray-600 line-clamp-2">{d.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, valeur, couleur = "bg-white" }: { label: string; valeur: number; couleur?: string }) {
  return (
    <div className={`${couleur} rounded-lg shadow p-4 text-center`}>
      <div className="text-3xl font-bold">{valeur}</div>
      <div className="text-xs text-gray-600 uppercase mt-1">{label}</div>
    </div>
  );
}
