# airtable-migrate-portfolio.mjs -- guide d'exécution

Version : 1.0.0
Date : 2026-09-17
Session : S135z-ccweb

## But

Script Node.js **idempotent** qui migre la table `AZ_Portfolio` de la base Airtable `Sales Closer Souverain` (`appTqLo3JDg7d1fak`) vers la structure v3.0.0 documentée dans `az-no-code/interfaces/AZ_PORTFOLIO_INTERFACE.md`.

Non-destructif : n'ajoute que les champs et records manquants, ne renomme rien, ne supprime rien. Relançable autant de fois que nécessaire.

## Ce que fait le script

-> 1- Récupère le schéma actuel de la base via l'API Airtable Metadata (`GET /v0/meta/bases/{baseId}/tables`)

-> 2- Si `AZ_Portfolio` n'existe pas : crée la table avec le champ principal `Nom du projet` (SingleLineText, à convertir manuellement en Formula après, voir §Étapes manuelles ci-dessous)

-> 3- Pour chaque champ attendu (18 champs listés dans le script) : ajoute uniquement s'il est absent (`POST /v0/meta/bases/{baseId}/tables/{tableId}/fields`)

-> 4- Vérifie les 3 records initiaux (`crm-souverain`, `cr-rdv-formate`, `masterclass-inscriptions`) et n'insère que ceux dont le `Slug` est absent

-> 5- **Optionnel** (flag `--with-sc-prospects-pattern`) : ajoute le champ `LinkedProspect` sur `AZ_Inscrits` (Link Record vers `SC_Prospects`)

## Prérequis

-> Node.js 18+ installé localement (Node.js 20 recommandé, `fetch` natif)

-> Un **Personal Access Token (PAT) Airtable** avec les scopes suivants :

   -> `schema.bases:read` (lire le schéma)

   -> `schema.bases:write` (créer table + champs)

   -> `data.records:read` (lire les records existants)

   -> `data.records:write` (insérer les records initiaux)

-> Le PAT doit avoir accès à la base `appTqLo3JDg7d1fak` (`Sales Closer Souverain`).

-> Génération d'un PAT : https://airtable.com/create/tokens -> `Create new token` -> cocher les 4 scopes -> ajouter la base en `Access`. Le token commence par `pat...` (~80 caractères).

## Trois méthodes d'injection du PAT

Le script lit `process.env.AIRTABLE_PAT`. C'est à toi de l'injecter juste avant l'exécution. Trois méthodes, du plus simple au plus souverain :

### Méthode 1 -- `secrets.env` (le plus simple)

Fichier `secrets.env` (à ne PAS committer, déjà couvert par `.gitignore` du repo) :

```
AIRTABLE_PAT=pat14CExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Exécution :

```bash
cd /c/Users/conta/dev/az-code
export $(grep -v '^#' secrets.env | xargs) && node scripts/airtable-migrate-portfolio.mjs
```

Ou dans un one-liner :

```bash
AIRTABLE_PAT=pat14CE... node scripts/airtable-migrate-portfolio.mjs
```

### Méthode 2 -- Bitwarden CLI (`bw`)

Prérequis : Bitwarden CLI installé + session déverrouillée (`bw unlock`).

Une seule fois, stocker le PAT dans Bitwarden :

```bash
echo '{"name":"airtable-sc-souverain","type":2,"secureNote":{"type":0},"notes":"pat14CE..."}' | bw encode | bw create item
# ou plus simple via l'UI Bitwarden : nouvelle Secure Note nommée "airtable-sc-souverain", champ notes = le PAT
```

Exécution :

```bash
cd /c/Users/conta/dev/az-code
AIRTABLE_PAT=$(bw get notes airtable-sc-souverain) node scripts/airtable-migrate-portfolio.mjs
```

### Méthode 3 -- age (souverain, versionnable)

Prérequis : `age` installé (`https://age-encryption.org`) + clé privée dans `~/.config/age/keys.txt`.

Une seule fois, chiffrer un fichier `secrets.age` qui contient `AIRTABLE_PAT=...` :

```bash
echo "AIRTABLE_PAT=pat14CE..." > /tmp/secrets.plain
age -r "age1..." -o secrets.age /tmp/secrets.plain
rm /tmp/secrets.plain
# secrets.age est chiffré, versionnable en git safe
```

Exécution :

```bash
cd /c/Users/conta/dev/az-code
AIRTABLE_PAT=$(age -d -i ~/.config/age/keys.txt secrets.age | grep AIRTABLE_PAT | cut -d= -f2) node scripts/airtable-migrate-portfolio.mjs
```

## Modes d'exécution

### Dry-run (recommandé en premier)

Simule les appels sans écrire dans Airtable. Affiche ce qui serait fait.

