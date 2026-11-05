import {
  blockedByMap,
  compareTasks,
  computeProgress,
  currentPhase,
  dependencyIdsOf,
  dependentIdsOf,
  diffDependencies,
  filterTasks,
  groupByPhase,
  groupTasks,
  phaseRanges,
  progressRatio,
  sortMilestones,
  sortPhaseTasks,
  sortTasks,
  tasksDueThrough,
  wouldCreateCycle,
} from '../logic';
import type { TaskRow } from '../types';

const TODAY = '2026-11-05';

let seq = 0;
function task(partial: Partial<TaskRow> & { id: string }): TaskRow {
  seq += 1;
  return {
    business_id: 'b1',
    title: partial.id,
    description: '',
    phase: 'days_30',
    milestone_id: null,
    priority: 'medium',
    status: 'todo',
    due_date: null,
    completed_at: partial.status === 'done' ? '2026-11-04T10:00:00.000Z' : null,
    source: 'user',
    sort_order: 0,
    created_at: `2026-11-01T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updated_at: '2026-11-01T00:00:00.000Z',
    ...partial,
  };
}

describe('phaseRanges', () => {
  it('uses each phase start and ends the day before the next phase', () => {
    const r = phaseRanges([
      { phase: 'days_30', starts_on: '2026-11-05' },
      { phase: 'days_60', starts_on: '2026-12-05' },
      { phase: 'days_90', starts_on: '2027-01-04' },
    ]);
    expect(r.days_30).toEqual({ start: '2026-11-05', end: '2026-12-04' });
    expect(r.days_60).toEqual({ start: '2026-12-05', end: '2027-01-03' });
    expect(r.days_90).toEqual({ start: '2027-01-04', end: '2027-02-02' });
  });

  it('derives later phases when rows are missing or left at the same default start', () => {
    const same = phaseRanges([
      { phase: 'days_30', starts_on: '2026-11-05' },
      { phase: 'days_60', starts_on: '2026-11-05' },
      { phase: 'days_90', starts_on: '2026-11-05' },
    ]);
    expect(same.days_60).toEqual({ start: '2026-12-05', end: '2027-01-03' });
    expect(same.days_90).toEqual({ start: '2027-01-04', end: '2027-02-02' });

    const onlyFirst = phaseRanges([{ phase: 'days_30', starts_on: '2026-11-05' }]);
    expect(onlyFirst.days_90?.start).toBe('2027-01-04');
  });

  it('anchors on a later phase when the first is missing', () => {
    const r = phaseRanges([{ phase: 'days_60', starts_on: '2026-12-05' }]);
    expect(r.days_30).toEqual({ start: '2026-11-05', end: '2026-12-04' });
    expect(r.days_60?.start).toBe('2026-12-05');
  });

  it('returns nulls without any phase row', () => {
    expect(phaseRanges([])).toEqual({ days_30: null, days_60: null, days_90: null });
  });

  it('finds the current phase', () => {
    const r = phaseRanges([{ phase: 'days_30', starts_on: '2026-11-05' }]);
    expect(currentPhase(r, '2026-11-05')).toBe('days_30');
    expect(currentPhase(r, '2026-12-04')).toBe('days_30');
    expect(currentPhase(r, '2026-12-05')).toBe('days_60');
    expect(currentPhase(r, '2027-02-02')).toBe('days_90');
    expect(currentPhase(r, '2027-02-03')).toBeNull();
    expect(currentPhase(r, '2026-11-04')).toBeNull();
  });
});

describe('progress', () => {
  it('counts totals and per-phase, ignoring unphased tasks per phase', () => {
    const p = computeProgress([
      task({ id: 'a', status: 'done' }),
      task({ id: 'b', status: 'in_progress' }),
      task({ id: 'c', phase: 'days_60', status: 'done' }),
      task({ id: 'd', phase: null, status: 'done' }),
    ]);
    expect(p).toEqual({
      total: 4,
      done: 3,
      byPhase: { days_30: { total: 2, done: 1 }, days_60: { total: 1, done: 1 }, days_90: { total: 0, done: 0 } },
    });
    expect(progressRatio(p.byPhase.days_30)).toBe(0.5);
    expect(progressRatio(p.byPhase.days_90)).toBe(0);
  });
});

describe('dependencies', () => {
  const tasks = [
    task({ id: 'a', title: 'Register business' }),
    task({ id: 'b', title: 'Open bank account' }),
    task({ id: 'c', title: 'Buy domain', status: 'done' }),
    task({ id: 'd', title: 'Launch site' }),
  ];
  const deps = [
    { task_id: 'b', depends_on_task_id: 'a' },
    { task_id: 'd', depends_on_task_id: 'c' },
    { task_id: 'd', depends_on_task_id: 'b' },
  ];

  it('reports unfinished blockers only, for open tasks only', () => {
    const map = blockedByMap(tasks, deps);
    expect(map.get('b')).toEqual(['Register business']);
    expect(map.get('d')).toEqual(['Open bank account']);
    expect(map.has('a')).toBe(false);

    const doneD = blockedByMap(
      tasks.map((t) => (t.id === 'd' ? { ...t, status: 'done' as const } : t)),
      deps,
    );
    expect(doneD.has('d')).toBe(false);
  });

  it('ignores dependencies on unknown tasks', () => {
    expect(blockedByMap(tasks, [{ task_id: 'a', depends_on_task_id: 'zzz' }]).size).toBe(0);
  });

  it('lists direct dependencies and dependents', () => {
    expect(dependencyIdsOf('d', deps).sort()).toEqual(['b', 'c']);
    expect(dependentIdsOf('a', deps)).toEqual(['b']);
  });

  it('detects cycles like the DB guard', () => {
    expect(wouldCreateCycle('a', 'a', deps)).toBe(true); // self
    expect(wouldCreateCycle('a', 'b', deps)).toBe(true); // b → a already
    expect(wouldCreateCycle('a', 'd', deps)).toBe(true); // d → b → a
    expect(wouldCreateCycle('d', 'a', deps)).toBe(false); // d → a is just redundant
    expect(wouldCreateCycle('c', 'a', deps)).toBe(false);
  });

  it('diffs desired dependency sets', () => {
    expect(diffDependencies(['a', 'b'], ['b', 'c'])).toEqual({ add: ['c'], remove: ['a'] });
    expect(diffDependencies([], [])).toEqual({ add: [], remove: [] });
  });
});

describe('sorting', () => {
  it('puts overdue first, then due date, undated last, then priority', () => {
    const list = [
      task({ id: 'undated-high', priority: 'high' }),
      task({ id: 'later', due_date: '2026-11-20' }),
      task({ id: 'today-low', due_date: TODAY, priority: 'low' }),
      task({ id: 'today-high', due_date: TODAY, priority: 'high' }),
      task({ id: 'overdue', due_date: '2026-11-01' }),
      task({ id: 'overdue-older', due_date: '2026-10-20', priority: 'low' }),
    ];
    expect(sortTasks(list, TODAY).map((t) => t.id)).toEqual([
      'overdue-older',
      'overdue',
      'today-high',
      'today-low',
      'later',
      'undated-high',
    ]);
  });

  it('breaks ties by sort order, then creation time', () => {
    const a = task({ id: 'a', sort_order: 2 });
    const b = task({ id: 'b', sort_order: 1 });
    const c = task({ id: 'c', sort_order: 1, created_at: '2026-10-01T00:00:00.000Z' });
    expect(sortTasks([a, b, c], TODAY).map((t) => t.id)).toEqual(['c', 'b', 'a']);
    expect(compareTasks(a, a, TODAY)).toBe(0);
  });

  it('treats a past-due done task as not overdue', () => {
    const done = task({ id: 'done', due_date: '2026-10-01', status: 'done' });
    const open = task({ id: 'open', due_date: '2026-11-02' });
    expect(sortTasks([done, open], TODAY).map((t) => t.id)).toEqual(['open', 'done']);
  });

  it('lists open phase tasks first, then completed (most recent first)', () => {
    const list = [
      task({ id: 'done-old', status: 'done', completed_at: '2026-11-01T08:00:00.000Z' }),
      task({ id: 'open-b', due_date: '2026-11-09' }),
      task({ id: 'done-new', status: 'done', completed_at: '2026-11-04T08:00:00.000Z' }),
      task({ id: 'open-a', due_date: '2026-11-06' }),
    ];
    expect(sortPhaseTasks(list, TODAY).map((t) => t.id)).toEqual(['open-a', 'open-b', 'done-new', 'done-old']);
  });

  it('sorts milestones by target date then order', () => {
    const m = sortMilestones([
      { id: 'x', target_date: null, sort_order: 0 },
      { id: 'y', target_date: '2026-12-01', sort_order: 1 },
      { id: 'z', target_date: '2026-11-15', sort_order: 2 },
      { id: 'w', target_date: '2026-12-01', sort_order: 0 },
    ]);
    expect(m.map((i) => i.id)).toEqual(['z', 'w', 'y', 'x']);
  });

  it('groups by phase', () => {
    const g = groupByPhase([task({ id: 'a' }), task({ id: 'b', phase: null }), task({ id: 'c', phase: 'days_90' })]);
    expect(g.days_30.map((t) => t.id)).toEqual(['a']);
    expect(g.days_60).toEqual([]);
    expect(g.days_90.map((t) => t.id)).toEqual(['c']);
    expect(g.none.map((t) => t.id)).toEqual(['b']);
  });
});

describe('filters and groups', () => {
  const list = [
    task({ id: 'overdue', due_date: '2026-11-03' }),
    task({ id: 'today', due_date: TODAY }),
    task({ id: 'tomorrow', due_date: '2026-11-06' }),
    task({ id: 'tomorrow-high', due_date: '2026-11-06', priority: 'high' }),
    task({ id: 'next-week', due_date: '2026-11-12' }),
    task({ id: 'undated' }),
    task({ id: 'done-today', status: 'done', due_date: TODAY, completed_at: new Date(2026, 10, 5, 9).toISOString() }),
    task({ id: 'done-earlier', status: 'done', completed_at: new Date(2026, 10, 2, 9).toISOString() }),
    task({ id: 'done-later-same-day', status: 'done', completed_at: new Date(2026, 10, 5, 15).toISOString() }),
  ];

  it('filters by view', () => {
    expect(filterTasks(list, 'today', TODAY).map((t) => t.id)).toEqual(['overdue', 'today']);
    expect(filterTasks(list, 'upcoming', TODAY).map((t) => t.id)).toEqual(['tomorrow', 'tomorrow-high', 'next-week']);
    expect(filterTasks(list, 'open', TODAY)).toHaveLength(6);
    expect(filterTasks(list, 'done', TODAY)).toHaveLength(3);
  });

  it('returns open tasks due through a date in working order', () => {
    expect(tasksDueThrough(list, TODAY).map((t) => t.id)).toEqual(['overdue', 'today']);
  });

  it('groups open tasks: overdue, today, per date, no date', () => {
    const groups = groupTasks(list, 'open', TODAY);
    expect(groups.map((g) => [g.key, g.tasks.map((t) => t.id)])).toEqual([
      ['overdue', ['overdue']],
      ['today', ['today']],
      ['date:2026-11-06', ['tomorrow-high', 'tomorrow']],
      ['date:2026-11-12', ['next-week']],
      ['noDate', ['undated']],
    ]);
    expect(groups[2]).toMatchObject({ kind: 'date', date: '2026-11-06' });
  });

  it('groups completed tasks by local completion day, newest first', () => {
    const groups = groupTasks(list, 'done', TODAY);
    expect(groups.map((g) => [g.kind, g.date, g.tasks.map((t) => t.id)])).toEqual([
      ['today', TODAY, ['done-later-same-day', 'done-today']],
      ['date', '2026-11-02', ['done-earlier']],
    ]);
  });

  it('returns no groups for an empty view', () => {
    expect(groupTasks([], 'today', TODAY)).toEqual([]);
  });
});
