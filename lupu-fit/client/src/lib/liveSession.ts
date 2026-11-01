/** Pure logic for the live workout screen: types, defaults, progression badge, replacement options, outbox views. */
import {
  isExerciseSafe, nextProgression, resolveSafeExercise, BODYWEIGHT_APPARATUS,
  type AgeBucket, type ExerciseDef, type ProfileInput, type ReadinessState, type SessionPerformance, type SwapContext,
} from '@lupu-fit/shared';
import type { OutboxItem } from './outbox.ts';

export interface Planned { sets: number; repsMin: number; repsMax: number; rpe: number; restSec: number; loadKg: number | null; durationSec: number | null }
export interface LiveSet { id: string; sessionExerciseId: string; setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }
export interface LiveExercise { id: string; position?: number; exerciseId: string; isFinisher: boolean; sport: string | null; planned: Planned; sets: LiveSet[] }
export interface LiveSessionData { id: string; name: string; sport: string | null; startedAt: string; readiness: string | null; exercises: LiveExercise[] }
export interface HistoryEntry { sessionId: string; date: string; sets: { setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }[] }
export interface HistoryResponse { exerciseId: string; history: HistoryEntry[] }

const TIMED_CATEGORIES = new Set(['duration', 'isometric', 'stretch', 'mobility']);
export const isTimedExercise = (category: string | undefined, planned: Planned): boolean => (category !== undefined && TIMED_CATEGORIES.has(category)) || (planned.durationSec !== null && planned.durationSec > 0);

/** Minors never go above RPE 7. */
export const maxRpeFor = (bucket: AgeBucket | null): number => (bucket === 'minor' ? 7 : 10);
export function rpeOptions(max: number): number[] { const out: number[] = []; for (let v = 1; v <= max + 1e-9; v += 0.5) out.push(v); return out; }
export const clampRpe = (v: number, max: number): number => Math.min(max, Math.max(1, Math.round(v * 2) / 2));

export function safeBucket(age: number | undefined, fn: (n: number) => AgeBucket): AgeBucket | null {
  if (age === undefined) return null;
  try { return fn(age); } catch { return null; }
}

const BUCKET_KEY = 'lf_live_age_bucket';
/** The last known age bucket, kept so a minor who opens the workout offline (profile not loaded) still gets the RPE cap / no load increases. */
export function loadStoredBucket(): AgeBucket | null {
  try { const v = localStorage.getItem(BUCKET_KEY); return v === 'minor' || v === 'adult' || v === 'master' || v === 'senior' ? v : null; } catch { return null; }
}
export function storeBucket(b: AgeBucket | null): void { try { if (b) localStorage.setItem(BUCKET_KEY, b); } catch { /* ignore */ } }

export const readinessOf = (s: string | null | undefined): ReadinessState => (s === 'easier' || s === 'rest' ? s : 'normal');

/** API history is newest-first; the shared engine wants oldest-first. Sessions without a logged set are skipped. */
export function toPerformances(history: readonly HistoryEntry[], planned: Planned): SessionPerformance[] {
  return [...history].reverse().filter((h) => h.sets.length > 0).map((h) => {
    const weights = h.sets.map((s) => s.weightKg).filter((w): w is number => w !== null && w > 0);
    return { loadKg: weights.length ? Math.max(...weights) : null, repsPerSet: h.sets.map((s) => s.reps).filter((r): r is number => r !== null), repsMin: planned.repsMin, repsMax: planned.repsMax };
  });
}

export type Badge =
  | { kind: 'none' }
  | { kind: 'increase'; kg: number }
  | { kind: 'deload' }
  | { kind: 'hold' }
  | { kind: 'frozen' }
  | { kind: 'minorReps'; max: number }
  | { kind: 'minorKeep' };
export interface Progression { badge: Badge; loadKg: number | null }

/**
 * Progression suggestion shown above the set rows. Frozen on 'easier'/'rest' readiness. Never a load increase for minors
 * (they only follow rep progression) and never when the age is unknown (safety may only make training easier).
 */
export function progressionFor(args: { history: readonly HistoryEntry[]; planned: Planned; readiness: ReadinessState; bucket: AgeBucket | null; timed: boolean }): Progression {
  const perfs = toPerformances(args.history, args.planned);
  const last = perfs[perfs.length - 1];
  if (!last) return { badge: { kind: 'none' }, loadKg: null };
  if (args.readiness !== 'normal') return { badge: { kind: 'frozen' }, loadKg: last.loadKg };
  if (args.timed) return { badge: { kind: 'none' }, loadKg: last.loadKg };
  const res = nextProgression(perfs, 'normal');
  if (res.action === 'deload') return { badge: { kind: 'deload' }, loadKg: res.loadKg };
  if (args.bucket === 'minor') {
    const below = last.repsPerSet.some((r) => r < args.planned.repsMax);
    return { badge: below ? { kind: 'minorReps', max: args.planned.repsMax } : { kind: 'minorKeep' }, loadKg: last.loadKg };
  }
  if (last.loadKg === null) return { badge: { kind: 'none' }, loadKg: null };
  if (res.action === 'increase' && args.bucket !== null && res.loadKg !== null) return { badge: { kind: 'increase', kg: Math.round((res.loadKg - last.loadKg) * 100) / 100 }, loadKg: res.loadKg };
  return { badge: { kind: 'hold' }, loadKg: last.loadKg };
}

