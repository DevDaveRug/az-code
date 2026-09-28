// Regles de nettoyage de la migration "avant -> apres" d'une base de missions tapee a la main.
// Miroir code de az-no-code/defis/missions-ca-par-client/DIAGNOSTIC.md (plan de migration).
// Fonctions pures, sans base de donnees : utilisees par le seed, la page /avant-apres et les tests.

export type Statut = "A_FAIRE" | "EN_COURS" | "TERMINEE" | "ARRETEE";

export const STATUTS: Statut[] = ["A_FAIRE", "EN_COURS", "TERMINEE", "ARRETEE"];

export interface Resultat<T> {
  valeur: T;
  alerte?: string;
}

// Une ligne de la base d'origine : 7 colonnes, toutes en texte libre
export interface LigneAvant {
  mission: string;
  client: string;
  emailClient: string;
  statut: string;
  montant: string;
  dateFin: string;
  facture: string;
}

export interface ClientNettoye {
  cle: string;
  nom: string;
  contact: string | null;
  email: string;
  alertes: string[];
}

export interface MissionNettoyee {
  ligne: number;
  intitule: string;
  cleClient: string;
  statut: Statut;
  montant: number | null;
  dateFin: Date | null;
  facture: boolean;
  alertes: string[];
}

export interface BaseNettoyee {
  clients: ClientNettoye[];
  missions: MissionNettoyee[];
}

// Cle de comparaison : sans accents, sans casse, espaces reduits
export function cleTexte(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// "2500 €", "80k€", "500 EUR", "450", "3 200,00 €", "1.200,50" -> nombre en euros
export function parseMontant(brut: string): Resultat<number | null> {
  const s = brut.trim();
  if (!s) return { valeur: null, alerte: "Montant vide" };

  let t = cleTexte(s).replace(/euros?|eur|€/g, "").replace(/[\s  ]/g, "");
  let multiplicateur = 1;
  if (t.endsWith("k")) {
    multiplicateur = 1000;
    t = t.slice(0, -1);
  }

  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, "");
  else t = t.replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(t)) return { valeur: null, alerte: `Montant "${s}" illisible` };
  return { valeur: Math.round(Number(t) * multiplicateur * 100) / 100 };
}

const VARIANTES_STATUT: Record<Statut, string[]> = {
  TERMINEE: ["termine", "terminee", "fini", "finie", "fait", "faite", "livre", "livree", "clos", "close"],
  EN_COURS: ["en cours", "encours", "en-cours", "demarre", "demarree"],
  ARRETEE: ["arrete", "arretee", "annule", "annulee", "abandonne", "abandonnee", "stoppe", "stoppee"],
  A_FAIRE: ["a faire", "afaire", "a venir", "prevu", "prevue", "todo"],
};

// "terminé", "fini", "EN COURS"... -> une des 4 valeurs de la liste fermee
export function parseStatut(brut: string): Resultat<Statut> {
  const cle = cleTexte(brut);
  if (!cle) return { valeur: "A_FAIRE", alerte: "Statut vide, mis en À faire" };
  for (const statut of STATUTS) {
    if (VARIANTES_STATUT[statut].includes(cle)) return { valeur: statut };
  }
  return { valeur: "A_FAIRE", alerte: `Statut "${brut.trim()}" non reconnu, mis en À faire` };
}

const OUI = ["oui", "o", "yes", "y", "1", "true", "vrai", "checked", "ok", "facture", "facturee"];
const NON = ["non", "n", "no", "0", "false", "faux"];

// "oui", "OUI", "x", "non", vide -> case a cocher
export function parseFacture(brut: string): Resultat<boolean> {
  const cle = cleTexte(brut);
  if (!cle) return { valeur: false, alerte: "Facturé vide lu comme non" };
  if (cle === "x") return { valeur: true, alerte: `Facturé "x" lu comme oui, à confirmer` };
  if (OUI.includes(cle)) return { valeur: true };
  if (NON.includes(cle)) return { valeur: false };
  return { valeur: false, alerte: `Facturé "${brut.trim()}" non reconnu, lu comme non` };
}

