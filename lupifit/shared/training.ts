/** Pure training math shared by server and client. */

/**
 * Estimated one-rep max using the Epley formula. Accurate enough for 1–12 reps;
 * returns null outside that range (high-rep sets give unreliable estimates).
 */
export function estimateOneRepMax(weightKg: number | null | undefined, reps: number | null | undefined): number | null {
  if (!weightKg || !reps || weightKg <= 0 || reps <= 0) return null;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  if (reps > 12) return null;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export function setVolumeKg(weightKg: number | null | undefined, reps: number | null | undefined): number {
  if (!weightKg || !reps || weightKg <= 0 || reps <= 0) return 0;
  return Math.round(weightKg * reps * 100) / 100;
}

/** Elapsed active time of a workout session, excluding paused time. */
export function activeElapsedSeconds(
  session: { startedAt: string; pausedAt: string | null; pausedSeconds: number; endedAt?: string | null },
  nowMs: number,
): number {
  const start = Date.parse(session.startedAt);
  const end = session.endedAt ? Date.parse(session.endedAt) : session.pausedAt ? Date.parse(session.pausedAt) : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000) - session.pausedSeconds);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const KG_PER_LB = 0.45359237;
export const kgToLb = (kg: number) => Math.round((kg / KG_PER_LB) * 10) / 10;
export const lbToKg = (lb: number) => Math.round(lb * KG_PER_LB * 100) / 100;
export const cmToFtIn = (cm: number) => {
  const totalIn = cm / 2.54;
  return { ft: Math.floor(totalIn / 12), in: Math.round(totalIn % 12) };
};
