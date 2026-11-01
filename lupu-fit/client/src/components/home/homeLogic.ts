import { isoWeekKey, MEAL_SLOTS, type MealSlot, type PlannedDay } from '@lupu-fit/shared';

export interface SessionRow { id: string; name: string; source?: string | null; sourceId?: string | null; localDate: string; finishedAt?: string | null }
export interface PlanRow { id: string; name: string; active: boolean; archived: boolean; plan: { days?: PlannedDay[] } | Record<string, unknown> }

/** Finished sessions that fall into the same ISO week as `today`. */
export const sessionsThisWeek = (sessions: readonly SessionRow[], today: string): SessionRow[] => {
  const wk = isoWeekKey(today);
  return sessions.filter((s) => isoWeekKey(s.localDate) === wk);
};

export const activePlan = (plans: readonly PlanRow[]): PlanRow | null => plans.find((p) => p.active && !p.archived) ?? null;
export const planDays = (p: PlanRow): PlannedDay[] => { const d = (p.plan as { days?: unknown }).days; return Array.isArray(d) ? (d as PlannedDay[]) : []; };

/** Next plan day = number of finished plan sessions this week (for this plan), wrapping around the plan length. */
export function nextPlanDay(plan: PlanRow, sessions: readonly SessionRow[], today: string): { index: number; day: PlannedDay; doneThisWeek: number; total: number } | null {
  const days = planDays(plan);
  if (days.length === 0) return null;
  const done = sessionsThisWeek(sessions, today).filter((s) => s.source === 'plan' && (!s.sourceId || s.sourceId === plan.id)).length;
  const index = done % days.length;
  const day = days[index];
  return day ? { index, day, doneThisWeek: done, total: days.length } : null;
}

export type Tone = 'ok' | 'warn' | 'over' | undefined;
/** Bars for energy-bearing numbers: only exceeding the target is flagged; being below it early in the day is normal. */
export const upperTone = (value: number, target: number): Tone => (target <= 0 ? undefined : value > target * 1.1 ? 'over' : value > target ? 'warn' : value >= target * 0.9 ? 'ok' : undefined);
/** Protein is a floor: reaching ~90% of it is good, otherwise neutral. */
export const proteinTone = (value: number, target: number): Tone => (target > 0 && value >= target * 0.9 ? 'ok' : undefined);

export interface ChecklistInput {
  profileDone: boolean; sessionCount: number; foodEntriesToday: number; weighIns: number; coachThreads: number; achievementIds: readonly string[];
}
export type ChecklistId = 'profile' | 'workout' | 'food' | 'weigh' | 'coach';
export interface ChecklistItem { id: ChecklistId; done: boolean }
/** Derived from real data only; an achievement unlocked earlier also counts (e.g. food logged on a previous day). */
export function deriveChecklist(i: ChecklistInput): ChecklistItem[] {
  const has = (a: string) => i.achievementIds.includes(a);
  return [
    { id: 'profile', done: i.profileDone },
    { id: 'workout', done: i.sessionCount > 0 || has('first_workout') },
    { id: 'food', done: i.foodEntriesToday > 0 || has('first_food_log') },
    { id: 'weigh', done: i.weighIns > 0 || has('first_weigh_in') },
    { id: 'coach', done: i.coachThreads > 0 || has('first_coach_chat') },
  ];
}

const SLOT_END_HOUR: Record<MealSlot, number> = { breakfast: 11, lunch: 16, dinner: 22, snack: 24 };
/** First menu item (in day order) whose slot is not logged yet and whose window has not passed; else the first unlogged one. */
export function nextMenuItem<T extends { slot: MealSlot }>(items: readonly T[], loggedSlots: ReadonlySet<string>, hour: number): T | null {
  const order = (a: T, b: T) => MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot);
  const open = [...items].sort(order).filter((i) => !loggedSlots.has(i.slot));
  return open.find((i) => hour < SLOT_END_HOUR[i.slot]) ?? open[0] ?? null;
}
