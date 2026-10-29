/**
 * Marks workout settings changed on this device that the account does not have yet (set when the user
 * flips a switch, cleared once the server has them), so a change made offline is pushed later instead of
 * being overwritten by the account's older copy.
 */
import { storage } from './storage';

const KEY = 'fitai.sessionPrefs.dirty';
const listeners = new Set<() => void>();

export const isPrefsDirty = () => storage.get<number>(KEY) != null;

export function markPrefsDirty(): void {
  storage.set(KEY, Date.now());
  for (const l of listeners) l();
}

export const clearPrefsDirty = () => storage.remove(KEY);

export function onPrefsDirty(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
