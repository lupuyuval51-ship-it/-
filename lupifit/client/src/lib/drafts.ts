/**
 * Form drafts kept on this device only, per signed-in user: what someone typed but has not submitted
 * survives a reload, a closed tab or a lost connection, and expires after a few days. Never the source of
 * truth; cleared on logout (shared devices) and whenever the form is submitted.
 */
import { storage } from './storage';

const PREFIX = 'fitai.draft.';
export const DRAFT_TTL_MS = 3 * 24 * 60 * 60 * 1000;

interface StoredDraft<T> {
  v: 1;
  savedAt: number;
  value: T;
}

const fullKey = (userId: string, key: string) => `${PREFIX}${userId}.${key}`;

export function readDraft<T>(userId: string, key: string, now: number = Date.now()): T | null {
  const d = storage.get<StoredDraft<T>>(fullKey(userId, key));
  if (!d || d.v !== 1 || typeof d.savedAt !== 'number' || now - d.savedAt > DRAFT_TTL_MS) return null;
  return d.value;
}

export function writeDraft<T>(userId: string, key: string, value: T, now: number = Date.now()): void {
  storage.set(fullKey(userId, key), { v: 1, savedAt: now, value } satisfies StoredDraft<T>);
}

export function removeDraft(userId: string, key: string): void {
  storage.remove(fullKey(userId, key));
}

/** Drops every draft of every user on this device (logout). */
export function clearAllDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
