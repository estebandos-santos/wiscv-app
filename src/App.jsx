// src/App.jsx
import React, { useMemo, useState, useEffect } from "react";
import { qitTable } from "./tables/qitTable"; // QIT officiel (Table A.7)

// ----- Déclarations WISC-V
const SUBTESTS = [
  { key: "SIM", label: "Similitudes", index: "ICV" },
  { key: "VOC", label: "Vocabulaire", index: "ICV" },
  { key: "CUB", label: "Cubes", index: "IVS" },
  { key: "PUZ", label: "Puzzles visuels", index: "IVS" },
  { key: "MAT", label: "Matrices", index: "IRF" },
  { key: "BAL", label: "Balances", index: "IRF" },
  { key: "MCH", label: "Mémoire des chiffres", index: "IMT" },
  { key: "MIM", label: "Mémoire des images", index: "IMT" },
  { key: "COD", label: "Code", index: "IVT" },
  { key: "SYM", label: "Symboles", index: "IVT" },
];
const INDICES = ["ICV", "IVS", "IRF", "IMT", "IVT"];

// ----- Utilitaires âge
function toISO(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;             // yyyy-mm-dd
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {                     // jj-mm-aaaa
    const [dd, mm, yyyy] = d.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}
function computeAge(dobRaw, testRaw) {
  const dobISO = toISO(dobRaw);
  const testISO = toISO(testRaw);
  const base = { valid: false, years: 0, months: 0, days: 0 };
  if (!dobISO || !testISO) return base;

  const birth = new Date(dobISO + "T00:00:00");
  const test  = new Date(testISO + "T00:00:00");
  if (Number.isNaN(birth.getTime()) || Number.isNaN(test.getTime()) || test < birth) return base;

  let years  = test.getFullYear() - birth.getFullYear();
  let months = test.getMonth() - birth.getMonth();
  let days   = test.getDate()  - birth.getDate();

  if (days < 0) {
    const daysInPrevMonth = new Date(test.getFullYear(), test.getMonth(), 0).getDate();
    days += daysInPrevMonth;
    months -= 1;
  }
  if (months < 0) { months += 12; years -= 1; }

  return { valid: true, years, months, days };
}

export default function App() {
  // ----- Dossier
  const [dossier, setDossier] = useState({ code: "", dob: "", testDate: "" });
  const age = useMemo(
    () => computeAge(dossier.dob, dossier.testDate),
    [dossier.dob, dossier.testDate]
  );

  // ----- Notes
  const [notes, setNotes] = useState({}); // ex: { SIM: "12", ... }
  const setNote = (key, value) => setNotes(n => ({ ...n, [key]: value }));

  // Progression de saisie
  const filledCount = useMemo(() => {
    return SUBTESTS.reduce((acc, st) => {
      const v = Number(notes[st.key]);
      return acc + (Number.isFinite(v) && v >= 1 && v <= 19 ? 1 : 0);
    }, 0);
  }, [notes]);
  const progressPct = Math.round((filledCount / SUBTESTS.length) * 100);

  // Sommes par indice + compte d’items
  const { sumsByIndex, countsByIndex } = useMemo(() => {
    const sums = { ICV: 0, IVS: 0, IRF: 0, IMT: 0, IVT: 0 };
    const counts = { ICV: 0, IVS: 0, IRF: 0, IMT: 0, IVT: 0 };
    for (const st of SUBTESTS) {
      const v = Number(notes[st.key]);
      if (Number.isFinite(v) && v >= 1 && v <= 19) {
        sums[st.index] += v;
        counts[st.index] += 1;
      }
    }
    return { sumsByIndex: sums, countsByIndex: counts };
  }, [notes]);

  // Composites provisoires (fallback visuel tant que les tables indices ne sont pas branchées)
  const compositesProv = useMemo(() => {
    const obj = {};
    for (const idx of INDICES) {
      const c = countsByIndex[idx] || 0;
      obj[idx] = c ? Math.round((sumsByIndex[idx] / c) * 10) : null;
    }
    return obj;
  }, [sumsByIndex, countsByIndex]);

  // Somme TOTALE des 10 notes (clé pour QIT Table A.7)
  const totalSumNotes = useMemo(() => {
    return Object.values(notes).reduce((acc, v) => {
      const n = Number(v);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [notes]);

  // QIT officiel via Table A.7
  const qitRow = qitTable[totalSumNotes] ?? null;
  const qitOfficial = qitRow?.QIT ?? null;
  const qitPct = qitRow?.pct ?? null;
  const [qitIC90Lo, qitIC90Hi] = (qitRow?.IC90 ?? "").split("–");

  // QIT provisoire = somme simple (repère visuel)
  const qitProvisoire = totalSumNotes;

  // Hétérogénéité simple
  const hetero = useMemo(() => {
    const vals = SUBTESTS.map(st => Number(notes[st.key])).filter(Number.isFinite);
    if (vals.length < 2) return { flag: false, range: 0 };
    const min = Math.min(...vals), max = Math.max(...vals);
    return { flag: (max - min) >= 7, range: max - min };
  }, [notes]);

  // ----- Sauvegarde locale
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wiscv-mvp") || "{}");
      if (saved.dossier) setDossier(saved.dossier);
      if (saved.notes) setNotes(saved.notes);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("wiscv-mvp", JSON.stringify({ dossier, notes }));
  }, [dossier, notes]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Psy Appli — WISC-V (MVP)
      </h1>

      {/* Dossier */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-3">Dossier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Code sujet</span>
            <input
              className="border rounded px-2 py-1 bg-transparent"
              placeholder="EX: ABC123"
              value={dossier.code}
              onChange={(e) => setDossier(d => ({ ...d, code: e.target.value }))}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Date de naissance</span>
            <input
              type="date"
              className="border rounded px-2 py-1 bg-transparent"
              value={dossier.dob}
              onChange={(e) => setDossier(d => ({ ...d, dob: e.target.value }))}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Date de passation</span>
            <input
              type="date"
              className="border rounded px-2 py-1 bg-transparent"
              value={dossier.testDate}
              onChange={(e) => setDossier(d => ({ ...d, testDate: e.target.value }))}
            />
          </label>

          <div className="md:col-span-3 text-sm opacity-80">
            Âge (auto) :{" "}
            <b>
              {age?.valid
                ? `${age?.years ?? 0} ans ${age?.months ?? 0} mois ${age?.days ?? 0} jours`
                : "—"}
            </b>
          </div>
        </div>
      </section>

      {/* Saisie */}
      <section className="border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Saisie — Notes standard (1–19)</h2>
        <span
          className={`text-xs px-2 py-1 rounded border ${
            hetero.flag
              ? "bg-amber-500/20 border-amber-500 text-amber-200"
              : "bg-emerald-500/20 border-emerald-500 text-emerald-200"
          }`}
        >
          {hetero.flag ? "Profil hétérogène" : "Profil plutôt homogène"} (étendue {hetero.range})
        </span>
        </div>

        {/* Progression */}
        <div className="mb-4">
          <div className="text-xs opacity-70 mb-1">
            Saisie complétée : {filledCount}/{SUBTESTS.length} subtests
          </div>
          <div className="h-2 w-full rounded bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
              title={`${progressPct}%`}
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_80px_160px] gap-x-4 gap-y-2 items-center">
          <div className="text-sm font-medium opacity-70">Subtest</div>
          <div className="text-sm font-medium opacity-70">Indice</div>
          <div className="text-sm font-medium opacity-70">Note standard</div>

          {SUBTESTS.map((st) => {
            const val = notes[st.key] ?? "";
            const empty = val === "";
            return (
              <div className="contents" key={st.key}>
                <div>{st.label}</div>
                <div className="opacity-80">{st.index}</div>
                <select
                  className={`border rounded px-2 py-1 bg-white text-black dark:bg-slate-900 dark:text-white ${empty ? "border-amber-400" : ""}`}
                  value={val}
                  onChange={(e) => setNote(st.key, e.target.value)}
                >
                  <option value="">—</option>
                  {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-sm">
          Sommes par indice —{" "}
          ICV: <b>{sumsByIndex.ICV}</b>{" "}
          IVS: <b>{sumsByIndex.IVS}</b>{" "}
          IRF: <b>{sumsByIndex.IRF}</b>{" "}
          IMT: <b>{sumsByIndex.IMT}</b>{" "}
          IVT: <b>{sumsByIndex.IVT}</b>
        </div>
      </section>

      {/* Résumé */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-3">Résumé</h2>

        <p className="leading-7">
          QIT provisoire (somme simple des notes) : <b>{qitProvisoire}</b>
          <span className="opacity-70"> — (repère visuel)</span>
        </p>

        <p className="text-sm opacity-80 mb-2">
          Somme totale des 10 notes standard : <b>{totalSumNotes}</b>
        </p>

        <p className="leading-7 mb-2">
          QIT (officiel table) :{" "}
          <b>{qitOfficial ?? "—"}</b>
          <span className="opacity-70">
            {qitOfficial != null
              ? ` — Percentile ≈ ${qitPct ?? "—"} • IC90 ~ ${(qitIC90Lo ?? "—")}–${(qitIC90Hi ?? "—")}`
              : " — en dehors de la table A.7 ou somme incomplète"}
          </span>
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {INDICES.map((idx) => {
            const comp = null;               // on branchera les tables indices ensuite
            const prov = compositesProv[idx] ?? "—";
            return (
              <div key={idx} className="rounded-lg border p-3">
                <div className="text-sm opacity-70">{idx}</div>

                <div className="mt-1">
                  <div className="text-xs opacity-70">Somme</div>
                  <div className="text-lg font-semibold">{sumsByIndex[idx] || 0}</div>
                </div>

                <div className="mt-2">
                  <div className="text-xs opacity-70">Composite</div>
                  <div className="text-lg font-semibold">
                    {comp ?? prov}
                  </div>
                  <div className="text-[11px] opacity-70 mt-1">
                    {comp != null
                      ? "Table officielle (à venir)"
                      : "= moyenne des notes × 10 (fallback provisoire)"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
