/**
 * "What should I do next?" — a pure, deterministic recommendation engine for the Home screen.
 *
 * Same input → same output: no clock, no randomness, no I/O. `today` is passed in as an ISO date
 * (YYYY-MM-DD, the user's local calendar day). The first matching rule wins:
 *
 *   1. onboarding incomplete                 → continue onboarding            (/onboarding)
 *   2. no plan                               → generate the plan              (/plan?generate=1)
 *   3. plan generating                       → view progress                  (/plan)
 *   4. plan generation failed                → retry                          (/plan?generate=1)
 *   5. no roadmap                            → create the roadmap             (/roadmap)
 *   6. overdue, unblocked, open tasks        → the most pressing one          (/roadmap/task/<id>)
 *        order: priority (high first), then most overdue, then sort order, then id
 *   7. other unblocked open tasks            → the next one                   (/roadmap/task/<id>)
 *        order: due date (undated last), then priority, then sort order, then id
 *   8. no finance inputs                     → set up finances                (/finance)
 *   9. everything done                       → ask the advisor for priorities (/advisor/new?prompt=…)
 */
import { translate, type TranslationKey } from '@/i18n/translate';
import type { Locale, TranslateVars } from '@/i18n/types';

export type PlanStatus = 'none' | 'generating' | 'failed' | 'ready';

export interface NextActionTask {
  id: string;
  title: string;
  /** 'todo' | 'in_progress' | 'done' */
  status: string;
  /** 'high' | 'medium' | 'low' */
  priority: string;
  /** YYYY-MM-DD or null. */
  due_date: string | null;
  /** True while at least one task it depends on is not done. */
  blocked: boolean;
  milestone_id?: string | null;
  sort_order?: number;
}

export interface NextActionMilestone {
  id: string;
  title: string;
  target_date: string | null;
  achieved_at: string | null;
}

export interface NextActionInput {
  onboardingComplete: boolean;
  planStatus: PlanStatus;
  hasRoadmap: boolean;
  tasks: readonly NextActionTask[];
  milestones: readonly NextActionMilestone[];
  hasFinanceInputs: boolean;
  /** The user's local calendar day, YYYY-MM-DD. */
  today: string;
  /** Language of the advisor prompt embedded in the advisor link. Default 'he'. */
  locale?: Locale;
}

export type NextActionKind =
  | 'continue_onboarding'
  | 'generate_plan'
  | 'plan_generating'
  | 'retry_plan'
  | 'create_roadmap'
  | 'overdue_task'
  | 'next_task'
  | 'setup_finances'
  | 'ask_advisor';

export interface NextAction {
  kind: NextActionKind;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  /** Variables for both `titleKey` and `bodyKey` (`count` selects plural forms). */
  vars: TranslateVars;
  /** Label of the primary button. */
  ctaKey: TranslationKey;
  href: string;
  /** The recommended task, for task kinds. */
  taskId?: string;
}

const PRIORITY_RANK: Readonly<Record<string, number>> = { high: 0, medium: 1, low: 2 };

