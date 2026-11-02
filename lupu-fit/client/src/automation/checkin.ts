/** Pure logic for the two in-app banners (weekly check-in, monthly backup reminder) plus their localStorage state. */
import type { Language } from '@lupu-fit/shared';
import { addDaysIso } from '../components/home/dates.ts';
import { weekEndOf, weekStartOf } from '../components/workouts/weekUtil.ts';

export interface DatedRow { localDate: string }
export interface WeightRow { loggedDate: string; weightKg: number }

export interface WeeklySummary { weekStart: string; done: number; goal: number; weightDeltaKg: number | null }

/** Summary of the calendar week before the one containing `today` (Sunday start for Hebrew, Monday for English). */
export function summarizeLastWeek(a: { today: string; lang: Language; goal: number; sessions: readonly DatedRow[]; weights: readonly WeightRow[]; includeWeight: boolean }): WeeklySummary {
  const thisStart = weekStartOf(a.today, a.lang);
  const start = addDaysIso(thisStart, -7); const end = weekEndOf(start);
  const done = a.sessions.filter((s) => s.localDate >= start && s.localDate <= end).length;
  let weightDeltaKg: number | null = null;
  if (a.includeWeight) {
    const sorted = [...a.weights].sort((x, y) => (x.loggedDate < y.loggedDate ? -1 : 1));
    const inWeek = sorted.filter((w) => w.loggedDate >= start && w.loggedDate <= end);
    const before = sorted.filter((w) => w.loggedDate < start);
    const last = inWeek[inWeek.length - 1];
    const base = before[before.length - 1] ?? (inWeek.length >= 2 ? inWeek[0] : undefined);
    if (last && base && base !== last) weightDeltaKg = Math.round((last.weightKg - base.weightKg) * 10) / 10;
  }
  return { weekStart: start, done, goal: a.goal, weightDeltaKg };
}

/** First open of a new week: show once per week, only when the account has any history to summarise. */
export function shouldShowCheckin(a: { enabled: boolean; today: string; lang: Language; seenWeek: string | null; hasHistory: boolean }): boolean {
  return a.enabled && a.hasHistory && a.seenWeek !== weekStartOf(a.today, a.lang);
}

export interface BackupState { since: string | null; lastDone: string | null; snoozed: string | null }
const daysBetween = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
export const BACKUP_INTERVAL_DAYS = 30;

/** Monthly, Device Mode only, never in the first 30 days after the first open, and only when there is data worth saving. */
export function shouldShowBackup(a: { enabled: boolean; isDevice: boolean; today: string; state: BackupState; hasData: boolean }): boolean {
  if (!a.enabled || !a.isDevice || !a.hasData) return false;
  const marks = [a.state.since, a.state.lastDone, a.state.snoozed].filter((x): x is string => !!x).sort();
  const newest = marks[marks.length - 1];
  return !!newest && daysBetween(newest, a.today) >= BACKUP_INTERVAL_DAYS;
}

const SEEN_KEY = 'lf_auto_checkin_seen';
const BACKUP_KEY = 'lf_auto_backup';
const get = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export const readCheckinSeen = (): string | null => get(SEEN_KEY);
export const markCheckinSeen = (weekStart: string): void => put(SEEN_KEY, weekStart);

export function readBackupState(): BackupState {
  try {
    const o = JSON.parse(get(BACKUP_KEY) ?? '{}') as Partial<BackupState>;
    const s = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    return { since: s(o.since), lastDone: s(o.lastDone), snoozed: s(o.snoozed) };
  } catch { return { since: null, lastDone: null, snoozed: null }; }
}
function writeBackup(patch: Partial<BackupState>): void { put(BACKUP_KEY, JSON.stringify({ ...readBackupState(), ...patch })); }
const todayLocal = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** Remember the first open so the first reminder comes a month later. */
export function ensureBackupSince(today: string): void { if (!readBackupState().since) writeBackup({ since: today }); }
export const snoozeBackup = (today: string): void => writeBackup({ snoozed: today });
/** Called after a successful export/share from the Backup panel. */
export const markBackupDone = (): void => writeBackup({ lastDone: todayLocal() });
