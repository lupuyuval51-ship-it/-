import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { readDraft, removeDraft, writeDraft } from '../lib/drafts';

/**
 * `useState` whose value is also kept on this device while it differs from `initial`, so an unfinished
 * form survives a reload. Returns `[value, setValue, clear]`; call `clear()` after a successful submit.
 * With `enabled: false` (editing an existing record, prefilled forms) it is a plain `useState`.
 */
export function useDraft<T>(key: string, initial: T, opts: { enabled?: boolean } = {}): readonly [T, Dispatch<SetStateAction<T>>, () => void] {
  const { user } = useAuth();
  const userId = user?.id;
  const enabled = (opts.enabled ?? true) && !!userId;
  const initialRef = useRef(initial);
  const initialJson = useRef(JSON.stringify(initial));
  const [value, setValue] = useState<T>(() => (enabled && userId ? (readDraft<T>(userId, key) ?? initial) : initial));

  useEffect(() => {
    if (!enabled || !userId) return;
    if (JSON.stringify(value) === initialJson.current) removeDraft(userId, key);
    else writeDraft(userId, key, value);
  }, [enabled, userId, key, value]);

  const clear = useCallback(() => {
    if (userId) removeDraft(userId, key);
    setValue(initialRef.current);
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
