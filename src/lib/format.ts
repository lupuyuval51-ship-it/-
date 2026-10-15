import type { Locale } from "@/lib/i18n";

const TAG: Record<Locale, string> = { he: "he-IL", en: "en-US", es: "es-ES" };

/** Dates are always shown in UTC so server and client render identical text and allowance periods are unambiguous. */
export function formatDate(value: Date | string | number, locale: Locale): string {
  return new Intl.DateTimeFormat(TAG[locale], { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function formatDateTime(value: Date | string | number, locale: Locale): string {
  return new Intl.DateTimeFormat(TAG[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC";
}
