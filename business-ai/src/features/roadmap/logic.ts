/**
 * Pure roadmap logic: phase date ranges, progress, blocked detection, filtering, grouping and
 * sorting. No React, no I/O — unit-tested in __tests__/logic.test.ts.
 */
import { ROADMAP_PHASES, type RoadmapPhase, type TaskPriority } from '@domain/plan';
import { addDays, compareISODate, localDateOf, type ISODate } from './dates';
import type { MilestoneRow, PhaseProgress, RoadmapPhaseRow, RoadmapProgress, TaskDependencyRow, TaskRow } from './types';

export { ROADMAP_PHASES };

export const PHASE_LENGTH_DAYS = 30;

/** Day numbers covered by each phase ("Days 1–30"). */
export const PHASE_DAY_SPAN: Readonly<Record<RoadmapPhase, { from: number; to: number }>> = {
  days_30: { from: 1, to: 30 },
  days_60: { from: 31, to: 60 },
  days_90: { from: 61, to: 90 },
};

const PHASE_INDEX: Readonly<Record<RoadmapPhase, number>> = { days_30: 0, days_60: 1, days_90: 2 };

export function isRoadmapPhase(value: unknown): value is RoadmapPhase {
  return value === 'days_30' || value === 'days_60' || value === 'days_90';
}

/* ------------------------------------------------------------------ */
/* Phase date ranges                                                   */
/* ------------------------------------------------------------------ */

export interface DateRange {
  start: ISODate;
  /** Inclusive. */
  end: ISODate;
}

/**
 * Calendar range of each phase from `roadmap_phases.starts_on`.
 *
 * A phase uses its own `starts_on` when it is later than the previous phase's start; otherwise
 * (missing row, or a row left at the column default) it starts 30 days after the previous phase.
 * A phase ends the day before the next phase starts, or after 30 days for the last phase.
 * Without any phase row there is no anchor and every range is null.
 */
export function phaseRanges(phases: readonly Pick<RoadmapPhaseRow, 'phase' | 'starts_on'>[]): Record<RoadmapPhase, DateRange | null> {
  const own = new Map<RoadmapPhase, ISODate>();
  for (const p of phases) if (isRoadmapPhase(p.phase) && p.starts_on) own.set(p.phase, p.starts_on.slice(0, 10));

  const starts: (ISODate | null)[] = [null, null, null];
  // Anchor: the first phase's own start, or the earliest known start shifted back by its offset.
  let anchor: ISODate | null = own.get('days_30') ?? null;
  if (!anchor) {
    for (const phase of ROADMAP_PHASES) {
      const s = own.get(phase);
      if (s) {
        anchor = addDays(s, -PHASE_INDEX[phase] * PHASE_LENGTH_DAYS);
        break;
      }
    }
  }
  if (!anchor) return { days_30: null, days_60: null, days_90: null };

  starts[0] = anchor;
  for (let i = 1; i < ROADMAP_PHASES.length; i++) {
    const prev = starts[i - 1]!;
    const candidate = own.get(ROADMAP_PHASES[i]!);
    starts[i] = candidate && compareISODate(candidate, prev) > 0 ? candidate : addDays(prev, PHASE_LENGTH_DAYS);
  }

  const result = {} as Record<RoadmapPhase, DateRange | null>;
  ROADMAP_PHASES.forEach((phase, i) => {
    const start = starts[i]!;
    const next = starts[i + 1];
    result[phase] = { start, end: next ? addDays(next, -1) : addDays(start, PHASE_LENGTH_DAYS - 1) };
  });
  return result;
}

