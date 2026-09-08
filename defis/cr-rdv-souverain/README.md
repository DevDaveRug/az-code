# Défi cr-rdv-souverain (Comptes rendus de RDV formatés)

Version : 0.1.0
Livraison v0.1 : 2026-09-08

MVP Next.js exécutable + déployable Vercel. Origine : défi Alegria d'Eva PRO du 8/9/2026 -- deuxième brique de la boite à outils souveraine (après crm-souverain v0.1/v0.2).

Compagnon no-code : [az-no-code/defis/cr-rdv-formate](https://github.com/DevDaveRug/az-no-code/tree/main/defis/cr-rdv-formate)

Livrable central du défi (utilisable seul, sans code) : [PROMPT_LLM.md](./PROMPT_LLM.md) -- le prompt réutilisable que le client peut coller dans l'IA de son choix.

## Ce que fait ce MVP

**v0.1 (livraison)** :

-> Page `/` : formulaire de prise de notes (textarea grande taille) + bouton "Formater le CR"

-> API `POST /api/cr` : reçoit les notes brutes, appelle le webhook n8n (OpenRouter derrière), retourne le CR formaté

-> Page `/cr/[id]` : affiche le CR formaté (tableau 2 colonnes markdown -> HTML)

-> Bouton "Télécharger PDF" (v0.1 minimal : print CSS impression / v0.2 : react-pdf)

-> Table Prisma `Cr` : id, notesBrutes, crFormate, dateRdv (extraite), interlocuteur, sujet, createdAt

**Ce qui vient en v0.2 (prochain défi Alegria si Eva/Luc lance)** :

-> Cases à cocher interactives pour compléter les champs manquants (date, interlocuteur, contexte)

-> Sortie PDF via `@react-pdf/renderer` (pas juste print CSS)

-> Rattachement à un prospect existant dans `crm-souverain` (via `POST` cross-app REST HTTP)

-> Copie automatique du PDF dans `C:/DR/DR_Personnel/Pe_CR-RDV/` via webhook n8n + Syncthing

**Ce qui vient en v0.3** :

-> Bulle vocale ElevenLabs pour dicter les notes

-> Tenant LIA'M dédié "CR de RDV" avec objectif conversation = collecter les infos en interactif

## Stack

-> Next.js 14 App Router (Node runtime)

-> Prisma + Neon Postgres

-> Tailwind CSS (palette souveraineté : noir + or)

-> n8n webhook OpenRouter (multi-LLM via une seule clé API)

-> `react-markdown` pour rendre le CR formaté (tableau markdown natif)

## Comment le client utilise l'outil

### Cas d'usage principal -- après un RDV

1- Le client rentre à son bureau ou reste au café, ouvre son navigateur

2- Va sur `https://cr-rdv-souverain.vercel.app/` (ou son propre déploiement)

3- Colle ses notes brutes dans le textarea (tirées de son bloc-notes, phone, papier retapé, dictée transcrite)

4- Clique "Formater le CR"

5- Le CR s'affiche formaté en 2 colonnes en 5-10 secondes

6- Il télécharge le PDF ou copie le markdown directement dans son CRM / mail / Notion

**Aucune inscription, aucun outil à apprendre.** Une seule page, un seul bouton.

## Prompt LLM utilisé

Voir [PROMPT_LLM.md](./PROMPT_LLM.md) -- **c'est le livrable central du défi**. Le client peut l'utiliser hors de l'app, dans son propre ChatGPT/Claude/Mistral, sans rien installer.

## Lancer en local

Prérequis : Node 18+, une URL Postgres (Neon recommandé), un webhook n8n avec OpenRouter connecté.

```bash
cd defis/cr-rdv-souverain
npm install
cp .env.example .env.local
# éditer .env.local : DATABASE_URL + N8N_WEBHOOK_URL + N8N_WEBHOOK_SECRET
npx prisma db push
npm run dev
# ouvrir http://localhost:3000
```

## Déployer sur Vercel + Neon (5 min)

Identique à `crm-souverain` (voir son README). Root Directory Vercel : `defis/cr-rdv-souverain`. Variables d'env : `DATABASE_URL` + `N8N_WEBHOOK_URL` + `N8N_WEBHOOK_SECRET`.

## Architecture n8n (workflow SB_WF_CR-RDV)

```
Webhook (POST notes brutes + secret)
  -> Validation secret
  -> Appel OpenRouter (modèle configurable, défaut anthropic/claude-sonnet-5)
     avec le PROMPT_LLM.md système + notes en user message
  -> Extraction structurée (regex ou 2e appel LLM pour parser)
     -> dateRdv, interlocuteur, sujet, crFormate (markdown)
  -> Retour JSON à l'app Next.js
```

Le prompt système reste versionné côté n8n -- une amélioration du prompt bénéficie à tous les clients sans redeploy de l'app.

## Souveraineté

-> Code TypeScript public sur GitHub -- forkable, auditable

-> Base Postgres self-host possible (Neon ou Coolify / VPS)

-> Prompt LLM public (PROMPT_LLM.md) -- lisible, améliorable, portable

-> LLM via OpenRouter -- pas de vendor lock-in sur un seul fournisseur (Anthropic/OpenAI/Google/Mistral choisissables)

-> Pas de "20€ par siège par mois", pas de "conditions modifiées du jour au lendemain"

## Roadmap az-code v0.3 (rappel)

Ce défi est la brique **v0.2 (CR-RDV)** de la boite à outils souveraine construite défi par défi. Voir `ROADMAP.md` racine du repo pour le plan v0.3 -> v1.0.

## Changelog

-> 0.1.0 -- 2026-09-08 (S133z-ccweb) : création. MVP formatage CR 2 colonnes via prompt LLM. Prompt réutilisable client (PROMPT_LLM.md) livré indépendant du code. Défi Alegria Eva PRO semaine du 8/9.
