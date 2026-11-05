/**
 * Business management — pure aggregation helpers for actual results (transactions), goals and
 * plan-vs-actual. Deterministic: no clock, no I/O; dates are passed in as ISO strings.
 *
 * Money is integer minor units throughout. Transactions store a positive `amount_minor`; `kind`
 * gives the sign (income +, expense −). Projections come from the `@domain/finance` forecast as-is
 * (this file only reads its month rows; it never re-implements forecast formulas).
 */
import type { Forecast, ForecastMonth } from '@domain/finance';

export type TransactionKind = 'income' | 'expense';
export const TRANSACTION_KINDS: readonly TransactionKind[] = ['income', 'expense'];

export type GoalMetric = 'revenue' | 'customers' | 'profit' | 'custom';
export const GOAL_METRICS: readonly GoalMetric[] = ['revenue', 'customers', 'profit', 'custom'];

export type GoalStatus = 'active' | 'achieved' | 'dropped';
export const GOAL_STATUSES: readonly GoalStatus[] = ['active', 'achieved', 'dropped'];

export interface TransactionLike {
  id?: string;
  kind: string;
  amount_minor: number;
  /** YYYY-MM-DD */
  occurred_on: string;
  created_at?: string;
}

export interface MonthTotals {
  /** YYYY-MM */
  month: string;
  incomeMinor: number;
  expenseMinor: number;
  /** income − expenses */
  netMinor: number;
  count: number;
}

