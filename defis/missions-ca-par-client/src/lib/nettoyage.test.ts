import { test } from "node:test";
import assert from "node:assert/strict";
import {
  anneeDeReference,
  choisirNom,
  nettoyerBase,
  nomDepuisEmail,
  parseDateFin,
  parseFacture,
  parseMontant,
  parseStatut,
  separerContact,
} from "./nettoyage";
import { donneesAvant } from "./donnees-avant";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

test("montants : les 6 écritures de la base d'origine", () => {
  const cas: [string, number][] = [
    ["2500 €", 2500],
    ["80k€", 80000],
    ["500 EUR", 500],
    ["1200 €", 1200],
    ["450", 450],
    ["3 200,00 €", 3200],
    ["1.200,50", 1200.5],
    ["80,000", 80000],
    ["1,5k", 1500],
    ["900€", 900],
  ];
  for (const [brut, attendu] of cas) assert.equal(parseMontant(brut).valeur, attendu, brut);
  assert.equal(parseMontant("beaucoup").valeur, null);
  assert.match(parseMontant("beaucoup").alerte ?? "", /illisible/);
  assert.match(parseMontant("").alerte ?? "", /vide/);
});

test("statuts : mots libres -> liste fermée", () => {
  for (const s of ["terminé", "fini", "Terminé"]) assert.equal(parseStatut(s).valeur, "TERMINEE", s);
  for (const s of ["en cours", "EN COURS"]) assert.equal(parseStatut(s).valeur, "EN_COURS", s);
  assert.equal(parseStatut("arrêté").valeur, "ARRETEE");
  assert.equal(parseStatut("à faire").valeur, "A_FAIRE");
  assert.equal(parseStatut("fini").alerte, undefined);
  const inconnu = parseStatut("bof");
  assert.equal(inconnu.valeur, "A_FAIRE");
  assert.match(inconnu.alerte ?? "", /non reconnu/);
});

test("facturé : oui / OUI / x / non / vide", () => {
  assert.deepEqual(parseFacture("oui"), { valeur: true });
  assert.deepEqual(parseFacture("OUI"), { valeur: true });
  assert.deepEqual(parseFacture("non"), { valeur: false });
  assert.equal(parseFacture("x").valeur, true);
  assert.match(parseFacture("x").alerte ?? "", /à confirmer/);
  assert.equal(parseFacture("").valeur, false);
  assert.match(parseFacture("").alerte ?? "", /vide/);
});

test("dates : complètes, mois seul, mois + année, impossibles", () => {
  assert.equal(iso(parseDateFin("12/03/2026", 2026).valeur), "2026-03-12");
  assert.equal(parseDateFin("12/03/2026", 2026).alerte, undefined);
  assert.equal(iso(parseDateFin("2026-10-30", 2026).valeur), "2026-10-30");
  assert.equal(iso(parseDateFin("mai 2026", 2020).valeur), "2026-05-31");
  assert.match(parseDateFin("mai 2026", 2026).alerte ?? "", /sans jour :/);
  assert.equal(iso(parseDateFin("juin", 2026).valeur), "2026-06-30");
  assert.equal(iso(parseDateFin("Juillet", 2026).valeur), "2026-07-31");
  assert.match(parseDateFin("Juillet", 2026).alerte ?? "", /sans jour ni année/);
  assert.equal(iso(parseDateFin("févr. 2027", 2026).valeur), "2027-02-28");
  assert.equal(parseDateFin("31/02/2026", 2026).valeur, null);
  assert.equal(parseDateFin("", 2026).valeur, null);
  assert.equal(anneeDeReference(["12/03/2026", "mai 2026", "juin", "01/01/2025"], 1999), 2026);
  assert.equal(anneeDeReference(["juin"], 1999), 1999);
});

test("clients : graphie, contact déduit, client + contact séparés", () => {
  assert.equal(choisirNom(["Alice martin", "Alice Martin", "Alice Martin"]), "Alice Martin");
  assert.equal(choisirNom(["fabien roux"]), "Fabien Roux");
  assert.equal(choisirNom(["TechFlow SAS"]), "TechFlow SAS");
  assert.equal(nomDepuisEmail("j.lefebvre@orange.example"), "J. Lefebvre");
  assert.equal(nomDepuisEmail("contact@dupont.example"), null);

  assert.deepEqual(separerContact("Alice Martin", "alice.martin@legrand.example"), { nom: "Alice Martin", contact: null });
  assert.deepEqual(separerContact("Marie Dupont", "contact@dupont.example"), { nom: "Marie Dupont", contact: null });
  const entreprise = separerContact("TechFlow SAS", "bob.durand@techflow.example");
  assert.equal(entreprise.contact, "Bob Durand");
  const deChez = separerContact("Maud de Les Esgourdes", "lesesgourdes@example.org");
  assert.equal(deChez.nom, "Les Esgourdes");
  assert.equal(deChez.contact, "Maud");
});

test("migration complète de la base d'origine", () => {
  const base = nettoyerBase(donneesAvant, 1999);

  assert.equal(base.clients.length, 5, "7 lignes, 5 clients uniques");
  const alice = base.clients.find((c) => c.email === "alice.martin@legrand.example");
  assert.equal(alice?.nom, "Alice Martin");
  assert.match(alice?.alertes[0] ?? "", /Écrit de 2 façons/);
  const zenith = base.clients.find((c) => c.email === "chloe.dubois@studio-zenith.example");
  assert.deepEqual([zenith?.nom, zenith?.contact], ["Studio Zenith", "Chloé"]);
  const techflow = base.clients.find((c) => c.email === "bob.durand@techflow.example");
  assert.deepEqual([techflow?.nom, techflow?.contact], ["TechFlow SAS", "Bob Durand"]);

  assert.equal(base.missions.filter((m) => m.cleClient === "alice.martin@legrand.example").length, 3);
  assert.deepEqual(
    base.missions.map((m) => m.montant),
    [2500, 80000, 500, 1200, 450, 3200, 900],
  );
  assert.deepEqual(
    base.missions.map((m) => iso(m.dateFin)),
    ["2026-03-12", "2026-05-31", "2026-06-30", "2026-06-24", "2026-07-31", "2026-05-15", "2026-10-30"],
    "année de référence déduite des données (2026), pas du paramètre par défaut",
  );

  const [maintenancePage, maintenance] = [base.missions[2], base.missions[4]];
  assert.ok(maintenancePage.alertes.some((a) => a.includes('Doublon possible avec "Maintenance"')));
  assert.ok(maintenance.alertes.some((a) => a.includes('Doublon possible avec "Maintenance page"')));
  assert.ok(!base.missions[0].alertes.some((a) => a.includes("Doublon")), "Refonte site n'est pas un doublon");

  assert.equal(base.missions.filter((m) => m.alertes.length > 0).length, 5, "5 lignes à vérifier");
});
