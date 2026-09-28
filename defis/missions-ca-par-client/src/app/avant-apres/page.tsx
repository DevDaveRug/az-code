import { COLONNES_AVANT, donneesAvant } from "@/lib/donnees-avant";
import { nettoyerBase } from "@/lib/nettoyage";
import { COULEUR_STATUT, LIBELLE_STATUT, formatDate, formatEuro } from "@/lib/format";

// Page sans base de donnees : rejoue la migration a chaque affichage, a partir de la base d'origine.
export default function AvantApres() {
  const base = nettoyerBase(donneesAvant);
  const nomClient = new Map(base.clients.map((c) => [c.cle, c.nom]));
  const nbMissions = (cle: string) => base.missions.filter((m) => m.cleClient === cle).length;

  return (
    <main className="mx-auto max-w-6xl p-8 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Avant / après</h1>
        <p className="text-gray-600">
          La même base, avant et après restructuration. Rien n'est ressaisi : chaque valeur d'origine est convertie, et chaque
          décision prise pendant la conversion reste visible dans la colonne « À vérifier ».
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-1">Avant : 1 table, 7 colonnes en texte libre</h2>
        <p className="text-sm text-gray-600 mb-2">Impossible d'additionner les montants, de filtrer les statuts ou de regrouper par client.</p>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-red-50 text-left">
              <tr>{COLONNES_AVANT.map((c) => <th key={c.cle} className="p-2">{c.titre}</th>)}</tr>
            </thead>
            <tbody>
              {donneesAvant.map((l, i) => (
                <tr key={i} className="border-t">
                  {COLONNES_AVANT.map((c) => <td key={c.cle} className="p-2 font-mono text-xs">{l[c.cle] || <span className="text-gray-400">(vide)</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">Après : table Clients ({base.clients.length} clients uniques pour {donneesAvant.length} lignes)</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-green-50 text-left">
              <tr>
                <th className="p-2">Client</th>
                <th className="p-2">Contact</th>
                <th className="p-2">E-mail</th>
                <th className="p-2 text-right">Missions</th>
                <th className="p-2">À vérifier</th>
              </tr>
            </thead>
            <tbody>
              {base.clients.map((c) => (
                <tr key={c.cle} className="border-t align-top">
                  <td className="p-2 font-medium">{c.nom}</td>
                  <td className="p-2">{c.contact ?? "-"}</td>
                  <td className="p-2 text-gray-600">{c.email}</td>
                  <td className="p-2 text-right">{nbMissions(c.cle)}</td>
                  <td className="p-2 text-xs text-gray-600">{c.alertes.join(" ; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">Après : table Missions, chaque champ dans son vrai type</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-green-50 text-left">
              <tr>
                <th className="p-2">Mission</th>
                <th className="p-2">Client (lien)</th>
                <th className="p-2">Statut (liste)</th>
                <th className="p-2 text-right">Montant (€)</th>
                <th className="p-2">Date de fin (date)</th>
                <th className="p-2">Facturé (case)</th>
                <th className="p-2">À vérifier</th>
              </tr>
            </thead>
            <tbody>
              {base.missions.map((m) => (
                <tr key={m.ligne} className="border-t align-top">
                  <td className="p-2">{m.intitule}</td>
                  <td className="p-2">{nomClient.get(m.cleClient)}</td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${COULEUR_STATUT[m.statut]}`}>{LIBELLE_STATUT[m.statut]}</span>
                  </td>
                  <td className="p-2 text-right">{formatEuro(m.montant)}</td>
                  <td className="p-2">{formatDate(m.dateFin)}</td>
                  <td className="p-2">{m.facture ? "Oui" : "Non"}</td>
                  <td className="p-2 text-xs text-gray-600 max-w-xs">{m.alertes.join(" ; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
