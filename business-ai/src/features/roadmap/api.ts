/**
 * Roadmap data layer (docs/FEATURE_CONTRACTS.md → roadmap).
 *
 * One query per business holds the whole roadmap (`['b', businessId, 'roadmap']`): phases,
 * milestones, tasks and dependencies. Every other read hook derives from it with `select`, so
 * optimistic updates and invalidations stay consistent everywhere (other features invalidate
 * `['b', businessId, 'roadmap']` after writing tasks).
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { TablesUpdate } from '@db';
import type { AiResponse, RoadmapSuggestion } from '@domain/ai-api';
import { TASK_PRIORITIES, TASK_STATUSES } from '@domain/plan';
import { useLocale } from '@/i18n/I18nProvider';
import { AppErrorException, toAppError } from '@/lib/errors';
import { invokeAi } from '@/lib/functions';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { dueDateFromOffset, todayISO, type ISODate } from './dates';
import { computeProgress, dependencyIdsOf, dependentIdsOf, isRoadmapPhase, tasksDueThrough } from './logic';
import type {
  ItemSource,
  MilestoneRow,
  Roadmap,
  RoadmapPhase,
  RoadmapPhaseRow,
  RoadmapProgress,
  TaskDependencyRow,
  TaskPriority,
  TaskRow,
  TaskStatus,
} from './types';

export type {
  ItemSource,
  MilestoneRow,
  PhaseProgress,
  Roadmap,
  RoadmapPhase,
  RoadmapPhaseRow,
  RoadmapProgress,
  TaskDependencyRow,
  TaskPriority,
  TaskRow,
  TaskStatus,
} from './types';
export type { RoadmapSuggestion } from '@domain/ai-api';

type BusinessId = string | null | undefined;

/* ------------------------------------------------------------------ */
/* Keys                                                                */
/* ------------------------------------------------------------------ */

export const roadmapKeys = {
  /** Everything roadmap-related for a business (the single roadmap query). */
  all: (businessId: string) => qk.b(businessId, 'roadmap'),
};

/* ------------------------------------------------------------------ */
/* Row narrowing (DB CHECK-constrained text → literal unions)          */
/* ------------------------------------------------------------------ */

const PRIORITY_SET: ReadonlySet<string> = new Set(TASK_PRIORITIES);
const STATUS_SET: ReadonlySet<string> = new Set(TASK_STATUSES);

function narrowSource(value: string): ItemSource {
  return value === 'ai' || value === 'advisor' ? value : 'user';
}

type RawTask = Omit<TaskRow, 'phase' | 'priority' | 'status' | 'source'> & { phase: string | null; priority: string; status: string; source: string };
type RawMilestone = Omit<MilestoneRow, 'phase' | 'source'> & { phase: string; source: string };
type RawPhase = Omit<RoadmapPhaseRow, 'phase'> & { phase: string };

export function narrowTask(row: RawTask): TaskRow {
  return {
    ...row,
    phase: isRoadmapPhase(row.phase) ? row.phase : null,
    priority: PRIORITY_SET.has(row.priority) ? (row.priority as TaskPriority) : 'medium',
    status: STATUS_SET.has(row.status) ? (row.status as TaskStatus) : 'todo',
    source: narrowSource(row.source),
  };
}

function narrowMilestone(row: RawMilestone): MilestoneRow | null {
  if (!isRoadmapPhase(row.phase)) return null;
  return { ...row, phase: row.phase, source: narrowSource(row.source) };
}

function narrowPhase(row: RawPhase): RoadmapPhaseRow | null {
  if (!isRoadmapPhase(row.phase)) return null;
  return { ...row, phase: row.phase };
}

function fail(error: unknown): never {
  throw new AppErrorException(toAppError(error));
}

function requireBusiness(businessId: BusinessId): string {
  if (!businessId) throw new AppErrorException(toAppError({ code: 'P0001', message: 'not_found' }));
  return businessId;
}

/* ------------------------------------------------------------------ */
/* Fetch                                                               */
/* ------------------------------------------------------------------ */

