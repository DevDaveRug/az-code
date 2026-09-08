"use client";

export function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-or bg-transparent px-4 py-2 text-sm font-bold text-or hover:bg-or hover:text-noir print:hidden"
    >
      Télécharger PDF (Imprimer -&gt; Enregistrer PDF)
    </button>
  );
}
