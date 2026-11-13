# Veille des blogs -- MVP code souverain

Projet portfolio : les nouveaux articles d'un ou plusieurs blogs arrivent tout seuls dans un tableau, avec titre, date et lien. Version code souverain du défi Alegria n°8 (semaine 46, « Claire, coach en nutrition, veut suivre le blog de sa concurrente »). Compagnons : `az-no-code/defis/veille-blog-concurrent/` (version Make + Airtable notée, version n8n + NocoDB).

## Ce qui change par rapport aux versions no-code

-> **Ajouter un site depuis l'application** : page `/sources`, on colle l'adresse du flux RSS. Le flux est lu avant d'être enregistré (une adresse qui n'est pas un flux est refusée), et ses articles arrivent tout de suite.

-> **Pas de doublon par construction** : le lien de l'article est unique en base.

-> **Une source en panne se voit** : date du dernier relevé et message d'erreur par site.

-> **RSS 2.0 et Atom** lus, entités HTML décodées (5 tests `node:test`, dont un cas réel : le flux de lanutrition.fr porte plus de 1000 entités dans ses résumés et faisait échouer un parseur réglé par défaut).

## Stack

- Next.js 14 App Router (TypeScript, runtime Node)
- Neon PostgreSQL (schema `veille` isolé dans le projet `Sales Closer Souverain`)
- Prisma ORM, `fast-xml-parser` pour les flux
- Tailwind CSS
- Vercel (région `cdg1`) + Vercel Cron

## Pages et API

- `/` : articles du plus récent au plus ancien, filtre par site
- `/sources` : sites suivis (articles, dernier relevé, erreur éventuelle) + formulaire d'ajout
- `GET /api/veille` : relève toutes les sources actives. Protégé par `Authorization: Bearer <CRON_SECRET>`
- `GET /api/sources` ; `POST /api/sources` : ajoute un site après lecture de son flux

## Fréquence du relevé

`vercel.json` déclare un passage par jour (06h17 UTC) : c'est la limite du plan Vercel Hobby pour les tâches planifiées. Pour un passage toutes les heures, deux voies : plan Pro, ou appeler `/api/veille` depuis n8n (déjà en place côté Coolify) avec le même en-tête.

## Setup local

```
cp .env.example .env
npm install
npm test
npx prisma db push
npm run seed      # ajoute la source lanutrition.fr
npm run dev
```

## Deploy Vercel

Projet `veille-blog-concurrent`, root directory `defis/veille-blog-concurrent/`. Variables : `DATABASE_URL` (Neon, terminée par `schema=veille`) et `CRON_SECRET`. En production, le build fait `prisma db push` puis le seed.
