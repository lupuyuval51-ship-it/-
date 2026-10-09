/**
 * Crash-recovery persistence for the live workout (localStorage, never the source of
 * truth): the last known active-session DTO, the queue of unsynced edits and the rest
 * timer sound preference. Everything is scoped to the signed-in user so a shared device
 * never leaks or replays another account's workout.
 */
import { isValidTimerState } from '@shared/timer';
import type { WorkoutSessionDTO } from '@shared/types';
import { storage } from '../../lib/storage';
import { isQueueEntry, type QueueEntry } from './queue';

export const ACTIVE_SESSION_KEY = 'fitai.activeSession';
export const PENDING_UPDATES_KEY = 'fitai.pendingSetUpdates';
export const TIMER_MUTED_KEY = 'fitai.restTimer.muted';
/** Cached sessions older than this are ignored (the server is asked instead). */
const MAX_CACHE_AGE_MS = 2 * 24 * 60 * 60 * 1000;

export interface CachedSession {
  v: 1;
  userId: string;
  savedAt: number;
  /** Server clock minus client clock when the session was last fetched. */
  skewMs: number;
  session: WorkoutSessionDTO;
}

interface StoredQueue {
  v: 1;
  userId: string;
  entries: QueueEntry[];
}

function isSessionLike(v: unknown): v is WorkoutSessionDTO {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<WorkoutSessionDTO>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    (s.status === 'in_progress' || s.status === 'paused') &&
    typeof s.startedAt === 'string' &&
    typeof s.pausedSeconds === 'number' &&
    Array.isArray(s.exercises) &&
    s.exercises.every((e) => e && typeof e.id === 'string' && Array.isArray(e.sets)) &&
    (s.restTimer == null || isValidTimerState(s.restTimer))
  );
}

export function readCachedSession(userId: string, now: number = Date.now()): CachedSession | null {
  const c = storage.get<CachedSession>(ACTIVE_SESSION_KEY);
  if (!c || c.v !== 1 || c.userId !== userId || typeof c.savedAt !== 'number' || now - c.savedAt > MAX_CACHE_AGE_MS) return null;
  if (!isSessionLike(c.session)) return null;
  return { ...c, skewMs: Number.isFinite(c.skewMs) ? c.skewMs : 0 };
}

export function writeCachedSession(userId: string, session: WorkoutSessionDTO | null, skewMs: number, now: number = Date.now()): void {
  if (!session || (session.status !== 'in_progress' && session.status !== 'paused')) {
    storage.remove(ACTIVE_SESSION_KEY);
    return;
  }
  const value: CachedSession = { v: 1, userId, savedAt: now, skewMs, session };
  storage.set(ACTIVE_SESSION_KEY, value);
}

export function readQueue(userId: string): QueueEntry[] {
  const q = storage.get<StoredQueue>(PENDING_UPDATES_KEY);
  if (!q || q.v !== 1 || q.userId !== userId || !Array.isArray(q.entries)) return [];
  return q.entries.filter(isQueueEntry);
}

export function writeQueue(userId: string, entries: QueueEntry[]): void {
  if (entries.length === 0) {
    storage.remove(PENDING_UPDATES_KEY);
    return;
  }
  const value: StoredQueue = { v: 1, userId, entries };
  storage.set(PENDING_UPDATES_KEY, value);
}

export function clearWorkoutStorage(): void {
  storage.remove(ACTIVE_SESSION_KEY);
  storage.remove(PENDING_UPDATES_KEY);
}

export function readTimerMuted(): boolean {
  return storage.get<boolean>(TIMER_MUTED_KEY) === true;
}

export function writeTimerMuted(muted: boolean): void {
  storage.set(TIMER_MUTED_KEY, muted);
}
