import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutPrefsDTO } from '@shared/types';

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
