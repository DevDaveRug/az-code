# Guide pas à pas -- Déployer CRM Souverain sur Vercel + Neon (~15 min)

Public : David, à partir de zéro sur vercel.com + console.neon.tech, sans expérience préalable de ces plateformes.

Résultat attendu : une URL vivante `https://crm-souverain-<hash>.vercel.app` avec les 4 prospects fictifs seedés, à partager avec Eva PRO comme démo.

Prérequis : le repo `DevDaveRug/az-code` accessible sur GitHub (déjà en place S131c).

## Étape 1 -- Créer un projet Neon (base Postgres)

-> Se rendre sur https://console.neon.tech/

-> Si pas de compte : cliquer `Sign up` -> `Continue with GitHub` (utilise le compte DevDaveRug)

-> Une fois connecté, cliquer sur `New Project` (bouton bleu en haut à droite)

-> Remplir :

  - **Project name** : `crm-souverain`

  - **Postgres version** : 16 (par défaut)

  - **Region** : `Europe (Frankfurt)` (le plus proche de tes utilisateurs Alegria et de Vercel Paris)

-> Cliquer `Create project`

-> Neon affiche la connection string dans un encart après création. Elle a le format :

```
postgresql://neondb_owner:XXXXXXXX@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

-> **COPIER cette chaîne complète** dans un fichier temporaire. C'est le `DATABASE_URL` qu'il faut donner à Vercel.

Note : Neon offre un plan gratuit largement suffisant (0.5 GB storage, 100 heures compute-time par mois) pour ce défi.

## Étape 2 -- Importer le repo sur Vercel

-> Se rendre sur https://vercel.com/

-> Si pas de compte : cliquer `Sign up` -> `Continue with GitHub` (compte DevDaveRug)

-> Une fois connecté, dans le dashboard : cliquer `Add New...` -> `Project`

-> Section `Import Git Repository` : chercher `az-code`

-> Cliquer `Import` à côté de `DevDaveRug/az-code`

## Étape 3 -- Configurer le projet Vercel (important : Root Directory)

Sur l'écran de configuration :

-> **Project Name** : `crm-souverain` (Vercel proposera `az-code` par défaut, à remplacer)

-> **Framework Preset** : `Next.js` (auto-détecté quand tu configures Root Directory correctement)

-> **Root Directory** : cliquer `Edit` à côté de la valeur par défaut, sélectionner `defis/crm-souverain`

  - **CRITIQUE** : sans ce Root Directory, Vercel va essayer de builder la racine du repo qui ne contient pas de package.json, et échouer

-> **Build and Output Settings** : laisser par défaut (Next.js s'auto-configure)

-> **Environment Variables** : ajouter UNE variable :

  - Name : `DATABASE_URL`

  - Value : coller la connection string Neon copiée à l'étape 1

  - Environment : cocher `Production`, `Preview`, `Development` (les 3)

-> Cliquer `Deploy` (bouton bleu en bas)

Vercel va cloner le repo, installer les dépendances, générer Prisma, migrer la base et builder. Prend ~2-3 minutes.

## Étape 4 -- Vérifier le build

Pendant le build, Vercel affiche les logs en direct. Points de vigilance :

-> `npm install` -> doit se terminer sans erreur

-> `prisma generate` -> doit générer le client sans erreur

-> `prisma migrate deploy` -> **cette étape échoue au premier deploy** car il n'y a pas encore de migrations dans `prisma/migrations/` du repo.

Deux options pour contourner :

**Option A -- Utiliser `prisma db push` (rapide, pas de migrations trackées)** :

Éditer `vercel.json` dans le repo :

```json
{
  "buildCommand": "prisma generate && prisma db push --accept-data-loss && next build"
}
```

Puis push la modif, Vercel redéploie automatiquement.

**Option B -- Créer la première migration en local** :

```bash
cd C:/Users/conta/dev/az-code/defis/crm-souverain
cp .env.example .env.local
# éditer .env.local pour mettre DATABASE_URL (celle de Neon)
npm install
npx prisma migrate dev --name init
git add prisma/migrations/
git commit -m "chore: initial prisma migration"
git push
```

Vercel redéploie automatiquement avec les migrations en place.

Note S131c : je recommande Option A pour la démo Alegria (plus rapide, moins de fichiers à générer). Pour un vrai déploiement client, l'Option B est plus propre car les migrations sont versionnées dans git.

## Étape 5 -- Seeder la base (les 4 prospects fictifs)

Une fois le build vert, la base est vide. Pour peupler avec Alice/Bob/Chloé/Emma :

Option depuis ton PC local :

```bash
cd C:/Users/conta/dev/az-code/defis/crm-souverain
# .env.local a déjà DATABASE_URL de Neon
npm run db:seed
```

Résultat attendu : `Seed OK - 4 prospects insérés`.

Alternative : dans Vercel dashboard, aller dans `Storage` -> `Neon` (si intégré) -> `Query` et coller le contenu de `prisma/seed.sql` (à générer si besoin).

## Étape 6 -- Vérifier l'app en ligne

-> Vercel affiche l'URL de production dans le dashboard, format : `https://crm-souverain-<hash>.vercel.app`

