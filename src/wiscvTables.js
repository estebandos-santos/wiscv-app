// src/wiscvTables.js

/**
 * On charge automatiquement tous les JSON présents dans src/tables/*.json
 * grâce à Vite (import.meta.glob). Chaque JSON doit suivre le schéma:
 * {
 *   id, label, minMonths, maxMonths,
 *   ICV, IVS, IRF, IMT, IVT, QIT,
 *   IC90 (optionnel) : { ICV: { [composite]: {lo,hi} }, ..., QIT: {...} }
 * }
 */

const modules = import.meta.glob("./tables/*.json", { eager: true });

const _BANDS = [];
const _TABLES = {};
const _IC90 = {};

for (const [path, mod] of Object.entries(modules)) {
  const band = mod.default ?? mod; // selon la config JSON
  if (!band?.id) {
    console.warn("Table ignorée (pas d'id) :", path);
    continue;
  }
  _BANDS.push({
    id: band.id,
    label: band.label || band.id,
    minMonths: Number(band.minMonths ?? 0),
    maxMonths: Number(band.maxMonths ?? 0)
  });

  _TABLES[band.id] = {
    ICV: band.ICV || {},
    IVS: band.IVS || {},
    IRF: band.IRF || {},
    IMT: band.IMT || {},
    IVT: band.IVT || {},
    QIT: band.QIT || {}
  };

  _IC90[band.id] = band.IC90 || {};
}

// Exports utilisés par conversion.js
export const AGE_BANDS = _BANDS.sort((a, b) => a.minMonths - b.minMonths);
export const WISCV_TABLES = _TABLES;
export const IC90_WIDTHS = _IC90;
