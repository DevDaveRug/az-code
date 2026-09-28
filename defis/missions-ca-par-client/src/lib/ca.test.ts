import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerCaParClient, totaux, type MissionPourCa } from "./ca";

const missions: MissionPourCa[] = [
  { clientId: 1, statut: "TERMINEE", montant: 2500, facture: true },
  { clientId: 2, statut: "TERMINEE", montant: 80000, facture: true },
  { clientId: 1, statut: "ARRETEE", montant: 500, facture: true },
  { clientId: 3, statut: "EN_COURS", montant: 1200, facture: false },
  { clientId: 1, statut: "EN_COURS", montant: 450, facture: false },
  { clientId: 4, statut: "TERMINEE", montant: 3200, facture: false },
  { clientId: 5, statut: "A_FAIRE", montant: 900, facture: false },
];

test("CA par client : facturé, reste à facturer, en cours", () => {
  const ca = calculerCaParClient(missions);
  assert.deepEqual(ca.get(1), { nbMissions: 3, caFacture: 3000, resteAFacturer: 0, enCours: 450 });
  assert.deepEqual(ca.get(2), { nbMissions: 1, caFacture: 80000, resteAFacturer: 0, enCours: 0 });
  assert.deepEqual(ca.get(4), { nbMissions: 1, caFacture: 0, resteAFacturer: 3200, enCours: 0 });
  assert.deepEqual(ca.get(5), { nbMissions: 1, caFacture: 0, resteAFacturer: 0, enCours: 0 });
});

test("totaux identiques aux chiffres attendus côté Airtable et NocoDB", () => {
  assert.deepEqual(totaux(missions), { nbMissions: 7, caFacture: 83000, resteAFacturer: 3200, enCours: 1650 });
});

test("pas d'erreur d'arrondi sur les centimes", () => {
  const t = totaux([
    { clientId: 1, statut: "TERMINEE", montant: 0.1, facture: true },
    { clientId: 1, statut: "TERMINEE", montant: 0.2, facture: true },
  ]);
  assert.equal(t.caFacture, 0.3);
});