const MOIS: Record<string, number> = {
  janvier: 1, janv: 1, jan: 1, fevrier: 2, fevr: 2, fev: 2, mars: 3, avril: 4, avr: 4,
  mai: 5, juin: 6, juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, sep: 9,
  octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12,
};

function dateUtc(annee: number, mois: number, jour: number): Date | null {
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  const valide = d.getUTCFullYear() === annee && d.getUTCMonth() === mois - 1 && d.getUTCDate() === jour;
  return valide ? d : null;
}

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

export function formatDateFr(d: Date): string {
  return `${deuxChiffres(d.getUTCDate())}/${deuxChiffres(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

// "12/03/2026", "2026-03-12", "mai 2026", "juin" -> date complete (UTC, sans heure)
// Mois sans jour : dernier jour du mois retenu, avec une alerte "a confirmer"
export function parseDateFin(brut: string, anneeParDefaut: number): Resultat<Date | null> {
  const s = brut.trim();
  if (!s) return { valeur: null };

  const fr = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (fr || iso) {
    const [a, m, j] = fr
      ? [Number(fr[3]) < 100 ? Number(fr[3]) + 2000 : Number(fr[3]), Number(fr[2]), Number(fr[1])]
      : [Number(iso![1]), Number(iso![2]), Number(iso![3])];
    const d = dateUtc(a, m, j);
    return d ? { valeur: d } : { valeur: null, alerte: `Date "${s}" impossible, laissée vide` };
  }

  const mois = cleTexte(s).match(/^([a-z]+)\.?(?:\s+(\d{4}))?$/);
  if (mois && MOIS[mois[1]]) {
    const annee = mois[2] ? Number(mois[2]) : anneeParDefaut;
    const d = new Date(Date.UTC(annee, MOIS[mois[1]], 0));
    const alerte = mois[2]
      ? `Date "${s}" sans jour : ${formatDateFr(d)} retenu (dernier jour du mois), à confirmer`
      : `Date "${s}" sans jour ni année : ${formatDateFr(d)} retenu, à confirmer`;
    return { valeur: d, alerte };
  }

  return { valeur: null, alerte: `Date "${s}" illisible, laissée vide` };
}

// Annee la plus frequente parmi les dates completes : sert aux dates "juin", "Juillet"
export function anneeDeReference(dates: string[], parDefaut: number): number {
  const compte = new Map<number, number>();
  for (const d of dates) {
    const a = d.match(/\b(\d{4})\b/);
    if (a) compte.set(Number(a[1]), (compte.get(Number(a[1])) ?? 0) + 1);
  }
  let meilleure = parDefaut;
  let max = 0;
  for (const [annee, n] of compte) {
    if (n > max) [meilleure, max] = [annee, n];
  }
  return meilleure;
}

const PARTICULES = ["de", "du", "des", "la", "le", "les", "d", "et", "chez"];

function estBienForme(nom: string): boolean {
  return nom.split(/\s+/).every((mot) => PARTICULES.includes(mot.toLowerCase()) || /^\p{Lu}/u.test(mot));
}

function formaterNom(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .map((mot, i) =>
      i > 0 && PARTICULES.includes(mot.toLowerCase())
        ? mot.toLowerCase()
        : mot
            .split("-")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join("-"),
    )
    .join(" ");
}

// Parmi "Alice martin", "Alice Martin", "Alice Martin" : la graphie bien formee la plus frequente
export function choisirNom(variantes: string[]): string {
  const compte = new Map<string, number>();
  for (const v of variantes) compte.set(v.trim(), (compte.get(v.trim()) ?? 0) + 1);
  const classees = [...compte.entries()].sort(
    ([a, na], [b, nb]) => Number(estBienForme(b)) - Number(estBienForme(a)) || nb - na,
  );
  const meilleure = classees[0][0];
  return estBienForme(meilleure) ? meilleure : formaterNom(meilleure);
}

// "bob.durand@..." -> "Bob Durand", "j.lefebvre@..." -> "J. Lefebvre", "contact@..." -> null
export function nomDepuisEmail(email: string): string | null {
  const parties = email.split("@")[0].split(/[._-]+/).filter(Boolean);
  if (parties.length < 2) return null;
  return parties
    .map((p) => (p.length === 1 ? `${p.toUpperCase()}.` : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
    .join(" ");
}

const dernierMot = (s: string) => cleTexte(s).split(" ").pop() ?? "";

// Le client est-il une entreprise avec un interlocuteur ?
// "Chloé de Studio Zenith" -> client "Studio Zenith", contact "Chloé"
// "TechFlow SAS" + bob.durand@... -> client "TechFlow SAS", contact "Bob Durand"
export function separerContact(nom: string, email: string): { nom: string; contact: string | null; alerte?: string } {
  const deChez = nom.match(/^(\p{Lu}[\p{L}'-]*) (?:de|chez) (\p{Lu}.*)$/u);
  if (deChez) {
    return {
      nom: deChez[2],
      contact: deChez[1],
      alerte: `"${nom}" séparé en client "${deChez[2]}" et contact "${deChez[1]}", à confirmer`,
    };
  }
  const depuisEmail = nomDepuisEmail(email);
  if (depuisEmail && dernierMot(depuisEmail) !== dernierMot(nom)) {
    return { nom, contact: depuisEmail, alerte: `Contact "${depuisEmail}" déduit de l'e-mail, à confirmer` };
  }
  return { nom, contact: null };
}

