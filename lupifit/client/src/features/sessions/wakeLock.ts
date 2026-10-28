/**
 * Screen Wake Lock: keeps the phone awake during a workout (no unlocking with sweaty
 * hands between sets). Supported browsers only; the lock is released by the browser
 * whenever the tab is hidden, so it is requested again when the tab becomes visible.
 */
import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
}
interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/** Holds a screen wake lock while `active`. Returns whether the lock is currently held. */
export function useWakeLock(active: boolean): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!active || !wakeLockSupported()) {
      setHeld(false);
      return;
    }
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        const s = await (navigator as unknown as { wakeLock: WakeLockApi }).wakeLock.request('screen');
        if (cancelled) {
          void s.release().catch(() => undefined);
          return;
        }
        sentinel = s;
        setHeld(true);
        s.addEventListener('release', () => {
          if (sentinel === s) sentinel = null;
          if (!cancelled) setHeld(false);
        });
      } catch {
        setHeld(false);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      const s = sentinel;
      sentinel = null;
      if (s) void s.release().catch(() => undefined);
      setHeld(false);
    };
  }, [active]);
  return held;
}
