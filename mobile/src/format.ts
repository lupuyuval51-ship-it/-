import type { Locale } from "@/lib/i18n";
import type { SyncStatus } from "./cloud/account";

/** The date language is the interface language: Spanish used to fall through to English ("Thursday", "tomorrow"). */
const tag = (locale: Locale): string => (locale === "he" ? "he-IL" : locale === "es" ? "es-ES" : "en-GB");
const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * When the next review is due, in words a person can place: "today, 14:30", "tomorrow, 09:00", a weekday within the
 * week ("Thursday, 09:00"), and a calendar date beyond that ("24 October"). A bare weekday would be ambiguous for the
 * long spaced-repetition gaps (a 16-day box), so it is only used for the coming 6 days.
 */
export function formatNextReview(nextDue: number, now: number, locale: Locale): string {
  const due = new Date(nextDue);
  const days = Math.round((startOfDay(due) - startOfDay(new Date(now))) / 86_400_000);
  const time = due.toLocaleTimeString(tag(locale), { hour: "2-digit", minute: "2-digit" });
  if (days >= 7) return due.toLocaleDateString(tag(locale), { day: "numeric", month: "long" });
  const day = days <= 1
    ? new Intl.RelativeTimeFormat(tag(locale), { numeric: "auto" }).format(Math.max(0, days), "day")
    : due.toLocaleDateString(tag(locale), { weekday: "long" });
  return `${day}, ${time}`;
}

/** A date and time in the app language ("11/10/2026, 14:30"), for "last sync". */
export function formatWhen(ts: number, locale: Locale): string {
  return new Date(ts).toLocaleString(tag(locale), { dateStyle: "short", timeStyle: "short" });
}

/** Which one-line account/sync message the library footer shows for a signed-in player. */
export function syncLineKey(status: SyncStatus, lastSyncAt: number | null): "mob.account.syncing" | "mob.account.syncError" | "mob.account.lastSync" | "mob.account.notSynced" {
  if (status === "syncing") return "mob.account.syncing";
  if (status === "error") return "mob.account.syncError";
  return lastSyncAt ? "mob.account.lastSync" : "mob.account.notSynced";
}
