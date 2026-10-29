/**
 * "Which workout today?" (pure, shared by server and client).
 *
 * The plan is a rotation (`nextIndex`). On top of it we only ever give advice, never block:
 *  1. back-to-back guard: if yesterday's session loaded the same body regions as the next plan day,
 *     suggest a day that does not: the one done least recently, ties in rotation order after the next
 *     day (in a plain rotation that is simply the first following day that does not overlap);
 *  2. scheduled rest: if the user named preferred training days, today is not one of them and the
 *     weekly goal is still reachable on the preferred days left this week, say today is a rest day.
 * Training anyway is always possible and starts `workoutIndex`.
 *
 * The rotation only moves on when its next day is done (`advanceRotation`): a day that stood in for
 * it leaves it next, so a skipped day is never dropped from the rotation.
 */
import { addDays, dayOfWeek, diffDays } from './dates';
import { regionsOverlap } from './split';

export type ScheduleReasonCode = 'rotation' | 'preferred_day' | 'rest_day_scheduled' | 'avoid_back_to_back';

export interface ScheduleInput {
  today: string;
  /** Weekdays (0 = Sunday … 6) the user prefers to train on; empty = no preference. */
  preferredDays: number[];
  /**
   * Plan days in rotation order, with when each was last completed (ISO timestamp; null/absent =
   * never or unknown).
   */
  days: { focus: string; lastDoneAt?: string | null; /** False for a day with no exercises (it is never suggested as a stand-in). */ startable?: boolean }[];
  nextIndex: number;
  /** Last completed workout: its date in the user's time zone and the plan day's focus (null if unknown/empty session). */
  last: { date: string; focus: string | null } | null;
  /** Qualifying workouts still missing for this week's goal. */
  weekRemaining: number;
  /** Dates of this week that are strictly after today. */
  futureWeekDates: string[];
  trainedToday: boolean;
}

export interface ScheduleRecommendation {
  /** Plan day to start now (index into `days`). */
  workoutIndex: number;
  code: ScheduleReasonCode;
  /** Set when `code` is `avoid_back_to_back`: the focus that was skipped. */
  skippedFocus: string | null;
  /** Set when `code` is `rest_day_scheduled`: the next preferred training date this week. */
  nextTrainingDate: string | null;
}

export function recommendToday(input: ScheduleInput): ScheduleRecommendation {
  const n = input.days.length;
  const base = n ? ((input.nextIndex % n) + n) % n : 0;
  let workoutIndex = base;
  let code: ScheduleReasonCode = input.preferredDays.length ? 'preferred_day' : 'rotation';
  let skippedFocus: string | null = null;
  let nextTrainingDate: string | null = null;
  if (!n) return { workoutIndex: 0, code: 'rotation', skippedFocus, nextTrainingDate };

  const yesterdayFocus =
    input.last?.focus && !input.trainedToday && diffDays(input.today, input.last.date) === 1 ? input.last.focus : null;
  if (yesterdayFocus && n > 1 && regionsOverlap(yesterdayFocus, input.days[base]!.focus)) {
    // The skipped day stays next in the rotation (`advanceRotation`), so it can wait several days;
    // picking the stand-in that waited longest keeps the other days taking turns meanwhile.
    let best = -1;
    for (let step = 1; step < n; step++) {
      const j = (base + step) % n;
      if (input.days[j]!.startable === false || regionsOverlap(yesterdayFocus, input.days[j]!.focus)) continue;
      if (best < 0 || (input.days[j]!.lastDoneAt ?? '') < (input.days[best]!.lastDoneAt ?? '')) best = j;
    }
    if (best >= 0) {
      workoutIndex = best;
      code = 'avoid_back_to_back';
      skippedFocus = input.days[base]!.focus;
    }
  }

  if (code !== 'avoid_back_to_back' && input.preferredDays.length && !input.trainedToday && input.weekRemaining > 0) {
    const preferred = new Set(input.preferredDays);
    if (!preferred.has(dayOfWeek(input.today))) {
      const upcoming = input.futureWeekDates.filter((d) => preferred.has(dayOfWeek(d)));
      // Rest only while the goal stays reachable using preferred days alone.
      if (upcoming.length >= input.weekRemaining) {
        code = 'rest_day_scheduled';
        nextTrainingDate = upcoming[0] ?? null;
      }
    }
  }
  return { workoutIndex, code, skippedFocus, nextTrainingDate };
}

/**
 * Rotation pointer after finishing plan day `finishedIndex`. Only finishing the rotation's next day
 * moves it on; any other day (a stand-in suggested by the back-to-back guard, or a day picked by hand)
 * leaves the next day waiting instead of jumping past it.
 */
export function advanceRotation(nextIndex: number, finishedIndex: number, dayCount: number): number {
  if (dayCount <= 0) return 0;
  const current = ((nextIndex % dayCount) + dayCount) % dayCount;
  return finishedIndex === current ? (current + 1) % dayCount : current;
}

/** Dates of the week (Sunday- or Monday-based) that come after `today`. */
export function futureDatesOfWeek(today: string, weekStart: string): string[] {
  const out: string[] = [];
  for (let d = addDays(today, 1); diffDays(d, weekStart) < 7; d = addDays(d, 1)) out.push(d);
  return out;
}