// La migration complete : 1 table texte -> clients uniques + missions typees
export function nettoyerBase(lignes: LigneAvant[], anneeParDefaut = new Date().getUTCFullYear()): BaseNettoyee {
  const annee = anneeDeReference(lignes.map((l) => l.dateFin), anneeParDefaut);

  // 1- Un client par e-mail (a defaut, par nom normalise) : c'est la table Clients qui manquait
  const groupes = new Map<string, { email: string; variantes: string[] }>();
  for (const l of lignes) {
    const email = l.emailClient.trim().toLowerCase();
    const cle = email || `nom:${cleTexte(l.client)}`;
    const groupe = groupes.get(cle) ?? { email, variantes: [] };
    groupe.variantes.push(l.client);
    groupes.set(cle, groupe);
  }

  const clients: ClientNettoye[] = [...groupes.entries()].map(([cle, { email, variantes }]) => {
    const alertes: string[] = [];
    const graphies = [...new Set(variantes.map((v) => v.trim()))];
    if (graphies.length > 1) alertes.push(`Écrit de ${graphies.length} façons : ${graphies.map((g) => `"${g}"`).join(", ")}`);
    if (!email) alertes.push("Pas d'e-mail : rapproché par le nom, à compléter");
    const separe = separerContact(choisirNom(variantes), email);
    if (separe.alerte) alertes.push(separe.alerte);
    return { cle, nom: separe.nom, contact: separe.contact, email, alertes };
  });

  // 2- Chaque colonne texte passe dans son vrai type
  const missions: MissionNettoyee[] = lignes.map((l, i) => {
    const email = l.emailClient.trim().toLowerCase();
    const statut = parseStatut(l.statut);
    const montant = parseMontant(l.montant);
    const dateFin = parseDateFin(l.dateFin, annee);
    const facture = parseFacture(l.facture);
    return {
      ligne: i + 1,
      intitule: l.mission.trim(),
      cleClient: email || `nom:${cleTexte(l.client)}`,
      statut: statut.valeur,
      montant: montant.valeur,
      dateFin: dateFin.valeur,
      facture: facture.valeur,
      alertes: [statut, montant, dateFin, facture].flatMap((r) => (r.alerte ? [r.alerte] : [])),
    };
  });

  // 3- Vrais doublons possibles : meme client, un intitule contenu dans l'autre ("Maintenance" / "Maintenance page")
  for (const a of missions) {
    for (const b of missions) {
      if (a === b || a.cleClient !== b.cleClient) continue;
      const [ca, cb] = [cleTexte(a.intitule), cleTexte(b.intitule)];
      if (ca === cb || ca.startsWith(`${cb} `) || cb.startsWith(`${ca} `)) {
        a.alertes.push(`Doublon possible avec "${b.intitule}" (même client)`);
      }
    }
  }

  return { clients, missions };
}