export interface LastPerformance { count: number; repsMin: number | null; repsMax: number | null; weightKg: number | null; durationSec: number | null }
export function lastPerformance(history: readonly HistoryEntry[]): LastPerformance | null {
  const h = history.find((x) => x.sets.length > 0);
  if (!h) return null;
  const reps = h.sets.map((s) => s.reps).filter((r): r is number => r !== null);
  const w = h.sets.map((s) => s.weightKg).filter((x): x is number => x !== null && x > 0);
  const d = h.sets.map((s) => s.durationSec).filter((x): x is number => x !== null && x > 0);
  return { count: h.sets.length, repsMin: reps.length ? Math.min(...reps) : null, repsMax: reps.length ? Math.max(...reps) : null, weightKg: w.length ? Math.max(...w) : null, durationSec: d.length ? Math.max(...d) : null };
}

export interface Defaults { weightKg: number | null; reps: number; durationSec: number; rpe: number }
export function defaultsFor(a: { planned: Planned; progression: Progression; last: LastPerformance | null; ownSets: readonly { reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }[]; maxRpe: number }): Defaults {
  const own = a.ownSets[a.ownSets.length - 1];
  const weightKg = own?.weightKg ?? a.progression.loadKg ?? a.last?.weightKg ?? a.planned.loadKg ?? null;
  return {
    weightKg,
    reps: own?.reps ?? Math.max(1, a.planned.repsMax || a.planned.repsMin || 8),
    durationSec: own?.durationSec ?? (a.planned.durationSec && a.planned.durationSec > 0 ? a.planned.durationSec : a.last?.durationSec ?? 30),
    rpe: clampRpe(own?.rpe ?? a.planned.rpe, a.maxRpe),
  };
}

export function swapContextFor(p: ProfileInput, bucket: AgeBucket): SwapContext {
  const gear = p.equipment.some((e) => e !== 'none' && !BODYWEIGHT_APPARATUS.includes(e));
  return { injuries: p.injuries, avoidIds: [], available: p.equipment, bucket, mode: gear ? 'weights' : 'bodyweight', maxDifficulty: p.experience };
}

/** Easier + harder alternatives, each resolved through the safety engine, minus the current exercise and duplicates. */
export function replacementOptions<T extends ExerciseDef>(current: T, ctx: SwapContext, byId: ReadonlyMap<string, T>): T[] {
  const seen = new Set<string>([current.id]);
  const out: T[] = [];
  for (const id of [...current.easierAlternatives, ...current.harderAlternatives]) {
    const cand = byId.get(id); if (!cand) continue;
    const r = resolveSafeExercise(cand, ctx, byId);
    if (r.kind === 'dropped' || seen.has(r.exercise.id)) continue;
    const ex = byId.get(r.exercise.id); if (!ex || !isExerciseSafe(ex, ctx)) continue;
    seen.add(ex.id); out.push(ex);
  }
  return out;
}

export function defaultPlanned(timed: boolean, minor: boolean): Planned {
  return timed ? { sets: 3, repsMin: 0, repsMax: 0, rpe: minor ? 6 : 7, restSec: 45, loadKg: null, durationSec: 30 } : { sets: 3, repsMin: 8, repsMax: 12, rpe: minor ? 7 : 8, restSec: 90, loadKg: null, durationSec: null };
}

/** Rough finisher length from its own prescriptions (work + rest per set). Not the full-workout estimator (that adds warm-up). */
export function finisherMinutes(items: readonly Planned[]): number {
  const sec = items.reduce((a, p) => a + p.sets * ((p.durationSec ?? p.repsMax * 3) + p.restSec), 0);
  return Math.max(1, Math.round(sec / 60));
}

/* ---- outbox views: queued set POSTs / set DELETEs for this session ---- */
export interface PendingSet { itemId: string; status: OutboxItem['status']; sessionExerciseId: string; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }
export const setsPath = (sessionId: string): string => `/api/sessions/${sessionId}/sets`;

export function pendingSets(items: readonly OutboxItem[], sessionId: string): PendingSet[] {
  return items.filter((i) => i.method === 'POST' && i.path === setsPath(sessionId)).map((i) => {
    const b = (i.body ?? {}) as { sessionExerciseId?: string; reps?: number; weightKg?: number; durationSec?: number; rpe?: number };
    return { itemId: i.id, status: i.status, sessionExerciseId: b.sessionExerciseId ?? '', reps: b.reps ?? null, weightKg: b.weightKg ?? null, durationSec: b.durationSec ?? null, rpe: b.rpe ?? null };
  });
}
export function deletedSetIds(items: readonly OutboxItem[], sessionId: string): Set<string> {
  const prefix = `${setsPath(sessionId)}/`;
  return new Set(items.filter((i) => i.method === 'DELETE' && i.path.startsWith(prefix)).map((i) => i.path.slice(prefix.length)));
}
export const sessionOutboxItems = (items: readonly OutboxItem[], sessionId: string): OutboxItem[] => items.filter((i) => i.path.startsWith(`/api/sessions/${sessionId}`));
