import type { DateStr } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD לפי אזור הזמן המקומי */
export function toDateStr(d: Date): DateStr {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateStr(s: DateStr): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0); // 12:00 כדי להימנע מקפיצות שעון קיץ
}

export function todayStr(now: Date = new Date()): DateStr {
  return toDateStr(now);
}

export function addDays(s: DateStr, days: number): DateStr {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** b - a בימים שלמים */
export function diffDays(a: DateStr, b: DateStr): number {
  const ms = parseDateStr(b).getTime() - parseDateStr(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** יום ראשון (0) הוא תחילת השבוע בישראל */
export function weekday(s: DateStr): number {
  return parseDateStr(s).getDay();
}

export function startOfWeek(s: DateStr): DateStr {
  return addDays(s, -weekday(s));
}

export function startOfMonth(s: DateStr): DateStr {
  return `${s.slice(0, 7)}-01`;
}

export function daysInMonth(s: DateStr): number {
  const d = parseDateStr(s);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function lastNDays(n: number, end: DateStr = todayStr()): DateStr[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

export function dateToIsoDay(iso: string): DateStr {
  return toDateStr(new Date(iso));
}

export const WEEKDAYS_LONG = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const WEEKDAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function formatLong(s: DateStr): string {
  const d = parseDateStr(s);
  return `יום ${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(s: DateStr): string {
  const d = parseDateStr(s);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function monthTitle(s: DateStr): string {
  const d = parseDateStr(s);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** טקסט יחסי בעברית: היום / מחר / בעוד X ימים / לפני X ימים */
export function relativeDay(target: DateStr, from: DateStr = todayStr()): string {
  const n = diffDays(from, target);
  if (n === 0) return "היום";
  if (n === 1) return "מחר";
  if (n === 2) return "מחרתיים";
  if (n === -1) return "אתמול";
  if (n > 0) return `בעוד ${n} ימים`;
  return `לפני ${-n} ימים`;
}

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 18) return "צהריים טובים";
  if (h < 22) return "ערב טוב";
  return "לילה טוב";
}
