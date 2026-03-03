export const YEAR_ORDER = ["L1", "L2", "L3", "M1", "M2"] as const;

export function normalizeNiveau(niveau: unknown) {
  return String(niveau ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function niveauOrderIndex(niveau: string) {
  const idx = YEAR_ORDER.indexOf(niveau as any);
  return idx === -1 ? 999 : idx;
}

export function sortNiveau(a: string, b: string) {
  const na = normalizeNiveau(a);
  const nb = normalizeNiveau(b);
  const ia = niveauOrderIndex(na);
  const ib = niveauOrderIndex(nb);
  if (ia !== ib) return ia - ib;
  return na.localeCompare(nb);
}

export function globalSemesterNumber(niveau: unknown, semestre: unknown) {
  const n = normalizeNiveau(niveau);
  const s = Number(semestre ?? 0);
  const offsets: Record<string, number> = {
    L1: 0,
    L2: 2,
    L3: 4,
    M1: 0,
    M2: 2,
  };
  const offset = offsets[n] ?? 0;
  return offset + (Number.isFinite(s) ? s : 0);
}

export function globalSemesterLabel(niveau: unknown, semestre: unknown) {
  return `S${globalSemesterNumber(niveau, semestre)}`;
}

export function buildSemestresByNiveau<T extends { niveau?: any; semestre?: any }>(
  items: T[]
) {
  const semestresByNiveauSet: Record<string, Set<number>> = {};

  for (const item of items) {
    const niveau = normalizeNiveau(item.niveau);
    const semestre = Number(item.semestre ?? 0);
    if (!niveau || !Number.isFinite(semestre) || semestre <= 0) continue;
    if (!semestresByNiveauSet[niveau]) semestresByNiveauSet[niveau] = new Set();
    semestresByNiveauSet[niveau].add(semestre);
  }

  const years = Object.keys(semestresByNiveauSet).sort(sortNiveau);
  const semestresByNiveau: Record<string, number[]> = {};
  for (const y of years) {
    semestresByNiveau[y] = Array.from(semestresByNiveauSet[y] || []).sort(
      (a, b) => a - b
    );
  }

  return { years, semestresByNiveau };
}

