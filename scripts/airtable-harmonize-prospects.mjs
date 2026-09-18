#!/usr/bin/env node
// airtable-harmonize-prospects.mjs
// ---
// Harmonisation idempotente des 4 prospects existants de SC_Prospects
// (Alice Martin, Bob Durand, Chloé Dubois, Emma Petit -- défi 1 crm-souverain)
// avec les 3 tables projets de la base "Sales Closer Souverain" :
//   - AZ_Inscrits        (défi 3 masterclass-inscriptions) -- champ LinkedProspect
//   - SC_CRs_de_RDV       (défi 2 cr-rdv-formaté / cr-rdv-souverain) -- champ Prospect
//   - SC_Prospects lui-même (défi 1) -- rien à ajouter côté source, c'est la table centrale
//
// Ce script est SAFE : il n'ajoute que les champs et records manquants (vérifiés par nom
// avant toute écriture), ne renomme/supprime jamais rien. Relançable autant de fois que
// nécessaire.
//
// PIÈGE API Metadata Airtable (confirmé empiriquement S135z) : quand on crée un champ
// multipleRecordLinks via POST /meta/bases/{baseId}/tables/{tableId}/fields côté source
// (ex : LinkedProspect sur AZ_Inscrits, linkedTableId = SC_Prospects), Airtable NE crée PAS
// automatiquement le champ symétrique inverse sur la table cible (SC_Prospects). Il faut
// un second POST explicite côté cible pour créer ce champ inverse (voir ensureInverseLink
// ci-dessous). Documenté dans az-no-code/interfaces/AIRTABLE_INTERFACE_TERMS.md v1.1.0
// §"Pièges API Metadata".
//
// Usage :
//   AIRTABLE_PAT=xxx node scripts/airtable-harmonize-prospects.mjs
//   AIRTABLE_PAT=xxx node scripts/airtable-harmonize-prospects.mjs --dry-run
//
// Session S136z-ccdd.

const BASE_ID = 'appTqLo3JDg7d1fak'; // Sales Closer Souverain
const PAT = process.env.AIRTABLE_PAT;
const DRY_RUN = process.argv.includes('--dry-run');

if (!PAT) {
  console.error('[ERREUR] AIRTABLE_PAT non défini dans l\'environnement.');
  console.error('Voir scripts/README-airtable-migrate.md pour les méthodes d\'injection (flow Bw + age recommandé).');
  process.exit(1);
}

if (!PAT.startsWith('pat')) {
  console.error('[ERREUR] AIRTABLE_PAT ne ressemble pas à un Personal Access Token Airtable.');
  process.exit(1);
}

const API = 'https://api.airtable.com/v0';
const HEADERS = {
  Authorization: `Bearer ${PAT}`,
  'Content-Type': 'application/json',
};

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

// --- Les 4 prospects existants (défi 1, exemples.md) ----------------------
// Matching par Nom+Prenom, TLD .example (RFC 2606, jamais routable -- safe pour les
// automations "recordCreated -> sendEmail" déclenchées par AZ_Inscrits).

const PROSPECTS = [
  { Prenom: 'Alice', Nom: 'Martin', Email: 'alice.martin@legrand.example', Entreprise: 'Cabinet Legrand' },
  { Prenom: 'Bob', Nom: 'Durand', Email: 'b.durand@techflow.example', Entreprise: 'TechFlow SAS' },
  { Prenom: 'Chloé', Nom: 'Dubois', Email: 'c.dubois@zenith.example', Entreprise: 'Studio Zenith' },
  { Prenom: 'Emma', Nom: 'Petit', Email: 'e.petit@marketpro.example', Entreprise: 'MarketPro' },
];

async function getSchema() {
  const data = await airtable('GET', `/meta/bases/${BASE_ID}/tables`);
  return data.tables;
}

async function listRecords(tableName) {
  const encoded = encodeURIComponent(tableName);
  const data = await airtable('GET', `/${BASE_ID}/${encoded}?maxRecords=100`);
  return data.records;
}

