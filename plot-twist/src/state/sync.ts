/**
 * Multi-tab safety and "last seen" bookkeeping.
 *
 * Every open tab of PLOT TWIST holds the whole persisted state in memory. A
 * blind last-writer-wins save would let a stale tab erase finished episodes,
 * so the store (a) adopts what other tabs write (`storage` events), (b) only
 * writes when it has unsaved local changes, and (c) merges with whatever is
 * stored when someone else wrote since its last read — using `mergeStates`,
 * which can never drop a completed episode.
 *
 * The "last seen" heartbeat for an active run lives under its own small key so
 * that keeping it fresh never rewrites (or races) the main state.
 */
import type { CompletedEpisode } from '../engine/types.ts';
import { STORAGE_KEY } from './persistence.ts';
import type { PersistedState, StorageLike } from './types.ts';

export const SEEN_KEY = `${STORAGE_KEY}:seen`;

/** Stored `updatedAt` of the main state, or null when there is none / it is unreadable. */
export function storedStamp(raw: string | null): number | null {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as { updatedAt?: unknown };
    return typeof parsed?.updatedAt === 'number' && Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : null;
  } catch {
    return null;
  }
}

export function readRaw(storage: StorageLike | null, key: string = STORAGE_KEY): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Union of completed episodes by id. For an id present in both, `preferOurs`
 * decides which copy wins (it carries the newer journal / edits). Sorted by
 * completion time; numbering is repaired only when two episodes collide on a
 * number (two tabs finishing at once), so existing posters keep their numbers.
 */
export function mergeCompleted(ours: readonly CompletedEpisode[], theirs: readonly CompletedEpisode[], preferOurs: boolean): CompletedEpisode[] {
  const byId = new Map<string, CompletedEpisode>();
  const [first, second] = preferOurs ? [theirs, ours] : [ours, theirs];
  for (const ep of first) byId.set(ep.id, ep);
  for (const ep of second) byId.set(ep.id, ep);
  const merged = Array.from(byId.values()).sort((a, b) => a.completedAt - b.completedAt || a.id.localeCompare(b.id));
  const numbers = new Set(merged.map((e) => e.episodeNumber));
  if (numbers.size === merged.length) return merged;
  return merged.map((e, i) => (e.episodeNumber === i + 1 ? e : { ...e, episodeNumber: i + 1 }));
}

/**
 * Merges this tab's unsaved state with a newer copy written by another tab.
 * `oursChangedAt` is when this tab last changed something; the stored copy's
 * `updatedAt` is when the other tab wrote. Completed episodes are a union (an
 * episode is never lost); every other section comes from whichever side changed
 * last. A run that the other side already finished is dropped.
 */
export function mergeStates(ours: PersistedState, theirs: PersistedState, oursChangedAt: number): PersistedState {
  const oursNewer = oursChangedAt >= theirs.updatedAt;
  const base = oursNewer ? ours : theirs;
  const completed = mergeCompleted(ours.completed, theirs.completed, oursNewer);
  const finishedIds = new Set(completed.map((c) => c.id));
  const run = base.run && finishedIds.has(base.run.id) ? null : base.run;
  return {
    ...base,
    completed,
    run,
    updatedAt: Math.max(ours.updatedAt, theirs.updatedAt),
  };
}

// ── last seen (absence detection for the active run) ─────────────────

export function readSeen(storage: StorageLike | null, runId: string): number | null {
  const raw = readRaw(storage, SEEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { runId?: unknown; at?: unknown };
    return parsed.runId === runId && typeof parsed.at === 'number' && Number.isFinite(parsed.at) ? parsed.at : null;
  } catch {
    return null;
  }
}

export function writeSeen(storage: StorageLike | null, runId: string, at: number): void {
  if (!storage) return;
  try {
    storage.setItem(SEEN_KEY, JSON.stringify({ runId, at }));
  } catch {
    // Best effort: the run's own lastSeenAt is the fallback.
  }
}
