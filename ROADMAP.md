# ROADMAP az-code

Version : 0.1.0
Date : 2026-09-01
Session : S131c

## Ambition

Construire progressivement un clone Airtable souverain, en partant des défis Alegria. Chaque défi ajoute une brique. Le tout doit à terme rivaliser avec Airtable sur l'essentiel, tout en restant self-host sur infra Coolify + Neon.

Pourquoi souverain :

-> pas de vendor lock-in

-> tarif prévisible (pas de facturation par utilisateur)

-> extensible sans limite (le no-code s'arrête vite pour les cas réels)

-> réutilisable pour les prospects (David vend des systèmes, pas des logins)

## Briques nécessaires

### v0.1 - MVP CRM simple (crm-souverain, origine défi Eva PRO)

-> Une table (Prospects)

-> Vue liste avec filtres

-> Vue "à relancer" (filtre statut + date)

-> Formulaire d'ajout

-> API REST minimale (GET, POST)

-> Seed avec exemples anonymisés

État : en cours (livraison 5/9/2026).

### v0.2 - Multi-tables + relations

-> Plusieurs tables dans une même base

-> Champs de type Lien (foreign keys)

-> Cascade + intégrité

-> UI pour gérer les relations (dropdown avec recherche)

### v0.3 - Types de champs enrichis

-> Formules (calcul entre champs, dates, textes)

-> Rollup (agrégation depuis une table liée)

-> Lookup (récupération depuis une table liée)

-> Attachements (upload fichiers, stockage S3 ou Coolify Storage)

### v0.4 - Interfaces

-> Vue grille (déjà en v0.1)

-> Vue kanban (groupement par champ single-select)

-> Vue calendrier (champ date -> événements)

-> Vue galerie (attachements en carte)

-> Vue timeline (Gantt-like)

### v0.5 - Automatisations

-> Déclencheurs : nouvel enregistrement, champ modifié, date atteinte, cron

-> Conditions : filtres arbitraires

-> Actions : envoyer email, appeler webhook, créer enregistrement, mettre à jour champ

-> Interface visuelle no-code (form builder + condition builder)

### v0.6 - Formulaires publics

-> Formulaires exposés en URL publique

-> Personnalisation (logo, couleurs, message de remerciement)

-> Redirect optionnel après soumission

-> Protection anti-spam (rate limiting, captcha)

### v0.7 - Multi-tenant + Auth

-> Chaque base appartient à un espace

-> Rôles : admin, éditeur, lecteur, invité

-> RLS PostgreSQL comme LIA'M

-> Auth NextAuth (email magic link + OAuth)

### v0.8 - Import / Export

-> Import CSV

-> Import depuis Airtable (via API)

-> Export CSV, JSON

-> Snapshots (backup complet d'une base)

### v0.9 - API et intégrations

-> API REST par base (comme Airtable)

-> API GraphQL (optionnel)

-> Webhooks sortants

-> Connexion n8n native

### v1.0 - Production ready

-> Documentation utilisateur

-> Landing page

-> Facturation Stripe (si offre payante)

-> Monitoring (Sentry, Uptime Kuma)

-> Site public : `az.salescloser.fr` (ou nom dédié)

## Principes de conception

-> chaque brique doit fonctionner isolément (les défis Alegria sont des tests grandeur nature)

-> le schéma Prisma reste dynamique (chaque base = un JSON de définition de table -> Prisma migre à la volée)

-> pas de framework "no-code interne" bricolé : on utilise les patterns Next.js standards (server components, server actions, API routes)

-> l'UI reste ergonomique et rapide (pas d'excuse "c'est du souverain donc c'est moche")

## Décisions ouvertes

-> stack UI définitif : Tailwind + shadcn/ui, ou Tremor, ou custom ?

-> stockage attachements : Coolify Storage (MinIO), S3 externe, ou Neon Blob ?

-> auth : NextAuth reste la référence, mais tester Clerk pour v0.7 si besoin de vitesse

-> facturation : Stripe (aligné LIA'M) ou offre uniquement self-host au départ ?

À arbitrer au fil des défis.