// --- Étape 1 : localiser (ou créer) le champ link source -> SC_Prospects --

async function ensureLinkField(table, fieldName, linkedTableId) {
  const existing = table.fields.find((f) => f.name === fieldName);
  if (existing) {
    log('↷', `Champ '${fieldName}' déjà présent sur ${table.name}, skip.`);
    return existing;
  }
  log('+', `Ajout du champ '${fieldName}' (Link -> SC_Prospects) sur ${table.name}…`);
  if (DRY_RUN) {
    log('◯', `[dry-run] ajout '${fieldName}' ignoré.`);
    return { name: fieldName, id: 'fldDRYRUN' };
  }
  return airtable('POST', `/meta/bases/${BASE_ID}/tables/${table.id}/fields`, {
    name: fieldName,
    type: 'multipleRecordLinks',
    options: { linkedTableId },
  });
}

// --- Étape 2 : champ symétrique inverse côté SC_Prospects (piège S135z) ---

async function ensureInverseLink(scProspects, fieldName, linkedTableId, linkedTableName) {
  const alreadyLinked = scProspects.fields.find(
    (f) => f.type === 'multipleRecordLinks' && f.options?.linkedTableId === linkedTableId
  );
  if (alreadyLinked) {
    log('↷', `SC_Prospects a déjà un champ lié à ${linkedTableName} ('${alreadyLinked.name}'), skip.`);
    return alreadyLinked;
  }
  log('+', `Ajout du champ inverse '${fieldName}' (Link -> ${linkedTableName}) sur SC_Prospects…`);
  if (DRY_RUN) {
    log('◯', `[dry-run] ajout inverse '${fieldName}' ignoré.`);
    return { name: fieldName, id: 'fldDRYRUN' };
  }
  return airtable('POST', `/meta/bases/${BASE_ID}/tables/${scProspects.id}/fields`, {
    name: fieldName,
    type: 'multipleRecordLinks',
    options: { linkedTableId },
  });
}

// --- Étape 3 : peupler avec des records exemples liés aux 4 prospects -----

async function ensureExampleRecords(table, linkFieldName, buildFields, scProspectsRecords) {
  if (DRY_RUN) {
    log('◯', `[dry-run] peuplement de ${table.name} ignoré.`);
    return;
  }
  let existing = [];
  try {
    existing = await listRecords(table.name);
  } catch (e) {
    log('!', `Impossible de lister les records de ${table.name} : ${e.message}`);
    return;
  }
  const alreadyLinkedProspectIds = new Set(
    existing.flatMap((r) => r.fields?.[linkFieldName] || [])
  );

  const toCreate = [];
  for (const prospect of PROSPECTS) {
    const scRecord = scProspectsRecords.find(
      (r) => r.fields?.Prenom === prospect.Prenom && r.fields?.Nom === prospect.Nom
    );
    if (!scRecord) {
      log('!', `Prospect ${prospect.Prenom} ${prospect.Nom} introuvable dans SC_Prospects, skip.`);
      continue;
    }
    if (alreadyLinkedProspectIds.has(scRecord.id)) {
      log('↷', `${table.name} a déjà un record lié à ${prospect.Prenom} ${prospect.Nom}, skip.`);
      continue;
    }
    toCreate.push({ ...buildFields(prospect), [linkFieldName]: [scRecord.id] });
  }

  if (toCreate.length === 0) {
    log('↷', `${table.name} : les 4 prospects sont déjà représentés, rien à créer.`);
    return;
  }
  log('+', `Insertion de ${toCreate.length} record(s) exemple(s) dans ${table.name}…`);
  const encoded = encodeURIComponent(table.name);
  await airtable('POST', `/${BASE_ID}/${encoded}`, { records: toCreate.map((fields) => ({ fields })) });
}

