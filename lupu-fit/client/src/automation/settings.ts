/** Automation settings: local only (localStorage, one blob per account). Nothing here is ever sent to a server. */
import { useCallback, useSyncExternalStore } from 'react';
import { useMe } from '../app/session.ts';

export type Hhmm = string; // "HH:MM", 24h, local time
/** 0 = Sunday ... 6 = Saturday (JS getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MealKind = 'breakfast' | 'lunch' | 'dinner';
export const MEAL_KINDS: readonly MealKind[] = ['breakfast', 'lunch', 'dinner'];

export interface AutomationSettings {
  v: 1;
  /** Every reminder is OFF until the user opts in. `days: null` = suggest from profile.daysPerWeek. */
  workout: { on: boolean; time: Hhmm; days: Weekday[] | null };
  meals: { on: boolean; kinds: MealKind[]; times: Record<MealKind, Hhmm> };
  weigh: { on: boolean; day: Weekday; time: Hhmm };
  streak: { on: boolean; time: Hhmm };
  rest: { on: boolean; time: Hhmm };
  quiet: { on: boolean; start: Hhmm; end: Hhmm };
  /** In-app automations (no permission needed). */
  auto: { restTimer: boolean; weeklyCheckin: boolean; backupReminder: boolean };
}

export const DEFAULT_SETTINGS: AutomationSettings = {
  v: 1,
  workout: { on: false, time: '18:00', days: null },
  meals: { on: false, kinds: ['breakfast', 'lunch', 'dinner'], times: { breakfast: '08:00', lunch: '13:00', dinner: '19:30' } },
  weigh: { on: false, day: 0, time: '08:00' },
  streak: { on: false, time: '20:00' },
  rest: { on: false, time: '10:00' },
  quiet: { on: true, start: '22:00', end: '07:00' },
  auto: { restTimer: true, weeklyCheckin: true, backupReminder: true },
};

export const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const parseHhmm = (v: string): { hour: number; minute: number } | null => {
  const m = HHMM.exec(v);
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : null;
};

const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const time = (v: unknown, d: Hhmm): Hhmm => (typeof v === 'string' && HHMM.test(v) ? v : d);
const isDay = (v: unknown): v is Weekday => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 6;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

/** Tolerant parse: anything malformed falls back to the default for that field. */
export function normalizeSettings(raw: unknown): AutomationSettings {
  const r = obj(raw); const d = DEFAULT_SETTINGS;
  const w = obj(r['workout']); const m = obj(r['meals']); const mt = obj(m['times']); const wg = obj(r['weigh']);
  const s = obj(r['streak']); const re = obj(r['rest']); const q = obj(r['quiet']); const a = obj(r['auto']);
  const days = Array.isArray(w['days']) ? [...new Set((w['days'] as unknown[]).filter(isDay))].sort() : null;
  const kinds = Array.isArray(m['kinds']) ? MEAL_KINDS.filter((k) => (m['kinds'] as unknown[]).includes(k)) : [...d.meals.kinds];
  return {
    v: 1,
    workout: { on: bool(w['on'], false), time: time(w['time'], d.workout.time), days },
    meals: { on: bool(m['on'], false), kinds, times: { breakfast: time(mt['breakfast'], d.meals.times.breakfast), lunch: time(mt['lunch'], d.meals.times.lunch), dinner: time(mt['dinner'], d.meals.times.dinner) } },
    weigh: { on: bool(wg['on'], false), day: isDay(wg['day']) ? wg['day'] : d.weigh.day, time: time(wg['time'], d.weigh.time) },
    streak: { on: bool(s['on'], false), time: time(s['time'], d.streak.time) },
    rest: { on: bool(re['on'], false), time: time(re['time'], d.rest.time) },
    quiet: { on: bool(q['on'], true), start: time(q['start'], d.quiet.start), end: time(q['end'], d.quiet.end) },
    auto: { restTimer: bool(a['restTimer'], true), weeklyCheckin: bool(a['weeklyCheckin'], true), backupReminder: bool(a['backupReminder'], true) },
  };
}

export const settingsKey = (userId: string | null | undefined): string => `lf_automation_v1:${userId ?? 'anon'}`;

export function loadSettings(userId: string | null | undefined): AutomationSettings {
  try { const raw = localStorage.getItem(settingsKey(userId)); return normalizeSettings(raw ? JSON.parse(raw) : null); } catch { return normalizeSettings(null); }
}

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: AutomationSettings }>();
const EVENT = 'lf-automation-settings';

export function saveSettings(userId: string | null | undefined, next: AutomationSettings): void {
  try { localStorage.setItem(settingsKey(userId), JSON.stringify(next)); } catch { /* storage unavailable: the change stays in memory for this session */ }
  cache.set(settingsKey(userId), { raw: safeGet(settingsKey(userId)), value: next });
  listeners.forEach((l) => l());
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ }
}
const safeGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };

/** Stable snapshot per key: only re-parses when the stored string changed (required by useSyncExternalStore). */
function snapshot(userId: string | null | undefined): AutomationSettings {
  const key = settingsKey(userId); const raw = safeGet(key); const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  const value = loadSettings(userId);
  cache.set(key, { raw, value });
  return value;
}
const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => { listeners.delete(cb); window.removeEventListener('storage', cb); };
};

/** Settings for the signed-in account (anonymous bucket while the session is loading). */
export function useAutomationSettings(): { settings: AutomationSettings; update: (fn: (s: AutomationSettings) => AutomationSettings) => void; userId: string | null } {
  const userId = (useMe().data as { user?: { id?: string } } | null | undefined)?.user?.id ?? null; // defensive: tests and offline caches may hand back partial data
  const settings = useSyncExternalStore(subscribe, () => snapshot(userId), () => DEFAULT_SETTINGS);
  const update = useCallback((fn: (s: AutomationSettings) => AutomationSettings) => saveSettings(userId, fn(snapshot(userId))), [userId]);
  return { settings, update, userId };
}

/** Whether the live screen should start the rest timer by itself after a set. Default ON (existing behaviour). */
export function useAutoRest(): boolean { return useAutomationSettings().settings.auto.restTimer; }
