import { DEFAULT_SCENARIOS, type FinanceInputs } from '@domain/finance';
import { blockersByTask, hasFinanceInputs, planStatusOf, toNextActionTasks, upcomingMilestones } from '../derive';

const task = (id: string, status = 'todo', title = `T${id}`) => ({
  id,
  title,
  status,
  priority: 'medium',
  due_date: null,
  milestone_id: null,
  sort_order: 0,
});

describe('planStatusOf', () => {
  it('prefers a ready current version', () => {
    expect(planStatusOf({ currentVersion: {}, isGenerating: true, pendingGeneration: { status: 'generating' } })).toBe('ready');
  });
  it('reports first-time generation and failures', () => {
    expect(planStatusOf({ currentVersion: null, isGenerating: true, pendingGeneration: null })).toBe('generating');
    expect(planStatusOf({ currentVersion: null, isGenerating: false, pendingGeneration: { status: 'failed' } })).toBe('failed');
    expect(planStatusOf({ currentVersion: null, isGenerating: false, pendingGeneration: null })).toBe('none');
  });
});

describe('blockers', () => {
  const tasks = [task('a'), task('b'), task('c', 'done'), task('d')];
  const deps = [
    { task_id: 'a', depends_on_task_id: 'b' },
    { task_id: 'a', depends_on_task_id: 'c' }, // done blocker → ignored
    { task_id: 'c', depends_on_task_id: 'b' }, // done task → never blocked
    { task_id: 'd', depends_on_task_id: 'missing' },
  ];

  it('lists unfinished blockers of unfinished tasks', () => {
    expect([...blockersByTask(tasks, deps).entries()]).toEqual([['a', ['Tb']]]);
  });

  it('marks blocked tasks for the engine', () => {
    expect(toNextActionTasks(tasks, deps).map((t) => [t.id, t.blocked])).toEqual([
      ['a', true],
      ['b', false],
      ['c', false],
      ['d', false],
    ]);
  });
});

describe('hasFinanceInputs', () => {
  const empty: FinanceInputs = {
    startingCapitalMinor: 0,
    startupCosts: [],
    recurringExpenses: [],
    revenueStreams: [],
    forecastMonths: 12,
    scenarios: { ...DEFAULT_SCENARIOS },
  };
  it('is false for an untouched model', () => {
    expect(hasFinanceInputs(undefined)).toBe(false);
    expect(hasFinanceInputs(empty)).toBe(false);
  });
  it('is true once anything is entered', () => {
    expect(hasFinanceInputs({ ...empty, startingCapitalMinor: 1 })).toBe(true);
    expect(hasFinanceInputs({ ...empty, recurringExpenses: [{ label: 'Rent', monthlyAmountMinor: 0 }] })).toBe(true);
  });
});

describe('upcomingMilestones', () => {
  it('keeps open milestones, earliest first, undated last, limited', () => {
    const ms = [
      { id: '1', title: 'A', target_date: null, achieved_at: null },
      { id: '2', title: 'B', target_date: '2026-12-01', achieved_at: null },
      { id: '3', title: 'C', target_date: '2026-11-10', achieved_at: '2026-11-01T00:00:00Z' },
      { id: '4', title: 'D', target_date: '2026-11-20', achieved_at: null },
      { id: '5', title: 'E', target_date: '2027-01-01', achieved_at: null },
    ];
    expect(upcomingMilestones(ms).map((m) => m.id)).toEqual(['4', '2', '5']);
    expect(upcomingMilestones(ms, 10).map((m) => m.id)).toEqual(['4', '2', '5', '1']);
  });
});
