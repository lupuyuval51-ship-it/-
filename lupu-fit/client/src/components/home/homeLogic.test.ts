import { describe, expect, it } from 'vitest';
import { deriveChecklist, nextMenuItem, nextPlanDay, proteinTone, sessionsThisWeek, upperTone, type PlanRow, type SessionRow } from './homeLogic.ts';

const day = (d: string, n: number) => ({ day: d, exercises: Array.from({ length: n }, () => ({ exerciseId: 'push_up', prescription: {} })), estimatedMinutes: 40 + n });
const plan = { id: 'p1', name: 'Plan', active: true, archived: false, plan: { days: [day('upper', 5), day('lower', 6), day('full_a', 7)] } } as unknown as PlanRow;
const s = (id: string, localDate: string, source: string | null = 'plan', sourceId: string | null = 'p1'): SessionRow => ({ id, name: id, source, sourceId, localDate });

describe('home logic', () => {
  it('counts only this ISO week (Mon-Sun)', () => {
    const list = [s('a', '2026-10-26'), s('b', '2026-11-01'), s('c', '2026-10-25')]; // Mon, Sun (same week), previous Sunday
    expect(sessionsThisWeek(list, '2026-10-29').map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('picks the next plan day from finished plan sessions this week', () => {
    expect(nextPlanDay(plan, [], '2026-10-29')?.day.day).toBe('upper');
    expect(nextPlanDay(plan, [s('a', '2026-10-26')], '2026-10-29')?.day.day).toBe('lower');
    expect(nextPlanDay(plan, [s('a', '2026-10-26'), s('b', '2026-10-27'), s('c', '2026-10-28', 'ready', null)], '2026-10-29')?.day.day).toBe('full_a');
    expect(nextPlanDay(plan, [s('a', '2026-10-26', 'plan', 'other-plan')], '2026-10-29')?.index).toBe(0);
    expect(nextPlanDay(plan, [s('a', '2026-10-19')], '2026-10-29')?.index).toBe(0);
    expect(nextPlanDay({ ...plan, plan: {} }, [], '2026-10-29')).toBeNull();
  });
  it('derives the getting-started checklist from real data only', () => {
    const base = { profileDone: true, sessionCount: 0, foodEntriesToday: 0, weighIns: 0, coachThreads: 0, achievementIds: [] as string[] };
    expect(deriveChecklist(base).map((i) => i.done)).toEqual([true, false, false, false, false]);
    expect(deriveChecklist({ ...base, sessionCount: 2, weighIns: 1 }).map((i) => i.done)).toEqual([true, true, false, true, false]);
    expect(deriveChecklist({ ...base, achievementIds: ['first_food_log', 'first_coach_chat'] }).map((i) => i.done)).toEqual([true, false, true, false, true]);
    expect(deriveChecklist({ ...base, profileDone: false })[0]?.done).toBe(false);
  });
  it('tones: only exceeding the target warns; protein is a floor', () => {
    expect(upperTone(500, 2000)).toBeUndefined(); expect(upperTone(1900, 2000)).toBe('ok'); expect(upperTone(2100, 2000)).toBe('warn'); expect(upperTone(2300, 2000)).toBe('over');
    expect(proteinTone(50, 120)).toBeUndefined(); expect(proteinTone(115, 120)).toBe('ok');
  });
  it('next meal skips logged slots and passed windows', () => {
    const items = [{ slot: 'snack' as const }, { slot: 'dinner' as const }, { slot: 'breakfast' as const }, { slot: 'lunch' as const }];
    expect(nextMenuItem(items, new Set(), 8)?.slot).toBe('breakfast');
    expect(nextMenuItem(items, new Set(['breakfast']), 8)?.slot).toBe('lunch');
    expect(nextMenuItem(items, new Set(['breakfast', 'lunch']), 18)?.slot).toBe('dinner');
    expect(nextMenuItem(items, new Set(['breakfast', 'lunch']), 23)?.slot).toBe('snack');
    expect(nextMenuItem(items, new Set(['breakfast', 'lunch', 'snack']), 23)?.slot).toBe('dinner');
    expect(nextMenuItem(items, new Set(['breakfast', 'lunch', 'dinner', 'snack']), 12)).toBeNull();
  });
});
