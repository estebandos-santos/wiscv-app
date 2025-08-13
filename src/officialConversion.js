// src/officialConversion.js
// Conversion "officielle" depuis les tables de l’Annexe A
// On s'appuie sur les objets de /src/tables/*.js que tu as déjà créés.

import { icvTable } from "./tables/icvTable";
import { ivsTable } from "./tables/ivsTable";
import { irfTable } from "./tables/irfTable";
import { imtTable } from "./tables/imtTable";
import { ivtTable } from "./tables/ivtTable";
import { qitTable } from "./tables/qitTable";

// Petit utilitaire pour parser "113–129" en { lo:"113", hi:"129" }
function parseRange(s) {
  if (!s || typeof s !== "string") return { lo: null, hi: null };
  const parts = s.split(/[-–—]/).map(t => t.trim());
  return { lo: parts[0] ?? null, hi: parts[1] ?? null };
}

// Normalise une ligne de table index -> { comp, pct, ic90:{lo,hi} }
function normIndexRow(row) {
  if (!row) return null;
  // selon tes fichiers, la clé peut s’appeler comp | Composite | composite
  const comp = row.comp ?? row.Composite ?? row.composite ?? null;
  const pct  = row.pct ?? row.percentile ?? row.rang ?? null;
  const ic90 = parseRange(row.IC90 ?? row.ic90 ?? null);
  return { comp, pct, ic90 };
}

// Normalise une ligne de table QIT -> { qit, pct, ic90:{lo,hi} }
function normQitRow(row) {
  if (!row) return null;
  const qit  = row.QIT ?? row.qit ?? null;
  const pct  = row.pct ?? row.percentile ?? row.rang ?? null;
  const ic90 = parseRange(row.IC90 ?? row.ic90 ?? null);
  return { qit, pct, ic90 };
}

/**
 * Calcule toutes les conversions officielles :
 * - composites ICV/IVS/IRF/IMT/IVT via leurs tables
 * - QIT via la table A.7
 * @param {object} age         {years, months, valid} (pas utilisé ici mais gardé pour plus tard)
 * @param {object} sumsByIndex {ICV:number, IVS:number, ...}
 * @param {number} totalSum    somme des 10 notes (utile pour affichage)
 */
export function computeOfficialFromTables(age, sumsByIndex, totalSum) {
  const lookups = {
    ICV: normIndexRow(icvTable[sumsByIndex.ICV]),
    IVS: normIndexRow(ivsTable[sumsByIndex.IVS]),
    IRF: normIndexRow(irfTable[sumsByIndex.IRF]),
    IMT: normIndexRow(imtTable[sumsByIndex.IMT]),
    IVT: normIndexRow(ivtTable[sumsByIndex.IVT]),
  };

  const composites = {};
  const percentiles = {};
  const ic90 = {};

  for (const idx of Object.keys(lookups)) {
    const row = lookups[idx];
    if (row) {
      composites[idx] = row.comp ?? null;
      percentiles[idx] = row.pct ?? null;
      ic90[idx] = row.ic90 ?? { lo: null, hi: null };
    } else {
      composites[idx] = null;
      percentiles[idx] = null;
      ic90[idx] = { lo: null, hi: null };
    }
  }

  // QIT : table A.7 -> somme totale des 10 notes
  const qitRow = normQitRow(qitTable[totalSum] ?? null);
  const qit = qitRow?.qit ?? null;
  const qitPct = qitRow?.pct ?? null;
  const qitIC90 = qitRow?.ic90 ?? { lo: null, hi: null };

  return {
    composites,            // {ICV, IVS, IRF, IMT, IVT} ou null si hors table
    qit,                   // nombre ou null
    meta: {
      percentiles,         // {ICV:"92", ...}
      ic90,                // {ICV:{lo,hi}, ...}
      qitPct,              // ex "63"
      qitIC90,             // {lo,hi}
      totalSum             // juste pour info/affichage
    }
  };
}
