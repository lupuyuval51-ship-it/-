import type { Locale, Localized } from "@/lib/types";

export function pick(l: Localized | undefined | null, locale: Locale): string {
  if (!l) return "";
  return l[locale] || l.he || l.en || "";
}

export function pickAll(list: Localized[] | undefined, locale: Locale): string[] {
  return (list ?? []).map((l) => pick(l, locale));
}
