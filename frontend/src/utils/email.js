export const SCHOOL_EMAIL_DOMAIN =
  import.meta.env.VITE_SCHOOL_EMAIL_DOMAIN || "supnum.mr";

export function normalizeSchoolEmail(input) {
  const raw = String(input ?? "").trim();

  if (!raw) {
    throw new Error("Adresse email requise.");
  }

  if (/\s/.test(raw)) {
    throw new Error("Adresse email invalide.");
  }

  if (!raw.includes("@")) {
    throw new Error("Saisissez l'adresse email complète (avec @...).");
  }

  return raw;
}
