import type { LigneAvant } from "./nettoyage";

// La base "qui part en vrille", anonymisee : 1 table, 7 colonnes texte.
// Meme contenu que az-no-code/defis/missions-ca-par-client/import-csv/missions-avant.csv
export const donneesAvant: LigneAvant[] = [
  { mission: "Refonte site", client: "Alice martin", emailClient: "alice.martin@legrand.example", statut: "terminé", montant: "2500 €", dateFin: "12/03/2026", facture: "oui" },
  { mission: "Création d'une app mobile", client: "TechFlow SAS", emailClient: "bob.durand@techflow.example", statut: "fini", montant: "80k€", dateFin: "mai 2026", facture: "OUI" },
  { mission: "Maintenance page", client: "Alice Martin", emailClient: "alice.martin@legrand.example", statut: "arrêté", montant: "500 EUR", dateFin: "juin", facture: "x" },
  { mission: "Audit", client: "Chloé de Studio Zenith", emailClient: "chloe.dubois@studio-zenith.example", statut: "en cours", montant: "1200 €", dateFin: "24/06/2026", facture: "" },
  { mission: "Maintenance", client: "Alice Martin", emailClient: "alice.martin@legrand.example", statut: "EN COURS", montant: "450", dateFin: "Juillet", facture: "non" },
  { mission: "Tunnel de vente", client: "Emma Petit", emailClient: "emma.petit@marketpro.example", statut: "Terminé", montant: "3 200,00 €", dateFin: "15/05/2026", facture: "non" },
  { mission: "Atelier CRM", client: "fabien roux", emailClient: "fabien.roux@atelier-nord.example", statut: "à faire", montant: "900€", dateFin: "30/10/2026", facture: "" },
];

export const COLONNES_AVANT: { cle: keyof LigneAvant; titre: string }[] = [
  { cle: "mission", titre: "Mission" },
  { cle: "client", titre: "Client" },
  { cle: "emailClient", titre: "Email client" },
  { cle: "statut", titre: "Statut" },
  { cle: "montant", titre: "Montant" },
  { cle: "dateFin", titre: "Date de fin" },
  { cle: "facture", titre: "Facturé" },
];
