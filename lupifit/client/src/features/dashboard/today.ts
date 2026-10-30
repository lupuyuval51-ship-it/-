/** "What should I do today" logic for the dashboard (pure; derived only from stored dashboard data). */
import type { DashboardDTO } from '@shared/types';

type TodayInput = Pick<DashboardDTO, 'today' | 'activePlan' | 'nextWorkout' | 'activeSession' | 'weeklyGoal' | 'weekDays'>;

export type WeekStatus = 'met' | 'relaxed' | 'tight' | 'out_of_reach';

export interface WeekOutlook {
  remaining: number;
  /** Days left in the week including today. */
  daysLeft: number;
  trainedToday: boolean;
  status: WeekStatus;
}

export function weekOutlook(data: Pick<DashboardDTO, 'today' | 'weeklyGoal' | 'weekDays'>): WeekOutlook {
  const remaining = Math.max(0, data.weeklyGoal.target - data.weeklyGoal.completed);
  const todayEntry = data.weekDays.find((d) => d.date === data.today);
  const trainedToday = (todayEntry?.workouts ?? 0) > 0;
  // A day already trained cannot be trained "again" for the goal, so it only counts while still open.
  const daysLeft = data.weekDays.filter((d) => d.date > data.today || (d.date === data.today && !trainedToday)).length;
  let status: WeekStatus;
  if (data.weeklyGoal.met || remaining === 0) status = 'met';
  else if (remaining > daysLeft) status = 'out_of_reach';
  else if (remaining === daysLeft) status = 'tight';
  else status = 'relaxed';
  return { remaining, daysLeft, trainedToday, status };
}

export type TodayKind = 'resume' | 'start' | 'trained' | 'no_plan' | 'empty_plan';

export interface TodayPlan {
  kind: TodayKind;
  /** The day is a planned rest day (preferred training days); training stays available as the secondary action. */
  restDay: boolean;
  /** i18n key suffix under `dashboard.today.reason.*` explaining the suggestion. */
  reason:
    | 'resume'
    | 'tight'
    | 'relaxed'
    | 'goalMet'
    | 'trainedToday'
    | 'trainedTodayMet'
    | 'noPlan'
    | 'emptyPlan'
    | 'outOfReach'
    | 'restDayScheduled'
    | 'avoidBackToBack';
  outlook: WeekOutlook;
}

/**
 * Single recommendation for today:
 * - an open workout always wins (resume);
 * - after a workout today the answer is "recover / eat well", with the next one one tap away;
 * - otherwise start the suggested plan day, and say why: a planned rest day (preferred days), a day chosen to
 *   avoid loading yesterday's muscles again, the goal pace, or the goal already being met.
 */
export function todayPlan(data: TodayInput): TodayPlan {
  const outlook = weekOutlook(data);
  const met = outlook.status === 'met';
  if (data.activeSession) return { kind: 'resume', restDay: false, reason: 'resume', outlook };
  if (!data.activePlan) return { kind: 'no_plan', restDay: false, reason: 'noPlan', outlook };
  if (!data.nextWorkout) return { kind: 'empty_plan', restDay: false, reason: 'emptyPlan', outlook };
  if (outlook.trainedToday) return { kind: 'trained', restDay: false, reason: met ? 'trainedTodayMet' : 'trainedToday', outlook };
  if (met) return { kind: 'start', restDay: false, reason: 'goalMet', outlook };
  const schedule = data.nextWorkout.schedule.code;
  if (schedule === 'rest_day_scheduled') return { kind: 'start', restDay: true, reason: 'restDayScheduled', outlook };
  if (outlook.status === 'tight') return { kind: 'start', restDay: false, reason: 'tight', outlook };
  if (outlook.status === 'out_of_reach') return { kind: 'start', restDay: false, reason: 'outOfReach', outlook };
  if (schedule === 'avoid_back_to_back') return { kind: 'start', restDay: false, reason: 'avoidBackToBack', outlook };
  return { kind: 'start', restDay: false, reason: 'relaxed', outlook };
}

export interface StartStep {
  key: 'plan' | 'workout' | 'meal';
  done: boolean;
}

/** Getting-started checklist for brand-new users; null once they have trained (it is no longer needed). */
export function gettingStarted(data: Pick<DashboardDTO, 'activePlan' | 'lastWorkout' | 'nutritionToday'>): StartStep[] | null {
  if (data.lastWorkout) return null;
  return [
    { key: 'plan', done: !!data.activePlan },
    { key: 'workout', done: false },
    { key: 'meal', done: data.nutritionToday.entryCount > 0 },
  ];
}
