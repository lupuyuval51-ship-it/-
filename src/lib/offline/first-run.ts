import { REGIONS } from "@/lib/regions";
import { isPlanId, type PlanId } from "@/config/plans";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/game/topics/types";
import type { Locale } from "@/lib/i18n";
import { WELCOME_KEY } from "./onboarding";
import type { KV } from "./store";

/**
 * First-launch choices of the offline app: the language and the country the learner would pay from. The country is the
 * learner's own pick (never a location) and stays on the device; it is only ever used to word the prices shown, and as prices
 * are in shekels everywhere now (`displayCurrency` in config/plans.ts) it changes nothing today.
 * Pure, so it can be unit-tested; app-state.ts applies it.
 */
export const REGION_OTHER = "OTHER";
export const REGION_CHOICES: readonly string[] = [...REGIONS.map((r) => r.code), REGION_OTHER];

export const sanitizeRegion = (v: unknown): string => (typeof v === "string" && REGION_CHOICES.includes(v) ? v : REGION_OTHER);

/**
 * Defaults of a fresh install: Hebrew (the product's default language), "Other" country (prices are in shekels either way) and the setup screen still to be shown.
 * The `e2e` test build has the setup already done, so the existing phone specs
 * start on the library as before; the setup flow has its own spec.
 */
export function freshDefaults(testBuild: boolean): { locale: Locale; region: string; setupDone: boolean } {
  return testBuild ? { locale: "he", region: REGION_OTHER, setupDone: true } : { locale: "he", region: REGION_OTHER, setupDone: false };
}

// ───────────── the first-run questionnaire (interests, time, plan) ─────────────

/** How much time the learner wants to give per day (minutes); the last option means "30 or more". */
export const MINUTES_CHOICES = [5, 10, 20, 30] as const;
export type MinutesChoice = (typeof MINUTES_CHOICES)[number];

export const sanitizeMinutes = (v: unknown): MinutesChoice | null => (MINUTES_CHOICES as readonly unknown[]).includes(v) ? (v as MinutesChoice) : null;

/** Interests are topic-library categories; anything else is dropped. */
export function sanitizeInterests(v: unknown): TopicCategory[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is TopicCategory => (TOPIC_CATEGORIES as readonly unknown[]).includes(x)))];
}

/** The plan the learner said they want. A preference only: the app sells nothing and unlocks nothing with it. */
export const sanitizePlanChoice = (v: unknown): PlanId | null => (isPlanId(v) ? v : null);

/** A short session suits a quick game; with 20 minutes or more a day the create screen proposes a full adventure. */
export const modeForMinutes = (m: MinutesChoice | null): "FAST" | "FULL" => (m !== null && m >= 20 ? "FULL" : "FAST");

/**
 * Does this phone already hold the learner's data: games (the lists and records of `OfflineStore`, key prefix `levelup.offline.`) or a
 * welcome that was already seen? Such a phone is an upgrade, not a fresh install. Versions before the questionnaire saved the settings
 * key only when a setting was changed, so a learner who never opened Settings has none and must still never be sent through it.
 * A storage failure counts as "nothing there".
 */
export function hasExistingData(kv: Pick<KV, "get" | "keys">): boolean {
  try {
    if (kv.get(WELCOME_KEY) === "1") return true;
    const listed = JSON.parse(kv.get("levelup.offline.games") ?? "[]") as unknown;
    if (Array.isArray(listed) && listed.length > 0) return true;
    return (kv.keys?.() ?? []).some((k) => k.startsWith("levelup.offline.game."));
  } catch {
    return false;
  }
}
