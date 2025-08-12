import { create } from 'zustand'

// mapping subtests -> indice principal
export const SUBTESTS = [
  { key: 'SIM', label: 'Similitudes', index: 'ICV' },
  { key: 'VOC', label: 'Vocabulaire', index: 'ICV' },

  { key: 'CUB', label: 'Cubes', index: 'IVS' },
  { key: 'PUZ', label: 'Puzzles visuels', index: 'IVS' },

  { key: 'MAT', label: 'Matrices', index: 'IRF' },
  { key: 'BAL', label: 'Balances', index: 'IRF' },

  { key: 'MCH', label: 'Mémoire des chiffres', index: 'IMT' },
  { key: 'MIM', label: 'Mémoire des images', index: 'IMT' },

  { key: 'COD', label: 'Code', index: 'IVT' },
  { key: 'SYM', label: 'Symboles', index: 'IVT' },
]

// indices principaux (WISC‑V)
const INDICES = ['ICV', 'IVS', 'IRF', 'IMT', 'IVT']

function calcAge(dobStr, testStr) {
  if (!dobStr || !testStr) return { years: 0, months: 0 }
  const dob = new Date(dobStr)
  const test = new Date(testStr)
  if (isNaN(dob) || isNaN(test) || test < dob) return { years: 0, months: 0 }
  let y = test.getFullYear() - dob.getFullYear()
  let m = test.getMonth() - dob.getMonth()
  let d = test.getDate() - dob.getDate()
  if (d < 0) m -= 1
  if (m < 0) { y -= 1; m += 12 }
  return { years: y, months: m }
}

function computeSums(notesStd) {
  // notesStd: { SIM: number|undefined, VOC: number|..., etc. } 1–19
  const sums = { ICV: 0, IVS: 0, IRF: 0, IMT: 0, IVT: 0 }
  const counts = { ICV: 0, IVS: 0, IRF: 0, IMT: 0, IVT: 0 }
  for (const s of SUBTESTS) {
    const v = notesStd[s.key]
    if (typeof v === 'number' && v >= 1 && v <= 19) {
      sums[s.index] += v
      counts[s.index] += 1
    }
  }
  return { sums, counts }
}

// “QIT provisoire” = simple somme des 10 notes standard (ce n’est PAS l’officiel)
function computeQitProv(notesStd) {
  let total = 0
  let n = 0
  for (const s of SUBTESTS) {
    const v = notesStd[s.key]
    if (typeof v === 'number' && v >= 1 && v <= 19) { total += v; n++ }
  }
  return { total, n }
}

export const useAppStore = create((set, get) => ({
  dossier: { code: '', dob: '', testDate: '', age: { years: 0, months: 0 } },
  notes: {}, // { SIM: 10, VOC: 12, ... } notes standard 1-19

  setDossier: (patch) => set(state => {
    const next = { ...state.dossier, ...patch }
    if ('dob' in patch || 'testDate' in patch) {
      next.age = calcAge(next.dob, next.testDate)
    }
    return { dossier: next }
  }),

  setNote: (key, val) => set(state => {
    // coercition & validation rapide
    let v = val === '' ? undefined : Number(val)
    if (typeof v === 'number') {
      if (Number.isNaN(v)) v = undefined
      if (v < 1 || v > 19) v = undefined
    }
    return { notes: { ...state.notes, [key]: v } }
  }),

  // sélecteurs calculés
  getSums: () => {
    const { sums, counts } = computeSums(get().notes)
    return { sums, counts }
  },
  getQitProv: () => computeQitProv(get().notes),
  SUBTESTS,
  INDICES
}))
