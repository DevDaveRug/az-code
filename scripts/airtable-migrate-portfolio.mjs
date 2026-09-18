#!/usr/bin/env node
// airtable-migrate-portfolio.mjs
// ---
// Migration idempotente de la table AZ_Portfolio (base "Sales Closer Souverain")
// + option pattern SC_Prospects centralisé (champ LinkedProspect sur toutes les tables projet)
//
// Ce script est SAFE : il n'ajoute que les champs et records manquants, ne touche jamais
// aux données existantes, ne renomme/supprime rien. Relançable autant de fois que nécessaire.
//
// Usage :
//   AIRTABLE_PAT=xxx node scripts/airtable-migrate-portfolio.mjs
//   AIRTABLE_PAT=xxx node scripts/airtable-migrate-portfolio.mjs --dry-run
//   AIRTABLE_PAT=xxx node scripts/airtable-migrate-portfolio.mjs --with-sc-prospects-pattern
//
// Voir scripts/README-airtable-migrate.md pour les 3 méthodes d'injection du PAT
// (secrets.env / Bitwarden CLI / age).
//
// Session S135z-ccweb, Val David : Option A (script API).

const BASE_ID = 'appTqLo3JDg7d1fak'; // Sales Closer Souverain
const PAT = process.env.AIRTABLE_PAT;
const DRY_RUN = process.argv.includes('--dry-run');
const WITH_SC_PROSPECTS = process.argv.includes('--with-sc-prospects-pattern');

if (!PAT) {
  console.error('[ERREUR] AIRTABLE_PAT non défini dans l\'environnement.');
  console.error('Voir scripts/README-airtable-migrate.md pour les 3 méthodes d\'injection.');
  process.exit(1);
}

if (!PAT.startsWith('pat')) {
  console.error('[ERREUR] AIRTABLE_PAT ne ressemble pas à un Personal Access Token Airtable.');
  console.error('Un PAT valide commence par "pat" (ex : pat14CE...). Vérifie la variable.');
  process.exit(1);
}

const API = 'https://api.airtable.com/v0';
const HEADERS = {
  Authorization: `Bearer ${PAT}`,
  'Content-Type': 'application/json',
};

// --- Helpers HTTP ---------------------------------------------------------

