/** Date helpers. All persisted dates are ISO strings; "date" means YYYY-MM-DD in local time. */

export function nowIso(): string {
  return new Date().toISOString();
}

export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addDaysKey(key: string, days: number): string {
  return toDateKey(addDays(parseDateKey(key), days));
}

/** Start of week with Sunday as first day (Israeli convention). */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function startOfWeekKey(date: Date = new Date()): string {
  return toDateKey(startOfWeek(date));
}

/** Week key used for weekly challenges: the Sunday date of that week. */
export function weekKey(date: Date = new Date()): string {
  return `W${startOfWeekKey(date)}`;
}

export function daysBetween(a: string, b: string): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function monthKey(date: Date = new Date()): string {
  return toDateKey(date).slice(0, 7);
}

export function secondsToClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function minutesToHuman(minutes: number, locale: "he" | "en"): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (locale === "he") {
    if (h === 0) return `${m} דק׳`;
    if (m === 0) return h === 1 ? "שעה" : `${h} שעות`;
    return `${h}:${String(m).padStart(2, "0")} שעות`;
  }
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h}h ${m}m`;
}

export function formatDate(key: string, locale: "he" | "en", opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", opts).format(parseDateKey(key));
}

export function formatDateTime(iso: string, locale: "he" | "en"): string {
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