function priorityRank(priority: string): number {
  return PRIORITY_RANK[priority] ?? 3;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Days since 1970-01-01 for a YYYY-MM-DD (or timestamp-prefixed) string; null when invalid. */
export function dayNumber(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return Math.round(ms / 86_400_000);
}

/** Whole calendar days from `from` to `to` (positive when `to` is later); null when either is invalid. */
export function daysBetween(from: string, to: string): number | null {
  const a = dayNumber(from);
  const b = dayNumber(to);
  return a === null || b === null ? null : b - a;
}

function isOpen(task: NextActionTask): boolean {
  return task.status !== 'done';
}

function compareIds(a: NextActionTask, b: NextActionTask): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function compareSortOrder(a: NextActionTask, b: NextActionTask): number {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

/** Highest priority first, then the most overdue, then sort order, then id. */
function compareOverdue(a: NextActionTask, b: NextActionTask): number {
  return (
    priorityRank(a.priority) - priorityRank(b.priority) ||
    (dayNumber(a.due_date) ?? 0) - (dayNumber(b.due_date) ?? 0) ||
    compareSortOrder(a, b) ||
    compareIds(a, b)
  );
}

/** Earliest due date first (undated last), then priority, then sort order, then id. */
function compareNext(a: NextActionTask, b: NextActionTask): number {
  const da = dayNumber(a.due_date);
  const db = dayNumber(b.due_date);
  if (da !== db) {
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  }
  return priorityRank(a.priority) - priorityRank(b.priority) || compareSortOrder(a, b) || compareIds(a, b);
}

/** Open, unblocked tasks due strictly before `today`, most pressing first. */
export function overdueTasks(tasks: readonly NextActionTask[], today: string): NextActionTask[] {
  const todayN = dayNumber(today);
  if (todayN === null) return [];
  return tasks
    .filter((t) => {
      if (!isOpen(t) || t.blocked) return false;
      const due = dayNumber(t.due_date);
      return due !== null && due < todayN;
    })
    .sort(compareOverdue);
}

function taskHref(id: string): string {
  return `/roadmap/task/${encodeURIComponent(id)}`;
}

function nextTaskBody(
  task: NextActionTask,
  milestones: readonly NextActionMilestone[],
  today: string,
): { bodyKey: TranslationKey; vars: TranslateVars } {
  const days = task.due_date ? daysBetween(today, task.due_date) : null;
  if (days !== null && days <= 0) return { bodyKey: 'home.next.nextTask.dueToday', vars: {} };
  if (days === 1) return { bodyKey: 'home.next.nextTask.dueTomorrow', vars: {} };
  if (days !== null && days > 1) return { bodyKey: 'home.next.nextTask.dueInDays', vars: { count: days } };
  const milestone = task.milestone_id ? milestones.find((m) => m.id === task.milestone_id) : undefined;
  if (milestone) return { bodyKey: 'home.next.nextTask.milestone', vars: { milestone: milestone.title } };
  return { bodyKey: 'home.next.nextTask.noDate', vars: {} };
}

export function advisorHref(prompt: string): string {
  return `/advisor/new?prompt=${encodeURIComponent(prompt)}`;
}

export function nextAction(input: NextActionInput): NextAction {
  const { today } = input;

  if (!input.onboardingComplete) {
    return {
      kind: 'continue_onboarding',
      titleKey: 'home.next.continueOnboarding.title',
      bodyKey: 'home.next.continueOnboarding.body',
      ctaKey: 'home.next.continueOnboarding.cta',
      vars: {},
      href: '/onboarding',
    };
  }

  switch (input.planStatus) {
    case 'none':
      return {
        kind: 'generate_plan',
        titleKey: 'home.next.generatePlan.title',
        bodyKey: 'home.next.generatePlan.body',
        ctaKey: 'home.next.generatePlan.cta',
        vars: {},
        href: '/plan?generate=1',
      };
    case 'generating':
      return {
        kind: 'plan_generating',
        titleKey: 'home.next.planGenerating.title',
        bodyKey: 'home.next.planGenerating.body',
        ctaKey: 'home.next.planGenerating.cta',
        vars: {},
        href: '/plan',
      };
    case 'failed':
      return {
        kind: 'retry_plan',
        titleKey: 'home.next.retryPlan.title',
        bodyKey: 'home.next.retryPlan.body',
        ctaKey: 'home.next.retryPlan.cta',
        vars: {},
        href: '/plan?generate=1',
      };
    case 'ready':
      break;
  }

  if (!input.hasRoadmap) {
    return {
      kind: 'create_roadmap',
      titleKey: 'home.next.createRoadmap.title',
      bodyKey: 'home.next.createRoadmap.body',
      ctaKey: 'home.next.createRoadmap.cta',
      vars: {},
      href: '/roadmap',
    };
  }

  const overdue = overdueTasks(input.tasks, today)[0];
  if (overdue) {
    const days = daysBetween(overdue.due_date ?? today, today) ?? 1;
    return {
      kind: 'overdue_task',
      titleKey: 'home.next.overdueTask.title',
      bodyKey: 'home.next.overdueTask.body',
      ctaKey: 'home.next.overdueTask.cta',
      vars: { title: overdue.title, count: days },
      href: taskHref(overdue.id),
      taskId: overdue.id,
    };
  }

  const next = input.tasks.filter((t) => isOpen(t) && !t.blocked).sort(compareNext)[0];
  if (next) {
    const body = nextTaskBody(next, input.milestones, today);
    return {
      kind: 'next_task',
      titleKey: 'home.next.nextTask.title',
      bodyKey: body.bodyKey,
      ctaKey: 'home.next.nextTask.cta',
      vars: { title: next.title, ...body.vars },
      href: taskHref(next.id),
      taskId: next.id,
    };
  }

  if (!input.hasFinanceInputs) {
    return {
      kind: 'setup_finances',
      titleKey: 'home.next.setupFinances.title',
      bodyKey: 'home.next.setupFinances.body',
      ctaKey: 'home.next.setupFinances.cta',
      vars: {},
      href: '/finance',
    };
  }

  return {
    kind: 'ask_advisor',
    titleKey: 'home.next.askAdvisor.title',
    bodyKey: 'home.next.askAdvisor.body',
    ctaKey: 'home.next.askAdvisor.cta',
    vars: {},
    href: advisorHref(translate(input.locale ?? 'he', 'home.next.askAdvisor.prompt')),
  };
}
