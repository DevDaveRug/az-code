# Défi crm-souverain (CRM avec relances + relations)

MVP Next.js exécutable + déployable Vercel. Origine : défi Alegria d'Eva PRO du 5/9/2026 - première brique de la boite à outils souveraine.

Version : 0.2.0
Livraison v0.1 : 2026-09-05
Livraison v0.2 : 2026-09-04

Compagnon no-code : [az-no-code/defis/crm-souverain](https://github.com/DevDaveRug/az-no-code/tree/main/defis/crm-souverain)

## Ce que fait ce MVP

**v0.1 (base)** :

-> vue "Tous les prospects" (par défaut, triée par date d'entrée)

-> vue "À relancer" (accès via `/?vue=relance`, filtre statut Nouveau/En cours + prochaine relance <= aujourd'hui)

-> formulaire d'ajout (`/nouveau`)

-> seed avec 4 prospects fictifs couvrant les 4 statuts

**v0.2 (nouveautés)** :

-> table `Entreprise` séparée (nom, secteur, taille, site, adresse, notes) -- une entreprise a N prospects

-> table `Interaction` (log chronologique par prospect : appel, email, LI, WA, RDV, autre) -- date + résumé + résultat + prochaine étape

-> vue détail prospect (`/prospects/[id]`) : coordonnées + entreprise + notes + timeline complète des interactions + formulaire d'ajout d'interaction (server action)

-> dropdown searchable custom sur le formulaire d'ajout de prospect : cherche une entreprise existante par nom OU propose "+ Créer nouvelle entreprise : « <texte> »" au vol (composant client, zero lib tierce)

-> API enrichie : `GET /api/prospects/[id]` (détail avec entreprise + interactions), `POST /api/prospects/[id]/interactions`, `GET/POST /api/entreprises`

Le calcul "prochaine relance = dernier contact + 7 jours" est fait côté application (fonction pure dans `src/lib/relance.ts`). Le champ physique `prospect.dernierContact` est maintenu à jour par les server actions à chaque nouvelle interaction (max entre valeur actuelle et date de l'interaction).

## Lancer en local

Prérequis : Node 18+, une URL Postgres (Neon recommandé, ou Postgres local).

```bash
cd defis/crm-souverain
npm install
cp .env.example .env.local
# éditer .env.local avec ta DATABASE_URL Neon
npx prisma db push
npm run db:seed
npm run dev
# ouvrir http://localhost:3000
```

## Déployer sur Vercel + Neon (5 min)

### 1. Créer la base Neon

-> Aller sur https://console.neon.tech/

-> New project -> nom : `crm-souverain` -> région : `Europe (Frankfurt)`

-> Copier la connection string avec pooler (finit par `-pooler.aws.neon.tech`)

### 2. Importer sur Vercel

-> Aller sur https://vercel.com/new

-> Import Git Repository -> DevDaveRug/az-code

-> Root Directory : `defis/crm-souverain` (important, pas la racine du repo)

-> Framework preset : Next.js (auto-détecté)

-> Environment Variables : `DATABASE_URL` = la connection string Neon

-> Deploy

### 3. Après premier deploy

Le `buildCommand` fait déjà `prisma db push` au build (voir `vercel.json`). Pour semer les données de démo :

```bash
curl -X POST https://<votre-url>.vercel.app/api/seed
# ou GET pour convenience : https://<votre-url>.vercel.app/api/seed
```

Retourne le compte final (entreprises, prospects, interactions).

**Migration v0.1 -> v0.2** : le schéma a changé (retrait de `entreprise` String sur Prospect, ajout de FK `entrepriseId` + nouvelles tables `sc_entreprises` et `sc_interactions`). Après pull de v0.2 sur une base v0.1 existante :

```bash
npx prisma db push
curl -X POST https://<votre-url>.vercel.app/api/seed  # reseed complet
```

Ou en local :

```bash
npx prisma db push
npm run db:seed
```

### 4. URL vivante

Vercel donne `https://crm-souverain.vercel.app` (ou variant hash). À partager comme démo.

## Endpoints API

### `GET /api/prospects`

Liste tous les prospects, entreprise incluse.

```bash
curl https://crm-souverain.vercel.app/api/prospects
```

### `GET /api/prospects?vue=relance`

Uniquement les prospects à relancer.

### `POST /api/prospects`

Crée un prospect. `entrepriseId` optionnel (Int, doit préexister).

```bash
curl -X POST https://crm-souverain.vercel.app/api/prospects \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Test","nom":"Prospect","email":"test@example.com","entrepriseId":1}'
```

### `GET /api/prospects/[id]`

Détail prospect + entreprise + interactions triées date desc + prochaine relance calculée.

### `POST /api/prospects/[id]/interactions`

Ajoute une interaction. Met à jour `prospect.dernierContact` si la date est plus récente (transaction atomique).

```bash
curl -X POST https://crm-souverain.vercel.app/api/prospects/1/interactions \
  -H "Content-Type: application/json" \
  -d '{"type":"EMAIL","date":"2026-09-04","resume":"Envoi devis","resultat":"Attend","nextStep":"Relance J+7"}'
```

Types acceptés : `APPEL`, `EMAIL`, `LI`, `WA`, `RDV`, `AUTRE`.

### `GET /api/entreprises?q=...`

Recherche entreprises par nom (case-insensitive, max 50 résultats). Utilisé par le dropdown searchable du formulaire.

### `POST /api/entreprises`

Crée une entreprise. `nom` requis, autres champs optionnels.

### `POST /api/seed`

Reset complet + reseed 4 entreprises + 4 prospects + interactions. Idempotent.

## Structure

```
defis/crm-souverain/
  README.md                       ce fichier
  package.json
  prisma/
    schema.prisma                 3 models (Entreprise, Prospect, Interaction) + 3 enums
    seed.ts                       seed CLI local (miroir de api/seed)
  src/
    lib/
      prisma.ts                   singleton Prisma client
      relance.ts                  fonctions pures prochaineRelance / joursRestants / couleurUrgence
      interactions.ts             helpers (derniereInteractionAt, libellés + couleurs par type)
    components/
      EntrepriseSearchable.tsx    dropdown searchable custom (client, zero lib tierce)
    app/
      layout.tsx                  nav + footer
      globals.css                 tailwind + variables theme
      page.tsx                    vue liste + vue relance (avec lien Détail)
      nouveau/page.tsx            formulaire ajout prospect (server action + EntrepriseSearchable)
      prospects/[id]/page.tsx     vue détail prospect (server action ajouterInteraction)
      api/
        prospects/route.ts        GET + POST
        prospects/[id]/route.ts   GET détail
        prospects/[id]/interactions/route.ts   POST
        entreprises/route.ts      GET + POST
        seed/route.ts             POST reset+reseed
```

## Alignement stack LIA'M

Ce MVP reprend les choix de LIA'M :

-> Next.js 14 App Router, runtime Node

-> TypeScript strict

-> Prisma ORM + PostgreSQL (Neon)

-> Server components + server actions (pas de state client inutile)

-> Vercel deploy avec `prisma db push` au build

Différences volontaires :

-> pas de NextAuth (une seule "org" pour ce défi)

-> pas de RLS multi-tenant (à réintroduire en v0.7)

-> pas d'IA (à venir dans les prochaines briques)

## Ambition roadmap

Cf `az-code/ROADMAP.md`. Ce MVP est la brique **v0.2 - Multi-tables + relations**. Prochaine brique cible (v0.3) : types de champs enrichis (formules, rollup, lookup, attachements).