-> Ouvrir cette URL dans un navigateur

-> Vérifier :

  - Page d'accueil affiche `4 prospect(s) au total.` avec Alice, Bob, Chloé, Emma

  - Cliquer `À relancer` (menu haut) affiche Bob (rouge -5) et Alice (orange 0)

  - Cliquer `+ Nouveau prospect` ouvre le formulaire

  - Créer un test : ajouter `Fake Test` -> retour vue liste, 5 prospects visibles

  - Supprimer le test via Prisma Studio local (`npm run db:studio`) si besoin, ou le laisser pour Alegria

## Étape 7 -- Nom de domaine custom (optionnel)

Par défaut l'URL Vercel `.vercel.app` fonctionne parfaitement. Pour un nom plus mémorable :

-> Dashboard Vercel -> Project -> Settings -> Domains

-> Add domain : `crm.davidruggieri.com` ou `crm-souverain.salescloser.fr` ou autre

-> Vercel donne les enregistrements DNS à ajouter chez IONOS

-> Une fois DNS propagé (5-30 min), l'URL custom fonctionne

Pas obligatoire pour la démo Alegria.

## Étape 8 -- Partager avec Eva PRO

L'URL Vercel devient le livrable "vivant" (en plus des captures Airtable).

Message à Eva PRO (exemple) :

```
Salut Eva,

Pour le défi CRM prospects avec relance 7 jours, j'ai livré 2 versions :

1. Airtable : lien vers la base + captures d'écran
2. Version souveraine self-host, code source public : https://crm-souverain-<hash>.vercel.app

La 2e est ma vraie différence : je vends des systèmes robustes que le client possède, pas des logins vers Airtable. Test la, dis-moi ce qui manque.

David
```

## Cas de blocage

**Build fail sur `prisma migrate deploy`** -> passer à Option A (db push) dans vercel.json.

**Build fail sur `Prisma binary`** -> ajouter dans package.json section engines : `"node": ">=18.17"` (déjà présent normalement).

**Runtime error `PrismaClientInitializationError: Can't reach database server`** -> la connection string Neon est incorrecte ou expirée. Retourner sur console.neon.tech, project settings, connection string, régénérer si besoin, remettre dans Vercel env vars.

**Page blanche à l'URL** -> ouvrir la console navigateur (F12), regarder les erreurs. Généralement un import Tailwind qui échoue = build cache Vercel corrompu, cliquer `Redeploy` avec cache cleared.

**`À relancer` vide** -> la date du jour n'est pas ce qu'attend le seed. Vérifier avec `SELECT NOW();` dans Neon Query que la date est bien >= 2026-08-27 (soit après la relance calculée pour Bob).

## Après la démo Alegria

Le repo `az-code/defis/crm-souverain/` reste comme référence. Pour créer un défi suivant :

- Nouveau dossier `defis/<slug>/` avec la même structure

- Skill `defi-hebdo-alegria` (dr-context) génère le squelette

- Neon : nouvelle base ou branche du projet existant

- Vercel : nouveau project ou nouveau path root du même repo
