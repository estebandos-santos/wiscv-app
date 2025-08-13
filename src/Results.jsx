// src/Results.jsx
import { useMemo } from "react"
import { qitTable } from "./tables/qitTable" // <-- la table A.7

// Les 7 subtests qui composent le QIT (WISC‑V FR)
const QIT_CORE = ["SIM", "VOC", "CUB", "MAT", "BAL", "MCH", "COD"]

export default function Results({ notes, sumsByIndex, qitProvisoire }) {
  // Somme de toutes les notes (10 subtests), juste pour affichage
  const totalSum10 = useMemo(() => {
    return Object.values(notes)
      .map((v) => Number(v))
      .filter(Number.isFinite)
      .reduce((a, b) => a + b, 0)
  }, [notes])

  // Somme des 7 subtests du QIT (clé de conversion A.7)
  const sumQit7 = useMemo(() => {
    return QIT_CORE.reduce((acc, key) => {
      const n = Number(notes[key])
      return acc + (Number.isFinite(n) ? n : 0)
    }, 0)
  }, [notes])

  // Récup QIT officiel si la somme QIT7 existe dans la table
  const qitRow = useMemo(() => qitTable[sumQit7] ?? null, [sumQit7])

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Résumé</h2>
      </header>

      {/* Bandeau QIT */}
      <div className="rounded-lg border border-white/10 p-4 space-y-2">
        <div className="text-lg">
          QIT provisoire (somme simple des notes) :{" "}
          <b>{qitProvisoire || 0}</b>{" "}
          <span className="opacity-60">— (conversion officielle à venir)</span>
        </div>

        <div className="opacity-80">
          Somme totale des 10 notes standard : <b>{totalSum10}</b>
        </div>

        <div className="opacity-80">
          Somme QIT (7 subtests) : <b>{sumQit7}</b>{" "}
          <span className="opacity-60">(SIM, VOC, CUB, MAT, BAL, MCH, COD)</span>
        </div>

        <div className="text-lg">
          QIT (officiel si dispo) :{" "}
          {qitRow ? (
            <>
              <b>{qitRow.QIT}</b>{" "}
              <span className="opacity-75 text-sm">
                • Percentile ≈ {qitRow.pct} • IC90 {qitRow.IC90} • IC95 {qitRow.IC95}
              </span>
            </>
          ) : (
            <span className="opacity-60">
              — — en attente des tables (aucune correspondance pour la somme QIT = {sumQit7})
            </span>
          )}
        </div>
      </div>

      {/* Détail par indice (ce que tu avais déjà) */}
      <div className="grid md:grid-cols-5 gap-4">
        {["ICV", "IVS", "IRF", "IMT", "IVT"].map((k) => (
          <div key={k} className="rounded-lg border border-white/10 p-4">
            <div className="text-sm opacity-70">{k}</div>
            <div className="mt-2 text-3xl font-semibold">{sumsByIndex[k] || 0}</div>
            <div className="text-sm opacity-60 mt-2">
              Composite = conversion officielle (annexe A) <br />
              {k === "ICV" && "ICV"}
              {k === "IVS" && "IVS"}
              {k === "IRF" && "IRF"}
              {k === "IMT" && "IMT"}
              {k === "IVT" && "IVT"}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