/** The phase whose range contains `today`, else null (before the start or after the end). */
export function currentPhase(ranges: Record<RoadmapPhase, DateRange | null>, today: ISODate): RoadmapPhase | null {
  for (const phase of ROADMAP_PHASES) {
    const r = ranges[phase];
    if (r && compareISODate(today, r.start) >= 0 && compareISODate(today, r.end) <= 0) return phase;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Status helpers & progress                                           */
/* ------------------------------------------------------------------ */

type TaskLike = Pick<TaskRow, 'id' | 'status' | 'due_date' | 'priority' | 'sort_order' | 'created_at' | 'completed_at' | 'phase' | 'title'>;

export function isDone(task: Pick<TaskRow, 'status'>): boolean {
  return task.status === 'done';
}

export function isOverdue(task: Pick<TaskRow, 'status' | 'due_date'>, today: ISODate): boolean {
  return !isDone(task) && !!task.due_date && compareISODate(task.due_date, today) < 0;
}

export function isDueThrough(task: Pick<TaskRow, 'status' | 'due_date'>, through: ISODate): boolean {
  return !isDone(task) && !!task.due_date && compareISODate(task.due_date, through) <= 0;
}

function emptyProgress(): PhaseProgress {
  return { total: 0, done: 0 };
}

/** Totals over every task; `byPhase` counts only tasks assigned to a phase. */
export function computeProgress(tasks: readonly Pick<TaskRow, 'status' | 'phase'>[]): RoadmapProgress {
  const byPhase: Record<RoadmapPhase, PhaseProgress> = { days_30: emptyProgress(), days_60: emptyProgress(), days_90: emptyProgress() };
  let total = 0;
  let done = 0;
  for (const task of tasks) {
    const finished = isDone(task);
    total += 1;
    if (finished) done += 1;
    if (task.phase && isRoadmapPhase(task.phase)) {
      byPhase[task.phase].total += 1;
      if (finished) byPhase[task.phase].done += 1;
    }
  }
  return { total, done, byPhase };
}

/** 0…1 (0 when there is nothing to do). */
export function progressRatio(p: PhaseProgress): number {
  return p.total === 0 ? 0 : Math.min(1, p.done / p.total);
}

/* ------------------------------------------------------------------ */
/* Dependencies                                                        */
/* ------------------------------------------------------------------ */

/** Ids `taskId` depends on directly. */
export function dependencyIdsOf(taskId: string, dependencies: readonly TaskDependencyRow[]): string[] {
  return dependencies.filter((d) => d.task_id === taskId).map((d) => d.depends_on_task_id);
}

/** Ids of tasks that directly depend on `taskId`. */
export function dependentIdsOf(taskId: string, dependencies: readonly TaskDependencyRow[]): string[] {
  return dependencies.filter((d) => d.depends_on_task_id === taskId).map((d) => d.task_id);
}

/**
 * Titles of the unfinished tasks blocking each open task. Done tasks are never reported as
 * blocked (the hint is only useful before completion). Unknown dependency ids are ignored.
 */
export function blockedByMap(
  tasks: readonly Pick<TaskRow, 'id' | 'status' | 'title'>[],
  dependencies: readonly TaskDependencyRow[],
): Map<string, string[]> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const result = new Map<string, string[]>();
  for (const dep of dependencies) {
    const task = byId.get(dep.task_id);
    const blocker = byId.get(dep.depends_on_task_id);
    if (!task || !blocker || isDone(task) || isDone(blocker)) continue;
    const list = result.get(task.id);
    if (list) list.push(blocker.title);
    else result.set(task.id, [blocker.title]);
  }
  return result;
}

/**
 * True when adding "taskId depends on candidateId" would create a cycle (or a self-dependency):
 * i.e. candidateId already reaches taskId through existing dependencies. Mirrors the DB guard so
 * the editor can disable such options; the DB remains authoritative.
 */
export function wouldCreateCycle(taskId: string, candidateId: string, dependencies: readonly TaskDependencyRow[]): boolean {
  if (taskId === candidateId) return true;
  const edges = new Map<string, string[]>();
  for (const d of dependencies) {
    const list = edges.get(d.task_id);
    if (list) list.push(d.depends_on_task_id);
    else edges.set(d.task_id, [d.depends_on_task_id]);
  }
  const seen = new Set<string>();
  const stack = [candidateId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of edges.get(current) ?? []) stack.push(next);
  }
  return false;
}

