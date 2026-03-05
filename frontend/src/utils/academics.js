export const ACADEMIC_LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2'];

export const SEMESTRES_BY_NIVEAU = {
    L1: [1, 2],
    L2: [1, 2],
    L3: [1, 2],
    M1: [1, 2],
    M2: [1, 2],
};

export const normalizeNiveau = (niveau) =>
    String(niveau ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');

const niveauOrderIndex = (niveau) => {
    const idx = ACADEMIC_LEVELS.indexOf(normalizeNiveau(niveau));
    return idx === -1 ? 999 : idx;
};

export const sortNiveau = (a, b) => {
    const ia = niveauOrderIndex(a);
    const ib = niveauOrderIndex(b);
    if (ia !== ib) return ia - ib;
    return normalizeNiveau(a).localeCompare(normalizeNiveau(b));
};

export const getSemestresForNiveau = (niveau) => {
    const normalized = normalizeNiveau(niveau);
    return SEMESTRES_BY_NIVEAU[normalized] || [];
};

export const globalSemesterNumber = (niveau, semestre) => {
    const n = normalizeNiveau(niveau);
    const s = Number(semestre ?? 0);
    const offsets = {
        L1: 0,
        L2: 2,
        L3: 4,
        M1: 0,
        M2: 2,
    };
    const offset = offsets[n] ?? 0;
    return offset + (Number.isFinite(s) ? s : 0);
};

export const globalSemesterLabel = (niveau, semestre) =>
    `S${globalSemesterNumber(niveau, semestre)}`;
