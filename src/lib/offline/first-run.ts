import { REGIONS } from "@/lib/regions";
import type { Locale } from "@/lib/i18n";

/**
 * First-launch choices of the offline app: the language and the country the learner would pay from. The country is the
 * learner's own pick (never a location), stays on the device, and only decides the currency of the prices shown.
 * Pure, so it can be unit-tested; app-state.ts applies it.
 */
export const REGION_OTHER = "OTHER";
export const REGION_CHOICES: readonly string[] = [...REGIONS.map((r) => r.code), REGION_OTHER];

export const sanitizeRegion = (v: unknown): string => (typeof v === "string" && REGION_CHOICES.includes(v) ? v : REGION_OTHER);

/**
 * Defaults of a fresh install: English, "Other" country (prices in USD) and the setup screen still to be shown.
 * The `e2e` test build keeps the product's Hebrew default with the setup already done, so the existing phone specs
 * start on the library as before; the setup flow has its own spec.
 */
export function freshDefaults(testBuild: boolean): { locale: Locale; region: string; setupDone: boolean } {
  return testBuild ? { locale: "he", region: REGION_OTHER, setupDone: true } : { locale: "en", region: REGION_OTHER, setupDone: false };
}
