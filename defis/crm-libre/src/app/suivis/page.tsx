import { prisma } from "@/lib/prisma";
import { creerSuivi, terminerSuivi } from "@/lib/actions";

export const dynamic = "force-dynamic";

const champ = "border rounded px-2 py-1 w-full bg-transparent";

export default async function Suivis() {
  const [suivis, prospects, rdvs] = await Promise.all([
    prisma.suivi.findMany({
      where: { statut: { not: "FAIT" } },
      orderBy: [{ echeance: { sort: "asc", nulls: "last" } }],
      include: { prospect: true }
    }),
    prisma.prospect.findMany({ orderBy: { nom: "asc" } }),
    prisma.rdv.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold mb-4">Suivis à faire</h1>
        {suivis.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Aucun suivi en attente.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {suivis.map((s) => (
              <li key={s.id} className="border-t pt-2 flex items-center justify-between gap-4" style={{ borderColor: "var(--border)" }}>
                <span>
                  <strong>{s.tache}</strong>{" "}
                  {s.echeance ? `(échéance ${new Date(s.echeance).toLocaleDateString("fr-FR")})` : ""}{" "}
                  {s.prospect ? `: ${s.prospect.prenom} ${s.prospect.nom}` : ""} [{s.priorite}]
                </span>
                <form action={terminerSuivi}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="underline text-xs">Terminé</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form action={creerSuivi} className="max-w-xl space-y-3">
        <h2 className="font-semibold">Nouveau suivi</h2>
        <label className="block text-sm">Tâche *<input name="tache" required className={champ} /></label>
        <label className="block text-sm">Prospect
          <select name="prospectId" defaultValue="" className={champ}>
            <option value="">(aucun)</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">RDV
          <select name="rdvId" defaultValue="" className={champ}>
            <option value="">(aucun)</option>
            {rdvs.map((r) => (
              <option key={r.id} value={r.id}>{r.titre}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">Échéance<input name="echeance" type="date" className={champ} /></label>
        <label className="block text-sm">Priorité
          <select name="priorite" defaultValue="MOYENNE" className={champ}>
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
        </label>
        <label className="block text-sm">Description<textarea name="description" rows={3} className={champ} /></label>
        <button className="border rounded px-4 py-1 font-medium">Ajouter</button>
      </form>
    </div>
  );
}