/** Diff between the current and desired dependency sets of one task. */
export function diffDependencies(current: readonly string[], desired: readonly string[]): { add: string[]; remove: string[] } {
  const cur = new Set(current);
  const want = new Set(desired);
  return { add: [...want].filter((id) => !cur.has(id)), remove: [...cur].filter((id) => !want.has(id)) };
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

export const PRIORITY_RANK: Readonly<Record<TaskPriority, number>> = { high: 0, medium: 1, low: 2 };

function rank(priority: string): number {
  return PRIORITY_RANK[priority as TaskPriority] ?? 1;
}

/** Overdue first, then due date (undated last), then priority, then manual order and age. */
export function compareTasks(a: TaskLike, b: TaskLike, today: ISODate): number {
  const ao = isOverdue(a, today) ? 0 : 1;
  const bo = isOverdue(b, today) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return compareISODate(a.due_date, b.due_date);
  }
  const pr = rank(a.priority) - rank(b.priority);
  if (pr !== 0) return pr;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortTasks<T extends TaskLike>(tasks: readonly T[], today: ISODate): T[] {
  return [...tasks].sort((a, b) => compareTasks(a, b, today));
}

/** Most recently completed first. */
export function compareDone(a: TaskLike, b: TaskLike): number {
  const ac = a.completed_at ?? '';
  const bc = b.completed_at ?? '';
  if (ac !== bc) return ac < bc ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Open tasks in working order, then completed tasks (most recent first). */
export function sortPhaseTasks<T extends TaskLike>(tasks: readonly T[], today: ISODate): T[] {
  const open = tasks.filter((t) => !isDone(t)).sort((a, b) => compareTasks(a, b, today));
  const done = tasks.filter(isDone).sort(compareDone);
  return [...open, ...done];
}

/** Target date first (undated last), then manual order. */
export function sortMilestones<T extends Pick<MilestoneRow, 'id' | 'target_date' | 'sort_order'>>(milestones: readonly T[]): T[] {
  return [...milestones].sort((a, b) => {
    if (a.target_date !== b.target_date) {
      if (!a.target_date) return 1;
      if (!b.target_date) return -1;
      return compareISODate(a.target_date, b.target_date);
    }
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Tasks per phase (unphased tasks under `none`). Order is preserved. */
export function groupByPhase<T extends Pick<TaskRow, 'phase'>>(items: readonly T[]): Record<RoadmapPhase | 'none', T[]> {
  const groups: Record<RoadmapPhase | 'none', T[]> = { days_30: [], days_60: [], days_90: [], none: [] };
  for (const item of items) groups[item.phase && isRoadmapPhase(item.phase) ? item.phase : 'none'].push(item);
  return groups;
}

/* ------------------------------------------------------------------ */
/* Filtering & grouping (tasks screen)                                 */
/* ------------------------------------------------------------------ */

export type TaskFilter = 'today' | 'upcoming' | 'open' | 'done';

export const TASK_FILTERS: readonly TaskFilter[] = ['today', 'upcoming', 'open', 'done'];

/** Open tasks due on or before `through` (overdue included), in working order. */
export function tasksDueThrough<T extends TaskLike>(tasks: readonly T[], through: ISODate, today: ISODate = through): T[] {
  return sortTasks(
    tasks.filter((t) => isDueThrough(t, through)),
    today,
  );
}

export function filterTasks<T extends TaskLike>(tasks: readonly T[], filter: TaskFilter, today: ISODate): T[] {
  switch (filter) {
    case 'today':
      return tasks.filter((t) => isDueThrough(t, today));
    case 'upcoming':
      return tasks.filter((t) => !isDone(t) && !!t.due_date && compareISODate(t.due_date, today) > 0);
    case 'open':
      return tasks.filter((t) => !isDone(t));
    case 'done':
      return tasks.filter(isDone);
  }
}

export type TaskGroupKind = 'overdue' | 'today' | 'date' | 'noDate';

export interface TaskGroup<T> {
  /** Stable key for lists. */
  key: string;
  kind: TaskGroupKind;
  /** The group's calendar date (kind 'date'; also 'today'). */
  date: ISODate | null;
  tasks: T[];
}

/**
 * Filters and groups tasks for the tasks screen.
 * - open filters: Overdue → Today → one group per due date (ascending) → No date.
 * - done: one group per local completion date, most recent first.
 */
export function groupTasks<T extends TaskLike>(tasks: readonly T[], filter: TaskFilter, today: ISODate): TaskGroup<T>[] {
  const filtered = filterTasks(tasks, filter, today);

  if (filter === 'done') {
    const groups = new Map<string, T[]>();
    for (const task of [...filtered].sort(compareDone)) {
      const date = (task.completed_at && localDateOf(task.completed_at)) ?? '';
      const list = groups.get(date);
      if (list) list.push(task);
      else groups.set(date, [task]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => (a === b ? 0 : a === '' ? 1 : b === '' ? -1 : a < b ? 1 : -1))
      .map(([date, list]) => ({
        key: date ? `done:${date}` : 'done:none',
        kind: date ? (date === today ? 'today' : 'date') : 'noDate',
        date: date || null,
        tasks: list,
      }));
  }

  const sorted = sortTasks(filtered, today);
  const overdue: T[] = [];
  const dueToday: T[] = [];
  const byDate = new Map<ISODate, T[]>();
  const undated: T[] = [];
  for (const task of sorted) {
    if (!task.due_date) undated.push(task);
    else if (compareISODate(task.due_date, today) < 0) overdue.push(task);
    else if (task.due_date === today) dueToday.push(task);
    else {
      const list = byDate.get(task.due_date);
      if (list) list.push(task);
      else byDate.set(task.due_date, [task]);
    }
  }
  const groups: TaskGroup<T>[] = [];
  if (overdue.length) groups.push({ key: 'overdue', kind: 'overdue', date: null, tasks: overdue });
  if (dueToday.length) groups.push({ key: 'today', kind: 'today', date: today, tasks: dueToday });
  for (const [date, list] of [...byDate.entries()].sort(([a], [b]) => compareISODate(a, b))) {
    groups.push({ key: `date:${date}`, kind: 'date', date, tasks: list });
  }
  if (undated.length) groups.push({ key: 'noDate', kind: 'noDate', date: null, tasks: undated });
  return groups;
}
