/** Local-calendar helpers (the server stores `localDate` as the user's own day, not UTC). */
export const localIso = (d: Date = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDaysIso = (iso: string, days: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
/** Whole days since 1970-01-01 for an ISO date: a stable per-day seed. */
export const dayNumber = (iso: string): number => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
