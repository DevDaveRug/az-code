import type { Interaction, Prospect, TypeInteraction } from "@prisma/client";

// Retourne la date la plus récente entre le fallback initial (prospect.dernierContact,
// posé à la création du prospect) et le max des dates d'interactions.
// Le champ physique prospect.dernierContact est maintenu à jour par les server actions
// (POST interaction met à jour prospect.dernierContact si l'interaction est plus récente),
// donc cette fonction sert surtout à la vue détail qui charge interactions séparément.
export function derniereInteractionAt(
  prospect: Pick<Prospect, "dernierContact">,
  interactions: Pick<Interaction, "date">[]
): Date {
  if (interactions.length === 0) return new Date(prospect.dernierContact);
  const maxInter = interactions.reduce(
    (acc, i) => (new Date(i.date) > acc ? new Date(i.date) : acc),
    new Date(interactions[0].date)
  );
  const fallback = new Date(prospect.dernierContact);
  return maxInter > fallback ? maxInter : fallback;
}

export const LIBELLE_TYPE_INTERACTION: Record<TypeInteraction, string> = {
  APPEL: "Appel",
  EMAIL: "Email",
  LI: "LinkedIn",
  WA: "WhatsApp",
  RDV: "Rendez-vous",
  AUTRE: "Autre"
};

export const COULEUR_TYPE_INTERACTION: Record<TypeInteraction, string> = {
  APPEL: "bg-blue-100 text-blue-900",
  EMAIL: "bg-slate-100 text-slate-900",
  LI: "bg-sky-100 text-sky-900",
  WA: "bg-green-100 text-green-900",
  RDV: "bg-purple-100 text-purple-900",
  AUTRE: "bg-gray-100 text-gray-900"
};
