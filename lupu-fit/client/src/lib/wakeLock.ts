/** Screen Wake Lock while the workout is open. Re-acquired when the tab becomes visible again; silent when unsupported. */
import { useEffect } from 'react';

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const held: { s: WakeLockSentinel | null } = { s: null };
    let cancelled = false;
    const acquire = async (): Promise<void> => {
      try {
        if (typeof navigator === 'undefined' || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) { void s.release().catch(() => undefined); return; }
        held.s = s;
      } catch { /* denied (battery saver, permissions policy): degrade silently */ }
    };
    const onVisible = (): void => { if (document.visibilityState === 'visible' && (!held.s || held.s.released)) void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      try { void held.s?.release().catch(() => undefined); } catch { /* ignore */ }
      held.s = null;
    };
  }, [active]);
}
