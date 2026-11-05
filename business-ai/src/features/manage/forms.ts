/**
 * Form values, zod schemas and parsing for the transaction and goal editors.
 * Error messages are translation keys (render with `t(message)`).
 */
import { z } from 'zod';
import { minorToInputText, parseMoneyInput } from '@/i18n/format';
import type { TranslationKey } from '@/i18n/translate';
import { GOAL_METRICS, GOAL_STATUSES, isMoneyMetric, TRANSACTION_KINDS, type GoalMetric, type GoalStatus, type TransactionKind } from './logic';

export const LIMITS = Object.freeze({
  categoryMax: 60,
  noteMax: 500,
  titleMax: 200,
  unitMax: 20,
  /** numeric(20,2) fits far more; keep values exact as JS numbers. */
  maxDecimal: 10_000_000_000_000,
});

const K = {
  required: 'errors.field.required',
  amountInvalid: 'errors.field.amountInvalid',
  amountPositive: 'manage.validation.amountPositive',
  dateRequired: 'manage.validation.dateRequired',
  targetInvalid: 'manage.validation.targetInvalid',
  currentInvalid: 'manage.validation.currentInvalid',
  titleTooLong: 'manage.validation.titleTooLong',
  categoryTooLong: 'manage.validation.categoryTooLong',
  noteTooLong: 'manage.validation.noteTooLong',
  unitTooLong: 'manage.validation.unitTooLong',
} as const satisfies Record<string, TranslationKey>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Collapses inner whitespace runs and trims. */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Non-negative decimal with up to 2 places ("12.5", "1,200", "12,5"); null when invalid. */
export function parseDecimal(text: string): number | null {
  const hundredths = parseMoneyInput(text, 'XXX', { maxMinor: LIMITS.maxDecimal * 100 });
  if (hundredths === null) return null;
  const value = hundredths / 100;
  return value === 0 ? 0 : value;
}

/** Decimal → editable text without grouping. */
export function decimalToInputText(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  return minorToInputText(Math.round(value * 100));
}

/* ---------------------------------------------------------------------------------------------- */
/* Transactions                                                                                    */
/* ---------------------------------------------------------------------------------------------- */

export interface TransactionFormValues {
  kind: TransactionKind;
  amount: string;
  occurredOn: string | null;
  category: string;
  note: string;
}

export interface TransactionDraft {
  kind: TransactionKind;
  amount_minor: number;
  occurred_on: string;
  category: string;
  note: string;
}

export function transactionFormDefaults(
  row: { kind: string; amount_minor: number; occurred_on: string; category: string; note: string } | undefined,
  today: string,
  kind: TransactionKind = 'income',
): TransactionFormValues {
  if (!row) return { kind, amount: '', occurredOn: today, category: '', note: '' };
  return {
    kind: row.kind === 'expense' ? 'expense' : 'income',
    amount: minorToInputText(row.amount_minor),
    occurredOn: row.occurred_on,
    category: row.category,
    note: row.note,
  };
}

export function transactionFormSchema(currency: string) {
  return z
    .object({
      kind: z.enum(TRANSACTION_KINDS as [TransactionKind, ...TransactionKind[]]),
      amount: z.string(),
      occurredOn: z.string().nullable(),
      category: z.string(),
      note: z.string(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof TransactionFormValues, message: TranslationKey) => ctx.addIssue({ code: 'custom', path: [path], message });
      if (v.amount.trim() === '') issue('amount', K.required);
      else {
        const minor = parseMoneyInput(v.amount, currency);
        if (minor === null) issue('amount', K.amountInvalid);
        else if (minor <= 0) issue('amount', K.amountPositive);
      }
      if (!v.occurredOn || !ISO_DATE.test(v.occurredOn)) issue('occurredOn', K.dateRequired);
      if (cleanText(v.category).length > LIMITS.categoryMax) issue('category', K.categoryTooLong);
      if (v.note.trim().length > LIMITS.noteMax) issue('note', K.noteTooLong);
    });
}

