/**
 * Training streak. A session extends the streak when it happens within 3 days of the previous one,
 * or when it is a planned session completed on/before its date (postponed sessions completed within
 * 7 days of the planned date keep the streak). The streak is never punitive in tone.
 */
import type { CompletedSession, Localized, PlannedSession } from "@/lib/types";
import { daysBetween, toDateKey } from "@/lib/dates";

export const STREAK_GAP_DAYS = 3;
export const STREAK_PLANNED_GRACE_DAYS = 7;

export interface StreakInfo {
  current: number;
  best: number;
  lastSessionDate?: string;
  /** Days left (from `now`) before the current streak would break; 0 when there is no live streak. */
  graceDaysLeft: number;
  message: Localized;
}

interface DatedSession {
  date: string;
  session: CompletedSession;
  planned?: PlannedSession;
}

function sessionDate(s: CompletedSession): string {
  const d = new Date(s.completedAt || s.startedAt);
  return Number.isNaN(d.getTime()) ? toDateKey() : toDateKey(d);
}

/** True when session `b` continues a streak that ended with session `a`. */
function linked(a: DatedSession, b: DatedSession): boolean {
  const gap = daysBetween(a.date, b.date);
  if (gap < 0) return false;
  if (gap <= STREAK_GAP_DAYS) return true;
  if (b.planned) {
    const fromPlanned = daysBetween(b.planned.date, b.date);
    // completed on/before its planned date, or postponed and completed within the grace window
    if (fromPlanned <= STREAK_PLANNED_GRACE_DAYS) return true;
  }
  return false;
}

export function computeStreak(completed: CompletedSession[], planned: PlannedSession[], now: Date): StreakInfo {
  const plannedById = new Map<string, PlannedSession>();
  for (const p of planned) if (!p.deletedAt) plannedById.set(p.id, p);

  const sessions: DatedSession[] = completed
    .filter((s) => !s.deletedAt)
    .map((session) => ({ date: sessionDate(session), session, planned: session.plannedSessionId ? plannedById.get(session.plannedSessionId) : undefined }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.session.completedAt.localeCompare(b.session.completedAt)));

  if (sessions.length === 0) {
    return {
      current: 0,
      best: 0,
      graceDaysLeft: 0,
      message: { he: "הרצף מתחיל עם האימון הראשון שלכם", en: "Your streak starts with your first workout" },
    };
  }

  // Walk the chain; several sessions on the same day count once.
  let run = 0;
  let best = 0;
  let prev: DatedSession | undefined;
  let prevDay: string | undefined;
  for (const s of sessions) {
    if (prevDay === s.date) {
      prev = s;
      continue;
    }
    if (!prev || !linked(prev, s)) run = 1;
    else run += 1;
    best = Math.max(best, run);
    prev = s;
    prevDay = s.date;
  }

  const last = sessions[sessions.length - 1];
  const todayKey = toDateKey(now);
  const daysSinceLast = daysBetween(last.date, todayKey);

  // The streak stays alive for 3 days after the last session, or until 7 days after the *next* planned
  // session (the earliest open planned session after the last workout).
  let deadline = daysSinceLast <= STREAK_GAP_DAYS ? STREAK_GAP_DAYS - daysSinceLast : -1;
  let nextPlanned: PlannedSession | undefined;
  for (const p of plannedById.values()) {
    if (p.restDay || p.status === "cancelled" || p.status === "replaced" || p.status === "completed" || p.completedSessionId) continue;
    if (p.date <= last.date) continue;
    if (!nextPlanned || p.date < nextPlanned.date) nextPlanned = p;
  }
  if (nextPlanned) {
    const left = daysBetween(todayKey, nextPlanned.date) + STREAK_PLANNED_GRACE_DAYS;
    if (left > deadline) deadline = left;
  }
  const alive = deadline >= 0;
  const current = alive ? run : 0;
  const graceDaysLeft = alive ? deadline : 0;

  let message: Localized;
  if (!alive) {
    message = { he: "חוזרים למסלול עם האימון הבא", en: "Back on track with the next workout" };
  } else if (current === 1) {
    message = { he: "אימון ראשון ברצף – האימון הבא ימשיך אותו", en: "First workout of a streak – the next one keeps it going" };
  } else {
    message = { he: `רצף של ${current} אימונים – ממשיכים!`, en: `${current}-workout streak – keep it going!` };
  }

  return { current, best, lastSessionDate: last.date, graceDaysLeft, message };
}