export async function fetchRoadmap(businessId: string): Promise<Roadmap> {
  const [phases, milestones, tasks, dependencies] = await Promise.all([
    supabase.from('roadmap_phases').select('*').eq('business_id', businessId),
    supabase.from('milestones').select('*').eq('business_id', businessId).order('sort_order').order('created_at'),
    supabase.from('tasks').select('*').eq('business_id', businessId).order('sort_order').order('created_at'),
    supabase
      .from('task_dependencies')
      .select('task_id, depends_on_task_id, task:tasks!task_dependencies_task_id_fkey!inner(business_id)')
      .eq('task.business_id', businessId),
  ]);
  if (phases.error) fail(phases.error);
  if (milestones.error) fail(milestones.error);
  if (tasks.error) fail(tasks.error);
  if (dependencies.error) fail(dependencies.error);

  return {
    phases: phases.data.map(narrowPhase).filter((p): p is RoadmapPhaseRow => p !== null),
    milestones: milestones.data.map(narrowMilestone).filter((m): m is MilestoneRow => m !== null),
    tasks: tasks.data.map(narrowTask),
    dependencies: dependencies.data.map((d) => ({ task_id: d.task_id, depends_on_task_id: d.depends_on_task_id })),
  };
}

function roadmapQueryOptions(businessId: BusinessId) {
  return {
    queryKey: roadmapKeys.all(businessId ?? ''),
    queryFn: () => fetchRoadmap(requireBusiness(businessId)),
    enabled: !!businessId,
  };
}

/* ------------------------------------------------------------------ */
/* Read hooks                                                          */
/* ------------------------------------------------------------------ */

const EMPTY: Roadmap = { phases: [], milestones: [], tasks: [], dependencies: [] };

/**
 * The whole roadmap. Data fields are empty arrays until loaded — check `isLoading` / `error`.
 * `isEmpty` is true when loaded and the business has no phases, milestones or tasks.
 */
export function useRoadmap(businessId: BusinessId) {
  const query = useQuery(roadmapQueryOptions(businessId));
  const data = query.data ?? EMPTY;
  return {
    ...query,
    phases: data.phases,
    milestones: data.milestones,
    tasks: data.tasks,
    dependencies: data.dependencies,
    isEmpty: !!query.data && data.phases.length === 0 && data.milestones.length === 0 && data.tasks.length === 0,
  };
}

const EMPTY_PROGRESS: RoadmapProgress = computeProgress([]);

/** `{ total, done, byPhase }` over all tasks (zeros until loaded) plus query state. */
export function useRoadmapProgress(businessId: BusinessId) {
  const query = useQuery({ ...roadmapQueryOptions(businessId), select: selectProgress });
  const progress = query.data ?? EMPTY_PROGRESS;
  return { ...query, total: progress.total, done: progress.done, byPhase: progress.byPhase };
}

function selectProgress(roadmap: Roadmap): RoadmapProgress {
  return computeProgress(roadmap.tasks);
}

export interface TasksDueOptions {
  /** 'today' (local calendar date) or an explicit 'YYYY-MM-DD'. */
  through: 'today' | ISODate;
}

/**
 * Open tasks due on or before `through` (overdue included), overdue first, then due date and
 * priority. `tasks` (= `data`) is an empty array until loaded.
 */
export function useTasksDue(businessId: BusinessId, options: TasksDueOptions = { through: 'today' }) {
  const today = todayISO();
  const through = options.through === 'today' ? today : options.through;
  const select = useCallback((roadmap: Roadmap) => tasksDueThrough(roadmap.tasks, through, today), [through, today]);
  const query = useQuery({ ...roadmapQueryOptions(businessId), select });
  return { ...query, tasks: query.data ?? [] };
}

export interface TaskDetail {
  task: TaskRow;
  /** Ids this task depends on. */
  dependsOn: string[];
  /** Ids of tasks that depend on this one. */
  dependents: string[];
}

/** One task (from the roadmap cache) with its dependency ids. `task` is undefined if not found. */
export function useTask(businessId: BusinessId, taskId: string | null | undefined) {
  const select = useCallback(
    (roadmap: Roadmap): TaskDetail | null => {
      const task = roadmap.tasks.find((t) => t.id === taskId);
      if (!task) return null;
      return { task, dependsOn: dependencyIdsOf(task.id, roadmap.dependencies), dependents: dependentIdsOf(task.id, roadmap.dependencies) };
    },
    [taskId],
  );
  const query = useQuery({ ...roadmapQueryOptions(businessId), select, enabled: !!businessId && !!taskId });
  return {
    ...query,
    task: query.data?.task,
    dependsOn: query.data?.dependsOn ?? [],
    dependents: query.data?.dependents ?? [],
    /** Loaded, and no task with this id exists in the business. */
    notFound: query.isSuccess && query.data === null,
  };
}

/* ------------------------------------------------------------------ */
/* Cache helpers                                                       */
/* ------------------------------------------------------------------ */

