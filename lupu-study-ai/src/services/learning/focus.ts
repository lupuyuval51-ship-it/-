/**
 * מצב ריכוז (פומודורו) מבוסס חותמות זמן: הזמן שנותר מחושב מהשעון ולא מספירת שניות,
 * ולכן הוא מדויק גם כשהלשונית ברקע וגם אחרי רענון. המצב נשמר ב-localStorage.
 */
export type FocusPhase = "focus" | "break";

export interface FocusState {
  phase: FocusPhase;
  status: "idle" | "running" | "paused";
  focusMinutes: number;
  breakMinutes: number;
  subjectId: string | null;
  /** כמה אלפיות שנייה של ריכוז נצברו בפועל במפגש הנוכחי (לא כולל הפסקות והשהיות) */
  focusedMs: number;
  /** חותמת התחלה של הקטע הרץ כעת */
  segmentStart: number | null;
  /** זמן שנצבר בקטע הנוכחי לפני השהיה */
  segmentElapsedMs: number;
  startedAt: string | null;
  /** מספר מחזורי ריכוז שהושלמו במפגש */
  cycles: number;
}

export const KEY = "lupu:focus:v1";

export const defaultFocus = (): FocusState => ({
  phase: "focus", status: "idle", focusMinutes: 25, breakMinutes: 5, subjectId: null, focusedMs: 0,
  segmentStart: null, segmentElapsedMs: 0, startedAt: null, cycles: 0,
});

export const segmentMs = (s: FocusState) => (s.phase === "focus" ? s.focusMinutes : s.breakMinutes) * 60_000;

export function elapsedInSegment(s: FocusState, now: number): number {
  return s.segmentElapsedMs + (s.status === "running" && s.segmentStart !== null ? now - s.segmentStart : 0);
}

export function remainingMs(s: FocusState, now: number): number {
  return Math.max(0, segmentMs(s) - elapsedInSegment(s, now));
}

export function start(s: FocusState, now: number): FocusState {
  if (s.status === "running") return s;
  return { ...s, status: "running", segmentStart: now, startedAt: s.startedAt ?? new Date(now).toISOString() };
}

export function pause(s: FocusState, now: number): FocusState {
  if (s.status !== "running") return s;
  return { ...s, status: "paused", segmentElapsedMs: elapsedInSegment(s, now), segmentStart: null };
}

/** מדביק את הזמן שנצבר בקטע הנוכחי לסיכום הריכוז (רק בקטעי ריכוז) */
function bank(s: FocusState, now: number): FocusState {
  return s.phase === "focus" ? { ...s, focusedMs: s.focusedMs + Math.min(elapsedInSegment(s, now), segmentMs(s)) } : s;
}

/** מעבר אוטומטי לקטע הבא כשהזמן נגמר: ריכוז → הפסקה → ריכוז */
export function advance(s: FocusState, now: number): FocusState {
  const banked = bank(s, now);
  const nextPhase: FocusPhase = s.phase === "focus" ? "break" : "focus";
  return {
    ...banked,
    phase: nextPhase,
    cycles: s.phase === "focus" ? s.cycles + 1 : s.cycles,
    status: "running",
    segmentStart: now,
    segmentElapsedMs: 0,
  };
}

export function skipBreak(s: FocusState, now: number): FocusState {
  if (s.phase !== "break") return s;
  return { ...s, phase: "focus", status: "running", segmentStart: now, segmentElapsedMs: 0 };
}

/** סיום המפגש: מחזיר את מספר דקות הריכוז האמיתיות, ואפס את המצב */
export function finish(s: FocusState, now: number): { minutes: number; cycles: number; startedAt: string | null; reset: FocusState } {
  const banked = bank(s, now);
  return {
    minutes: Math.round((banked.focusedMs / 60_000) * 10) / 10,
    cycles: s.cycles,
    startedAt: s.startedAt,
    reset: { ...defaultFocus(), focusMinutes: s.focusMinutes, breakMinutes: s.breakMinutes, subjectId: s.subjectId },
  };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
