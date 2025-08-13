// src/App.jsx
import React, { useMemo, useState, useEffect } from "react";

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

/** Convertit "" | "yyyy-mm-dd" | "dd-mm-yyyy" -> "yyyy-mm-dd" ou "" */
function toISO(d) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; // input type="date"
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {         // saisie manuelle jj-mm-aaaa
    const [dd, mm, yyyy] = d.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

/** Calcule un âge exact en années / mois / jours (toujours avec "days") */
function computeAge(dobRaw, testRaw) {
  const dobISO = toISO(dobRaw);
  const testISO = toISO(testRaw);

  const base = { valid: false, years: 0, months: 0, days: 0 };
  if (!dobISO || !testISO) return base;

  const birth = new Date(dobISO + "T00:00:00");
  const test  = new Date(testISO + "T00:00:00");
  if (Number.isNaN(birth.getTime()) || Number.isNaN(test.getTime()) || test < birth) {
    return base;
  }

  let years  = test.getFullYear() - birth.getFullYear();
  let months = test.getMonth() - birth.getMonth();
  let days   = test.getDate()  - birth.getDate();

  if (days < 0) {
    // emprunte le nombre de jours du mois précédent la date de test (gère bissextiles)
    const daysInPrevMonth = new Date(test.getFullYear(), test.getMonth(), 0).getDate();
    days += daysInPrevMonth;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { valid: true, years, months, days };
}

export default function App() {
  const [dossier, setDossier] = useState({ code: "", dob: "", testDate: "" });
  const [notes, setNotes] = useState({}); // ex : { SIM: "12", ... }

  // âge auto (recalcule uniquement quand les dates changent)
  const age = useMemo(
    () => computeAge(dossier.dob, dossier.testDate),
    [dossier.dob, dossier.testDate]
  );

  // sommes par indice
  const sommeParIndice = useMemo(() => {
    const sums = { ICV: 0, IVS: 0, IRF: 0, IMT: 0, IVT: 0 };
    for (const st of SUBTESTS) {
      const v = parseInt(notes[st.key], 10);
      sums[st.index] += Number.isFinite(v) ? v : 0;
    }
    return sums;
  }, [notes]);

  // QIT provisoire (simple somme – placeholder)
  const qitProvisoire = useMemo(() => {
    return SUBTESTS.reduce((acc, st) => {
      const v = parseInt(notes[st.key], 10);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [notes]);

  // set note
  function setNote(key, value) {
    setNotes((n) => ({ ...n, [key]: value }));
  }

  // Sauvegarde locale
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
              onChange={(e) =>
                setDossier((d) => ({ ...d, code: e.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Date de naissance</span>
            <input
              type="date"
              className="border rounded px-2 py-1 bg-transparent"
              value={dossier.dob}
              onChange={(e) =>
                setDossier((d) => ({ ...d, dob: e.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Date de passation</span>
            <input
              type="date"
              className="border rounded px-2 py-1 bg-transparent"
              value={dossier.testDate}
              onChange={(e) =>
                setDossier((d) => ({ ...d, testDate: e.target.value }))
              }
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
        <h2 className="text-xl font-semibold mb-3">
          Saisie — Notes standard (1–19)
        </h2>
        <div className="grid grid-cols-[1fr_80px_160px] gap-x-4 gap-y-2 items-center">
          <div className="text-sm font-medium opacity-70">Subtest</div>
          <div className="text-sm font-medium opacity-70">Indice</div>
          <div className="text-sm font-medium opacity-70">Note standard</div>

          {SUBTESTS.map((st) => (
            <div className="contents" key={st.key}>
              <div>{st.label}</div>
              <div className="opacity-80">{st.index}</div>
              <select
                className="border rounded px-2 py-1 bg-white text-black dark:bg-slate-900 dark:text-white"
                value={notes[st.key] ?? ""}
                onChange={(e) => setNote(st.key, e.target.value)}
              >
                <option value="">—</option>
                {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm">
          Sommes par indice —&nbsp;
          ICV: <b>{sommeParIndice.ICV}</b>&nbsp;
          IVS: <b>{sommeParIndice.IVS}</b>&nbsp;
          IRF: <b>{sommeParIndice.IRF}</b>&nbsp;
          IMT: <b>{sommeParIndice.IMT}</b>&nbsp;
          IVT: <b>{sommeParIndice.IVT}</b>
        </div>
      </section>

      {/* Résumé */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-3">Résumé</h2>
        <p className="leading-7">
          QIT provisoire : <b>{qitProvisoire}</b>
          <span className="opacity-70"> — (ce n’est pas la conversion officielle)</span>
        </p>
        <p className="text-sm opacity-70">
          Remarque : la conversion <i>officielle</i> (Annexes A/B) sera ajoutée plus tard.
        </p>
      </section>
    </div>
  );
}
