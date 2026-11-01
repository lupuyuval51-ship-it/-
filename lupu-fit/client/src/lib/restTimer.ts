/** Rest timer: wall-clock based (survives reload / background throttling) and persisted per workout in localStorage. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { videoStore } from './videoState.ts';

export const restKey = (id: string): string => `lf_rest_${id}`;
export const remainingSec = (endsAtEpochMs: number, now: number): number => Math.max(0, Math.ceil((endsAtEpochMs - now) / 1000));

/** Stored end time, or null when nothing is stored, the value is malformed or the rest already ended while away. */
export function loadRestEnd(id: string, now: number = Date.now()): number | null {
  try {
    const raw = localStorage.getItem(restKey(id));
    if (!raw) return null;
    const v = (JSON.parse(raw) as { restEndsAtEpochMs?: unknown }).restEndsAtEpochMs;
    return typeof v === 'number' && Number.isFinite(v) && v > now ? v : null;
  } catch { return null; }
}
export function saveRestEnd(id: string, endsAtEpochMs: number | null): void {
  try {
    if (endsAtEpochMs === null) localStorage.removeItem(restKey(id));
    else localStorage.setItem(restKey(id), JSON.stringify({ restEndsAtEpochMs: endsAtEpochMs }));
  } catch { /* storage unavailable: the timer still works in memory */ }
}

function chime(): void {
  try {
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 880; gain.gain.value = 0.15;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => { void ctx.close().catch(() => undefined); };
  } catch { /* audio blocked or unsupported */ }
}

async function notify(title: string, body: string): Promise<void> {
  try {
    const spec = '@capacitor/local-notifications'; // not installed on web: the import fails and we fall through
    const mod = (await import(/* @vite-ignore */ spec)) as { LocalNotifications: { schedule: (o: unknown) => Promise<unknown> } };
    await mod.LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() % 2_000_000_000), title, body }] });
    return;
  } catch { /* fall back to the web API */ }
  try {
    // Never prompt automatically: only use the Notification API when permission was already granted.
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body });
  } catch { /* ignore */ }
}

export function alertRestEnd(title: string, body: string): void {
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
  chime();
  void notify(title, body);
}

export interface RestTimer { remaining: number | null; start: (sec: number) => void; adjust: (deltaSec: number) => void; skip: () => void }

export function useRestTimer(workoutId: string, onEnd?: () => void): RestTimer {
  const [end, setEnd] = useState<number | null>(() => loadRestEnd(workoutId));
  const [now, setNow] = useState<number>(() => Date.now());
  const onEndRef = useRef(onEnd); onEndRef.current = onEnd;

  const set = useCallback((v: number | null) => { saveRestEnd(workoutId, v); setNow(Date.now()); setEnd(v); }, [workoutId]);
  const start = useCallback((sec: number) => { if (sec > 0) set(Date.now() + sec * 1000); }, [set]);
  const skip = useCallback(() => set(null), [set]);
  const adjust = useCallback((delta: number) => {
    setEnd((cur) => { const base = cur ?? Date.now(); const next = base + delta * 1000; const v = next <= Date.now() ? null : next; saveRestEnd(workoutId, v); return v; });
    setNow(Date.now());
  }, [workoutId]);

  useEffect(() => {
    if (end === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [end]);

  useEffect(() => {
    if (end !== null && now >= end) { saveRestEnd(workoutId, null); setEnd(null); onEndRef.current?.(); }
  }, [end, now, workoutId]);

  useEffect(() => { videoStore.setRestActive(end !== null); }, [end]);
  useEffect(() => () => { videoStore.setRestActive(false); }, []);

  return { remaining: end === null ? null : remainingSec(end, now), start, adjust, skip };
}