function patchRoadmap(qc: QueryClient, businessId: string, update: (r: Roadmap) => Roadmap): void {
  qc.setQueryData<Roadmap>(roadmapKeys.all(businessId), (current) => (current ? update(current) : current));
}

function upsertTask(roadmap: Roadmap, task: TaskRow): Roadmap {
  const exists = roadmap.tasks.some((t) => t.id === task.id);
  return { ...roadmap, tasks: exists ? roadmap.tasks.map((t) => (t.id === task.id ? task : t)) : [...roadmap.tasks, task] };
}

function upsertMilestone(roadmap: Roadmap, milestone: MilestoneRow): Roadmap {
  const exists = roadmap.milestones.some((m) => m.id === milestone.id);
  return {
    ...roadmap,
    milestones: exists ? roadmap.milestones.map((m) => (m.id === milestone.id ? milestone : m)) : [...roadmap.milestones, milestone],
  };
}

function nextSortOrder(items: readonly { phase: string | null; sort_order: number }[], phase: string | null): number {
  let max = -1;
  for (const item of items) if (item.phase === phase && item.sort_order > max) max = item.sort_order;
  return max + 1;
}

function invalidateRoadmap(qc: QueryClient, businessId: string): Promise<void> {
  return qc.invalidateQueries({ queryKey: roadmapKeys.all(businessId) });
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export interface ToggleTaskInput {
  id: string;
  done: boolean;
}

/** Marks a task done / not done. Optimistic; the task's previous state is restored on error. */
export function useToggleTask(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: ToggleTaskInput): Promise<TaskRow> => {
      const bid = requireBusiness(businessId);
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: done ? 'done' : 'todo' })
        .eq('id', id)
        .eq('business_id', bid)
        .select()
        .single();
      if (error) fail(error);
      return narrowTask(data);
    },
    onMutate: async ({ id, done }) => {
      if (!businessId) return { previous: undefined };
      await qc.cancelQueries({ queryKey: roadmapKeys.all(businessId) });
      const previous = qc.getQueryData<Roadmap>(roadmapKeys.all(businessId))?.tasks.find((t) => t.id === id);
      if (previous) {
        const optimistic: TaskRow = {
          ...previous,
          status: done ? 'done' : 'todo',
          completed_at: done ? (previous.status === 'done' ? previous.completed_at : new Date().toISOString()) : null,
        };
        patchRoadmap(qc, businessId, (r) => upsertTask(r, optimistic));
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      const previous = context?.previous;
      if (businessId && previous) {
        patchRoadmap(qc, businessId, (r) => (r.tasks.some((t) => t.id === previous.id) ? upsertTask(r, previous) : r));
      }
    },
    onSuccess: (task) => {
      if (businessId) patchRoadmap(qc, businessId, (r) => upsertTask(r, task));
    },
    onSettled: () => (businessId ? invalidateRoadmap(qc, businessId) : undefined),
  });
}

export interface NewTaskInput {
  title: string;
  description?: string;
  phase?: RoadmapPhase | null;
  milestoneId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  /** 'YYYY-MM-DD' or null. Takes precedence over `dueInDays`. */
  dueDate?: ISODate | null;
  /** Convenience for AI/advisor suggestions: due N days from today. */
  dueInDays?: number | null;
  /** Default 'user'. Use 'advisor' for tasks accepted from AI suggestions. */
  source?: ItemSource;
  /**
   * Idempotency key for tasks created from a proposal (e.g. `suggestion:<id>`). Unique per
   * business in the database: adding the same proposal twice resolves with the existing task.
   */
  sourceRef?: string;
}

/** Creates a task; resolves with the saved row (or the existing row for a repeated `sourceRef`). */
export function useCreateTask(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewTaskInput): Promise<TaskRow> => {
      const bid = requireBusiness(businessId);
      const phase = input.phase ?? null;
      const cached = qc.getQueryData<Roadmap>(roadmapKeys.all(bid));
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          business_id: bid,
          title: input.title.trim(),
          description: (input.description ?? '').trim(),
          phase,
          milestone_id: input.milestoneId ?? null,
          priority: input.priority ?? 'medium',
          status: input.status ?? 'todo',
          due_date: input.dueDate !== undefined ? input.dueDate : dueDateFromOffset(input.dueInDays),
          source: input.source ?? 'user',
          source_ref: input.sourceRef ?? null,
          sort_order: cached ? nextSortOrder(cached.tasks, phase) : 0,
        })
        .select()
        .single();
      if (error) {
        // Same proposal added again (double tap, retry after a lost response, another device):
        // the unique (business_id, source_ref) key rejected the duplicate — return the original.
        if (input.sourceRef && (error as { code?: string }).code === '23505') {
          const existing = await supabase.from('tasks').select().eq('business_id', bid).eq('source_ref', input.sourceRef).single();
          if (existing.error) fail(existing.error);
          return narrowTask(existing.data);
        }
        fail(error);
      }
      return narrowTask(data);
    },
    onSuccess: (task) => {
      if (!businessId) return;
      patchRoadmap(qc, businessId, (r) => upsertTask(r, task));
      void invalidateRoadmap(qc, businessId);
    },
  });
}

