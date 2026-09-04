"use client";

import { useEffect, useRef, useState } from "react";

type Entreprise = { id: number; nom: string; secteur: string | null; taille: string | null };

// Dropdown searchable custom pour selection ou creation d'une entreprise.
// Zero dependance tierce -- input controle + fetch /api/entreprises?q=... + liste absolue.
// Emet un hidden input <name>_id (Int) selectionne + <name>_nomInline (String) pour creation inline.
// Comportement :
//   - Tape un nom -> propose les entreprises existantes (max 8 visibles).
//   - Clique sur un resultat -> selectionne l'entreprise (hidden id renseigne).
//   - Aucun resultat + texte saisi -> option "Creer nouvelle entreprise : <texte>" (hidden nomInline renseigne).
//   - Reset (X) -> revient a l'etat vide.
export function EntrepriseSearchable({ name = "entreprise" }: { name?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entreprise[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [selectedNom, setSelectedNom] = useState<string>("");
  const [creerNouveau, setCreerNouveau] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch avec debounce simple (200 ms).
    const q = query.trim();
    if (selectedId) {
      setResults([]);
      return;
    }
    if (!q) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/entreprises?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.entreprises ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, selectedId]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectEntreprise(e: Entreprise) {
    setSelectedId(e.id);
    setSelectedNom(e.nom);
    setCreerNouveau("");
    setQuery(e.nom);
    setOpen(false);
  }
  function selectCreerNouveau(nom: string) {
    setSelectedId("");
    setSelectedNom("");
    setCreerNouveau(nom);
    setQuery(nom);
    setOpen(false);
  }
  function reset() {
    setSelectedId("");
    setSelectedNom("");
    setCreerNouveau("");
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  const trimmed = query.trim();
  const showCreerNouveau = trimmed.length > 0 && !selectedId && results.every((r) => r.nom.toLowerCase() !== trimmed.toLowerCase());

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-sm font-medium mb-1">Entreprise</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setSelectedNom("");
            setCreerNouveau("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Chercher ou créer une entreprise..."
          className="w-full border rounded px-3 py-2"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={reset} className="px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }}>×</button>
        )}
      </div>
      {open && (results.length > 0 || showCreerNouveau || loading) && (
        <div className="absolute z-10 mt-1 w-full border rounded shadow bg-white max-h-64 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
          {loading && <div className="px-3 py-2 text-sm" style={{ color: "var(--muted)" }}>Recherche...</div>}
          {results.slice(0, 8).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => selectEntreprise(e)}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-medium">{e.nom}</span>
              {(e.secteur || e.taille) && (
                <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>
                  {[e.secteur, e.taille].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          ))}
          {showCreerNouveau && (
            <button
              type="button"
              onClick={() => selectCreerNouveau(trimmed)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-blue-700 font-medium"
            >
              + Créer nouvelle entreprise : « {trimmed} »
            </button>
          )}
        </div>
      )}
      {/* Hidden inputs consommés par la server action */}
      <input type="hidden" name={`${name}_id`} value={selectedId} />
      <input type="hidden" name={`${name}_nomInline`} value={creerNouveau} />
      {selectedId ? (
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Entreprise sélectionnée : #{selectedId} ({selectedNom})</p>
      ) : creerNouveau ? (
        <p className="text-xs mt-1 text-blue-700">Sera créée à la validation : « {creerNouveau} »</p>
      ) : null}
    </div>
  );
}
