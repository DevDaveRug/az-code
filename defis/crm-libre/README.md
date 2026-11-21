# CRM libre (vide), version Code

Même modèle que les versions Airtable et NocoDB (az-no-code, `interfaces/SC_CRM_LIBRE_VIDE.md` et `SC_CRM_LIBRE_SOUVERAIN.md`) : 3 tables reliées, aucune donnée, aucun champ IA.

-> `Prospect` : prénom, nom, entreprise, e-mail, téléphone, statut (Nouveau, En cours, Gagné, Perdu), action, source, dates, montant potentiel, notes. La prochaine relance se calcule : dernier contact + 7 jours, pour les statuts Nouveau et En cours.

-> `Rdv` : titre, prospect, date, contexte (Découverte, Suivi, Closing), notes brutes, compte rendu, statut.

-> `Suivi` : tâche, prospect, RDV, échéance, statut (À faire, En cours, Fait), priorité, description, notes de clôture.

## Lancer

```bash
cd defis/crm-libre
cp .env.example .env      # puis coller la chaîne de connexion Neon dans DATABASE_URL
npm install
npx prisma db push        # crée le schéma crm_libre et les 3 tables
npm run dev
```

Pages : `/` (prospects, vue `?vue=relance` pour ceux à relancer), `/nouveau`, `/rdv`, `/suivis`.

## Déployer

Vercel, variable `DATABASE_URL` (Neon, schéma `crm_libre`). `vercel.json` lance `prisma db push` en production seulement.

## État

Compile (`prisma validate`, `tsc`, `next build` passent). Parcours testé le 21/11/2026 contre une branche Neon jetable (supprimée ensuite) : `prisma db push` crée le schéma `crm_libre` ; création d'un prospect (relance à J+7), d'un RDV puis d'un suivi liés au prospect et au RDV ; « Terminé » retire le suivi de la liste ; la vue `?vue=relance` montre un contact vieux de 10 jours et cache un contact du jour ; « Contacté aujourd'hui » le sort de la vue.

Pas de modification ni de suppression d'un prospect, d'un RDV ou d'un suivi depuis l'interface (hors « Contacté aujourd'hui » et « Terminé ») : à ajouter si besoin.
