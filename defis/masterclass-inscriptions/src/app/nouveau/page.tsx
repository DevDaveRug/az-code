// Formulaire d'ajout d'un inscrit.
// Post vers /api/inscrits qui : insert DB + envoie l'email de confirmation.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NouveauPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      prenom: String(data.get("prenom") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      dateMasterclass: String(data.get("dateMasterclass") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/inscrits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur inconnue");
        setLoading(false);
        return;
      }
      setMessage(
        json.emailStatus === "ENVOYE"
          ? "Merci ! Un email de confirmation vient d'être envoyé."
          : json.emailStatus === "ERREUR"
            ? `Inscription enregistrée, mais l'envoi de l'email a échoué : ${json.emailError ?? "?"}`
            : "Inscription enregistrée. L'email part dans un instant."
      );
      form.reset();
      setLoading(false);
      // Rafraîchir la vue liste après un court délai pour laisser l'utilisateur lire le message.
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Inscription à la masterclass</h1>
        <p className="mt-1 text-sm text-slate-600">
          Renseigne ton prénom, ton email et la date de la session choisie.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="prenom" className="mb-1 block text-sm font-medium text-slate-700">
            Prénom
          </label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Alice"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="alice@exemple.fr"
          />
        </div>

        <div>
          <label htmlFor="dateMasterclass" className="mb-1 block text-sm font-medium text-slate-700">
            Date de la masterclass
          </label>
          <input
            id="dateMasterclass"
            name="dateMasterclass"
            type="date"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enregistrement..." : "M'inscrire"}
        </button>

        {message && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
