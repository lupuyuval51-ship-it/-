import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_WORKOUT_PREFS, type WorkoutPrefsDTO } from '@shared/types';

const api = vi.fn();
const setUser = vi.fn();
let user: { id: string; workoutPrefs: WorkoutPrefsDTO | null } | null = null;
vi.mock('../../api/client', () => ({ api: (...a: unknown[]) => api(...a) }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user, setUser }) }));

import { isPrefsDirty } from '../../lib/prefsDirty';
import { readPrefs, resetPrefsCache, writePrefs } from './prefs';
import { currentWorkoutPrefs, useWorkoutPrefsSync } from './prefsSync';
import { readTimerMuted, writeTimerMuted } from './storage';

const server = (over: Partial<WorkoutPrefsDTO> = {}): WorkoutPrefsDTO => ({ wakeLock: true, vibrate: true, autoAdvance: true, restSound: true, ...over });

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  resetPrefsCache();
  api.mockReset().mockResolvedValue({});
  setUser.mockReset();
  user = { id: 'u1', workoutPrefs: null };
});
afterEach(() => vi.useRealTimers());

describe('useWorkoutPrefsSync', () => {
  it('adopts the account\'s settings on a device without local changes', () => {
    user = { id: 'u1', workoutPrefs: server({ wakeLock: false, restSound: false }) };
    renderHook(() => useWorkoutPrefsSync());
    expect(readPrefs().wakeLock).toBe(false);
    expect(readTimerMuted()).toBe(true);
    expect(isPrefsDirty()).toBe(false); // applying the account's copy is not a local change
    expect(api).not.toHaveBeenCalled();
  });

  it('uploads a change made on this device (debounced) and clears the unsynced mark', async () => {
    renderHook(() => useWorkoutPrefsSync());
    act(() => writePrefs({ vibrate: false }));
    expect(isPrefsDirty()).toBe(true);
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    expect(api).toHaveBeenCalledWith('/settings', { method: 'PATCH', body: { workoutPrefs: { wakeLock: true, vibrate: false, autoAdvance: true, restSound: true } } });
    expect(isPrefsDirty()).toBe(false);
    expect(setUser).toHaveBeenCalledWith({ workoutPrefs: expect.objectContaining({ vibrate: false }) });
  });

  it('keeps an offline change marked and retries it when the connection returns', async () => {
    renderHook(() => useWorkoutPrefsSync());
    api.mockRejectedValueOnce(new Error('offline'));
    act(() => writeTimerMuted(true));
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    expect(isPrefsDirty()).toBe(true);
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(api).toHaveBeenCalledTimes(2);
    expect(isPrefsDirty()).toBe(false);
  });

  it('does not let an older account copy overwrite a local change that was never uploaded', async () => {
    user = { id: 'u1', workoutPrefs: server({ vibrate: true }) };
    writePrefs({ vibrate: false });
    expect(isPrefsDirty()).toBe(true);
    renderHook(() => useWorkoutPrefsSync());
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(readPrefs().vibrate).toBe(false);
    expect(api).toHaveBeenCalledWith('/settings', expect.objectContaining({ body: { workoutPrefs: expect.objectContaining({ vibrate: false }) } }));
  });

  it('shares the choices of the first device when the account has none yet', async () => {
    window.localStorage.setItem('fitai.sessionPrefs.owner', JSON.stringify('u1')); // this account's choices
    window.localStorage.setItem('fitai.sessionPrefs', JSON.stringify({ wakeLock: false, vibrate: true, autoAdvance: true }));
    resetPrefsCache();
    renderHook(() => useWorkoutPrefsSync());
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
    expect(api).toHaveBeenCalledWith('/settings', { method: 'PATCH', body: { workoutPrefs: expect.objectContaining({ wakeLock: false }) } });
  });

  it('currentWorkoutPrefs mirrors the local switches and the rest sound', () => {
    writePrefs({ autoAdvance: false }, { fromServer: true });
    writeTimerMuted(true, { fromServer: true });
    expect(currentWorkoutPrefs()).toEqual({ wakeLock: true, vibrate: true, autoAdvance: false, restSound: false });
  });
});

