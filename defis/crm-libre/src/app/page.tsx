import { prisma } from "@/lib/prisma";
import { estARelancer, joursRestants, prochaineRelance } from "@/lib/relance";
import { marquerContact } from "@/lib/actions";

export const dynamic = "force-dynamic";

const fr = (d: Date | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");

export default async function Page({ searchParams }: { searchParams: { vue?: string } }) {
  const tous = await prisma.prospect.findMany({ orderBy: { dateEntree: "desc" } });
  const relance = searchParams.vue === "relance";
  const prospects = relance
    ? tous
        .filter((p) => estARelancer(p))
        .sort((a, b) => prochaineRelance(a)!.getTime() - prochaineRelance(b)!.getTime())
    : tous;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{relance ? "À relancer" : "Prospects"}</h1>
      {prospects.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          {relance ? "Rien à relancer pour l'instant." : "Aucun prospect. Ajoute le premier avec « + Nouveau prospect »."}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--muted)" }}>
              <th className="py-2">Nom</th>
              <th>Entreprise</th>
              <th>Statut</th>
              <th>Dernier contact</th>
              <th>Prochaine relance</th>
              <th>Jours</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => {
              const pr = prochaineRelance(p);
              const jr = joursRestants(pr);
              return (
                <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2">{p.prenom} {p.nom}</td>
                  <td>{p.entreprise}</td>
                  <td>{p.statut}</td>
                  <td>{fr(p.dernierContact)}</td>
                  <td>{fr(pr)}</td>
                  <td>{jr}</td>
                  <td>
                    <form action={marquerContact}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="underline text-xs">Contacté aujourd&apos;hui</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
