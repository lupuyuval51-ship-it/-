/**
 * Billing regions the user can pick. Only Israel has localized prices (Plus ₪10, Pro ₪40); everyone else is charged in USD.
 * The region is the user's own choice (never precise location) and is stored on their profile.
 */
export const REGIONS = [
  { code: "IL", en: "Israel", he: "ישראל" },
  { code: "US", en: "United States", he: "ארצות הברית" },
  { code: "GB", en: "United Kingdom", he: "בריטניה" },
  { code: "CA", en: "Canada", he: "קנדה" },
  { code: "AU", en: "Australia", he: "אוסטרליה" },
  { code: "DE", en: "Germany", he: "גרמניה" },
  { code: "FR", en: "France", he: "צרפת" },
  { code: "ES", en: "Spain", he: "ספרד" },
] as const;

export const OTHER_REGION = "OTHER";
export type RegionCode = (typeof REGIONS)[number]["code"] | typeof OTHER_REGION;

export const regionLabel = (code: string | null | undefined, locale: "he" | "en"): string => REGIONS.find((r) => r.code === code)?.[locale] ?? (locale === "he" ? "אחר" : "Other");
