import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Statut, Source } from "@prisma/client";
import { EntrepriseSearchable } from "@/components/EntrepriseSearchable";

async function creerProspect(formData: FormData) {
  "use server";
  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const entrepriseIdRaw = String(formData.get("entreprise_id") ?? "").trim();
  const entrepriseNomInline = String(formData.get("entreprise_nomInline") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim() || null;
  const source = (String(formData.get("source") ?? "AUTRE") as Source) || Source.AUTRE;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!prenom || !nom || !email) {
    throw new Error("Prénom, nom et email sont requis");
  }

  // Résolution de l'entreprise :
  //   1- Si un id a été sélectionné dans le dropdown -> utiliser directement.
  //   2- Sinon si un nom inline a été proposé -> créer l'entreprise puis récupérer son id.
  //   3- Sinon -> prospect sans entreprise (null).
  let entrepriseId: number | null = null;
  if (entrepriseIdRaw) {
    const parsed = Number(entrepriseIdRaw);
    if (Number.isFinite(parsed) && parsed > 0) entrepriseId = parsed;
  } else if (entrepriseNomInline) {
    const nouvelle = await prisma.entreprise.create({ data: { nom: entrepriseNomInline } });
    entrepriseId = nouvelle.id;
  }

  await prisma.prospect.create({
    data: {
      prenom, nom, email,
      entrepriseId,
      telephone,
      source,
      notes,
      statut: Statut.NOUVEAU,
      dateEntree: new Date(),
      dernierContact: new Date()
    }
  });

  redirect("/");
}

export default function NouveauProspect() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nouveau prospect</h1>
      <form action={creerProspect} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Champ label="Prénom" name="prenom" required />
          <Champ label="Nom" name="nom" required />
        </div>

        <EntrepriseSearchable name="entreprise" />

        <Champ label="Email" name="email" type="email" required />
        <Champ label="Téléphone" name="telephone" type="tel" />

        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <select name="source" className="w-full border rounded px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} defaultValue="AUTRE">
            <option value="LINKEDIN">LinkedIn</option>
            <option value="RECOMMANDATION">Recommandation</option>
            <option value="SITE">Site</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={4}
            className="w-full border rounded px-3 py-2"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700">
            Ajouter
          </button>
          <a href="/" className="px-4 py-2 rounded border" style={{ borderColor: "var(--border)" }}>
            Annuler
          </a>
        </div>
      </form>
    </div>
  );
}

function Champ({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full border rounded px-3 py-2"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      />
    </div>
  );
}