```bash
AIRTABLE_PAT=... node scripts/airtable-migrate-portfolio.mjs --dry-run
```

Sortie attendue :

```
[hh:mm:ss] ▲ Récupération du schéma de la base…
[hh:mm:ss] ↷ N tables détectées : Table1, Table2, …
[hh:mm:ss] ▲ Création de la table AZ_Portfolio…
[hh:mm:ss] ◯ [dry-run] création AZ_Portfolio ignorée.
[hh:mm:ss] + Ajout du champ 'Numéro' (type: number)…
[hh:mm:ss] ◯ [dry-run] ajout 'Numéro' ignoré.
…
[hh:mm:ss] ✓ Migration terminée.
```

### Apply (écriture réelle)

Après validation du dry-run, sans le flag :

```bash
AIRTABLE_PAT=... node scripts/airtable-migrate-portfolio.mjs
```

### Avec pattern SC_Prospects centralisé

Ajoute le champ `LinkedProspect` sur `AZ_Inscrits` (nécessite que `SC_Prospects` existe déjà dans la base) :

```bash
AIRTABLE_PAT=... node scripts/airtable-migrate-portfolio.mjs --with-sc-prospects-pattern
```

## Étapes manuelles après le script (limitations API Airtable Metadata)

L'API Airtable Metadata (septembre 2026) NE PERMET PAS :

-> de créer un champ `Formula` avec sa formule dès la création (workaround : créer en `SingleLineText` puis convertir manuellement dans l'UI)

-> de créer des vues (`Grid`, `Kanban`, `Timeline`, `Calendar`) programmatiquement (les vues sont UI-only)

-> de créer des champs `Count` ou `Rollup` sur des links qui n'existent pas encore

Après exécution du script, il te reste :

-> 1- Convertir le champ `Nom du projet` en Formula : clic droit sur la colonne dans AZ_Portfolio -> `Edit field` -> `Change field type` -> `Formula` -> formule : `"Projet " & {Numéro} & " -- " & {Slug}`

-> 2- Créer les 5 vues sur AZ_Portfolio (2 min de clic dans l'UI, voir `az-no-code/interfaces/AZ_PORTFOLIO_INTERFACE.md` v3.0.0 §"Vues à créer") :

   -> `Tous les projets` (Grid, tri Numéro desc)

   -> `En cours + À faire` (Grid, filtre Statut ∈ {En cours, À faire}, tri DateLivraison asc)

   -> `Portfolio public (livrés uniquement)` (Grid, filtre Statut = Livré)

   -> `Statut` (Kanban, groupé par Statut)

   -> `Livraisons` (Timeline sur DateLivraison, coloration par Statut)

-> 3- Si tu as passé `--with-sc-prospects-pattern`, ajouter sur SC_Prospects :

   -> `Nombre_projets` (Count sur le lien inverse AZ_Inscrits)

   -> `Origines` (Rollup sur AZ_Inscrits Slug via projet, ARRAYJOIN(values, ', '))

## Erreurs fréquentes

**`AIRTABLE_PAT non défini`** : la variable d'env n'a pas été injectée. Vérifie ta méthode d'injection (§ci-dessus).

**`HTTP 401 Unauthorized`** : le PAT est invalide ou expiré. Regénère un PAT sur airtable.com/create/tokens.

**`HTTP 403 Forbidden`** : le PAT n'a pas accès à la base `appTqLo3JDg7d1fak`. Sur airtable.com/create/tokens, édite le token et ajoute la base dans la section `Access`.

**`HTTP 422 Unprocessable Entity`** avec message sur `type` : Airtable a peut-être renommé un type de champ. Vérifie la doc `https://airtable.com/developers/web/api/model/field-type`.

## Extensibilité (futurs projets)

Ce script est le squelette. Pour un futur projet 4 qui ajoute une nouvelle table (ex : `AZ_LeadsCRM`) :

-> 1- Ajouter la spec de la table dans une nouvelle constante `AZ_LEADSCRM_FIELDS` en haut du script

-> 2- Ajouter une section `main()` qui crée la table si absente + ajoute les champs manquants (copier le pattern de AZ_Portfolio)

-> 3- Si la table doit être liée à `SC_Prospects`, le pattern `--with-sc-prospects-pattern` s'applique automatiquement (le script parcourt toutes les tables projet et ajoute le champ `LinkedProspect`)

## Changelog

-> 1.0.0 -- 2026-09-17 -- création (S135z-ccweb, Val David Option A) : script idempotent de migration AZ_Portfolio + pattern SC_Prospects optionnel. Sourcé sur l'API Airtable Metadata publique (v0, septembre 2026). Gestion PAT via 3 méthodes documentées (secrets.env / Bitwarden / age).
