# Défi crm-souverain (CRM Prospects avec relance 7 jours)

MVP Next.js exécutable + déployable Vercel. Origine : défi Alegria d'Eva PRO du 5/9/2026 - premier livrable de la boite à outils souveraine.

Version : 0.1.0
Livraison : 2026-09-05

Compagnon no-code : [az-no-code/defis/crm-souverain](https://github.com/DevDaveRug/az-no-code/tree/main/defis/crm-souverain)

## Ce que fait ce MVP

Une page unique qui liste les prospects avec :

- vue "Tous les prospects" (par défaut, triée par date d'entrée)

- vue "À relancer" (accès via `/?vue=relance`, filtre : statut Nouveau/En cours ET prochaine relance <= aujourd'hui)

- formulaire d'ajout (`/nouveau`)

- API REST minimale (`GET /api/prospects`, `POST /api/prospects`)

- seed avec 4 prospects fictifs (Alice, Bob, Chloé, Emma) couvrant les 4 statuts

Le calcul "prochaine relance = dernier contact + 7 jours" est fait côté application (fonction pure dans `src/lib/relance.ts`), pas en base. La colonne "Jours" colore la ligne en rouge (retard), orange (aujourd'hui), jaune (imminent).

## Lancer en local

Prérequis : Node 18+, une URL Postgres (Neon recommandé, ou Postgres local).

```bash
cd defis/crm-souverain
npm install
cp .env.example .env.local
# éditer .env.local avec ta DATABASE_URL Neon
npx prisma migrate dev --name init
npm run db:seed
npm run dev
# ouvrir http://localhost:3000
```

## Déployer sur Vercel + Neon (5 min)

### 1. Créer la base Neon

- Aller sur https://console.neon.tech/ (compte de David)

- New project -> nom : `crm-souverain` -> région : `Europe (Frankfurt)`

- Copier la connection string avec pooler (finit par `-pooler.aws.neon.tech`)

### 2. Importer sur Vercel

- Aller sur https://vercel.com/new

- Import Git Repository -> DevDaveRug/az-code

- Root Directory : `defis/crm-souverain` (important, pas la racine du repo)

- Framework preset : Next.js (auto-détecté)

- Environment Variables :

  - `DATABASE_URL` = la connection string Neon copiée à l'étape 1

- Deploy

### 3. Après premier deploy

- Aller dans le shell Vercel (ou via `vercel env pull && npx prisma migrate deploy && npx tsx prisma/seed.ts` en local)

- Une fois : `npx prisma db push` pour créer les tables (le buildCommand fait déjà `migrate deploy` mais s'il n'y a pas de migrations en dossier, `db push` fait le job)

- Une fois : lancer le seed : `npm run db:seed` (local avec la même DATABASE_URL, ou script Vercel)

### 4. URL vivante à partager

Vercel donne une URL du style `https://crm-souverain-<hash>.vercel.app`. À partager avec Eva PRO ou tout prospect comme démo.

## Endpoints API

### GET /api/prospects

Renvoie tous les prospects enrichis.

```bash
curl https://crm-souverain.vercel.app/api/prospects
```

### GET /api/prospects?vue=relance

Renvoie uniquement les prospects à relancer (statut Nouveau/En cours + prochaine relance <= today).

```bash
curl https://crm-souverain.vercel.app/api/prospects?vue=relance
```

### POST /api/prospects

Crée un prospect (statut auto : NOUVEAU).

```bash
curl -X POST https://crm-souverain.vercel.app/api/prospects \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Test","nom":"Prospect","email":"test@example.com"}'
```

## Structure

```
defis/crm-souverain/
  README.md                 # ce fichier
  package.json
  next.config.js
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  vercel.json
  .env.example
  .gitignore
  prisma/
    schema.prisma          # modèle Prospect + enums Statut, Source
    seed.ts                # 4 prospects fictifs
  src/
    lib/
      prisma.ts            # singleton Prisma client
      relance.ts           # fonctions pures prochaineRelance / joursRestants
    app/
      layout.tsx           # nav + footer
      globals.css          # tailwind + variables theme
      page.tsx             # vue liste + vue relance
      nouveau/page.tsx     # formulaire d'ajout (server action)
      api/prospects/route.ts  # GET + POST
```

## Alignement stack LIA'M

Ce MVP reprend les choix de LIA'M :

- Next.js 14 App Router, runtime Node

- TypeScript strict

- Prisma ORM + PostgreSQL (Neon)

- Server components + server actions (pas de state client inutile)

- Vercel deploy avec `prisma migrate deploy` au build

Différences volontaires (parce que c'est un MVP indépendant) :

- pas de NextAuth (une seule "org" pour le défi Alegria)

- pas de RLS multi-tenant (pas nécessaire pour le défi)

- pas de wassenger/telegram/openai (défi = CRM basique, pas d'IA)

Ces briques seront ajoutées progressivement dans les prochains défis, cf `az-code/ROADMAP.md`.

## Ambition roadmap

Cf `az-code/ROADMAP.md`. Ce MVP est la brique **v0.1 - MVP CRM simple**. Prochaine brique cible (v0.2) : multi-tables + relations.
