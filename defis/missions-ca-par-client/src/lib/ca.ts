import type { Statut } from "./nettoyage";

// Les 3 chiffres que la base d'origine ne savait pas sortir, client par client.
// Memes regles que les cumuls Airtable / formules NocoDB du projet no-code.

export interface MissionPourCa {
  clientId: number;
  statut: Statut;
  montant: number;
  facture: boolean;
}

export interface CaClient {
  nbMissions: number;
  caFacture: number;
  resteAFacturer: number;
  enCours: number;
}

export const CA_VIDE: CaClient = { nbMissions: 0, caFacture: 0, resteAFacturer: 0, enCours: 0 };

// Calcul en centimes pour eviter les arrondis flottants sur les sommes
const centimes = (euros: number) => Math.round(euros * 100);

function ajouter(ca: CaClient, m: MissionPourCa): CaClient {
  const c = centimes(m.montant);
  return {
    nbMissions: ca.nbMissions + 1,
    caFacture: ca.caFacture + (m.facture ? c : 0),
    resteAFacturer: ca.resteAFacturer + (m.statut === "TERMINEE" && !m.facture ? c : 0),
    enCours: ca.enCours + (m.statut === "EN_COURS" ? c : 0),
  };
}

const enEuros = (ca: CaClient): CaClient => ({
  nbMissions: ca.nbMissions,
  caFacture: ca.caFacture / 100,
  resteAFacturer: ca.resteAFacturer / 100,
  enCours: ca.enCours / 100,
});

export function calculerCaParClient(missions: MissionPourCa[]): Map<number, CaClient> {
  const parClient = new Map<number, CaClient>();
  for (const m of missions) parClient.set(m.clientId, ajouter(parClient.get(m.clientId) ?? CA_VIDE, m));
  return new Map([...parClient].map(([id, ca]) => [id, enEuros(ca)]));
}

export function totaux(missions: MissionPourCa[]): CaClient {
  return enEuros(missions.reduce(ajouter, CA_VIDE));
}
