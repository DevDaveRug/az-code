import { prisma } from "@/lib/prisma";
import { creerRdv } from "@/lib/actions";

export const dynamic = "force-dynamic";

const champ = "border rounded px-2 py-1 w-full bg-transparent";

export default async function Rdv() {
  const [rdvs, prospects] = await Promise.all([
    prisma.rdv.findMany({ orderBy: { dateRdv: "desc" }, include: { prospect: true } }),
    prisma.prospect.findMany({ orderBy: { nom: "asc" } })
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold mb-4">RDV</h1>
        {rdvs.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Aucun rendez-vous.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rdvs.map((r) => (
              <li key={r.id} className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
                <strong>{r.titre}</strong>{" "}
                {r.dateRdv ? new Date(r.dateRdv).toLocaleDateString("fr-FR") : ""}
                {r.prospect ? ` : ${r.prospect.prenom} ${r.prospect.nom}` : ""} ({r.contexte}, {r.statut})
              </li>
            ))}
          </ul>
        )}
      </section>
      <form action={creerRdv} className="max-w-xl space-y-3">
        <h2 className="font-semibold">Nouveau RDV</h2>
        <label className="block text-sm">Titre *<input name="titre" required className={champ} /></label>
        <label className="block text-sm">Prospect
          <select name="prospectId" defaultValue="" className={champ}>
            <option value="">(aucun)</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">Date<input name="dateRdv" type="date" className={champ} /></label>
        <label className="block text-sm">Contexte
          <select name="contexte" defaultValue="DECOUVERTE" className={champ}>
            <option value="DECOUVERTE">Découverte</option>
            <option value="SUIVI">Suivi</option>
            <option value="CLOSING">Closing</option>
          </select>
        </label>
        <label className="block text-sm">Notes brutes<textarea name="notesBrutes" rows={3} className={champ} /></label>
        <label className="block text-sm">Compte rendu<textarea name="compteRendu" rows={3} className={champ} /></label>
        <button className="border rounded px-4 py-1 font-medium">Ajouter</button>
      </form>
    </div>
  );
}
