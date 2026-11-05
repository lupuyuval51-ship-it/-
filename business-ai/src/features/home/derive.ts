/**
 * Pure adapters between other features' data and the Home / Workspace screens.
 */
import type { FinanceInputs } from '@domain/finance';
import type { NextActionMilestone, NextActionTask, PlanStatus } from './next-action';

/**
 * Plan status for the next-action engine. A ready current version wins (a regeneration in the
 * background does not block the roadmap); otherwise the newest attempt decides.
 */
export function planStatusOf(state: {
  currentVersion: unknown | null;
  isGenerating: boolean;
  pendingGeneration: { status: string } | null;
}): PlanStatus {
  if (state.currentVersion) return 'ready';
  if (state.isGenerating || state.pendingGeneration?.status === 'generating') return 'generating';
  if (state.pendingGeneration?.status === 'failed') return 'failed';
  return 'none';
}

interface TaskLike {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  milestone_id: string | null;
  sort_order: number;
}

interface DependencyLike {
  task_id: string;
  depends_on_task_id: string;
}

/** Titles of the unfinished tasks blocking each unfinished task. */
export function blockersByTask(tasks: readonly TaskLike[], dependencies: readonly DependencyLike[]): Map<string, string[]> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const result = new Map<string, string[]>();
  for (const dep of dependencies) {
    const task = byId.get(dep.task_id);
    const blocker = byId.get(dep.depends_on_task_id);
    if (!task || !blocker || task.status === 'done' || blocker.status === 'done') continue;
    const list = result.get(task.id);
    if (list) list.push(blocker.title);
    else result.set(task.id, [blocker.title]);
  }
  return result;
}

export function toNextActionTasks(tasks: readonly TaskLike[], dependencies: readonly DependencyLike[]): NextActionTask[] {
  const blockers = blockersByTask(tasks, dependencies);
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    milestone_id: t.milestone_id,
    sort_order: t.sort_order,
    blocked: blockers.has(t.id),
  }));
}

/** True once the user has entered anything in the financial model. */
export function hasFinanceInputs(inputs: FinanceInputs | undefined | null): boolean {
  if (!inputs) return false;
  return (
    inputs.startingCapitalMinor > 0 ||
    inputs.startupCosts.length > 0 ||
    inputs.recurringExpenses.length > 0 ||
    inputs.revenueStreams.length > 0
  );
}

/** Open milestones, earliest target date first (undated last), at most `limit`. */
export function upcomingMilestones<M extends NextActionMilestone & { sort_order?: number }>(milestones: readonly M[], limit = 3): M[] {
  return milestones
    .filter((m) => !m.achieved_at)
    .sort((a, b) => {
      if (a.target_date !== b.target_date) {
        if (a.target_date === null) return 1;
        if (b.target_date === null) return -1;
        return a.target_date < b.target_date ? -1 : 1;
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    })
    .slice(0, limit);
}
