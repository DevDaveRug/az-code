# masterclass-inscriptions - MVP souverain

Défi Alegria n°3 (semaine 38). Version code souverain du défi "inscriptions masterclass + email de confirmation auto".

Compagnon no-code : [az-no-code/defis/masterclass-inscriptions](https://github.com/DevDaveRug/az-no-code/tree/main/defis/masterclass-inscriptions)

## Stack

-> Next.js 14 (App Router, runtime Node)

-> Neon PostgreSQL

-> Prisma ORM

-> Resend (envoi email transactionnel)

-> Tailwind CSS

-> Déploiement : Vercel

Aligné sur le stack LIA'M -- si un client veut cette même brique intégrée à un plus gros système, on la porte sans friction.

## Ce que fait ce MVP

1. Un formulaire public (`/nouveau`) où quelqu'un s'inscrit avec prénom + email + date de la session

2. À la soumission, l'API crée la ligne en DB et déclenche IMMÉDIATEMENT l'envoi d'un email de confirmation personnalisé (prénom + date)

3. Le statut d'envoi (`En attente`, `Envoyé`, `Erreur`) est visible dans la vue liste (`/`), groupée par date de masterclass

4. Un mode `EMAIL_MODE=console` permet de tester en local sans clé Resend (l'email est simplement loggé dans la console)

Contrairement à Airtable, ici pas de quota d'automation, pas de vendor lock-in, pas de facturation par utilisateur. Le workflow tourne dans ta stack.

## Setup local

```bash
cd defis/masterclass-inscriptions
npm install
cp .env.example .env
# Renseigner DATABASE_URL (Neon), garder EMAIL_MODE=console pour un premier test
npx prisma db push
npm run db:seed
npm run dev
```

Ouvre http://localhost:3000

## Déploiement Vercel

1. Créer un projet Vercel pointant sur ce dossier (`Root Directory` = `defis/masterclass-inscriptions`)

2. Env vars à définir dans le dashboard Vercel :

   -> `DATABASE_URL` : URL Neon (pooled)

   -> `RESEND_API_KEY` : clé API Resend

   -> `EMAIL_FROM` : expéditeur vérifié (ex. `hello@salescloser.fr`)

   -> `EMAIL_MODE` : `resend` (prod) ou `console` (test)

3. Le build lance `prisma db push --accept-data-loss && next build` (cf `vercel.json`)

4. Optionnel : après premier deploy, exécuter le seed depuis un terminal local pointé sur la DB Neon (`npm run db:seed`)

## Test de l'énoncé "ajoute-toi toi-même"

1. Ouvrir `/nouveau`

2. Prénom : `David` -- Email : `david@salescloser.fr` -- Date : `2026-10-14`

3. Soumettre

4. Vérifier :

   -> le message "Merci ! Un email de confirmation vient d'être envoyé."

   -> la ligne apparaît dans `/` sous "Masterclass du 14 octobre 2026" avec le badge vert `Envoyé`

   -> l'email est arrivé sur `david@salescloser.fr` avec le sujet `Ta place pour la masterclass du 14 octobre 2026 est confirmée` et le corps commençant par `Salut David,`

## Structure

```
masterclass-inscriptions/
  package.json
  next.config.js
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  vercel.json
  .env.example
  .gitignore
  README.md
  prisma/
    schema.prisma          # 1 modèle Inscrit + enum StatutEmail
    seed.ts                # 5 lignes (dont David pour le test défi)
  src/
    lib/
      prisma.ts            # singleton Prisma client
      email.ts             # Resend + mode console pour dev
    app/
      layout.tsx
      globals.css
      page.tsx             # vue liste groupée par date
      nouveau/page.tsx     # formulaire d'inscription
      api/inscrits/route.ts # POST (create + send) + GET (list)
```

## Roadmap possible (hors scope du défi)

-> V1.1 : plusieurs masterclass en table séparée (relation FK, ce qui permet un back-office "créer une session" plus riche)

-> V1.2 : envoi de rappel J-1 automatique via cron Vercel

-> V1.3 : intégration ICS (fichier calendrier joint au mail)

-> V1.4 : compteur "places restantes" par session

Aucune de ces briques n'est nécessaire pour le défi Alegria -- elles servent à raconter la trajectoire commerciale à un vrai client.
