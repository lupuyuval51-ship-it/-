import type { Locale } from "@/lib/i18n";
/**
 * Billing regions the user can pick. Only Israel has localized prices (Plus ₪10, Pro ₪40); everyone else is charged in USD.
 * The region is the user's own choice (never precise location) and is stored on their profile.
 */
export const REGIONS = [
  { code: "IL", en: "Israel", he: "ישראל", es: "Israel" },
  { code: "US", en: "United States", he: "ארצות הברית", es: "Estados Unidos" },
  { code: "GB", en: "United Kingdom", he: "בריטניה", es: "Reino Unido" },
  { code: "CA", en: "Canada", he: "קנדה", es: "Canadá" },
  { code: "AU", en: "Australia", he: "אוסטרליה", es: "Australia" },
  { code: "DE", en: "Germany", he: "גרמניה", es: "Alemania" },
  { code: "FR", en: "France", he: "צרפת", es: "Francia" },
  { code: "ES", en: "Spain", he: "ספרד", es: "España" },
] as const;

export const OTHER_REGION = "OTHER";
export type RegionCode = (typeof REGIONS)[number]["code"] | typeof OTHER_REGION;

const OTHER_LABEL: Record<Locale, string> = { he: "אחר", en: "Other", es: "Otro" };
export const regionLabel = (code: string | null | undefined, locale: Locale): string => REGIONS.find((r) => r.code === code)?.[locale] ?? OTHER_LABEL[locale];
