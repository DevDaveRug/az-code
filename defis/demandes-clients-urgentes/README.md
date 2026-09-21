# Demandes clients urgentes -- MVP code souverain

Projet portfolio : dashboard de demandes clients priorisees par urgence, formulaire public partageable, notifications email + Telegram. Version code souverain equivalente au no-code Airtable / NocoDB (miroir dans `az-no-code/defis/demandes-clients-urgentes/`).

## Stack

- Next.js 14 App Router (TypeScript, runtime Node)
- Neon PostgreSQL (multi-schema, table dans schema `demandes`)
- Prisma ORM (previewFeatures multiSchema, pattern S136z P4)
- Tailwind CSS
- Resend (email confirmation client) + Telegram Bot API (notif urgence)
- Vercel deploy (region cdg1)

## Fonctionnalites

- `/demande` : formulaire public pour saisir une demande (nom, email, telephone optionnel, description, urgence declaree)

- `/admin` : dashboard proprietaire avec KPIs, table triee par urgence reelle, kanban par statut

- `POST /api/demandes` : cree la demande, matche ou cree le client par email, envoie email de confirmation, notifie TG si urgence >= Haute

- `GET /api/demandes` : liste toutes les demandes avec client lie

- `GET /api/clients` : liste tous les clients avec compteur de demandes

## Modele

Voir `prisma/schema.prisma`. 2 tables `clients` et `demandes` (schema `demandes`, isole comme masterclass S136z). Relation FK optionnelle (nullable) sur `clientId` pour laisser respirer la creation post-form.

## Setup local

```
cp .env.example .env
# Remplir DATABASE_URL (Neon), garder EMAIL_MODE=console et TELEGRAM_MODE=console pour dev
npm install
npx prisma db push
npm run seed
npm run dev
```

Ouvrir `http://localhost:3000/demande` pour le form, `http://localhost:3000/admin` pour le dashboard.

## Deploy Vercel

1. Nouveau projet Vercel, connecte le repo, root directory : `defis/demandes-clients-urgentes/`

2. Env vars :
   - `DATABASE_URL` : ton Neon connection string, ajouter `?schema=demandes` a la fin
   - `RESEND_API_KEY` + `EMAIL_FROM` + `EMAIL_MODE=resend` pour envoi email reel
   - `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` + `TELEGRAM_MODE=telegram` pour notifs reelles

3. Deploy, Vercel execute `prisma generate && prisma db push --accept-data-loss && next build` automatiquement (cf. `vercel.json`).

4. Verifier que le schema `demandes` est cree dans Neon (SQL Editor : `\dn` ou `SELECT nspname FROM pg_namespace`).

## Notes conception

Pattern multi-schema herite de S136z P4 (`masterclass` pour defi 3, ici `demandes` pour defi 4, `cr` reste en public pour defi 2 legacy). Chaque defi peut cohabiter sur le meme projet Neon `Sales Closer Souverain` (orange-cake-12929525) sans jamais entrer en collision de tables. Avantage : un seul cout Neon, un seul projet a monitor.

Choix 2 champs Urgence : le client declare son ressenti (`urgenceClient`, non modifiable apres soumission), le proprietaire assume la priorite reelle (`urgenceReelle`, editable en un clic). Evite la derive "tout le monde met Critique" sans reprocher au client.

Notifs Telegram uniquement si `urgenceReelle in Haute, Critique` -- fixe post-form (copie initiale de UrgenceClient), le proprietaire peut re-notifier a la main si il rebumpe. Volontairement pas de re-notif automatique sur edit pour eviter le spam.