export interface TaskPatch {
  title?: string;
  description?: string;
  phase?: RoadmapPhase | null;
  milestoneId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: ISODate | null;
}

export interface UpdateTaskInput {
  id: string;
  patch: TaskPatch;
}

/** Updates a task's fields; resolves with the saved row. */
export function useUpdateTask(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: UpdateTaskInput): Promise<TaskRow> => {
      const bid = requireBusiness(businessId);
      const update: TablesUpdate<'tasks'> = {};
      if (patch.title !== undefined) update.title = patch.title.trim();
      if (patch.description !== undefined) update.description = patch.description.trim();
      if (patch.phase !== undefined) update.phase = patch.phase;
      if (patch.milestoneId !== undefined) update.milestone_id = patch.milestoneId;
      if (patch.priority !== undefined) update.priority = patch.priority;
      if (patch.status !== undefined) update.status = patch.status;
      if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
      const { data, error } = await supabase
        .from('tasks')
        .update(update)
        .eq('id', id)
        .eq('business_id', bid)
        .select()
        .single();
      if (error) fail(error);
      return narrowTask(data);
    },
    onSuccess: (task) => {
      if (!businessId) return;
      patchRoadmap(qc, businessId, (r) => upsertTask(r, task));
      void invalidateRoadmap(qc, businessId);
    },
  });
}

/** Deletes a task (its dependency rows cascade). */
export function useDeleteTask(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const bid = requireBusiness(businessId);
      const { error } = await supabase.from('tasks').delete().eq('id', id).eq('business_id', bid);
      if (error) fail(error);
      return id;
    },
    onSuccess: (id) => {
      if (!businessId) return;
      patchRoadmap(qc, businessId, (r) => ({
        ...r,
        tasks: r.tasks.filter((t) => t.id !== id),
        dependencies: r.dependencies.filter((d) => d.task_id !== id && d.depends_on_task_id !== id),
      }));
      void invalidateRoadmap(qc, businessId);
    },
  });
}

export interface SetDependenciesInput {
  taskId: string;
  /** The complete desired set of task ids this task depends on. */
  dependsOn: string[];
}

/**
 * Replaces a task's dependencies with `dependsOn`. Removals run first (so swapping a direction
 * does not trip the cycle guard), then additions in one atomic insert. DB rule violations reject
 * with AppError codes `dependency_self`, `dependency_cross_business` or `dependency_cycle`; if the
 * insert fails, removed rows are restored (best effort).
 */
export function useSetDependencies(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, dependsOn }: SetDependenciesInput): Promise<TaskDependencyRow[]> => {
      requireBusiness(businessId);
      // One transaction (`set_task_dependencies`): the old set is removed and the new set inserted
      // together, and any rule violation (self, cross-business, cycle) leaves the old set intact.
      const wanted = [...new Set(dependsOn)];
      const { error } = await supabase.rpc('set_task_dependencies', { p_task_id: taskId, p_depends_on: wanted });
      if (error) fail(error);
      return wanted.map((id) => ({ task_id: taskId, depends_on_task_id: id }));
    },
    onSuccess: (rows, { taskId }) => {
      if (!businessId) return;
      patchRoadmap(qc, businessId, (r) => ({ ...r, dependencies: [...r.dependencies.filter((d) => d.task_id !== taskId), ...rows] }));
    },
    onSettled: () => (businessId ? invalidateRoadmap(qc, businessId) : undefined),
  });
}

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */

export interface NewMilestoneInput {
  title: string;
  phase: RoadmapPhase;
  /** 'YYYY-MM-DD' or null. Takes precedence over `dueInDays`. */
  targetDate?: ISODate | null;
  dueInDays?: number | null;
  /** Default 'user'. */
  source?: ItemSource;
}