/* ---------------------------------------------------------------------------------------------- */
/* Months                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

const MONTH_PREFIX = /^(\d{4})-(\d{2})/;

/** 'YYYY-MM' of an ISO date or timestamp; null when invalid. */
export function monthKey(date: string | null | undefined): string | null {
  if (!date) return null;
  const m = MONTH_PREFIX.exec(date);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}`;
}

function monthOrdinal(month: string): number | null {
  const key = monthKey(month);
  if (!key) return null;
  return Number(key.slice(0, 4)) * 12 + (Number(key.slice(5, 7)) - 1);
}

function ordinalToMonth(ordinal: number): string {
  const year = Math.floor(ordinal / 12);
  const month = ordinal - year * 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** `month` shifted by `n` months (n may be negative). Invalid input is returned unchanged. */
export function addMonths(month: string, n: number): string {
  const o = monthOrdinal(month);
  return o === null ? month : ordinalToMonth(o + Math.trunc(n));
}

export function previousMonthKey(month: string): string {
  return addMonths(month, -1);
}

/** Whole calendar months from `from` to `to` ('2026-11' → '2027-01' = 2); null when invalid. */
export function monthsBetween(from: string, to: string): number | null {
  const a = monthOrdinal(from);
  const b = monthOrdinal(to);
  return a === null || b === null ? null : b - a;
}

/* ---------------------------------------------------------------------------------------------- */
/* Totals                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

function emptyTotals(month: string): MonthTotals {
  return { month, incomeMinor: 0, expenseMinor: 0, netMinor: 0, count: 0 };
}

function addTo(totals: MonthTotals, tx: TransactionLike): void {
  const amount = Number.isFinite(tx.amount_minor) ? Math.round(Math.abs(tx.amount_minor)) : 0;
  if (tx.kind === 'income') totals.incomeMinor += amount;
  else if (tx.kind === 'expense') totals.expenseMinor += amount;
  else return;
  totals.netMinor = totals.incomeMinor - totals.expenseMinor;
  totals.count += 1;
}

/** Totals of all transactions (any month). */
export function sumTransactions(transactions: readonly TransactionLike[], month = ''): MonthTotals {
  const totals = emptyTotals(month);
  for (const tx of transactions) addTo(totals, tx);
  return totals;
}

/** Totals for one month ('YYYY-MM'); zeroes when there are no transactions. */
export function totalsForMonth(transactions: readonly TransactionLike[], month: string): MonthTotals {
  const totals = emptyTotals(month);
  for (const tx of transactions) if (monthKey(tx.occurred_on) === month) addTo(totals, tx);
  return totals;
}

/** Totals per month that has transactions, newest month first. */
export function monthlyTotals(transactions: readonly TransactionLike[]): MonthTotals[] {
  const byMonth = new Map<string, MonthTotals>();
  for (const tx of transactions) {
    const key = monthKey(tx.occurred_on);
    if (!key) continue;
    let totals = byMonth.get(key);
    if (!totals) {
      totals = emptyTotals(key);
      byMonth.set(key, totals);
    }
    addTo(totals, tx);
  }
  return [...byMonth.values()].sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0));
}

export interface MonthGroup<T extends TransactionLike> {
  month: string;
  totals: MonthTotals;
  /** Newest first (occurred_on, then created_at, then id). */
  items: T[];
}

function compareTxDesc(a: TransactionLike, b: TransactionLike): number {
  if (a.occurred_on !== b.occurred_on) return a.occurred_on < b.occurred_on ? 1 : -1;
  const ca = a.created_at ?? '';
  const cb = b.created_at ?? '';
  if (ca !== cb) return ca < cb ? 1 : -1;
  const ia = a.id ?? '';
  const ib = b.id ?? '';
  return ia < ib ? 1 : ia > ib ? -1 : 0;
}

/** Transactions grouped by month, newest month first, each with its totals. */
export function groupByMonth<T extends TransactionLike>(transactions: readonly T[]): MonthGroup<T>[] {
  const groups = new Map<string, MonthGroup<T>>();
  for (const tx of transactions) {
    const key = monthKey(tx.occurred_on);
    if (!key) continue;
    let group = groups.get(key);
    if (!group) {
      group = { month: key, totals: emptyTotals(key), items: [] };
      groups.set(key, group);
    }
    group.items.push(tx);
    addTo(group.totals, tx);
  }
  const result = [...groups.values()].sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0));
  for (const g of result) g.items.sort(compareTxDesc);
  return result;
}

export type KindFilter = 'all' | TransactionKind;

export function filterByKind<T extends TransactionLike>(transactions: readonly T[], filter: KindFilter): T[] {
  return filter === 'all' ? [...transactions] : transactions.filter((t) => t.kind === filter);
}

/* ---------------------------------------------------------------------------------------------- */
/* Month over month                                                                                */
/* ---------------------------------------------------------------------------------------------- */

export interface Delta {
  /** current − previous */
  deltaMinor: number;
  /** Relative change in percent (1 decimal); null when the previous value is 0. */
  changePct: number | null;
}

export interface MonthOverMonth {
  current: MonthTotals;
  previous: MonthTotals;
  income: Delta;
  expenses: Delta;
  net: Delta;
}

function delta(current: number, previous: number): Delta {
  const deltaMinor = current - previous;
  const changePct = previous === 0 ? null : Math.round((deltaMinor / Math.abs(previous)) * 1000) / 10;
  return { deltaMinor, changePct: changePct === 0 ? 0 : changePct };
}

export function monthOverMonth(transactions: readonly TransactionLike[], month: string): MonthOverMonth {
  const current = totalsForMonth(transactions, month);
  const previous = totalsForMonth(transactions, previousMonthKey(month));
  return {
    current,
    previous,
    income: delta(current.incomeMinor, previous.incomeMinor),
    expenses: delta(current.expenseMinor, previous.expenseMinor),
    net: delta(current.netMinor, previous.netMinor),
  };
}

/* ---------------------------------------------------------------------------------------------- */
/* Goals                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export interface GoalLike {
  metric: string;
  /** Minor units for revenue/profit; otherwise in the goal's unit. */
  target_value: number;
  /** Manual progress (customers/custom). Ignored for revenue/profit. */
  current_value: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  /** 0…1 (clamped). */
  ratio: number;
  /** Whole percent 0…100, rounded down so 100 means the target is actually reached. */
  percent: number;
  reached: boolean;
  /** `transactions`: computed from recorded transactions; `manual`: the goal's current_value. */
  source: 'transactions' | 'manual';
  /** True when values are money in minor units (revenue / profit). */
  isMoney: boolean;
}

export function isMoneyMetric(metric: string): boolean {
  return metric === 'revenue' || metric === 'profit';
}

/**
 * Progress toward a goal. Revenue = all recorded income; profit = all recorded income − expenses
 * (both from transactions, minor units). Customers / custom use the manually entered current value.
 */
export function goalProgress(goal: GoalLike, transactions: readonly TransactionLike[]): GoalProgress {
  const money = isMoneyMetric(goal.metric);
  let current: number;
  if (money) {
    const totals = sumTransactions(transactions);
    current = goal.metric === 'revenue' ? totals.incomeMinor : totals.netMinor;
  } else {
    current = Number.isFinite(goal.current_value) ? goal.current_value : 0;
  }
  const target = Number.isFinite(goal.target_value) ? Math.max(0, goal.target_value) : 0;
  const reached = current >= target;
  const ratio = target <= 0 ? (reached ? 1 : 0) : Math.min(1, Math.max(0, current / target));
  const percent = reached ? 100 : Math.min(99, Math.floor(ratio * 100));
  return { current, target, ratio: reached ? 1 : ratio, percent, reached, source: money ? 'transactions' : 'manual', isMoney: money };
}

/* ---------------------------------------------------------------------------------------------- */
/* Plan vs actual                                                                                  */
/* ---------------------------------------------------------------------------------------------- */

/**
 * The plan start used to line up forecast months with calendar months: the roadmap's first
 * phase start date when there is one, otherwise the plan's creation date (both local YYYY-MM-DD).
 */
export function planStartDate(sources: { roadmapStartsOn?: string | null; planCreatedOn?: string | null }): string | null {
  if (monthKey(sources.roadmapStartsOn)) return sources.roadmapStartsOn ?? null;
  if (monthKey(sources.planCreatedOn)) return sources.planCreatedOn ?? null;
  return null;
}

/**
 * 1-based forecast month for a calendar month: the plan's start month is forecast month 1.
 * Null when either value is invalid. Can be ≤ 0 (before the plan started).
 */
export function forecastMonthIndex(planStart: string, month: string): number | null {
  const startMonth = monthKey(planStart);
  if (!startMonth) return null;
  const diff = monthsBetween(startMonth, month);
  return diff === null ? null : diff + 1;
}

export interface PlannedMonth {
  revenueMinor: number;
  /** Variable + fixed costs of that forecast month. */
  costsMinor: number;
  netMinor: number;
}

export interface PlanVsActual {
  month: string;
  /** Forecast month compared (1-based); null when the plan start is unknown. */
  monthIndex: number | null;
  /** 'before_start' | 'beyond_horizon' when there is no forecast month to compare. */
  status: 'compared' | 'no_start' | 'before_start' | 'beyond_horizon';
  planned: PlannedMonth | null;
  actual: { incomeMinor: number; expenseMinor: number; netMinor: number };
  /** actual − planned; null without a planned month. */
  variance: { revenueMinor: number; costsMinor: number; netMinor: number } | null;
}

function plannedFrom(row: ForecastMonth): PlannedMonth {
  return {
    revenueMinor: row.revenueMinor,
    costsMinor: row.variableCostsMinor + row.fixedCostsMinor,
    netMinor: row.netMinor,
  };
}

export function planVsActual(
  forecast: Pick<Forecast, 'months'> | null | undefined,
  planStart: string | null,
  month: string,
  actual: MonthTotals,
): PlanVsActual {
  const actualPart = { incomeMinor: actual.incomeMinor, expenseMinor: actual.expenseMinor, netMinor: actual.netMinor };
  const monthIndex = planStart ? forecastMonthIndex(planStart, month) : null;
  if (monthIndex === null) {
    return { month, monthIndex: null, status: 'no_start', planned: null, actual: actualPart, variance: null };
  }
  if (monthIndex < 1) {
    return { month, monthIndex, status: 'before_start', planned: null, actual: actualPart, variance: null };
  }
  const row = forecast?.months.find((m) => m.month === monthIndex);
  if (!row) {
    return { month, monthIndex, status: 'beyond_horizon', planned: null, actual: actualPart, variance: null };
  }
  const planned = plannedFrom(row);
  return {
    month,
    monthIndex,
    status: 'compared',
    planned,
    actual: actualPart,
    variance: {
      revenueMinor: actual.incomeMinor - planned.revenueMinor,
      costsMinor: actual.expenseMinor - planned.costsMinor,
      netMinor: actual.netMinor - planned.netMinor,
    },
  };
}
