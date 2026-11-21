import type { Prospect } from "@prisma/client";

const JOURS_RELANCE = 7;
const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

type Relancable = Pick<Prospect, "statut" | "dernierContact">;

// Prochaine relance : dernier contact + 7 jours, pour les prospects Nouveau ou En cours seulement.
export function prochaineRelance(p: Relancable): Date | null {
  if (p.statut !== "NOUVEAU" && p.statut !== "EN_COURS") return null;
  if (!p.dernierContact) return null;
  const d = new Date(p.dernierContact);
  d.setDate(d.getDate() + JOURS_RELANCE);
  return d;
}

export function joursRestants(prochaine: Date | null, today: Date = new Date()): number | null {
  if (!prochaine) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const p = new Date(prochaine.getFullYear(), prochaine.getMonth(), prochaine.getDate());
  return Math.round((p.getTime() - t.getTime()) / MS_PAR_JOUR);
}

export function estARelancer(p: Relancable, today: Date = new Date()): boolean {
  const jr = joursRestants(prochaineRelance(p), today);
  return jr !== null && jr <= 0;
}
