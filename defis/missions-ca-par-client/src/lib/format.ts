import type { Statut } from "./nettoyage";

export const LIBELLE_STATUT: Record<Statut, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ARRETEE: "Arrêtée",
};

export const COULEUR_STATUT: Record<Statut, string> = {
  A_FAIRE: "bg-gray-100 text-gray-700",
  EN_COURS: "bg-yellow-100 text-yellow-800",
  TERMINEE: "bg-green-100 text-green-800",
  ARRETEE: "bg-red-100 text-red-800",
};

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatEuro(montant: number | null): string {
  return montant === null ? "-" : euros.format(montant);
}

export function formatDate(d: Date | null): string {
  return d ? d.toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "-";
}
