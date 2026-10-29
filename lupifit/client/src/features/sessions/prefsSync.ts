/**
 * Keeps the workout settings (wake lock, vibration, rest sound, auto-advance) the same on every device of
 * an account. Local-first: a switch works immediately and offline; the account copy is updated in the
 * background. On sign-in the account's copy wins unless this device has a change the account does not know
 * about yet, in which case this device's choices are uploaded. That only holds for the account the device's
 * settings belong to: on a shared device another account's choices are replaced, never uploaded.
 */
import { useEffect, useRef } from 'react';
import { DEFAULT_WORKOUT_PREFS, type WorkoutPrefsDTO } from '@shared/types';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { claimPrefs, clearPrefsDirty, isPrefsDirty, markPrefsDirty, onPrefsDirty, prefsOwner } from '../../lib/prefsDirty';
import { storage } from '../../lib/storage';
import { readPrefs, SESSION_PREFS_KEY, writePrefs } from './prefs';
import { readTimerMuted, TIMER_MUTED_KEY, writeTimerMuted } from './storage';

export function currentWorkoutPrefs(): WorkoutPrefsDTO {
  const p = readPrefs();
  return { wakeLock: p.wakeLock, vibrate: p.vibrate, autoAdvance: p.autoAdvance, restSound: !readTimerMuted() };
}

export function applyServerPrefs(p: WorkoutPrefsDTO): void {
  writePrefs({ wakeLock: p.wakeLock, vibrate: p.vibrate, autoAdvance: p.autoAdvance }, { fromServer: true });
  writeTimerMuted(!p.restSound, { fromServer: true });
}

const hasLocalChoices = () => storage.get(SESSION_PREFS_KEY) != null || storage.get(TIMER_MUTED_KEY) != null;
const PUSH_DELAY_MS = 800;

export function useWorkoutPrefsSync(): void {
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const serverPrefs = user?.workoutPrefs ?? null;
  const uploadedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushing = useRef(false);
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const push = useRef(async function pushPrefs(): Promise<void> {
    const uid = userIdRef.current;
    if (pushing.current || !uid || !isPrefsDirty(uid)) return;
    pushing.current = true;
    const prefs = currentWorkoutPrefs();
    try {
      await api('/settings', { method: 'PATCH', body: { workoutPrefs: prefs } });
      // Another account signed in on this device meanwhile: these values are not its settings.
      if (prefsOwner() !== uid) return;
      // Changed again while the request was in flight: stay dirty and send the newer values next.
      const after = currentWorkoutPrefs();
      const unchanged = JSON.stringify(after) === JSON.stringify(prefs);
      if (unchanged) clearPrefsDirty();
      setUserRef.current({ workoutPrefs: prefs });
      if (!unchanged) setTimeout(() => void pushPrefs(), 0);
    } catch {
      /* offline or a server hiccup: still dirty, retried on the next change, when online again and on the next start */
    } finally {
      pushing.current = false;
    }
  }).current;

  // Whenever the account's copy changes (sign-in, another device, a refetch on focus): adopt it, unless this
  // device has a change by this account that the account does not know about yet — then upload ours instead.
  useEffect(() => {
    if (!userId) return;
    const claim = claimPrefs(userId);
    if (isPrefsDirty(userId)) return void push();
    if (serverPrefs) {
      const server = { ...DEFAULT_WORKOUT_PREFS, ...serverPrefs };
      if (JSON.stringify(server) !== JSON.stringify(currentWorkoutPrefs())) applyServerPrefs(server);
    } else if (claim !== 'own') {
      // This account has none yet and the device's choices are another account's, or from before they had an
      // owner (whose cannot be told): never share them; this account starts from the defaults.
      if (hasLocalChoices()) applyServerPrefs(DEFAULT_WORKOUT_PREFS);
    } else if (hasLocalChoices() && uploadedFor.current !== userId) {
      // First device to customise anything: the account has nothing yet, so share this account's choices.
      uploadedFor.current = userId;
      markPrefsDirty();
      void push();
    }
  }, [userId, serverPrefs, push]);

  useEffect(() => {
    if (!userId) return;
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void push(), PUSH_DELAY_MS);
    };
    const offDirty = onPrefsDirty(schedule);
    const onOnline = () => void push();
    window.addEventListener('online', onOnline);
    return () => {
      offDirty();
      window.removeEventListener('online', onOnline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId, push]);
}
