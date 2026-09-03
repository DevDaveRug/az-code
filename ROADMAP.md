# ROADMAP az-code

Version : 0.2.0
Date : 2026-09-03
Session : S132c

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

### v0.2 - Multi-tables + relations (crm-souverain v0.2)

Point de départ : la brique v0.1 (crm-souverain) livre un CRM 1 table (Prospects) fonctionnel. La v0.2 fait grandir ce même défi pour couvrir un cas réel : un prospect appartient à une entreprise, un prospect génère plusieurs interactions dans le temps (appel, email, RDV, message LinkedIn). Airtable gère nativement ces relations, la version souveraine doit rattraper cette parité pour rester crédible en démo.

Nouvelles tables (à ajouter à la base `crm-souverain`) :

-> `SC_Entreprises` : une ligne par entreprise cliente ou prospect (nom, secteur, taille, site, adresse, notes). Le champ `entrepriseId` devient une FK sur `SC_Prospects` (un prospect appartient à 0 ou 1 entreprise, une entreprise a N prospects).

-> `SC_Interactions` : log chronologique des échanges. Champs : `prospectId` (FK), `type` (enum : appel, email, LI, WA, RDV), `date`, `resume`, `resultat`, `nextStep`. Remplace le champ `Notes` unique de v0.1 par un vrai journal daté.

Nouveaux comportements attendus :

-> Champ `Dernier contact` sur `SC_Prospects` devient **calculé** (max de `date` sur les interactions liées) plutôt que saisi manuellement. Impact : `Prochaine relance` reste cohérente sans intervention.

-> Suppression d'un prospect -> cascade sur ses interactions (`onDelete: Cascade` dans Prisma). Suppression d'une entreprise -> détache les prospects (`onDelete: SetNull`), jamais silent-drop.

-> Vue détail prospect (`/prospects/[id]`) : affiche l'entreprise + les N interactions triées par date desc + bouton "+ Ajouter interaction" (server action).

-> Dropdown entreprise dans le formulaire d'ajout : composant custom searchable (React server components + query params), pas de librairie tierce -- démontre qu'on peut faire mieux qu'un `<select>` natif sans dépendance lourde.

Livrable démontrable : capture d'un prospect fictif (ex : Bob Durand, société "ACME") avec 3 interactions historisées + prochaine relance recalculée automatiquement + URL vivante sur Vercel.

Dépendance amont : brique v0.1 déployée et stable (fait, S131c).

Séquençage prévu : session S133c ou S134c selon dispo (après P4 skills tri code_archi).

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

## Changelog

-> 0.2.0 (2026-09-03, S132c) : v0.2 enrichie (crm-souverain v0.2 -- multi-tables + relations). Tables cibles nommées (`SC_Entreprises`, `SC_Interactions`), FK Prisma détaillées, cascade explicitée, comportements calculés (Dernier contact auto), livrable démontrable défini. Séquençage post-P4.

-> 0.1.0 (2026-09-01, S131c) : ROADMAP initiale (9 briques v0.1 -> v1.0 pour ambition full clone Airtable souverain).
