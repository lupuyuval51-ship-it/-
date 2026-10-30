import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { readReadyPrefs, writeReadyPrefs, type ReadyPrefs } from './prefs';

/**
 * The signed-in user's saved ready-workout choices. `update` merges a patch, keeps the result on this device
 * and returns nothing; with no user (signed out) the choices only live as long as the page.
 * When the user changes, the other user's choices are never carried over.
 */
export function useReadyPrefs() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [slot, setSlot] = useState(() => ({ userId, prefs: readReadyPrefs(userId) }));
  let current = slot;
  if (slot.userId !== userId) {
    current = { userId, prefs: readReadyPrefs(userId) };
    setSlot(current);
  }
  // Two quick updates in one event must both land, so the latest value is read from a ref, not from state.
  const latest = useRef(current.prefs);
  latest.current = current.prefs;

  const update = useCallback(
    (patch: Partial<ReadyPrefs>) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      setSlot({ userId, prefs: next });
      writeReadyPrefs(userId, next);
    },
    [userId],
  );

  return { prefs: current.prefs, update };
}