describe('useWorkoutPrefsSync on a device shared by two accounts', () => {
  const settle = () => act(async () => void (await vi.advanceTimersByTimeAsync(1000)));

  /** Account `id` flips a switch while offline and signs out before the change reaches the account. */
  async function offlineChangeThenSignOut(id: string, patch: Parameters<typeof writePrefs>[0]) {
    user = { id, workoutPrefs: server() };
    api.mockRejectedValue(new Error('offline'));
    const hook = renderHook(() => useWorkoutPrefsSync());
    act(() => writePrefs(patch));
    await settle();
    hook.unmount();
    api.mockReset().mockResolvedValue({});
  }

  it("never uploads another account's unsynced change, in either direction", async () => {
    await offlineChangeThenSignOut('a', { vibrate: false });

    user = { id: 'b', workoutPrefs: server({ wakeLock: false }) };
    const b = renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(api).not.toHaveBeenCalled();
    expect(currentWorkoutPrefs()).toEqual(server({ wakeLock: false })); // B gets B's own settings
    b.unmount();

    // A's change was replaced on this device by B's settings, so A's next sign-in must not upload B's.
    user = { id: 'a', workoutPrefs: server() };
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(api).not.toHaveBeenCalled();
    expect(currentWorkoutPrefs()).toEqual(server());
  });

  it("does not share another account's choices with an account that has none yet", async () => {
    user = { id: 'a', workoutPrefs: null };
    const a = renderHook(() => useWorkoutPrefsSync());
    act(() => writePrefs({ wakeLock: false }));
    await settle();
    expect(api).toHaveBeenCalledTimes(1); // A's change reached A's account
    a.unmount();
    api.mockClear();

    user = { id: 'b', workoutPrefs: null };
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(api).not.toHaveBeenCalled();
    expect(currentWorkoutPrefs()).toEqual(DEFAULT_WORKOUT_PREFS); // B starts from the defaults, not from A's choices
    expect(isPrefsDirty()).toBe(false);
  });

  it('treats an unsynced mark from before marks were per account as not dirty and adopts the account copy', async () => {
    window.localStorage.setItem('fitai.sessionPrefs', JSON.stringify({ wakeLock: false, vibrate: false, autoAdvance: true }));
    window.localStorage.setItem('fitai.sessionPrefs.dirty', JSON.stringify(Date.now()));
    resetPrefsCache();
    user = { id: 'b', workoutPrefs: server({ autoAdvance: false }) };
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(api).not.toHaveBeenCalled();
    expect(currentWorkoutPrefs()).toEqual(server({ autoAdvance: false }));
    expect(isPrefsDirty()).toBe(false);
  });

  it.each([
    ['without an unsynced mark', null],
    ['with an unsynced mark from before marks were per account', JSON.stringify(Date.now())],
  ])("does not share settings from before they had an owner with an account that has none yet (%s)", async (_, mark) => {
    // Updated device: A's choices are still stored, but nothing says whose they are (A signed out before the update).
    window.localStorage.setItem('fitai.sessionPrefs', JSON.stringify({ wakeLock: false, vibrate: false, autoAdvance: false }));
    window.localStorage.setItem('fitai.restTimer.muted', 'true');
    if (mark) window.localStorage.setItem('fitai.sessionPrefs.dirty', mark);
    resetPrefsCache();
    user = { id: 'b', workoutPrefs: null };
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(api).not.toHaveBeenCalled();
    expect(currentWorkoutPrefs()).toEqual(DEFAULT_WORKOUT_PREFS); // B starts from the defaults, not from A's choices
    expect(isPrefsDirty()).toBe(false);
  });

  it('shares a change made before any account signed in with the first account', async () => {
    window.localStorage.setItem('fitai.sessionPrefs', JSON.stringify({ wakeLock: false, vibrate: true, autoAdvance: true }));
    window.localStorage.setItem('fitai.sessionPrefs.dirty', JSON.stringify({ v: 1, userId: null, at: Date.now() }));
    resetPrefsCache();
    user = { id: 'b', workoutPrefs: null };
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(api).toHaveBeenCalledWith('/settings', { method: 'PATCH', body: { workoutPrefs: expect.objectContaining({ wakeLock: false }) } });
    expect(isPrefsDirty()).toBe(false);
  });

  it("does not hand an upload that finishes after another account signed in to that account", async () => {
    user = { id: 'a', workoutPrefs: server() };
    let finish!: (v: unknown) => void;
    api.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const a = renderHook(() => useWorkoutPrefsSync());
    act(() => writePrefs({ vibrate: false }));
    await settle(); // A's upload is still on its way
    a.unmount();

    user = { id: 'b', workoutPrefs: server({ wakeLock: false }) };
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    await act(async () => {
      finish({});
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(setUser).not.toHaveBeenCalled(); // A's values never become B's "account copy"
    expect(api).toHaveBeenCalledTimes(1);
    expect(currentWorkoutPrefs()).toEqual(server({ wakeLock: false }));
  });

  it("still uploads the same account's offline change after it signs out and back in", async () => {
    await offlineChangeThenSignOut('a', { vibrate: false });
    user = { id: 'a', workoutPrefs: server() }; // the account still has the older copy
    renderHook(() => useWorkoutPrefsSync());
    await settle();
    expect(readPrefs().vibrate).toBe(false);
    expect(api).toHaveBeenCalledWith('/settings', { method: 'PATCH', body: { workoutPrefs: expect.objectContaining({ vibrate: false }) } });
    expect(isPrefsDirty()).toBe(false);
  });
});
