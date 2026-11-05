/**
 * Business management data layer: actual transactions, business goals and monthly aggregates.
 * Query keys: ['b', businessId, 'transactions', ...] and ['b', businessId, 'goals', ...].
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Row } from '@/lib/database';
import { AppErrorException, makeAppError } from '@/lib/errors';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseResult';
import type { GoalDraft, TransactionDraft } from './forms';
import {
  GOAL_METRICS,
  GOAL_STATUSES,
  monthlyTotals,
  monthOverMonth,
  type GoalMetric,
  type GoalStatus,
  type MonthOverMonth,
  type MonthTotals,
  type TransactionKind,
} from './logic';

type BusinessId = string | null | undefined;

export type TransactionRow = Omit<Row<'transactions'>, 'kind'> & { kind: TransactionKind };
export type GoalRow = Omit<Row<'business_goals'>, 'metric' | 'status'> & { metric: GoalMetric; status: GoalStatus };

export const manageKeys = {
  transactions: (businessId: string) => qk.b(businessId, 'transactions'),
  goals: (businessId: string) => qk.b(businessId, 'goals'),
};

function requireBusiness(businessId: BusinessId): string {
  if (!businessId) throw new AppErrorException(makeAppError('precondition_failed', 'No active business'));
  return businessId;
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function narrowTransaction(row: Row<'transactions'>): TransactionRow {
  return { ...row, kind: row.kind === 'expense' ? 'expense' : 'income', amount_minor: toNumber(row.amount_minor) };
}

export function narrowGoal(row: Row<'business_goals'>): GoalRow {
  return {
    ...row,
    metric: (GOAL_METRICS as readonly string[]).includes(row.metric) ? (row.metric as GoalMetric) : 'custom',
    status: (GOAL_STATUSES as readonly string[]).includes(row.status) ? (row.status as GoalStatus) : 'active',
    target_value: toNumber(row.target_value),
    current_value: toNumber(row.current_value),
  };
}

/* ---------------------------------------------------------------------------------------------- */
/* Transactions                                                                                    */
/* ---------------------------------------------------------------------------------------------- */

/** PostgREST returns at most `max_rows` (1000) rows per request. */
const PAGE_SIZE = 1000;
/** Upper bound of rows loaded for on-device aggregation. */
export const MAX_TRANSACTIONS = 10_000;

export interface TransactionsData {
  /** Newest first (occurred_on, then created_at). */
  items: TransactionRow[];
  /** True when the business has more than MAX_TRANSACTIONS transactions (oldest are not loaded). */
  truncated: boolean;
}

export async function fetchTransactions(businessId: string): Promise<TransactionsData> {
  const items: TransactionRow[] = [];
  for (let from = 0; from < MAX_TRANSACTIONS; from += PAGE_SIZE) {
    const rows = unwrap(
      await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + PAGE_SIZE - 1),
    );
    items.push(...rows.map(narrowTransaction));
    if (rows.length < PAGE_SIZE) return { items, truncated: false };
  }
  return { items, truncated: true };
}

function transactionsQuery(businessId: BusinessId) {
  return {
    queryKey: manageKeys.transactions(businessId ?? ''),
    queryFn: () => fetchTransactions(requireBusiness(businessId)),
    enabled: !!businessId,
  };
}

const EMPTY_TRANSACTIONS: TransactionRow[] = [];

/** All transactions of the business (newest first). `transactions` is [] until loaded. */
export function useTransactions(businessId: BusinessId) {
  const query = useQuery(transactionsQuery(businessId));
  return { ...query, transactions: query.data?.items ?? EMPTY_TRANSACTIONS, truncated: query.data?.truncated ?? false };
}

/** One transaction from the list cache; `transaction` is undefined until loaded or when missing. */
export function useTransaction(businessId: BusinessId, id: string | null | undefined) {
  const select = useCallback((data: TransactionsData) => data.items.find((t) => t.id === id), [id]);
  const query = useQuery({ ...transactionsQuery(businessId), select });
  return { ...query, transaction: query.data };
}

/** Totals per month with transactions, newest first. */
export function useMonthlyTotals(businessId: BusinessId) {
  const query = useQuery({ ...transactionsQuery(businessId), select: selectMonthly });
  return { ...query, months: query.data ?? EMPTY_MONTHS };
}

const EMPTY_MONTHS: MonthTotals[] = [];

function selectMonthly(data: TransactionsData): MonthTotals[] {
  return monthlyTotals(data.items);
}

