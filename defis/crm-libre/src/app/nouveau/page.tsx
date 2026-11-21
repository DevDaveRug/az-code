import { creerProspect } from "@/lib/actions";

const champ = "border rounded px-2 py-1 w-full bg-transparent";

export default function Nouveau() {
  return (
    <form action={creerProspect} className="max-w-xl space-y-3">
      <h1 className="text-xl font-semibold">Nouveau prospect</h1>
      <label className="block text-sm">Prénom *<input name="prenom" required className={champ} /></label>
      <label className="block text-sm">Nom *<input name="nom" required className={champ} /></label>
      <label className="block text-sm">Entreprise<input name="entreprise" className={champ} /></label>
      <label className="block text-sm">E-mail<input name="email" type="email" className={champ} /></label>
      <label className="block text-sm">Téléphone<input name="telephone" className={champ} /></label>
      <label className="block text-sm">Source
        <select name="source" defaultValue="AUTRE" className={champ}>
          <option value="LINKEDIN">LinkedIn</option>
          <option value="RECOMMANDATION">Recommandation</option>
          <option value="SITE">Site</option>
          <option value="AUTRE">Autre</option>
        </select>
      </label>
      <label className="block text-sm">Montant potentiel (€)<input name="montantPotentiel" type="number" step="0.01" className={champ} /></label>
      <label className="block text-sm">Notes<textarea name="notes" rows={3} className={champ} /></label>
      <button className="border rounded px-4 py-1 font-medium">Ajouter</button>
    </form>
  );
}
