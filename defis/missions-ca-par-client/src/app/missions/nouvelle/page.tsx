"use client";

import { useEffect, useState } from "react";

type ClientOption = { id: number; nom: string; contact: string | null };

const NOUVEAU = "nouveau";

export default function NouvelleMission() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [choixClient, setChoixClient] = useState("");
  const [resultat, setResultat] = useState<{ ok: boolean; message: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((json) => setClients(json.clients ?? []))
      .catch(() => setClients([]));
  }, []);

  async function submit(formData: FormData) {
    setEnCours(true);
    const payload = {
      intitule: formData.get("intitule"),
      clientId: choixClient && choixClient !== NOUVEAU ? Number(choixClient) : null,
      nouveauClient:
        choixClient === NOUVEAU
          ? { nom: formData.get("nomClient"), email: formData.get("emailClient"), contact: formData.get("contactClient") || null }
          : null,
      statut: formData.get("statut"),
      montant: Number(formData.get("montant")),
      dateFin: formData.get("dateFin") || null,
      facture: formData.get("facture") === "on",
    };
    try {
      const r = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      setResultat(
        r.ok
          ? { ok: true, message: json.clientExistant ? "Mission enregistrée sur la fiche existante du client." : "Mission et nouveau client enregistrés." }
          : { ok: false, message: json.error ?? "Erreur inconnue." },
      );
    } catch {
      setResultat({ ok: false, message: "Erreur réseau, réessaie." });
    } finally {
      setEnCours(false);
    }
  }

  if (resultat?.ok) {
    return (
      <main className="mx-auto max-w-md p-8 mt-16 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">C'est enregistré</h1>
        <p className="mb-6">{resultat.message} Elle apparaît déjà dans le CA du client.</p>
        <div className="flex gap-4 text-sm">
          <a href="/" className="rounded bg-blue-600 text-white px-4 py-2">Voir le CA par client</a>
          <button onClick={() => setResultat(null)} className="rounded border px-4 py-2">Ajouter une autre mission</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8 mt-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-2">Ajouter une mission</h1>
      <p className="text-sm text-gray-600 mb-6">
        Le client se choisit dans la liste, le montant est un nombre, la date une vraie date : impossible de recréer un doublon ou un « 80k€ ».
      </p>
      <form action={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Intitulé de la mission *</span>
          <input required name="intitule" className="mt-1 w-full rounded border p-2" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Client *</span>
          <select required value={choixClient} onChange={(e) => setChoixClient(e.target.value)} className="mt-1 w-full rounded border p-2">
            <option value="" disabled>Choisir un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.contact ? `${c.nom} (${c.contact})` : c.nom}</option>
            ))}
            <option value={NOUVEAU}>+ Nouveau client</option>
          </select>
        </label>

        {choixClient === NOUVEAU && (
          <fieldset className="space-y-3 rounded border border-dashed p-3">
            <label className="block">
              <span className="text-sm font-medium">Nom du client (personne ou entreprise) *</span>
              <input required name="nomClient" className="mt-1 w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">E-mail *</span>
              <input required type="email" name="emailClient" className="mt-1 w-full rounded border p-2" />
              <span className="text-xs text-gray-500">Si cet e-mail existe déjà, la mission va sur la fiche existante.</span>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Contact (si entreprise)</span>
              <input name="contactClient" className="mt-1 w-full rounded border p-2" />
            </label>
          </fieldset>
        )}

        <label className="block">
          <span className="text-sm font-medium">Statut *</span>
          <select required name="statut" defaultValue="A_FAIRE" className="mt-1 w-full rounded border p-2">
            <option value="A_FAIRE">À faire</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ARRETEE">Arrêtée</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Montant HT en € *</span>
          <input required type="number" name="montant" min="0" step="0.01" inputMode="decimal" className="mt-1 w-full rounded border p-2" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Date de fin prévue</span>
          <input type="date" name="dateFin" className="mt-1 w-full rounded border p-2" />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="facture" />
          <span className="text-sm font-medium">Facturé</span>
        </label>

        <button type="submit" disabled={enCours} className="w-full rounded bg-blue-600 text-white p-2 font-semibold disabled:opacity-50">
          {enCours ? "Enregistrement..." : "Enregistrer la mission"}
        </button>
        {resultat?.ok === false && <p className="text-red-600 text-sm">{resultat.message}</p>}
      </form>
    </main>
  );
}