// --- Flow principal ---------------------------------------------------------

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  Airtable Harmonize — SC_Prospects <-> 3 tables projets');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`  Base : ${BASE_ID} (Sales Closer Souverain)`);
  console.log(`  PAT  : ${PAT.slice(0, 8)}… (longueur ${PAT.length})`);
  console.log(`  Mode : ${DRY_RUN ? 'DRY-RUN (aucune écriture)' : 'APPLY'}`);
  console.log('────────────────────────────────────────────────────────────────');

  log('▲', 'Récupération du schéma de la base…');
  const schema = await getSchema();
  log('↷', `${schema.length} table(s) détectée(s) : ${schema.map((t) => t.name).join(', ')}`);

  const scProspects = schema.find((t) => t.name === 'SC_Prospects');
  if (!scProspects) {
    console.error('[FATAL] Table SC_Prospects introuvable. Rien à harmoniser.');
    process.exit(1);
  }

  let scProspectsRecords = [];
  if (!DRY_RUN) {
    scProspectsRecords = await listRecords('SC_Prospects');
    log('↷', `${scProspectsRecords.length} prospect(s) trouvé(s) dans SC_Prospects.`);
  }

  // --- AZ_Inscrits (défi 3) ---
  const azInscrits = schema.find((t) => t.name === 'AZ_Inscrits');
  if (azInscrits) {
    await ensureLinkField(azInscrits, 'LinkedProspect', scProspects.id);
    await ensureInverseLink(scProspects, 'Projets_liés', azInscrits.id, 'AZ_Inscrits');
    await ensureExampleRecords(
      azInscrits,
      'LinkedProspect',
      (p) => ({
        Prenom: p.Prenom,
        Email: p.Email,
        DateMasterclass: new Date().toISOString().slice(0, 10),
        StatutEmail: 'En attente',
        Notes: `Exemple généré par airtable-harmonize-prospects.mjs (S136z) -- lié à ${p.Prenom} ${p.Nom} (${p.Entreprise}).`,
      }),
      scProspectsRecords
    );
  } else {
    log('!', 'Table AZ_Inscrits introuvable, skip.');
  }

  // --- SC_CRs_de_RDV (défi 2) ---
  const scCrsDeRdv = schema.find((t) => t.name === 'SC_CRs_de_RDV');
  if (scCrsDeRdv) {
    await ensureLinkField(scCrsDeRdv, 'Prospect', scProspects.id);
    await ensureInverseLink(scProspects, 'CRs_de_RDV_liés', scCrsDeRdv.id, 'SC_CRs_de_RDV');
    await ensureExampleRecords(
      scCrsDeRdv,
      'Prospect',
      (p) => ({
        'Notes brutes': `Exemple généré par airtable-harmonize-prospects.mjs (S136z) -- RDV fictif avec ${p.Prenom} ${p.Nom} (${p.Entreprise}).`,
        Interlocuteur: `${p.Prenom} ${p.Nom}`,
        Sujet: 'Exemple portfolio -- pas un vrai CR',
        Statut: 'Formaté',
        'CR formaté': `**Exemple portfolio.** Ce record démontre le lien Prospect <-> SC_CRs_de_RDV pour ${p.Prenom} ${p.Nom}.`,
      }),
      scProspectsRecords
    );
  } else {
    log('!', 'Table SC_CRs_de_RDV introuvable (pas encore créée via le RUNBOOK cr-rdv-formate), skip.');
    log('!', 'Voir az-no-code/defis/cr-rdv-formate/RUNBOOK.md §II pour la créer manuellement.');
  }

  console.log('────────────────────────────────────────────────────────────────');
  log('✓', 'Harmonisation terminée.');
  console.log('');
  console.log('  NOTE IMPORTANTE :');
  console.log('  - AZ_Inscrits a une automation "recordCreated -> sendEmail" : les 4 emails');
  console.log('    exemples utilisent le TLD .example (RFC 2606, jamais routable) pour éviter');
  console.log('    tout envoi réel. Vérifie que l\'automation ne remonte pas d\'erreur bloquante.');
  console.log('  - SC_CRs_de_RDV : Statut mis à \'Formaté\' directement (pas \'À formater\') pour');
  console.log('    ne PAS déclencher le webhook n8n SB_WF10 (coût OpenRouter évité).');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
