# Migration de `cr-rdv-souverain` vers le schéma Postgres `cr`

Version : 1.0.0
Date : 2026-10-17
Session : S261006z-ccweb (suite 3 des corrections W40)
Statut : **préparée, non exécutée**. Rien ne part en production sans Go de David.

## Pourquoi

Ce projet est le seul des cinq à vivre dans le schéma `public`. Les quatre autres sont isolés :
`crm`, `demandes`, `masterclass`, `missions`. L'isolement évite qu'un `prisma db push` d'un projet
voie, et puisse toucher, les tables d'un autre.

## Pourquoi ça ne se déploie pas tout seul

`vercel.json` lance `prisma db push` à chaque déploiement de **production** :

```
prisma generate && if [ "$VERCEL_ENV" = "production" ]; then prisma db push; else ... fi && next build
```

Si on fusionne le changement de `schema.prisma` sans rien faire d'autre, `db push` crée une table
**vide** `cr.cr` et laisse les données dans `public.cr`. Le site se déploie sans erreur et affiche
zéro compte rendu. C'est le pire des cas : une panne silencieuse qui ressemble à une base vide.

## L'ordre, qui n'est pas négociable

1- **D'abord** déplacer la table, sur la base de production :

```sql
CREATE SCHEMA IF NOT EXISTS cr;
ALTER TABLE public.cr SET SCHEMA cr;
```

Les deux index (`createdAt`, `dateRdv`) suivent la table automatiquement, il n'y a rien à recréer.

2- **Ensuite seulement** fusionner cette PR, ce qui déclenche le déploiement et le `db push`.
Celui-ci ne trouvera rien à faire : la table est déjà là, au bon endroit, avec les bonnes colonnes.

## La fenêtre d'indisponibilité, à connaître avant de commencer

Entre l'étape 1 et la fin du déploiement de l'étape 2, le code en production cherche encore
`public.cr`, qui n'existe plus. **Le site renvoie une erreur sur les pages qui lisent la base**,
le temps du déploiement Vercel (une à deux minutes). C'est une démo, pas un outil de production
client : la fenêtre est acceptable, mais elle doit être choisie, pas subie. À faire à un moment
calme, pas pendant qu'un prospect regarde.

## Retour arrière

```sql
ALTER TABLE cr.cr SET SCHEMA public;
DROP SCHEMA IF EXISTS cr;
```

Puis revenir au `schema.prisma` d'avant (ce commit se révoque sans effet de bord) et redéployer.
Aucune donnée n'est touchée dans un sens comme dans l'autre : `SET SCHEMA` déplace la table,
il ne la recopie pas.

## Comment exécuter le SQL

Le port 5432 est bloqué depuis un conteneur CCWeb, mais **Neon répond en SQL sur HTTPS**, ce qui
marche depuis CCWeb comme depuis CCDD :

```bash
curl -s -X POST "https://<endpoint>.neon.tech/sql" \
  -H "Neon-Connection-String: $DATABASE_URL" \
  -H "Content-Type: application/json" \
  --data-binary '{"query":"CREATE SCHEMA IF NOT EXISTS cr","params":[]}'
```

La chaîne de connexion est celle du projet Vercel `cr-rdv-souverain`, variable `DATABASE_URL`,
cible Production. **Ne jamais l'afficher en clair** : la référencer par `$VAR`.

## Contrôle après migration

```sql
select table_schema, table_name from information_schema.tables where table_name = 'cr';
-- attendu : une seule ligne, cr | cr

select count(*) from cr.cr;
-- attendu : le même nombre qu'avant la migration, à relever au préalable
```

**Relever le nombre de lignes avant de commencer** : sans ce chiffre, le contrôle d'après ne prouve
rien. Cette session n'a pas pu le faire, son identifiant Neon n'ouvre pas cette base.