export function parseTransactionForm(v: TransactionFormValues, currency: string): TransactionDraft | null {
  const amount = parseMoneyInput(v.amount, currency);
  if (amount === null || amount <= 0 || !v.occurredOn || !ISO_DATE.test(v.occurredOn)) return null;
  const category = cleanText(v.category);
  const note = v.note.trim();
  if (category.length > LIMITS.categoryMax || note.length > LIMITS.noteMax) return null;
  return { kind: v.kind, amount_minor: amount, occurred_on: v.occurredOn, category, note };
}

/* ---------------------------------------------------------------------------------------------- */
/* Goals                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export interface GoalFormValues {
  title: string;
  metric: GoalMetric;
  /** Money text for revenue/profit, a decimal otherwise. */
  target: string;
  /** Manual metrics only. */
  current: string;
  unit: string;
  dueDate: string | null;
  status: GoalStatus;
}

export interface GoalDraft {
  title: string;
  metric: GoalMetric;
  /** Minor units for revenue/profit. */
  target_value: number;
  current_value: number;
  unit: string;
  due_date: string | null;
  status: GoalStatus;
}

export function goalFormDefaults(
  row:
    | { title: string; metric: string; target_value: number; current_value: number; unit: string; due_date: string | null; status: string }
    | undefined,
): GoalFormValues {
  if (!row) return { title: '', metric: 'revenue', target: '', current: '', unit: '', dueDate: null, status: 'active' };
  const metric = (GOAL_METRICS as readonly string[]).includes(row.metric) ? (row.metric as GoalMetric) : 'custom';
  const status = (GOAL_STATUSES as readonly string[]).includes(row.status) ? (row.status as GoalStatus) : 'active';
  return {
    title: row.title,
    metric,
    target: isMoneyMetric(metric) ? minorToInputText(row.target_value) : decimalToInputText(row.target_value),
    current: isMoneyMetric(metric) ? '' : decimalToInputText(row.current_value),
    unit: row.unit,
    dueDate: row.due_date,
    status,
  };
}

function parseTarget(metric: GoalMetric, text: string, currency: string): number | null {
  return isMoneyMetric(metric) ? parseMoneyInput(text, currency) : parseDecimal(text);
}

export function goalFormSchema(currency: string) {
  return z
    .object({
      title: z.string(),
      metric: z.enum(GOAL_METRICS as [GoalMetric, ...GoalMetric[]]),
      target: z.string(),
      current: z.string(),
      unit: z.string(),
      dueDate: z.string().nullable(),
      status: z.enum(GOAL_STATUSES as [GoalStatus, ...GoalStatus[]]),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof GoalFormValues, message: TranslationKey) => ctx.addIssue({ code: 'custom', path: [path], message });
      const title = cleanText(v.title);
      if (title === '') issue('title', K.required);
      else if (title.length > LIMITS.titleMax) issue('title', K.titleTooLong);
      if (v.target.trim() === '') issue('target', K.required);
      else if (parseTarget(v.metric, v.target, currency) === null) issue('target', K.targetInvalid);
      if (!isMoneyMetric(v.metric) && v.current.trim() !== '' && parseDecimal(v.current) === null) issue('current', K.currentInvalid);
      if (cleanText(v.unit).length > LIMITS.unitMax) issue('unit', K.unitTooLong);
      if (v.dueDate !== null && !ISO_DATE.test(v.dueDate)) issue('dueDate', K.dateRequired);
    });
}

/**
 * Validated values → row fields. For revenue/profit the target is minor units, the manual
 * current value is reset to 0 and the unit cleared (progress comes from transactions).
 */
export function parseGoalForm(v: GoalFormValues, currency: string): GoalDraft | null {
  const title = cleanText(v.title);
  const target = parseTarget(v.metric, v.target, currency);
  if (title === '' || title.length > LIMITS.titleMax || target === null) return null;
  const money = isMoneyMetric(v.metric);
  const current = money ? 0 : v.current.trim() === '' ? 0 : parseDecimal(v.current);
  if (current === null) return null;
  const unit = money ? '' : cleanText(v.unit);
  if (unit.length > LIMITS.unitMax) return null;
  if (v.dueDate !== null && !ISO_DATE.test(v.dueDate)) return null;
  return { title, metric: v.metric, target_value: target, current_value: current, unit, due_date: v.dueDate, status: v.status };
}
