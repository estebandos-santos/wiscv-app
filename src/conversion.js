// src/conversion.js
import { AGE_BANDS, WISCV_TABLES, IC90_WIDTHS } from "./wiscvTables";

/** Convertit "" | "yyyy-mm-dd" | "dd-mm-yyyy" -> "yyyy-mm-dd" ou "" */
function toISO(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

/** âge en mois (entier) ou null */
function ageInMonths(age) {
  // age peut être {valid, years, months, days} OU (dob,testDate) string ISO
  if (age && typeof age === "object" && "years" in age && "months" in age) {
    if (!age.valid) return null;
    return age.years * 12 + age.months;
  }
  return null;
}

/** Retourne la liste des bandIds qui couvrent l'âge (en mois) */
function bandIdsForAge(months) {
  if (months == null) {
    // pas d'âge => on prend toutes les bandes “all ages”
    return AGE_BANDS
      .filter(b => b.minMonths <= 0 && b.maxMonths >= 240)
      .map(b => b.id);
  }
  return AGE_BANDS
    .filter(b => months >= b.minMonths && months <= b.maxMonths)
    .map(b => b.id);
}

/** Fusionne les tables de plusieurs bandes (ordre: AGE_BANDS) */
function mergeTables(bandIds) {
  const merged = { ICV: {}, IVS: {}, IRF: {}, IMT: {}, IVT: {}, QIT: {} };
  const mergedIC90 = { ICV: {}, IVS: {}, IRF: {}, IMT: {}, IVT: {}, QIT: {} };

  // préserver l'ordre d'AGE_BANDS pour une fusion déterministe
  const order = AGE_BANDS.map(b => b.id).filter(id => bandIds.includes(id));

  for (const id of order) {
    const t = WISCV_TABLES[id] || {};
    for (const k of ["ICV", "IVS", "IRF", "IMT", "IVT", "QIT"]) {
      Object.assign(merged[k], t[k] || {});
    }
    const ic = IC90_WIDTHS[id] || {};
    for (const k of ["ICV", "IVS", "IRF", "IMT", "IVT", "QIT"]) {
      Object.assign(mergedIC90[k], ic[k] || {});
    }
  }

  return { tables: merged, ic90: mergedIC90 };
}

/** Lit un composite dans la table fusionnée */
function compositeFromSum(indexKey, sum, tables) {
  if (sum == null) return null;
  const map = tables[indexKey] || {};
  const key = String(sum);
  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  return null;
}

/** Petit fallback IC90 si non fourni (±8) */
function ic90Fallback(comp) {
  if (comp == null) return null;
  const lo = Math.max(40, comp - 8);
  const hi = Math.min(160, comp + 8);
  return { lo, hi };
}

/**
 * API principale — utilisée par App.jsx
 * @param {object} ageObj  {valid, years, months, days}
 * @param {object} sumsByIndex ex {ICV: 28, IVS: 17, ...}
 * @param {number} totalSumNotes somme des 10 notes
 */
export function convertAll(ageObj, sumsByIndex, totalSumNotes) {
  const months = ageInMonths(ageObj);

  // 1) bandes éligibles + fusion
  const bandIds = bandIdsForAge(months);
  const { tables, ic90 } = mergeTables(bandIds);

  // 2) composites d'indices
  const out = { composites: {}, meta: { percentiles: {}, ic90: {}, qitPct: null, qitIC90: null } };
  for (const idx of ["ICV", "IVS", "IRF", "IMT", "IVT"]) {
    const sum = sumsByIndex?.[idx] ?? null;
    const comp = compositeFromSum(idx, sum, tables);
    out.composites[idx] = comp ?? null;

    // IC90 (table si dispo, sinon fallback)
    const ic90FromTable = comp != null ? ic90?.[idx]?.[String(comp)] ?? null : null;
    out.meta.ic90[idx] = ic90FromTable ?? ic90Fallback(comp);

    // percentiles : non encodés ici -> laisse null (on pourra ajouter si on les saisit)
    out.meta.percentiles[idx] = null;
  }

  // 3) QIT (somme totale -> QIT)
  const qit = compositeFromSum("QIT", totalSumNotes, tables);
  out.qit = qit ?? null;

  // IC90 du QIT
  const qitIC90FromTable = qit != null ? ic90?.QIT?.[String(qit)] ?? null : null;
  out.meta.qitIC90 = qitIC90FromTable ?? ic90Fallback(qit);

  // percentile du QIT : non encodé ici -> null (ajout possible plus tard)
  out.meta.qitPct = null;

  return out;
}
