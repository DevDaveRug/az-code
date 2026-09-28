import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CA_VIDE, calculerCaParClient, totaux, type MissionPourCa } from "@/lib/ca";
import { COULEUR_STATUT, LIBELLE_STATUT, formatDate, formatEuro } from "@/lib/format";
import { STATUTS, type Statut } from "@/lib/nettoyage";

export const dynamic = "force-dynamic";

type Filtres = { statut?: string; facture?: string };

const FILTRES_RAPIDES: { label: string; href: string }[] = [
  { label: "Toutes", href: "/" },
  { label: "En cours", href: "/?statut=EN_COURS" },
  { label: "À facturer", href: "/?statut=TERMINEE&facture=non" },
  { label: "Facturées", href: "/?facture=oui" },
  { label: "Arrêtées", href: "/?statut=ARRETEE" },
];

export default async function Accueil({ searchParams }: { searchParams: Filtres }) {
  const [clients, missions] = await Promise.all([
    prisma.client.findMany({ orderBy: { nom: "asc" } }),
    prisma.mission.findMany({ include: { client: true }, orderBy: [{ dateFin: "asc" }, { id: "asc" }] }),
  ]);

  const pourCa: MissionPourCa[] = missions.map((m) => ({
    clientId: m.clientId,
    statut: m.statut,
    montant: m.montant.toNumber(),
    facture: m.facture,
  }));
  const caParClient = calculerCaParClient(pourCa);
  const t = totaux(pourCa);

  const lignesCa = clients
    .map((c) => ({ client: c, ca: caParClient.get(c.id) ?? CA_VIDE }))
    .sort((a, b) => b.ca.caFacture - a.ca.caFacture || b.ca.resteAFacturer - a.ca.resteAFacturer);

  const statut = STATUTS.includes(searchParams.statut as Statut) ? (searchParams.statut as Statut) : undefined;
  const facture = searchParams.facture === "oui" ? true : searchParams.facture === "non" ? false : undefined;
  const filtrees = missions.filter(
    (m) => (statut === undefined || m.statut === statut) && (facture === undefined || m.facture === facture),
  );
  const aVerifier = missions.filter((m) => m.notesMigration).length;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Ton chiffre d'affaires, client par client</h1>
        <p className="text-gray-600">Facturé, à facturer, en cours : calculé à chaque mission ajoutée, sans formule à maintenir.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Kpi label="CA facturé" valeur={formatEuro(t.caFacture)} couleur="bg-green-50" />
        <Kpi label="Reste à facturer" valeur={formatEuro(t.resteAFacturer)} couleur="bg-orange-50" />
        <Kpi label="En cours" valeur={formatEuro(t.enCours)} couleur="bg-yellow-50" />
        <Kpi label="Lignes à vérifier" valeur={String(aVerifier)} couleur="bg-blue-50" />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">CA par client</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Client</th>
                <th className="p-2">Contact</th>
                <th className="p-2 text-right">Missions</th>
                <th className="p-2 text-right">CA facturé</th>
                <th className="p-2 text-right">Reste à facturer</th>
                <th className="p-2 text-right">En cours</th>
              </tr>
            </thead>
            <tbody>
              {lignesCa.map(({ client, ca }) => (
                <tr key={client.id} className="border-t">
                  <td className="p-2 font-medium">{client.nom}</td>
                  <td className="p-2 text-gray-600">{client.contact ?? "-"}</td>
                  <td className="p-2 text-right">{ca.nbMissions}</td>
                  <td className="p-2 text-right font-semibold">{formatEuro(ca.caFacture)}</td>
                  <td className="p-2 text-right">{formatEuro(ca.resteAFacturer)}</td>
                  <td className="p-2 text-right">{formatEuro(ca.enCours)}</td>
                </tr>
              ))}
              {lignesCa.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">Aucun client. Lance `npm run seed` pour la démonstration.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-xl font-semibold">Missions</h2>
          <nav className="flex flex-wrap gap-2 text-sm">
            {FILTRES_RAPIDES.map((f) => (
              <Link key={f.href} href={f.href} className="rounded border bg-white px-3 py-1 hover:bg-gray-100">
                {f.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Les filtres portent sur des valeurs choisies dans une liste : « fini » et « terminé » ne peuvent plus coexister.
        </p>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Mission</th>
                <th className="p-2">Client</th>
                <th className="p-2">Statut</th>
                <th className="p-2 text-right">Montant</th>
                <th className="p-2">Date de fin</th>
                <th className="p-2">Facturé</th>
                <th className="p-2">À vérifier</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map((m) => (
                <tr key={m.id} className="border-t align-top">
                  <td className="p-2">{m.intitule}</td>
                  <td className="p-2">{m.client.nom}</td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${COULEUR_STATUT[m.statut]}`}>{LIBELLE_STATUT[m.statut]}</span>
                  </td>
                  <td className="p-2 text-right">{formatEuro(m.montant.toNumber())}</td>
                  <td className="p-2">{formatDate(m.dateFin)}</td>
                  <td className="p-2">{m.facture ? "Oui" : "Non"}</td>
                  <td className="p-2 text-xs text-gray-600 max-w-xs">{m.notesMigration ?? ""}</td>
                </tr>
              ))}
              {filtrees.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-gray-500">Aucune mission pour ce filtre.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, valeur, couleur }: { label: string; valeur: string; couleur: string }) {
  return (
    <div className={`${couleur} rounded-lg shadow p-4 text-center`}>
      <div className="text-2xl font-bold">{valeur}</div>
      <div className="text-xs text-gray-600 uppercase mt-1">{label}</div>
    </div>
  );
}
