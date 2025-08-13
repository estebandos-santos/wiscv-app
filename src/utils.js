// src/utils.js

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
export function computeAge(dobRaw, testRaw) {
  const dobISO = toISO(dobRaw);
  const testISO = toISO(testRaw);

  // Valeur de base sûre
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
    // emprunter au mois précédent la date de test (gère bissextiles)
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

/** (facultatif) hétérogénéité basique pour les graphes */
export function heterogeneityFlag(notes) {
  const vals = Object.values(notes).map(Number).filter(Number.isFinite);
  if (vals.length < 2) return { heterogeneous: false, range: 0 };
  const range = Math.max(...vals) - Math.min(...vals);
  return { heterogeneous: range >= 7, range };
}
