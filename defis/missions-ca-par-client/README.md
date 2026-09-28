# Missions et CA par client -- MVP code souverain

Projet portfolio : suivi des missions avec le chiffre d'affaires facturé, à facturer et en cours, client par client. Version code souverain de la structure cible du diagnostic `az-no-code/defis/missions-ca-par-client/DIAGNOSTIC.md` (défi Alegria n°5, semaine 40 : « une base Airtable qui part en vrille »).

La particularité de ce projet : le seed **est** la migration. Il part de la base d'origine (1 table, 7 colonnes en texte, doublons, « 80k€ », « juin ») et la convertit avec des règles de nettoyage testées.

## Stack

- Next.js 14 App Router (TypeScript, runtime Node)
- Neon PostgreSQL (schema `missions` isolé, pattern multi-schéma S136z P4)
- Prisma ORM (`previewFeatures = ["multiSchema"]`)
- Tailwind CSS
- Vercel (région `cdg1`)
- Tests : `node:test` via `tsx` (aucune dépendance de test en plus)

## Pages et API

- `/` : KPIs (CA facturé, reste à facturer, en cours, lignes à vérifier), tableau « CA par client », liste des missions avec filtres (En cours, À facturer, Facturées, Arrêtées)

- `/missions/nouvelle` : formulaire typé (client choisi dans une liste ou créé une seule fois, montant numérique, vraie date, case à cocher)

- `/avant-apres` : la base d'origine et le résultat de la migration côte à côte, avec chaque décision de nettoyage visible. Page sans base de données : elle fonctionne même avant le provisionnement Neon

- `GET /api/clients` : clients + CA calculé ; `GET /api/missions` ; `POST /api/missions` : valide les types, rattache au client existant par e-mail (pas de doublon possible)

## Modèle

`prisma/schema.prisma` : `Client` (nom, contact, e-mail unique, téléphone) et `Mission` (intitulé, client lié, statut en liste fermée, montant `Decimal(12,2)`, date de fin `Date`, facturé booléen). Les 2 champs `notesMigration` gardent la trace des valeurs interprétées pendant la migration.

## Règles de nettoyage (`src/lib/nettoyage.ts`, testées dans `nettoyage.test.ts`)

-> Montants : « 2500 € », « 80k€ », « 500 EUR », « 3 200,00 € », « 1.200,50 » -> nombre en euros

-> Statuts : « terminé », « fini », « EN COURS »... -> À faire / En cours / Terminée / Arrêtée ; valeur inconnue = À faire + alerte

-> Facturé : « oui », « OUI » -> oui ; « x » -> oui + alerte ; vide -> non + alerte

-> Dates : « 12/03/2026 » exacte ; « mai 2026 » -> 31/05/2026 + alerte ; « juin » -> 30/06 de l'année la plus fréquente dans la base + alerte

-> Clients : un client par e-mail ; graphie la plus fréquente bien formée (« Alice Martin » plutôt que « Alice martin ») ; « Chloé de Studio Zenith » -> client Studio Zenith, contact Chloé ; « TechFlow SAS » + `bob.durand@...` -> contact Bob Durand déduit de l'e-mail (alerte)

-> Doublons possibles : même client et un intitulé contenu dans l'autre (« Maintenance » / « Maintenance page ») -> alerte sur les 2 lignes, jamais de suppression automatique

## Setup local

```
cp .env.example .env
# DATABASE_URL : Neon (ou Postgres local), terminer par ?schema=missions
npm install
npm test
npx prisma db push
npm run seed      # rejoue la migration : 7 lignes -> 5 clients + 7 missions (5 à vérifier)
npm run dev
```

## Deploy Vercel

1- Nouveau projet Vercel relié à `DevDaveRug/az-code`, root directory `defis/missions-ca-par-client/`, nom de projet `missions-ca-par-client` (URL courte `missions-ca-par-client.vercel.app`).

2- Variable `DATABASE_URL` : chaîne Neon du projet `Sales Closer Souverain` terminée par `?schema=missions`.

3- Deploy : Vercel exécute `prisma generate && prisma db push && next build` (`vercel.json`). Lancer ensuite `npm run seed` une fois en local contre la même `DATABASE_URL` pour les données de démonstration.

4- Domaine personnalisé (IDEE_infra_200) : `missions-ca-par-client.demo.salescloser.fr`, voir la procédure du skill `/defi-hebdo-alegria` (`references/CUSTOM_DOMAINS.md`).

## Vérifié le 28/09/2026 (S163z-ccweb)

`npm test` 9/9, `tsc --noEmit` OK, `next build` OK, parcours complet sur Postgres 16 local : `db push`, seed, `GET /api/clients` (CA attendu : 83 000 € facturé, 3 200 € à facturer, 1 650 € en cours), `POST /api/missions` (client existant retrouvé malgré « alice MARTIN » et un e-mail en majuscules ; « 80k », statut « fini » et date « juin » refusés). Captures dans `az-no-code/defis/missions-ca-par-client/captures/`.
