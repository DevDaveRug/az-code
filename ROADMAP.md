# ROADMAP az-code

Version : 0.4.0
Date : 2026-09-14
Session : S135z-ccweb

## Ambition

Construire progressivement un clone Airtable souverain, en partant des défis Alegria. Chaque défi ajoute une brique. Le tout doit à terme rivaliser avec Airtable sur l'essentiel, tout en restant self-host sur infra Coolify + Neon.

## Deux axes en parallèle

Les défis Alegria ne renforcent pas tous le même produit. On distingue :

-> **Axe 1 -- Clone Airtable souverain** : évolution structurée du défi `crm-souverain` (versioning interne `v0.1 -> v1.0`, sections `v0.x` ci-dessous). Chaque incrément mérite d'être backporté dans `crm-souverain` -- l'objectif est un moteur générique.

-> **Axe 2 -- Défis parallèles autonomes** : outils souverains issus de défis Alegria mais qui vivent leur vie propre dans leur dossier `defis/<slug>/`. Ils enrichissent la boite à outils souveraine (démonstration produit + argument commercial AZI/Enterprise) sans altérer la roadmap Airtable. Numérotation **ordinale (Brique N°1, N°2, N°3...)** distincte des `v0.x` de l'axe 1 -- chaque brique garde en interne sa propre versioning `vX.Y.Z`. Liste vivante :

   -> **Brique N°1 -- crm-souverain** (livré S131c, 2026-09-05 en v0.1 + S132c, 2026-09-05 en v0.2) -- défi Eva PRO 5/9 : CRM prospects + relances 7 jours. Sert aussi de socle Axe 1 pour le clone Airtable.

   -> **Brique N°2 -- cr-rdv-souverain** (livré S133z-ccweb, 2026-09-08 en v0.1) -- défi Eva PRO 8/9 : formatage automatique de CR de RDV en 2 colonnes via prompt LLM. Livrable central portable : `defis/cr-rdv-souverain/PROMPT_LLM.md`. Compagnon no-code : `az-no-code/defis/cr-rdv-formate/`.

   -> **Brique N°3 -- masterclass-inscriptions** (livré S135z-ccweb, 2026-09-14 en v0.1) -- défi Eva PRO 14/9 (semaine 38) : formulaire d'inscription à une masterclass + envoi automatique d'un email de confirmation personnalisé (prénom + date) dès qu'un inscrit est ajouté. Stack : Next.js 14 + Neon + Prisma + Resend. Compagnon no-code : `az-no-code/defis/masterclass-inscriptions/` (Airtable automation + NocoDB webhook -> n8n). Sert d'argument "brique email transactionnel souverain".

   -> **Brique N°4 -- [prochain défi]** -- à venir.

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

-> 0.4.0 (2026-09-14, S135z-ccweb) : Brique N°3 (masterclass-inscriptions) livrée. Défi Alegria n°3 semaine 38 : formulaire inscription + envoi automatique email de confirmation personnalisé. Stack : Next.js 14 + Neon + Prisma + Resend. Placeholder "Brique N°4 -- à venir" décalé.

-> 0.3.0 (2026-09-08, S133z-ccweb) : Brique N°2 (cr-rdv-souverain) livrée. Défi Eva PRO 8/9 : formatage CR RDV via prompt LLM.

-> 0.2.0 (2026-09-03, S132c) : v0.2 enrichie (crm-souverain v0.2 -- multi-tables + relations). Tables cibles nommées (`SC_Entreprises`, `SC_Interactions`), FK Prisma détaillées, cascade explicitée, comportements calculés (Dernier contact auto), livrable démontrable défini. Séquençage post-P4.

-> 0.1.0 (2026-09-01, S131c) : ROADMAP initiale (9 briques v0.1 -> v1.0 pour ambition full clone Airtable souverain).
