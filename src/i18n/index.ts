/**
 * i18n core. Feature dictionaries live in ./messages/<feature>.ts and export
 * `{ he: Record<string,string>, en: Record<string,string> }`. Keys are namespaced: "home.title".
 * Interpolation: "{name}" placeholders are replaced from `vars`.
 */
import type { Locale, Localized } from "@/lib/types";
import { common } from "./messages/common";
import { nav } from "./messages/nav";
import { onboarding } from "./messages/onboarding";
import { home } from "./messages/home";
import { workouts } from "./messages/workouts";
import { session } from "./messages/session";
import { progress } from "./messages/progress";
import { profile } from "./messages/profile";
import { coach } from "./messages/coach";
import { admin } from "./messages/admin";
import { auth } from "./messages/auth";
import { library } from "./messages/library";
import { plan } from "./messages/plan";
import { pwa } from "./messages/pwa";
import { domain } from "./messages/domain";
import { ui } from "./messages/ui";

export type Dictionary = Record<string, string>;
export type FeatureMessages = { he: Dictionary; en: Dictionary };

const features: FeatureMessages[] = [common, nav, onboarding, home, workouts, session, progress, profile, coach, admin, auth, library, plan, pwa, domain, ui];

export const dictionaries: Record<Locale, Dictionary> = {
  he: Object.assign({}, ...features.map((f) => f.he)),
  en: Object.assign({}, ...features.map((f) => f.en)),
};

export const LOCALES: Locale[] = ["he", "en"];
export const DEFAULT_LOCALE: Locale = "he";

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = dictionaries[locale] ?? dictionaries.he;
  let text = dict[key] ?? dictionaries.he[key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

export function localized(locale: Locale, l: Localized | undefined | null): string {
  if (!l) return "";
  return l[locale] || l.he || l.en || "";
}
