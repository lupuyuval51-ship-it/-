/**
 * Marks workout settings changed on this device that the account does not have yet (set when the user
 * flips a switch, cleared once the server has them), so a change made offline is pushed later instead of
 * being overwritten by the account's older copy.
 *
 * The settings are stored once per device, so they belong to one account at a time: the "owner", the
 * account signed in when they were last changed or adopted (`claimPrefs` on every sign-in). A mark carries
 * the owner's id and only ever counts for that account, so a different account signing in on the same
 * device never uploads them.
 */
import { storage } from './storage';

const KEY = 'fitai.sessionPrefs.dirty';
const OWNER_KEY = 'fitai.sessionPrefs.owner';
const listeners = new Set<() => void>();

/** `userId` is null only for a change made before any account signed in on this device. */
interface DirtyMark {
  v: 1;
  userId: string | null;
  at: number;
}

/** A bare timestamp is the device-wide mark from before marks were per account: not dirty for anyone. */
function readMark(): DirtyMark | null {
  const m = storage.get<DirtyMark>(KEY);
  return m && typeof m === 'object' && m.v === 1 && (typeof m.userId === 'string' || m.userId === null) ? m : null;
}

/** The account the device's workout settings belong to (null before any account signed in here). */
export function prefsOwner(): string | null {
  const o = storage.get<string>(OWNER_KEY);
  return typeof o === 'string' ? o : null;
}

/** Whether `userId` (default: the device's owner) changed the settings here and the account lacks it. */
export function isPrefsDirty(userId: string | null = prefsOwner()): boolean {
  const m = readMark();
  return m != null && m.userId === userId;
}

export function markPrefsDirty(): void {
  storage.set(KEY, { v: 1, userId: prefsOwner(), at: Date.now() } satisfies DirtyMark);
  for (const l of listeners) l();
}

export const clearPrefsDirty = () => storage.remove(KEY);

/**
 * Hands the device's settings to `userId`, who just signed in:
 * - `own`: they already belong to this account;
 * - `claimed`: nobody's yet (a new device, or values from before settings had an owner). A change made
 *   before any account signed in becomes this account's; a device-wide mark from the older format is
 *   dropped, so the account's copy is adopted;
 * - `foreign`: another account's. Its unsynced mark is dropped (this account replaces the values) and the
 *   values must not be shared with this account.
 */
export function claimPrefs(userId: string): 'own' | 'claimed' | 'foreign' {
  const owner = prefsOwner();
  if (owner === userId) return 'own';
  storage.set(OWNER_KEY, userId);
  const mark = readMark();
  if (owner == null && mark?.userId === null) storage.set(KEY, { ...mark, userId } satisfies DirtyMark);
  else storage.remove(KEY);
  return owner == null ? 'claimed' : 'foreign';
}

export function onPrefsDirty(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
