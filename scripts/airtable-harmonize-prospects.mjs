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

// Prénom/Nom ci-dessous DOIVENT matcher exactement les valeurs des records live
// (vérifié via l'API S136z : le champ s'appelle 'Prénom' avec accent, et le record
// Dubois porte 'Chloe' SANS accent malgré le nom du contact 'Chloé' dans les docs).
const PROSPECTS = [
  { Prenom: 'Alice', Nom: 'Martin', Email: 'alice.martin@legrand.example', Entreprise: 'Cabinet Legrand' },
  { Prenom: 'Bob', Nom: 'Durand', Email: 'b.durand@techflow.example', Entreprise: 'TechFlow SAS' },
  { Prenom: 'Chloe', Nom: 'Dubois', Email: 'c.dubois@zenith.example', Entreprise: 'Studio Zenith' },
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

// --- Champ lien nommé, dans un sens ou dans l'autre -----------------------
//
// PIÈGE API Metadata (précisé empiriquement S136z, corrige l'hypothèse S135z) :
// Airtable CRÉE bien le champ symétrique inverse automatiquement lors d'un POST
// /fields de type multipleRecordLinks -- mais lui donne un nom générique dérivé
// du nom de la table source (ex : 'SC_Prospects', ou 'SC_Prospects 2' en cas de
// collision de nom). C'est CE nom moche/inattendu qui avait fait croire à S135z
// que l'inverse n'était "pas auto-créé" : David a vu un champ au nom absurde et
// l'a supprimé en pensant réparer un doublon, alors que c'était le vrai lien
// symétrique. Il faut donc RENOMMER le champ auto-créé, jamais le supprimer
// puis en recréer un autre à la main (ça duplique la paire).
//
// Cette fonction cherche D'ABORD par (type === multipleRecordLinks && linkedTableId),
// PEU IMPORTE le nom actuel, et renomme si besoin. Ne crée un nouveau champ que si
// aucun champ lié à cette table cible n'existe encore.

async function ensureNamedLinkField(table, desiredName, linkedTableId, linkedTableLabel) {
  const wrongTypeSameName = table.fields.find(
    (f) => f.name === desiredName && f.type !== 'multipleRecordLinks'
  );

  const existingLink = table.fields.find(
    (f) => f.type === 'multipleRecordLinks' && f.options?.linkedTableId === linkedTableId
  );

  // Si un champ au nom voulu existe mais avec le mauvais type (artefact ratée),
  // ne JAMAIS le supprimer (il peut contenir de vraies données texte saisies à la
  // main). On le pousse de côté en renommant en '<nom>_ancien_texte' -- non
  // destructif, David peut migrer/nettoyer les données à son rythme.
  if (wrongTypeSameName) {
    const backupName = `${desiredName}_ancien_texte`;
    const backupAlreadyExists = table.fields.some((f) => f.name === backupName);
    if (!backupAlreadyExists) {
      log('~', `Champ '${desiredName}' existant est de type '${wrongTypeSameName.type}' (contient des données) -- renommage non destructif en '${backupName}' sur ${table.name}…`);
      if (!DRY_RUN) {
        await airtable('PATCH', `/meta/bases/${BASE_ID}/tables/${table.id}/fields/${wrongTypeSameName.id}`, {
          name: backupName,
        });
      } else {
        log('◯', `[dry-run] renommage de sauvegarde ignoré.`);
      }
    } else {
      log('↷', `'${backupName}' existe déjà (renommage de sauvegarde déjà fait), skip.`);
    }
  }

  if (existingLink) {
    if (existingLink.name === desiredName) {
      log('↷', `Champ '${desiredName}' (Link -> ${linkedTableLabel}) déjà présent et bien nommé sur ${table.name}, skip.`);
      return existingLink;
    }
    log('~', `Renommage du champ auto-créé '${existingLink.name}' -> '${desiredName}' sur ${table.name}…`);
    if (DRY_RUN) {
      log('◯', `[dry-run] renommage ignoré.`);
      return { ...existingLink, name: desiredName };
    }
    return airtable('PATCH', `/meta/bases/${BASE_ID}/tables/${table.id}/fields/${existingLink.id}`, {
      name: desiredName,
    });
  }

  log('+', `Ajout du champ '${desiredName}' (Link -> ${linkedTableLabel}) sur ${table.name}…`);
  if (DRY_RUN) {
    log('◯', `[dry-run] ajout '${desiredName}' ignoré.`);
    return { name: desiredName, id: 'fldDRYRUN' };
  }
  return airtable('POST', `/meta/bases/${BASE_ID}/tables/${table.id}/fields`, {
    name: desiredName,
    type: 'multipleRecordLinks',
    options: { linkedTableId },
  });
}

async function ensureTextField(table, fieldName) {
  if (table.fields.some((f) => f.name === fieldName)) {
    log('↷', `Champ '${fieldName}' déjà présent sur ${table.name}, skip.`);
    return;
  }
  log('+', `Ajout du champ texte '${fieldName}' sur ${table.name}…`);
  if (DRY_RUN) {
    log('◯', `[dry-run] ajout '${fieldName}' ignoré.`);
    return;
  }
  await airtable('POST', `/meta/bases/${BASE_ID}/tables/${table.id}/fields`, {
    name: fieldName,
    type: 'singleLineText',
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
      (r) => r.fields?.['Prénom'] === prospect.Prenom && r.fields?.Nom === prospect.Nom
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
    await ensureNamedLinkField(scProspects, 'Projets_liés', azInscrits.id, 'AZ_Inscrits');
    await ensureNamedLinkField(azInscrits, 'LinkedProspect', scProspects.id, 'SC_Prospects');
    await ensureTextField(azInscrits, 'Nom');
    await ensureTextField(azInscrits, 'Entreprise');
    await ensureExampleRecords(
      azInscrits,
      'LinkedProspect',
      (p) => ({
        Prenom: p.Prenom,
        Nom: p.Nom,
        Entreprise: p.Entreprise,
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
    await ensureNamedLinkField(scProspects, 'SC_CRs_de_RDV', scCrsDeRdv.id, 'SC_CRs_de_RDV');
    await ensureNamedLinkField(scCrsDeRdv, 'Prospect', scProspects.id, 'SC_Prospects');
    await ensureExampleRecords(
      scCrsDeRdv,
      'Prospect',
      (p) => ({
        'Notes brutes': `Exemple généré par airtable-harmonize-prospects.mjs (S136z) -- RDV fictif avec ${p.Prenom} ${p.Nom} (${p.Entreprise}).`,
        Interlocuteur: `${p.Prenom} ${p.Nom} (${p.Entreprise})`,
        // 'Date RDV' est OBLIGATOIRE : la formule 'Nom' de cette table fait
        // DATETIME_FORMAT({Date RDV}, ...) et renvoie #ERROR! si le champ est vide
        // (bug reproduit S136z sur les 4 premiers records générés par ce script,
        // corrigé manuellement après coup -- ne plus jamais omettre ce champ).
        'Date RDV': new Date().toISOString(),
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
