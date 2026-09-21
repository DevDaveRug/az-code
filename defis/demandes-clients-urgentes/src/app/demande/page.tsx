"use client";

import { useState } from "react";

export default function FormulaireDemande() {
  const [envoyee, setEnvoyee] = useState<{ ok: boolean; ref?: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function submit(formData: FormData) {
    setEnCours(true);
    const payload = {
      nomClient: formData.get("nomClient"),
      emailClient: formData.get("emailClient"),
      telephoneClient: formData.get("telephoneClient") || null,
      description: formData.get("description"),
      urgenceClient: formData.get("urgenceClient"),
    };
    try {
      const r = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      setEnvoyee({ ok: r.ok, ref: json.ref });
    } catch (e) {
      setEnvoyee({ ok: false });
    } finally {
      setEnCours(false);
    }
  }

  if (envoyee?.ok) {
    return (
      <main className="mx-auto max-w-md p-8 mt-16 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Merci !</h1>
        <p>Ta demande <strong>{envoyee.ref}</strong> est bien recue. On te recontacte des que possible.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8 mt-16 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-2">Envoyer une demande</h1>
      <p className="text-sm text-gray-600 mb-6">Remplis ce formulaire, on te recontacte des que possible.</p>
      <form action={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Ton nom *</span>
          <input required name="nomClient" className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ton email *</span>
          <input required type="email" name="emailClient" className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ton telephone (optionnel)</span>
          <input name="telephoneClient" className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ta demande *</span>
          <textarea required name="description" rows={4} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">A quel point c est urgent selon toi ? *</span>
          <select required name="urgenceClient" defaultValue="MOYENNE" className="mt-1 w-full rounded border p-2">
            <option value="BASSE">Basse (pas presse)</option>
            <option value="MOYENNE">Moyenne (cette semaine)</option>
            <option value="HAUTE">Haute (24-48h)</option>
            <option value="CRITIQUE">Critique (maintenant)</option>
          </select>
        </label>
        <button type="submit" disabled={enCours} className="w-full rounded bg-blue-600 text-white p-2 font-semibold disabled:opacity-50">
          {enCours ? "Envoi..." : "Envoyer ma demande"}
        </button>
        {envoyee?.ok === false && <p className="text-red-600 text-sm">Une erreur est survenue, reessaie ou contacte-moi directement.</p>}
      </form>
    </main>
  );
}
