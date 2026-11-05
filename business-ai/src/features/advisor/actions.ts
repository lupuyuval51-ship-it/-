/**
 * Proposed advisor actions → exactly the rows the app will write when the user confirms. Pure.
 *
 * The advisor only PROPOSES (AdvisorAction). Nothing here touches the network; `useApplyAction`
 * in ./api.ts performs the write through RLS after an explicit tap, using these builders, so the
 * confirm sheet can show precisely what is about to be saved.
 */
import type { AdvisorAction } from '@domain/ai-api';
import { FINANCE_LIMITS } from '@domain/finance';
import type { RoadmapPhase, TaskPriority } from '@domain/plan';
import type { InsertRow } from '@/lib/database';
import { toISODate } from '@/i18n/format';

export type WriteAction = Exclude<AdvisorAction, { type: 'open_plan_section' }>;
export type ActionTarget = 'roadmap' | 'finance' | 'plan';

export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 2000;
export const FINANCE_LABEL_MAX = 120;

export function isWriteAction(action: AdvisorAction): action is WriteAction {
  return action.type !== 'open_plan_section';
}

/** Which feature's data an action writes (for invalidation and copy). */
export function actionTarget(action: AdvisorAction): ActionTarget {
  switch (action.type) {
    case 'add_task':
    case 'add_milestone':
      return 'roadmap';
    case 'add_recurring_expense':
    case 'add_startup_cost':
      return 'finance';
    case 'open_plan_section':
      return 'plan';
  }
}

/** The user-facing name of the item an action creates or opens (already trimmed). */
export function actionSubject(action: AdvisorAction): string {
  switch (action.type) {
    case 'add_task':
    case 'add_milestone':
      return action.title.trim();
    case 'add_recurring_expense':
      return action.expenseLabel.trim();
    case 'add_startup_cost':
      return action.costLabel.trim();
    case 'open_plan_section':
      return action.sectionKey;
  }
}

/**
 * Whether the proposal has everything the database requires (non-blank title/label). Invalid
 * proposals are shown disabled with an explanation instead of failing on tap.
 */
export function isActionComplete(action: AdvisorAction): boolean {
  return actionSubject(action) !== '';
}

/** Local calendar date `days` from `today` as YYYY-MM-DD, or null when no due date was proposed. */
export function dueDateFromDays(days: number | null, today: Date = new Date()): string | null {
  if (days === null || !Number.isFinite(days)) return null;
  const whole = Math.max(0, Math.min(365, Math.round(days)));
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + whole);
  return toISODate(date);
}

function clampAmount(minor: number): number {
  if (!Number.isFinite(minor)) return 0;
  return Math.max(0, Math.min(FINANCE_LIMITS.maxAmountMinor, Math.round(minor)));
}

function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trimEnd() : trimmed;
}

export interface TaskPreview {
  kind: 'task';
  title: string;
  description: string;
  phase: RoadmapPhase;
  priority: TaskPriority;
  dueDate: string | null;
}
export interface MilestonePreview {
  kind: 'milestone';
  title: string;
  phase: RoadmapPhase;
  targetDate: string | null;
}
export interface RecurringExpensePreview {
  kind: 'recurring_expense';
  label: string;
  monthlyAmountMinor: number;
  basis: 'ai_estimate';
}
export interface StartupCostPreview {
  kind: 'startup_cost';
  label: string;
  amountMinor: number;
  basis: 'ai_estimate';
}
export type ActionPreview = TaskPreview | MilestonePreview | RecurringExpensePreview | StartupCostPreview;

/** Exactly what will be written, in display form (the confirm sheet renders this). */
export function previewAction(action: WriteAction, today: Date = new Date()): ActionPreview {
  switch (action.type) {
    case 'add_task':
      return {
        kind: 'task',
        title: clip(action.title, TASK_TITLE_MAX),
        description: clip(action.description, TASK_DESCRIPTION_MAX),
        phase: action.phase,
        priority: action.priority,
        dueDate: dueDateFromDays(action.dueInDays, today),
      };
    case 'add_milestone':
      return {
        kind: 'milestone',
        title: clip(action.title, TASK_TITLE_MAX),
        phase: action.phase,
        targetDate: dueDateFromDays(action.dueInDays, today),
      };
    case 'add_recurring_expense':
      return {
        kind: 'recurring_expense',
        label: clip(action.expenseLabel, FINANCE_LABEL_MAX),
        monthlyAmountMinor: clampAmount(action.monthlyAmountMinor),
        basis: 'ai_estimate',
      };
    case 'add_startup_cost':
      return {
        kind: 'startup_cost',
        label: clip(action.costLabel, FINANCE_LABEL_MAX),
        amountMinor: clampAmount(action.amountMinor),
        basis: 'ai_estimate',
      };
  }
}

export type ActionInsert =
  | { table: 'tasks'; row: InsertRow<'tasks'> }
  | { table: 'milestones'; row: InsertRow<'milestones'> }
  | { table: 'recurring_expenses'; row: InsertRow<'recurring_expenses'> }
  | { table: 'startup_costs'; row: InsertRow<'startup_costs'> };

/** The insert the app performs (through RLS) for a confirmed preview. */
export function buildActionInsert(businessId: string, preview: ActionPreview): ActionInsert {
  switch (preview.kind) {
    case 'task':
      return {
        table: 'tasks',
        row: {
          business_id: businessId,
          title: preview.title,
          description: preview.description,
          phase: preview.phase,
          priority: preview.priority,
          due_date: preview.dueDate,
          status: 'todo',
          source: 'advisor',
        },
      };
    case 'milestone':
      return {
        table: 'milestones',
        row: {
          business_id: businessId,
          title: preview.title,
          phase: preview.phase,
          target_date: preview.targetDate,
          source: 'advisor',
        },
      };
    case 'recurring_expense':
      return {
        table: 'recurring_expenses',
        row: {
          business_id: businessId,
          label: preview.label,
          monthly_amount_minor: preview.monthlyAmountMinor,
          basis: preview.basis,
        },
      };
    case 'startup_cost':
      return {
        table: 'startup_costs',
        row: {
          business_id: businessId,
          label: preview.label,
          amount_minor: preview.amountMinor,
          basis: preview.basis,
        },
      };
  }
}

/** Query keys to invalidate after an action wrote another feature's data. */
export function invalidationKeysFor(businessId: string, action: AdvisorAction): (readonly unknown[])[] {
  switch (actionTarget(action)) {
    case 'roadmap':
      return [['b', businessId, 'roadmap']];
    case 'finance':
      return [['b', businessId, 'finance']];
    case 'plan':
      return [];
  }
}

/** New applied-id list: union, order preserved, only ids that exist in `actions`. */
export function mergeAppliedIds(current: readonly string[], add: string, actions: readonly AdvisorAction[]): string[] {
  const valid = new Set(actions.map((a) => a.id));
  const next = current.filter((id) => valid.has(id));
  if (valid.has(add) && !next.includes(add)) next.push(add);
  return next;
}
