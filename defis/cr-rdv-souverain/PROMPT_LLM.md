# Prompt LLM -- Formatage automatique de CR de RDV

Version : 1.1.0
Date : 2026-09-10
Statut : Actif -- artefact réutilisable client
Défi : Alegria Eva PRO, semaine du 8 septembre 2026

> Ce fichier est **l'artefact central du défi CR-RDV**. Le client peut le coller tel quel dans sa propre IA (Claude, ChatGPT, Gemini, Mistral, ou via OpenRouter dans un workflow n8n) pour transformer ses notes brutes de RDV en compte rendu formaté à 2 colonnes.
>
> Aucun compte à créer, aucun outil à installer. Copier-coller le bloc "Prompt à copier" ci-dessous dans l'IA de son choix, puis coller ses notes en dessous.

---

## I- Contexte du défi

Eva PRO (formation Alegria) : "Comment faire des comptes rendus de RDV rapidement. Le client colle ses notes brutes sur son téléphone après un RDV, il reçoit un CR formaté avec 2 colonnes : `Ce que le client a demandé` / `Ce que je dois faire`. 5 CR par semaine à produire. Le prompt doit être réutilisable et ne pas modifier le process existant du client."

Contraintes :

-> Notes **écrites** (pas d'audio -- traité par un autre défi)

-> Pas de nouvel outil à apprendre pour le client

-> Rendu prêt à copier-coller dans son CRM / son mail / son Notion

-> 1 prompt, N fois par semaine, résultat cohérent

---

## II- Prompt à copier (v1.1.0)

> **Nouveautés v1.1.0** : (1) règle explicite "français avec TOUS les accents" (le LLM avait tendance à omettre les accents sur certains modèles) ; (2) règle année courante (le LLM inventait "2023" au lieu d'utiliser l'année en cours quand l'année est absente des notes). Remplace `2026` ci-dessous par l'année courante si tu utilises ce prompt en 2027 ou après.

```
Tu es un assistant qui formate des notes brutes de rendez-vous en compte rendu structuré. Tu écris en français avec TOUS les accents standards (é è ê à â î ô û ç ù œ ï).

RÈGLE ABSOLUE 1 -- Fidélité : tu ne modifies JAMAIS le contenu factuel des notes. Tu réorganises et clarifies uniquement.

RÈGLE ABSOLUE 2 -- Accents FR : tu utilises TOUS les accents français standards. Ne jamais écrire "en-tete" à la place de "en-tête", ni "deteste" à la place de "déteste", ni "demo" à la place de "démo". C'est du français, pas de l'ASCII.

RÈGLE ABSOLUE 3 -- Année : si l'année du RDV n'est pas explicite dans les notes, utilise 2026 (année courante, PAS 2023 ni une année inventée).

Ton output doit contenir EXACTEMENT 4 sections dans cet ordre :

1- En-tête
   - Date du RDV (extrais-la des notes ; si absente, écris "Date : à préciser" ; si année absente, utilise 2026)
   - Interlocuteur (extrais nom + entreprise si présents ; sinon "Interlocuteur : à préciser")
   - Sujet (1 ligne max, résume l'objet du RDV)

2- Tableau à 2 colonnes -- section principale
   Colonne gauche : "Ce que le client a demandé"
   Colonne droite : "Ce que je dois faire"

   Règles de remplissage :
   - Chaque ligne du tableau relie UNE demande à UNE action de suivi
   - Si une demande n'appelle aucune action de ma part (info seulement), écris "Rien à faire, note pour mémoire"
   - Si une action apparait sans demande explicite du client (mais que je dois la faire), écris "Point soulevé de ma part" en colonne gauche
   - Si la demande est ambigüe, écris entre parenthèses "(à confirmer)" à côté

3- Points d'attention
   - Uniquement les tensions, désaccords, points bloquants ou risques mentionnés dans les notes
   - Si aucun, écris "Aucun point d'attention détecté"
   - Une ligne par point

4- Prochaine étape
   - La suite concrète : appel, envoi, RDV, livrable, décision
   - Format : "Action -- Date/échéance -- Qui"
   - Si non défini dans les notes, écris "Prochaine étape à définir de mon côté"

FORMAT DE SORTIE : Markdown pur, aucun emoji, tutoiement, phrases courtes. Le tableau utilise la syntaxe Markdown standard `| Colonne 1 | Colonne 2 |`. Aucun préambule ("Voici votre CR..."), aucun postambule ("N'hésitez pas..."). Livre uniquement le CR formaté, prêt à copier.

NOTES BRUTES DU RDV :
[coller les notes ici]
```

---

## III- Exemple d'utilisation

### Entrée -- notes brutes du client

```
rdv marie dupont acme sarl 8 sept 15h visio
elle veut refonte site vitrine budget 5-8k urgence pas immédiate mais avant Noël
demande devis avant 20/09 forme pdf
site actuel wordpress lent images non compressées elle sait
question rgpd formulaire contact -> à vérifier avec son dpo
concurrent qu'elle a vu : agence trucbidule 12k trop cher
elle veut cta whatsapp sur home
budget peut monter si on inclut ref seo ok
prochain call 22/09 après réception devis
elle a insisté : pas de démarcheur téléphonique dans le workflow
```

### Sortie -- CR formaté par le prompt

```
## CR RDV -- Marie Dupont (Acme SARL) -- 8 septembre 2026

Sujet : refonte site vitrine, cible avant Noël

| Ce que le client a demandé | Ce que je dois faire |
|---|---|
| Refonte site vitrine, budget 5-8k, livraison avant Noël | Préparer offre technique + planning livraison |
| Devis PDF avant le 20/09 | Envoyer devis chiffré au format PDF avant le 20/09 |
| Vérifier conformité RGPD du formulaire de contact | Coordonner avec son DPO pour audit RGPD formulaire |
| CTA WhatsApp sur la page d'accueil | Intégrer bouton WhatsApp Business dans la maquette home |
| Budget extensible si intégration référencement SEO inclus | Chiffrer option SEO en add-on dans le devis |
| Point soulevé de ma part | Signaler que Wordpress actuel est lent -- inclure optimisation images dans le devis |

## Points d'attention

-> Concurrent agence trucbidule a proposé 12k, jugé trop cher -- rester sous ce plafond
-> Aucun démarcheur téléphonique dans le workflow -- ne pas prévoir de relance commerciale sortante

## Prochaine étape

Appel de suivi -- 22 septembre 2026 -- moi (après envoi devis)
```

---

## IV- Comment le client utilise ce prompt

### Version 1 -- ChatGPT / Claude / autre IA directe

1- Ouvrir son IA préférée

2- Coller le "Prompt à copier" (section II) dans le champ système ou en premier message

3- Coller ses notes brutes juste après `NOTES BRUTES DU RDV :`

4- Copier la réponse formatée dans son CRM / son mail / son Notion

Coût : 0€ (dans la limite du plan gratuit de l'IA)

### Version 2 -- OpenRouter via workflow n8n (souverain)

Le client déclenche le workflow n8n via un raccourci navigateur ou un webhook :

1- Le client va sur `https://cr-rdv-souverain.vercel.app/` (page démo)

2- Il colle ses notes brutes dans le textarea

3- Il clique "Formater"

4- Le workflow n8n appelle OpenRouter (choix du modèle via config, ex : `anthropic/claude-sonnet-5` ou `google/gemini-2.5-flash`)

5- Le CR formaté s'affiche sur la page + est stocké en base + PDF téléchargeable

Avantages :

-> Un seul geste pour le client (pas besoin de copier-coller dans son IA)

-> Prompt versionné côté n8n -- si tu améliores le prompt, tous les clients bénéficient

-> Historique des CR consultable (base Postgres)

-> Sortie PDF prête à envoyer par mail

Coût par CR : ~0,001 à 0,005€ selon le modèle OpenRouter choisi (versus ~0,02€ sur ChatGPT Plus ou Claude Pro à l'usage individuel).

### Version 3 -- Airtable interface no-code

Le client saisit ses notes dans un formulaire Airtable, un automation Airtable envoie les notes à OpenAI (ou script custom) et le CR s'écrit automatiquement dans un champ formaté. Détails : `az-no-code/defis/cr-rdv-formate/README.md`.

---

## V- Bonus interactifs (v0.2)

Prévu dans la version code souveraine v0.2 :

-> **Cases à cocher** dans le formulaire de saisie pour préciser les champs manquants (date RDV, nom interlocuteur, contexte) que l'IA n'aurait pas pu déduire.

-> **Bulle vocale ElevenLabs** (v0.3) : le client peut dicter ses notes à voix haute pendant sa marche, la bulle transcrit et lance le formatage en un geste.

-> **Rattachement CRM** (v0.4) : cocher un prospect existant dans `crm-souverain` pour rattacher le CR à sa timeline d'interactions. Connexion REST HTTP entre les 2 apps.

-> **Tenant LIA'M dédié "CR de RDV"** (v0.5) : conversation en direct sur Telegram/WhatsApp, LIA'M pose les questions manquantes en interactif, produit le CR à la fin. Objectif conversation = collecter les infos que l'écrit seul rate.

---

## VI- Améliorations du prompt à venir

Idées v1.1 :

-> Ajouter section "Décisions prises" quand des choix ont été actés en RDV

-> Détection automatique de la langue (FR / EN / ES) et adaptation

-> Version longue optionnelle (verbatim) pour les RDV très denses

-> Format alternatif "email de suivi" (CR reformulé en mail au client)

Idées v1.2 :

-> Le prompt s'auto-adapte au secteur du client (juridique, immobilier, conseil...) via une variable `{secteur}`

-> Cross-check RGPD automatique quand des données personnelles apparaissent

---

## Changelog

-> 1.1.0 -- 2026-09-10 (S133z, Cor David) : fix 2 régressions observées sur premier test end-to-end (Julie Marchand / cabinet Talents Cinq). (a) **Accents FR omis dans la sortie du LLM** ("En-tete", "Deteste", "demo", "Prete", "hesitation"...) -- règle "Français avec TOUS les accents" ajoutée en tête + rappelée dans chaque section + exemples de mots à ne pas ASCII-fier. Origine côté n8n : le systemPrompt du node Code était écrit sans accents "par prudence JS", le LLM reproduisait ce style. (b) **Année inventée** (LLM écrivait "09/09/2023" alors que les notes disent "9 sept" sans année) -- règle "utilise l'année courante" ajoutée avec valeur explicite `2026` (à bumper manuellement en 2027). Miroir : workflow n8n `SB_WF10 v1.1.0` bumpé sur la même bascule (dr-context PR à venir).

-> 1.0.0 -- 2026-09-08 (S133z) : création. Prompt CR-RDV formaté 2 colonnes, structure 4 sections, artefact réutilisable client. Défi Alegria Eva PRO semaine du 8/9.
