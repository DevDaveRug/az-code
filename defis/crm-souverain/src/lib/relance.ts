import type { Prospect } from "@prisma/client";

const JOURS_RELANCE = 7;
const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

export function prochaineRelance(p: Pick<Prospect, "statut" | "dernierContact">): Date | null {
  if (p.statut !== "NOUVEAU" && p.statut !== "EN_COURS") return null;
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

export function estARelancer(p: Pick<Prospect, "statut" | "dernierContact">, today: Date = new Date()): boolean {
  const pr = prochaineRelance(p);
  if (!pr) return false;
  const jr = joursRestants(pr, today);
  return jr !== null && jr <= 0;
}

export function couleurUrgence(joursRestants: number | null): string {
  if (joursRestants === null) return "";
  if (joursRestants < 0) return "bg-red-100 text-red-900";
  if (joursRestants === 0) return "bg-orange-100 text-orange-900";
  if (joursRestants <= 2) return "bg-yellow-100 text-yellow-900";
  return "";
}
