/**
 * Per-device workout preferences (localStorage, never the source of truth): keep the
 * screen awake, vibrate when a rest ends and jump to the next exercise automatically.
 * The rest-timer sound has its own mute flag in `storage.ts`.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { markPrefsDirty } from '../../lib/prefsDirty';
import { storage } from '../../lib/storage';

export const SESSION_PREFS_KEY = 'fitai.sessionPrefs';

export interface SessionPrefs {
  wakeLock: boolean;
  vibrate: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_PREFS: SessionPrefs = { wakeLock: true, vibrate: true, autoAdvance: true };

let cache: SessionPrefs | null = null;
const listeners = new Set<() => void>();

export function readPrefs(): SessionPrefs {
  if (cache) return cache;
  const stored = storage.get<Partial<SessionPrefs>>(SESSION_PREFS_KEY);
  cache = {
    wakeLock: typeof stored?.wakeLock === 'boolean' ? stored.wakeLock : DEFAULT_PREFS.wakeLock,
    vibrate: typeof stored?.vibrate === 'boolean' ? stored.vibrate : DEFAULT_PREFS.vibrate,
    autoAdvance: typeof stored?.autoAdvance === 'boolean' ? stored.autoAdvance : DEFAULT_PREFS.autoAdvance,
  };
  return cache;
}

/** `fromServer` applies the account's copy without marking it as an unsynced local change. */
export function writePrefs(patch: Partial<SessionPrefs>, opts: { fromServer?: boolean } = {}): void {
  cache = { ...readPrefs(), ...patch };
  storage.set(SESSION_PREFS_KEY, cache);
  listeners.forEach((l) => l());
  if (!opts.fromServer) markPrefsDirty();
}

/** Test helper: forget the in-memory copy so the next read goes to storage. */
export function resetPrefsCache(): void {
  cache = null;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSessionPrefs(): [SessionPrefs, (patch: Partial<SessionPrefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, readPrefs, readPrefs);
  const update = useCallback((patch: Partial<SessionPrefs>) => writePrefs(patch), []);
  return [prefs, update];
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
