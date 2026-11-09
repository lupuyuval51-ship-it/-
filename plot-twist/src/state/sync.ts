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
import type { CompletedEpisode, Run } from '../engine/types.ts';
import { STORAGE_KEY } from './persistence.ts';
import { SECTIONS } from './types.ts';
import type { Draw, DrawEnvelope, PersistedState, Section, SectionStamps, StorageLike } from './types.ts';

export const SEEN_KEY = `${STORAGE_KEY}:seen`;
/** Heartbeat of the tab that is writing an AI envelope, so other tabs don't start a duplicate. */
export const GEN_KEY = `${STORAGE_KEY}:gen`;
/** A generation beat older than this means its tab is gone. */
export const GEN_BEAT_STALE_MS = 9_000;

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

/** A section's change time. Data saved before stamps existed falls back to a whole-state time. */
function stampOf(state: PersistedState, section: Section, fallback: number): number {
  return state.stamps ? (state.stamps[section] ?? 0) : fallback;
}

/** For the same run in two tabs, the copy that got further wins (finished > more steps). */
function furtherRun(a: Run, b: Run, preferA: boolean): Run {
  const score = (r: Run) => (r.finishedAt !== null ? 1000 : 0) + r.steps.length * 10 + (r.phase === 'choice' ? 1 : 0);
  const sa = score(a);
  const sb = score(b);
  if (sa !== sb) return sa > sb ? a : b;
  return preferA ? a : b;
}

/** For the same draw in two tabs: an envelope never goes from written back to "writing", and opened stays opened. */
function mergeDraw(preferred: Draw, other: Draw): Draw {
  const envelopes = preferred.envelopes.map((env) => {
    const twin = other.envelopes.find((e) => e.slot === env.slot);
    if (!twin) return env;
    const base: DrawEnvelope = env.status === 'writing' && twin.status !== 'writing' ? twin : env;
    return base.opened || !twin.opened || base.adventure?.id !== twin.adventure?.id ? base : { ...base, opened: true };
  });
  return { ...preferred, envelopes, shownIds: Array.from(new Set([...preferred.shownIds, ...other.shownIds])) };
}

/**
 * Merges this tab's unsaved state with a newer copy written by another tab.
 * Each section comes from whichever side changed it last (per-section stamps;
 * for data saved before stamps existed, this tab's last change time
 * `oursChangedAt` against the other tab's write time). Completed episodes are a
 * union — an episode is never lost — except across a "Reset all" (`resetAt`).
 * The same run or draw in both tabs never moves backwards.
 */
export function mergeStates(ours: PersistedState, theirs: PersistedState, oursChangedAt = 0): PersistedState {
  const newer = (section: Section) => stampOf(ours, section, oursChangedAt) >= stampOf(theirs, section, theirs.updatedAt);
  const resetAt = Math.max(ours.resetAt ?? 0, theirs.resetAt ?? 0);

  const completed = mergeCompleted(ours.completed, theirs.completed, newer('completed')).filter((c) => c.completedAt >= resetAt);
  const finishedIds = new Set(completed.map((c) => c.id));

  let run = newer('run') ? ours.run : theirs.run;
  if (ours.run && theirs.run && ours.run.id === theirs.run.id) run = furtherRun(ours.run, theirs.run, newer('run'));
  if (run && (finishedIds.has(run.id) || run.startedAt < resetAt)) run = null;

  let draw = newer('draw') ? ours.draw : theirs.draw;
  if (draw && ours.draw && theirs.draw && ours.draw.id === theirs.draw.id) draw = mergeDraw(draw, draw === ours.draw ? theirs.draw : ours.draw);
  if (draw && draw.createdAt < resetAt) draw = null;

  const stamps: SectionStamps = {};
  for (const section of SECTIONS) {
    const t = Math.max(ours.stamps?.[section] ?? 0, theirs.stamps?.[section] ?? 0);
    if (t) stamps[section] = t;
  }

  const merged: PersistedState = {
    ...ours,
    prefs: newer('prefs') ? ours.prefs : theirs.prefs,
    draw,
    run,
    completed,
    series: newer('series') ? ours.series : theirs.series,
    settings: newer('settings') ? ours.settings : theirs.settings,
    updatedAt: Math.max(ours.updatedAt, theirs.updatedAt),
    stamps,
  };
  if (resetAt) merged.resetAt = resetAt;
  else delete merged.resetAt;
  return merged;
}

/** Section stamps after a local change: every section whose object changed gets `now`. */
export function restamp(prev: PersistedState, next: PersistedState, now: number): PersistedState {
  let stamps: SectionStamps | null = null;
  for (const section of SECTIONS) {
    if (next[section] !== prev[section]) {
      stamps ??= { ...(prev.stamps ?? {}) };
      stamps[section] = now;
    }
  }
  return stamps ? { ...next, stamps } : next;
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

// ── who is writing the AI envelope ───────────────────────────────────

export interface GenBeat {
  drawId: string;
  slot: number;
  owner: string;
  at: number;
}

export function readGenBeat(storage: StorageLike | null): GenBeat | null {
  const raw = readRaw(storage, GEN_KEY);
  if (!raw) return null;
  try {
    const b = JSON.parse(raw) as Partial<GenBeat>;
    return typeof b.drawId === 'string' && typeof b.slot === 'number' && typeof b.owner === 'string' && typeof b.at === 'number' && Number.isFinite(b.at)
      ? { drawId: b.drawId, slot: b.slot, owner: b.owner, at: b.at }
      : null;
  } catch {
    return null;
  }
}

export function writeGenBeat(storage: StorageLike | null, beat: GenBeat): void {
  if (!storage) return;
  try {
    storage.setItem(GEN_KEY, JSON.stringify(beat));
  } catch {
    // Best effort.
  }
}

export function clearGenBeat(storage: StorageLike | null, owner: string): void {
  if (!storage) return;
  try {
    if (readGenBeat(storage)?.owner === owner) storage.removeItem(GEN_KEY);
  } catch {
    // Best effort.
  }
}

/** True when another, still-alive tab is writing this envelope. */
export function ownedElsewhere(beat: GenBeat | null, drawId: string, slot: number, self: string, now: number): boolean {
  return Boolean(beat && beat.owner !== self && beat.drawId === drawId && beat.slot === slot && now - beat.at < GEN_BEAT_STALE_MS);
}