async function airtable(method, path, body) {
  const url = `${API}${path}`;
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → HTTP ${res.status} : ${text}`);
  }
  return res.json();
}

function log(icon, msg) {
  const t = new Date().toISOString().slice(11, 19);
  console.log(`[${t}] ${icon} ${msg}`);
}

// --- Spec de la table AZ_Portfolio ---------------------------------------

// Champ principal : Nom du projet (Formula). L'API Metadata NE PERMET PAS de créer
// un champ Formula avec formule à la création (limitation Airtable septembre 2026).
// Solution : on crée d'abord AZ_Portfolio avec un champ principal singleLineText "Nom du projet",
// et on demande à David de convertir manuellement en Formula après (1 clic droit dans l'UI).
// Le script signale cette étape manuelle en fin d'exécution.

const AZ_PORTFOLIO_FIELDS = [
  // Le champ principal "Nom du projet" est créé à la création de la table (voir createPortfolioTable).
  { name: 'Numéro', type: 'number', options: { precision: 0 } },
  { name: 'Slug', type: 'singleLineText' },
  { name: 'Semaine', type: 'number', options: { precision: 0 } },
  {
    name: 'AnnéeSaison',
    type: 'singleSelect',
    options: {
      choices: [
        { name: '2026-Automne' },
        { name: '2026-Hiver' },
        { name: '2026-Printemps' },
        { name: '2026-Été' },
      ],
    },
  },
  { name: 'Client', type: 'singleLineText' },
  { name: 'DateLivraison', type: 'date', options: { dateFormat: { name: 'iso' } } },
  {
    name: 'Statut',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'À faire', color: 'grayLight2' },
        { name: 'En cours', color: 'blueLight2' },
        { name: 'Livré', color: 'greenLight2' },
        { name: 'Bonus', color: 'purpleLight2' },
      ],
    },
  },
  { name: 'Pitch', type: 'multilineText' },
  { name: 'TablesConcernées', type: 'multilineText' },
  { name: 'AutomationsConcernées', type: 'multilineText' },
  { name: 'Repo_NoCode', type: 'url' },
  { name: 'Repo_Code', type: 'url' },
  { name: 'Preview_Vercel', type: 'url' },
  { name: 'Lien_Airtable_Demo', type: 'url' },
  { name: 'Lien_NocoDB_Demo', type: 'url' },
  { name: 'Captures', type: 'multipleAttachments' },
  { name: 'AngleCommercial', type: 'multilineText' },
  { name: 'Notes', type: 'multilineText' },
  { name: 'DateAjout', type: 'createdTime', options: { result: { type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Europe/Paris' } } } },
];

const AZ_PORTFOLIO_INITIAL_RECORDS = [
  {
    Numéro: 1,
    Slug: 'crm-souverain',
    Semaine: 36,
    AnnéeSaison: '2026-Automne',
    Client: 'Consultant B2B',
    DateLivraison: '2026-09-05',
    Statut: 'Livré',
    Pitch: 'Un CRM prospects avec vue "à relancer" (dernière relance > 7 jours) et email récap hebdo. Idéal quand tu perds tes prospects dans un fichier Excel.',
    Repo_NoCode: 'https://github.com/DevDaveRug/az-no-code/tree/main/defis/crm-souverain',
    Repo_Code: 'https://github.com/DevDaveRug/az-code/tree/main/defis/crm-souverain',
  },
  {
    Numéro: 2,
    Slug: 'cr-rdv-formate',
    Semaine: 37,
    AnnéeSaison: '2026-Automne',
    Client: 'Coach / formateur',
    DateLivraison: '2026-09-12',
    Statut: 'Livré',
    Pitch: "Un compte-rendu de RDV brut devient une synthèse structurée en 2 colonnes (verbatim + reformulation). Économise 45 min de reprise après chaque appel.",
    Repo_NoCode: 'https://github.com/DevDaveRug/az-no-code/tree/main/defis/cr-rdv-formate',
    Repo_Code: 'https://github.com/DevDaveRug/az-code/tree/main/defis/cr-rdv-souverain',
  },
  {
    Numéro: 3,
    Slug: 'masterclass-inscriptions',
    Semaine: 38,
    AnnéeSaison: '2026-Automne',
    Client: "Organisateur d'événements",
    DateLivraison: '2026-09-19',
    Statut: 'Livré',
    Pitch: "Un formulaire d'inscription à une masterclass qui envoie automatiquement l'email de confirmation personnalisé (prénom + date). Fini l'heure par jour à envoyer les mails à la main.",
    Repo_NoCode: 'https://github.com/DevDaveRug/az-no-code/tree/main/defis/masterclass-inscriptions',
    Repo_Code: 'https://github.com/DevDaveRug/az-code/tree/main/defis/masterclass-inscriptions',
  },
];

// --- Opérations principales ----------------------------------------------

async function getSchema() {
  const data = await airtable('GET', `/meta/bases/${BASE_ID}/tables`);
  return data.tables;
}

async function createPortfolioTable() {
  log('▲', 'Création de la table AZ_Portfolio…');
  if (DRY_RUN) {
    log('◯', '[dry-run] création AZ_Portfolio ignorée.');
    return { id: 'tblDRYRUN', name: 'AZ_Portfolio', fields: [{ name: 'Nom du projet', id: 'fldDRY' }] };
  }
  const body = {
    name: 'AZ_Portfolio',
    description: 'Portfolio des projets souverains livrés (ou en cours). Base publique pour prospects.',
    fields: [
      { name: 'Nom du projet', type: 'singleLineText' },
    ],
  };
  return airtable('POST', `/meta/bases/${BASE_ID}/tables`, body);
}

async function ensureField(tableId, spec, existingNames) {
  if (existingNames.has(spec.name)) {
    log('↷', `Champ '${spec.name}' déjà présent, skip.`);
    return null;
  }
  log('+', `Ajout du champ '${spec.name}' (type: ${spec.type})…`);
  if (DRY_RUN) {
    log('◯', `[dry-run] ajout '${spec.name}' ignoré.`);
    return null;
  }
  return airtable('POST', `/meta/bases/${BASE_ID}/tables/${tableId}/fields`, spec);
}

async function listRecords(tableName) {
  const encoded = encodeURIComponent(tableName);
  const data = await airtable('GET', `/${BASE_ID}/${encoded}?maxRecords=100`);
  return data.records;
}

async function createRecords(tableName, records) {
  if (records.length === 0) return [];
  log('+', `Insertion de ${records.length} record(s) dans '${tableName}'…`);
  if (DRY_RUN) {
    log('◯', `[dry-run] insertion de ${records.length} record(s) ignorée.`);
    return [];
  }
  const encoded = encodeURIComponent(tableName);
  const body = { records: records.map((fields) => ({ fields })) };
  const data = await airtable('POST', `/${BASE_ID}/${encoded}`, body);
  return data.records;
}

// --- Pattern SC_Prospects centralisé (optionnel, flag --with-sc-prospects-pattern) ---

async function applyScProspectsPattern(schema) {
  log('▲', 'Application du pattern SC_Prospects centralisé…');

  let scProspects = schema.find((t) => t.name === 'SC_Prospects');
  if (!scProspects) {
    log('!', "Table SC_Prospects introuvable dans la base. Le pattern nécessite qu'elle existe déjà.");
    log('!', 'Skip du pattern SC_Prospects. Crée la table manuellement puis relance avec --with-sc-prospects-pattern.');
    return;
  }
  log('↷', `Table SC_Prospects trouvée (id: ${scProspects.id}).`);

  // Sur AZ_Inscrits (projet 3, si présente) : ajouter le champ LinkedProspect (Link -> SC_Prospects)
  const azInscrits = schema.find((t) => t.name === 'AZ_Inscrits');
  if (azInscrits) {
    const hasLinked = azInscrits.fields.some((f) => f.name === 'LinkedProspect');
    if (hasLinked) {
      log('↷', "Champ 'LinkedProspect' déjà présent sur AZ_Inscrits, skip.");
    } else {
      log('+', "Ajout du champ 'LinkedProspect' (Link -> SC_Prospects) sur AZ_Inscrits…");
      if (!DRY_RUN) {
        await airtable('POST', `/meta/bases/${BASE_ID}/tables/${azInscrits.id}/fields`, {
          name: 'LinkedProspect',
          type: 'multipleRecordLinks',
          options: { linkedTableId: scProspects.id },
        });
      }
    }
  } else {
    log('!', "Table AZ_Inscrits introuvable, skip le pattern côté projet 3.");
  }

  // Sur SC_Prospects : ajouter les champs de rollup pour visualiser les projets liés
  const existingScFields = new Set(scProspects.fields.map((f) => f.name));
  const scNewFields = [
    // PIÈGE API Metadata (corrigé empiriquement S136z après test réel, l'hypothèse S135z
    // était fausse) : le champ symétrique inverse EST auto-créé par Airtable lors d'un
    // POST /fields côté source, mais avec un nom générique dérivé de la table source
    // (ex : 'SC_Prospects 2' en cas de collision). Il faut le RENOMMER (PATCH), jamais le
    // supprimer/recréer -- voir az-code/scripts/airtable-harmonize-prospects.mjs fonction
    // ensureNamedLinkField() pour le pattern complet (champ 'Projets_liés' côté
    // SC_Prospects <-> 'LinkedProspect' côté AZ_Inscrits).
    // On ajoute ensuite un champ Count (nombre de projets liés) et Origines (liste des slugs).
    // Note : ces champs de type Count / Rollup ne peuvent être créés via l'API que si les champs liés existent déjà.
    // On les liste ici comme rappel pour création manuelle après le premier link.
  ];
  if (scNewFields.length > 0 && !existingScFields.size) {
    // placeholder pour évolution future
  }
  log('↷', 'Champs Count/Rollup sur SC_Prospects : à ajouter manuellement dans l\'UI Airtable (limitation API pour ces types).');
  log('↷', "  → 'Nombre_projets' (Count sur AZ_Inscrits inverse link)");
  log('↷', "  → 'Origines' (Rollup sur AZ_Inscrits[Slug via projet], ARRAYJOIN(values, ', '))");
}

// --- Flow principal -------------------------------------------------------

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  Airtable Migrate — AZ_Portfolio + (optionnel) SC_Prospects');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`  Base : ${BASE_ID} (Sales Closer Souverain)`);
  console.log(`  PAT  : ${PAT.slice(0, 8)}… (longueur ${PAT.length})`);
  console.log(`  Mode : ${DRY_RUN ? 'DRY-RUN (aucune écriture)' : 'APPLY'}`);
  console.log(`  SC_Prospects pattern : ${WITH_SC_PROSPECTS ? 'ACTIVÉ' : 'désactivé (--with-sc-prospects-pattern pour l\'activer)'}`);
  console.log('────────────────────────────────────────────────────────────────');

  log('▲', 'Récupération du schéma de la base…');
  const schema = await getSchema();
  log('↷', `${schema.length} table(s) détectée(s) : ${schema.map((t) => t.name).join(', ')}`);

  // 1. AZ_Portfolio : create if missing, then ensure all fields
  let portfolio = schema.find((t) => t.name === 'AZ_Portfolio');
  if (!portfolio) {
    portfolio = await createPortfolioTable();
    // Refresh schema view of the newly created table for field ID resolution
    if (!DRY_RUN) {
      const refreshed = await getSchema();
      portfolio = refreshed.find((t) => t.name === 'AZ_Portfolio');
    }
  } else {
    log('↷', `Table AZ_Portfolio déjà présente (id: ${portfolio.id}), on complète les champs manquants.`);
  }

  const existingFieldNames = new Set((portfolio.fields || []).map((f) => f.name));
  for (const spec of AZ_PORTFOLIO_FIELDS) {
    await ensureField(portfolio.id, spec, existingFieldNames);
  }

  // 2. Insert initial records if AZ_Portfolio is empty (or if the 3 projects are missing)
  let existingRecords = [];
  if (!DRY_RUN) {
    try {
      existingRecords = await listRecords('AZ_Portfolio');
    } catch (e) {
      log('!', `Impossible de lister les records existants : ${e.message}`);
      existingRecords = [];
    }
  }
  const existingSlugs = new Set(existingRecords.map((r) => r.fields?.Slug).filter(Boolean));
  const missingRecords = AZ_PORTFOLIO_INITIAL_RECORDS.filter((r) => !existingSlugs.has(r.Slug));
  if (missingRecords.length === 0) {
    log('↷', 'Les 3 projets initiaux sont déjà présents, skip insertion.');
  } else {
    await createRecords('AZ_Portfolio', missingRecords);
  }

  // 3. Optional : SC_Prospects pattern
  if (WITH_SC_PROSPECTS) {
    const refreshed = DRY_RUN ? schema : await getSchema();
    await applyScProspectsPattern(refreshed);
  }

  console.log('────────────────────────────────────────────────────────────────');
  log('✓', 'Migration terminée.');
  console.log('');
  console.log('  ÉTAPES MANUELLES RESTANTES (limitations API Airtable Metadata) :');
  console.log('  1. Ouvrir AZ_Portfolio dans l\'UI Airtable.');
  console.log('  2. Convertir le champ "Nom du projet" (SingleLineText) en Formula :');
  console.log('       formule : "Projet " & {Numéro} & " -- " & {Slug}');
  console.log('     → clic droit sur la colonne "Nom du projet" → Edit field → Change field type → Formula.');
  console.log('  3. Créer les 5 vues manuellement (l\'API ne permet pas la création de vues) :');
  console.log('     → "Tous les projets" (Grid, tri Numéro desc)');
  console.log('     → "En cours + À faire" (Grid, filtre Statut ∈ {En cours, À faire}, tri DateLivraison asc)');
  console.log('     → "Portfolio public (livrés uniquement)" (Grid, filtre Statut=Livré)');
  console.log('     → "Statut" (Kanban, groupé par Statut)');
  console.log('     → "Livraisons" (Timeline sur DateLivraison, coloration par Statut)');
  if (WITH_SC_PROSPECTS) {
    console.log('  4. Sur SC_Prospects, ajouter manuellement les champs Count/Rollup (voir logs ci-dessus).');
  }
  console.log('');
  console.log('  Voir AZ_PORTFOLIO_INTERFACE.md v3.0.0 pour le détail des vues + Interface Designer.');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