export function useCreateMilestone(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewMilestoneInput): Promise<MilestoneRow> => {
      const bid = requireBusiness(businessId);
      const cached = qc.getQueryData<Roadmap>(roadmapKeys.all(bid));
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          business_id: bid,
          title: input.title.trim(),
          phase: input.phase,
          target_date: input.targetDate !== undefined ? input.targetDate : dueDateFromOffset(input.dueInDays),
          source: input.source ?? 'user',
          sort_order: cached ? nextSortOrder(cached.milestones, input.phase) : 0,
        })
        .select()
        .single();
      if (error) fail(error);
      const row = narrowMilestone(data);
      if (!row) fail({ code: 'P0001', message: 'invalid_request' });
      return row;
    },
    onSuccess: (milestone) => {
      if (!businessId) return;
      patchRoadmap(qc, businessId, (r) => upsertMilestone(r, milestone));
      void invalidateRoadmap(qc, businessId);
    },
  });
}

export interface MilestonePatch {
  title?: string;
  phase?: RoadmapPhase;
  targetDate?: ISODate | null;
  achieved?: boolean;
}

async function updateMilestoneRow(businessId: string, id: string, patch: MilestonePatch): Promise<MilestoneRow> {
  const update: TablesUpdate<'milestones'> = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.phase !== undefined) update.phase = patch.phase;
  if (patch.targetDate !== undefined) update.target_date = patch.targetDate;
  if (patch.achieved !== undefined) update.achieved_at = patch.achieved ? new Date().toISOString() : null;
  const { data, error } = await supabase.from('milestones').update(update).eq('id', id).eq('business_id', businessId).select().single();
  if (error) fail(error);
  const row = narrowMilestone(data);
  if (!row) fail({ code: 'P0001', message: 'invalid_request' });
  return row;
}

export function useUpdateMilestone(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: MilestonePatch }) => updateMilestoneRow(requireBusiness(businessId), id, patch),
    onSuccess: (milestone) => {
      if (!businessId) return;
      patchRoadmap(qc, businessId, (r) => upsertMilestone(r, milestone));
      void invalidateRoadmap(qc, businessId);
    },
  });
}

/** Marks a milestone achieved / not achieved. Optimistic with per-item rollback. */
export function useToggleMilestone(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, achieved }: { id: string; achieved: boolean }) => updateMilestoneRow(requireBusiness(businessId), id, { achieved }),
    onMutate: async ({ id, achieved }) => {
      if (!businessId) return { previous: undefined };
      await qc.cancelQueries({ queryKey: roadmapKeys.all(businessId) });
      const previous = qc.getQueryData<Roadmap>(roadmapKeys.all(businessId))?.milestones.find((m) => m.id === id);
      if (previous) {
        patchRoadmap(qc, businessId, (r) =>
          upsertMilestone(r, { ...previous, achieved_at: achieved ? (previous.achieved_at ?? new Date().toISOString()) : null }),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      const previous = context?.previous;
      if (businessId && previous) patchRoadmap(qc, businessId, (r) => upsertMilestone(r, previous));
    },
    onSuccess: (milestone) => {
      if (businessId) patchRoadmap(qc, businessId, (r) => upsertMilestone(r, milestone));
    },
    onSettled: () => (businessId ? invalidateRoadmap(qc, businessId) : undefined),
  });
}

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

export type GenerateRoadmapMode = 'create' | 'replace_ai_items';

/**
 * Generates (mode 'create') or rebuilds (mode 'replace_ai_items') the roadmap from the current
 * plan; the function persists it. Rejects with AppError codes such as `conflict` (create when AI
 * items already exist), `precondition_failed` (no ready plan), `quota_exceeded`, `not_configured`.
 */
export function useGenerateRoadmap(businessId: BusinessId) {
  const qc = useQueryClient();
  const { locale } = useLocale();
  return useMutation({
    mutationFn: ({ mode }: { mode: GenerateRoadmapMode }): Promise<AiResponse<'roadmap.generate'>> =>
      invokeAi({ action: 'roadmap.generate', businessId: requireBusiness(businessId), mode, locale }),
    onSettled: () => (businessId ? invalidateRoadmap(qc, businessId) : undefined),
  });
}

/** Asks the AI for next-step suggestions. Nothing is saved; add them with useCreateTask. */
export function useRecommendTasks(businessId: BusinessId) {
  const { locale } = useLocale();
  return useMutation({
    mutationFn: async ({ instruction }: { instruction?: string } = {}): Promise<RoadmapSuggestion[]> => {
      const trimmed = instruction?.trim();
      const response = await invokeAi({
        action: 'roadmap.recommend',
        businessId: requireBusiness(businessId),
        locale,
        ...(trimmed ? { instruction: trimmed } : {}),
      });
      return Array.isArray(response.suggestions) ? response.suggestions : [];
    },
  });
}
