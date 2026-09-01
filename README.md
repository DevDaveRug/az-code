# az-code

Code souverain (full stack moderne) pour les défis Alegria + prospects + clients futurs.

Compagnon no-code : [DevDaveRug/az-no-code](https://github.com/DevDaveRug/az-no-code)

## Pourquoi ce repo

David suit le programme Alegria (Ambassadeur Zen) pour transformer les défis hebdo en briques réutilisables. Chaque défi se livre sur deux stacks parallèles :

-> le code moderne (Next.js + Postgres + Prisma, aligné sur le stack de LIA'M)

-> le no-code (Airtable + NocoDB, dans le repo az-no-code)

Cette dualité sert deux ambitions :

-> livrer vite à Alegria (no-code, rapide, démontrable, captures d'écran)

-> construire des briques réutilisables pour les prospects réels (code souverain, robuste, extensible)

## Structure

```
defis/
  eva-pro-crm-relance/    # défi actuel, livraison 5/9/2026
    src/                  # code Next.js
    prisma/               # schema + seed
    README.md             # comment lancer, comment déployer
packages/                 # briques réutilisables (à venir)
docs/                     # notes, décisions
ROADMAP.md                # ambition full clone Airtable souverain
```

## Stack

Aligné sur LIA'M :

-> Next.js 14 App Router (TypeScript, runtime Node)

-> Neon PostgreSQL

-> Prisma ORM

-> Tailwind CSS

-> Vercel deploy

## Défis livrés

| Défi | Slug | Livraison | État |
|---|---|---|---|
| Eva PRO - CRM prospects avec relance 7 jours | `eva-pro-crm-relance` | 2026-09-05 | en cours |

## Roadmap ambition

Voir [`ROADMAP.md`](ROADMAP.md). Le défi Eva PRO est le point de départ d'un clone Airtable souverain (multi-tables, interfaces, automatisations, calendrier).

## Skill de génération

Un skill `defi-hebdo-alegria` (dans `dr-context/.claude/skills/`) génère automatiquement le squelette de chaque nouveau défi (code + no-code en miroir).

Trigger : `PAUSE_Defi_Hebdo_Alegria <énoncé du défi>`
