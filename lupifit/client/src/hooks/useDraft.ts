import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { readDraft, removeDraft, writeDraft } from '../lib/drafts';

/** The value for one stored draft (user + key), with the initial value it is compared against. */
interface DraftSlot<T> {
  id: string;
  value: T;
  initial: T;
  initialJson: string;
}

/**
 * `useState` whose value is also kept on this device while it differs from `initial`, so an unfinished
 * form survives a reload. Returns `[value, setValue, clear]`; call `clear()` after a successful submit.
 * With `enabled: false` (editing an existing record, prefilled forms) it is a plain `useState`.
 * When `key` changes (e.g. `menu.<date>` after moving to another day) the value becomes that key's stored
 * draft (or `initial`): the previous key's value is never carried over or written under the new key.
 */
export function useDraft<T>(key: string, initial: T, opts: { enabled?: boolean } = {}): readonly [T, Dispatch<SetStateAction<T>>, () => void] {
  const { user } = useAuth();
  const userId = user?.id;
  const enabled = (opts.enabled ?? true) && !!userId;
  const id = JSON.stringify([userId ?? null, key]);
  const load = (): DraftSlot<T> => ({
    id,
    value: enabled && userId ? (readDraft<T>(userId, key) ?? initial) : initial,
    initial,
    initialJson: JSON.stringify(initial),
  });
  const [stored, setSlot] = useState<DraftSlot<T>>(load);
  let slot = stored;
  if (stored.id !== id) {
    // Another key or user: switch to that draft during render, so no effect ever sees the old value with the new key.
    slot = load();
    setSlot(slot);
  }

  const { value, initialJson } = slot;
  useEffect(() => {
    if (!enabled || !userId) return;
    if (JSON.stringify(value) === initialJson) removeDraft(userId, key);
    else writeDraft(userId, key, value);
  }, [enabled, userId, key, value, initialJson]);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) =>
      setSlot((s) => {
        const next = typeof action === 'function' ? (action as (prev: T) => T)(s.value) : action;
        return Object.is(next, s.value) ? s : { ...s, value: next };
      }),
    [],
  );

  const clear = useCallback(() => {
    if (userId) removeDraft(userId, key);
    setSlot((s) => (Object.is(s.value, s.initial) ? s : { ...s, value: s.initial }));
  }, [userId, key]);

  return [value, setValue, clear] as const;
}

/** Removes a stored draft from outside the component that owns it (e.g. after a successful create elsewhere). */
export function useClearDraft(): (key: string) => void {
  const { user } = useAuth();
  const userId = user?.id;
  return useCallback((key: string) => {
    if (userId) removeDraft(userId, key);
  }, [userId]);
}
