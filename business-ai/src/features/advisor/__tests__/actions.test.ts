import type { AdvisorAction } from '@domain/ai-api';
import {
  actionTarget,
  dueDateFromDays,
  invalidationKeysFor,
  isActionComplete,
  isWriteAction,
  parseApplyResult,
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

describe('previewAction (mirrors what apply_advisor_action writes)', () => {
  it('previews an advisor task with a trimmed title and a due date', () => {
    expect(previewAction(task as WriteAction, TODAY)).toEqual({
      kind: 'task',
      title: 'Call three suppliers',
      description: 'Ask for minimum order quantities.',
      phase: 'days_30',
      priority: 'high',
      dueDate: '2026-11-12',
    });
  });

  it('previews a milestone without a due date', () => {
    expect(previewAction(milestone as WriteAction, TODAY)).toEqual({ kind: 'milestone', title: 'First 10 customers', phase: 'days_60', targetDate: null });
  });

  it('labels finance items as AI estimates', () => {
    expect(previewAction(expense as WriteAction)).toEqual({ kind: 'recurring_expense', label: 'Hosting', monthlyAmountMinor: 4900, basis: 'ai_estimate' });
    expect(previewAction(cost as WriteAction)).toEqual({ kind: 'startup_cost', label: 'Espresso machine', amountMinor: 1_250_000, basis: 'ai_estimate' });
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

  it('parses the apply RPC result and rejects unexpected shapes', () => {
    expect(parseApplyResult({ status: 'applied', table: 'recurring_expenses', row_id: 'r1', applied_action_ids: ['a1'] })).toEqual({
      status: 'applied',
      appliedActionIds: ['a1'],
    });
    expect(parseApplyResult({ status: 'already_applied', applied_action_ids: ['a1', 'a2'] })).toEqual({
      status: 'already_applied',
      appliedActionIds: ['a1', 'a2'],
    });
    expect(parseApplyResult(null)).toBeNull();
    expect(parseApplyResult({ status: 'done', applied_action_ids: [] })).toBeNull();
    expect(parseApplyResult({ status: 'applied', applied_action_ids: [1] })).toBeNull();
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
