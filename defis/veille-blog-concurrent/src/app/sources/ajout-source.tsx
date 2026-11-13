"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AjoutSource() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(form: FormData) {
    setEnvoi(true);
    setMessage(null);
    const r = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: form.get("nom"), fluxRss: form.get("fluxRss"), usage: form.get("usage") }),
    });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok) return setMessage(d.erreur);
    setMessage(`Site ajouté : ${d.ajoutes} article(s) importé(s).`);
    router.refresh();
  }

  return (
    <form action={envoyer} className="bg-white border rounded p-4 grid gap-3 sm:grid-cols-4 items-end">
      <label className="text-sm">Nom du site<input name="nom" required className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm sm:col-span-2">Adresse du flux RSS<input name="fluxRss" type="url" required placeholder="https://exemple.fr/feed" className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Usage (facultatif)<input name="usage" className="mt-1 w-full border rounded px-2 py-1" /></label>
      <button disabled={envoi} className="sm:col-span-4 justify-self-start bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50">{envoi ? "Lecture du flux..." : "Ajouter ce site"}</button>
      {message && <p className="sm:col-span-4 text-sm">{message}</p>}
    </form>
  );
}
