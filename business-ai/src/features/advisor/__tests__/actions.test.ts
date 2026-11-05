import type { AdvisorAction } from '@domain/ai-api';
import {
  actionTarget,
  buildActionInsert,
  dueDateFromDays,
  invalidationKeysFor,
  isActionComplete,
  isWriteAction,
  mergeAppliedIds,
  previewAction,
  type WriteAction,
} from '../actions';
import { relativeTime } from '../time';

const task: AdvisorAction = {
  type: 'add_task',
  id: 'a1',
  label: 'Add task',
  title: '  Call three suppliers  ',
  description: 'Ask for minimum order quantities.',
  phase: 'days_30',
  priority: 'high',
  dueInDays: 7,
};
const milestone: AdvisorAction = { type: 'add_milestone', id: 'a2', label: 'm', title: 'First 10 customers', phase: 'days_60', dueInDays: null };
const expense: AdvisorAction = { type: 'add_recurring_expense', id: 'a3', label: 'e', expenseLabel: 'Hosting', monthlyAmountMinor: 4900 };
const cost: AdvisorAction = { type: 'add_startup_cost', id: 'a4', label: 'c', costLabel: 'Espresso machine', amountMinor: 1_250_000 };
const open: AdvisorAction = { type: 'open_plan_section', id: 'a5', label: 'o', sectionKey: 'pricing_strategy' };

const TODAY = new Date(2026, 10, 5, 23, 30); // 5 Nov 2026, late evening local time

describe('dueDateFromDays', () => {
  it('adds calendar days in local time', () => {
    expect(dueDateFromDays(0, TODAY)).toBe('2026-11-05');
    expect(dueDateFromDays(7, TODAY)).toBe('2026-11-12');
    expect(dueDateFromDays(30, TODAY)).toBe('2026-12-05');
    expect(dueDateFromDays(365, new Date(2026, 0, 1))).toBe('2027-01-01');
  });

  it('returns null without a proposed due date and clamps out-of-range input', () => {
    expect(dueDateFromDays(null, TODAY)).toBeNull();
    expect(dueDateFromDays(-3, TODAY)).toBe('2026-11-05');
    expect(dueDateFromDays(5000, new Date(2026, 0, 1))).toBe('2027-01-01');
  });
});

describe('previewAction + buildActionInsert', () => {
  it('builds an advisor-sourced task with a due date', () => {
    const preview = previewAction(task as WriteAction, TODAY);
    expect(preview).toEqual({
      kind: 'task',
      title: 'Call three suppliers',
      description: 'Ask for minimum order quantities.',
      phase: 'days_30',
      priority: 'high',
      dueDate: '2026-11-12',
    });
    expect(buildActionInsert('b1', preview)).toEqual({
      table: 'tasks',
      row: {
        business_id: 'b1',
        title: 'Call three suppliers',
        description: 'Ask for minimum order quantities.',
        phase: 'days_30',
        priority: 'high',
        due_date: '2026-11-12',
        status: 'todo',
        source: 'advisor',
      },
    });
  });

  it('builds an advisor-sourced milestone', () => {
    expect(buildActionInsert('b1', previewAction(milestone as WriteAction, TODAY))).toEqual({
      table: 'milestones',
      row: { business_id: 'b1', title: 'First 10 customers', phase: 'days_60', target_date: null, source: 'advisor' },
    });
  });

  it('labels finance items as AI estimates', () => {
    expect(buildActionInsert('b1', previewAction(expense as WriteAction))).toEqual({
      table: 'recurring_expenses',
      row: { business_id: 'b1', label: 'Hosting', monthly_amount_minor: 4900, basis: 'ai_estimate' },
    });
    expect(buildActionInsert('b1', previewAction(cost as WriteAction))).toEqual({
      table: 'startup_costs',
      row: { business_id: 'b1', label: 'Espresso machine', amount_minor: 1_250_000, basis: 'ai_estimate' },
    });
  });
});

describe('action helpers', () => {
  it('classifies targets and invalidation keys', () => {
    expect([task, milestone, expense, cost, open].map(actionTarget)).toEqual(['roadmap', 'roadmap', 'finance', 'finance', 'plan']);
    expect(isWriteAction(open)).toBe(false);
    expect(isWriteAction(task)).toBe(true);
    expect(invalidationKeysFor('b1', task)).toEqual([['b', 'b1', 'roadmap']]);
    expect(invalidationKeysFor('b1', cost)).toEqual([['b', 'b1', 'finance']]);
    expect(invalidationKeysFor('b1', open)).toEqual([]);
  });

  it('flags proposals with a blank title as incomplete', () => {
    expect(isActionComplete(task)).toBe(true);
    expect(isActionComplete({ ...task, title: '   ' } as AdvisorAction)).toBe(false);
    expect(isActionComplete({ ...expense, expenseLabel: '' } as AdvisorAction)).toBe(false);
  });

  it('merges applied ids as a subset of the message actions', () => {
    const actions = [task, milestone, expense];
    expect(mergeAppliedIds([], 'a1', actions)).toEqual(['a1']);
    expect(mergeAppliedIds(['a1'], 'a1', actions)).toEqual(['a1']);
    expect(mergeAppliedIds(['a1', 'gone'], 'a3', actions)).toEqual(['a1', 'a3']);
    expect(mergeAppliedIds(['a1'], 'unknown', actions)).toEqual(['a1']);
  });
});

describe('relativeTime', () => {
  const now = new Date(2026, 10, 5, 15, 0);
  it('produces relative phrases for recent times', () => {
    expect(relativeTime(new Date(2026, 10, 5, 14, 59, 30).toISOString(), now)).toEqual({ kind: 'key', key: 'advisor.time.justNow' });
    expect(relativeTime(new Date(2026, 10, 5, 15, 0, 10).toISOString(), now)).toEqual({ kind: 'key', key: 'advisor.time.justNow' });
    expect(relativeTime(new Date(2026, 10, 5, 14, 35).toISOString(), now)).toEqual({ kind: 'count', key: 'advisor.time.minutesAgo', count: 25 });
    expect(relativeTime(new Date(2026, 10, 5, 9, 0).toISOString(), now)).toEqual({ kind: 'count', key: 'advisor.time.hoursAgo', count: 6 });
    expect(relativeTime(new Date(2026, 10, 4, 22, 0).toISOString(), now)).toEqual({ kind: 'key', key: 'advisor.time.yesterday' });
  });

  it('falls back to a date', () => {
    const r = relativeTime(new Date(2026, 9, 1).toISOString(), now);
    expect(r).toMatchObject({ kind: 'date', sameYear: true });
    expect(relativeTime(new Date(2025, 9, 1).toISOString(), now)).toMatchObject({ kind: 'date', sameYear: false });
    expect(relativeTime('nope', now)).toBeNull();
  });
});