/** `month` ('YYYY-MM') vs the previous calendar month. */
export function useMonthOverMonth(businessId: BusinessId, month: string) {
  const select = useCallback((data: TransactionsData): MonthOverMonth => monthOverMonth(data.items, month), [month]);
  const query = useQuery({ ...transactionsQuery(businessId), select });
  return { ...query, comparison: query.data };
}

function invalidateTransactions(qc: QueryClient, businessId: string) {
  return qc.invalidateQueries({ queryKey: manageKeys.transactions(businessId) });
}

function patchTransactions(qc: QueryClient, businessId: string, update: (items: TransactionRow[]) => TransactionRow[]) {
  qc.setQueryData<TransactionsData>(manageKeys.transactions(businessId), (data) => (data ? { ...data, items: update(data.items) } : data));
}

function sortDesc(items: TransactionRow[]): TransactionRow[] {
  return [...items].sort((a, b) => {
    if (a.occurred_on !== b.occurred_on) return a.occurred_on < b.occurred_on ? 1 : -1;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

export interface SaveTransactionInput {
  /** Omit to create. */
  id?: string;
  values: TransactionDraft;
}

/** Creates or updates a transaction. */
export function useSaveTransaction(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: SaveTransactionInput): Promise<TransactionRow> => {
      const bid = requireBusiness(businessId);
      const row = id
        ? unwrap(await supabase.from('transactions').update(values).eq('id', id).eq('business_id', bid).select('*').single())
        : unwrap(await supabase.from('transactions').insert({ ...values, business_id: bid }).select('*').single());
      return narrowTransaction(row);
    },
    onSuccess: (tx) => {
      if (!businessId) return;
      patchTransactions(qc, businessId, (items) => sortDesc([...items.filter((t) => t.id !== tx.id), tx]));
      void invalidateTransactions(qc, businessId);
    },
  });
}

export function useDeleteTransaction(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const bid = requireBusiness(businessId);
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('business_id', bid);
      if (error) unwrap({ data: null, error });
      return id;
    },
    onSuccess: (id) => {
      if (!businessId) return;
      patchTransactions(qc, businessId, (items) => items.filter((t) => t.id !== id));
      void invalidateTransactions(qc, businessId);
    },
  });
}

/* ---------------------------------------------------------------------------------------------- */
/* Goals                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export async function fetchGoals(businessId: string): Promise<GoalRow[]> {
  const rows = unwrap(
    await supabase
      .from('business_goals')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
  );
  return rows.map(narrowGoal);
}

function goalsQuery(businessId: BusinessId) {
  return {
    queryKey: manageKeys.goals(businessId ?? ''),
    queryFn: () => fetchGoals(requireBusiness(businessId)),
    enabled: !!businessId,
  };
}

const EMPTY_GOALS: GoalRow[] = [];

/** All goals (oldest first). `goals` is [] until loaded. */
export function useGoals(businessId: BusinessId) {
  const query = useQuery(goalsQuery(businessId));
  return { ...query, goals: query.data ?? EMPTY_GOALS };
}

export function useGoal(businessId: BusinessId, id: string | null | undefined) {
  const select = useCallback((goals: GoalRow[]) => goals.find((g) => g.id === id), [id]);
  const query = useQuery({ ...goalsQuery(businessId), select });
  return { ...query, goal: query.data };
}

export interface SaveGoalInput {
  id?: string;
  values: GoalDraft;
}

export function useSaveGoal(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: SaveGoalInput): Promise<GoalRow> => {
      const bid = requireBusiness(businessId);
      const row = id
        ? unwrap(await supabase.from('business_goals').update(values).eq('id', id).eq('business_id', bid).select('*').single())
        : unwrap(await supabase.from('business_goals').insert({ ...values, business_id: bid }).select('*').single());
      return narrowGoal(row);
    },
    onSuccess: (goal) => {
      if (!businessId) return;
      qc.setQueryData<GoalRow[]>(manageKeys.goals(businessId), (goals) =>
        goals ? (goals.some((g) => g.id === goal.id) ? goals.map((g) => (g.id === goal.id ? goal : g)) : [...goals, goal]) : goals,
      );
      void qc.invalidateQueries({ queryKey: manageKeys.goals(businessId) });
    },
  });
}

export function useDeleteGoal(businessId: BusinessId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const bid = requireBusiness(businessId);
      const { error } = await supabase.from('business_goals').delete().eq('id', id).eq('business_id', bid);
      if (error) unwrap({ data: null, error });
      return id;
    },
    onSuccess: (id) => {
      if (!businessId) return;
      qc.setQueryData<GoalRow[]>(manageKeys.goals(businessId), (goals) => goals?.filter((g) => g.id !== id));
      void qc.invalidateQueries({ queryKey: manageKeys.goals(businessId) });
    },
  });
}
