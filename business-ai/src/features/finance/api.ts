/**
 * Finance data layer (docs/FEATURE_CONTRACTS.md): financial model, startup costs, recurring
 * expenses, revenue streams, AI proposals. Engine calls are memoized; all math lives in
 * `@domain/finance`.
 *
 * Query keys: ['b', businessId, 'finance', ...] for finance data; the plan-version proposal lives
 * under ['b', businessId, 'plan', 'financeProposal'] so plan (re)generation invalidates it.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FinanceProposal } from '@domain/ai-api';
import { compareScenarios, summarize, type FinanceInputs, type FinanceSummary, type Forecast, type ScenarioKey } from '@domain/finance';
import type { Basis } from '@domain/plan';
import { useBusinesses } from '@/features/business/api';
import { useLocale } from '@/i18n/I18nProvider';
import { AppErrorException, toAppError, type AppError } from '@/lib/errors';
import { invokeAi } from '@/lib/functions';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabaseResult';
import {
  applyModelPatch,
  draftToRow,
  isProposalEmpty,
  linesOfKind,
  mapModelRow,
  mapRecurringExpenseRow,
  mapRevenueStreamRow,
  mapStartupCostRow,
  modelPatchToRow,
  nextSortOrder,
  parseFinanceProposal,
  parseMaxForecastMonths,
  pendingProposalItems,
  proposalCapitalMinor,
  proposalItemToDraft,
  toFinanceInputs,
  type FinanceLines,
  type FinancialModelPatch,
  type FinancialModelRow,
  type LineDraft,
  type LineKind,
  type ProposalItem,
  type RecurringExpenseDraft,
  type RevenueStreamDraft,
  type StartupCostDraft,
} from './mapping';
import { useFinanceUiStore, useFreshProposal, useReviewedKeys } from './store';

export type { FinanceLines, FinancialModelRow, LineDraft, LineKind, ProposalItem } from './mapping';

/* ============================================================================================== */
/* Keys                                                                                           */
/* ============================================================================================== */

export const financeKeys = {
  /** Everything finance of one business (invalidate after any finance write). */
  all: (businessId: string) => qk.b(businessId, 'finance'),
  data: (businessId: string) => qk.b(businessId, 'finance', 'data'),
  /** AI proposal stored on the latest plan version (plan-owned data). */
  planProposal: (businessId: string) => qk.b(businessId, 'plan', 'financeProposal'),
};

/* ============================================================================================== */
/* Reads                                                                                          */
/* ============================================================================================== */

export interface FinanceData {
  model: FinancialModelRow;
  lines: FinanceLines;
  /** ISO-4217 from businesses.currency. */
  currency: string;
}

async function fetchFinanceData(businessId: string): Promise<FinanceData> {
  const [model, startup, expenses, revenue, business] = await Promise.all([
    supabase.rpc('ensure_financial_model', { p_business_id: businessId }),
    supabase.from('startup_costs').select('*').eq('business_id', businessId).order('sort_order').order('created_at'),
    supabase.from('recurring_expenses').select('*').eq('business_id', businessId).order('sort_order').order('created_at'),
    supabase.from('revenue_streams').select('*').eq('business_id', businessId).order('sort_order').order('created_at'),
    supabase.from('businesses').select('currency').eq('id', businessId).single(),
  ]);
  return {
    model: mapModelRow(unwrap(model) as FinancialModelRow),
    lines: {
      startupCosts: unwrap(startup).map(mapStartupCostRow),
      recurringExpenses: unwrap(expenses).map(mapRecurringExpenseRow),
      revenueStreams: unwrap(revenue).map(mapRevenueStreamRow),
    },
    currency: unwrap(business).currency,
  };
}

export interface FinanceInputsResult {
  inputs?: FinanceInputs;
  model?: FinancialModelRow;
  lines?: FinanceLines;
  currency: string;
  isLoading: boolean;
  isRefetching: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

/** Finance model + lines of a business, mapped to engine inputs (memoized per fetched data). */
export function useFinanceInputs(businessId: string | null | undefined): FinanceInputsResult {
  const query = useQuery({
    queryKey: financeKeys.data(businessId ?? ''),
    queryFn: () => fetchFinanceData(businessId as string),
    enabled: !!businessId,
  });
  // The business list reflects currency changes made in settings immediately.
  const listed = useBusinesses().data?.find((b) => b.id === businessId)?.currency;
  const data = query.data;
  const inputs = useMemo(() => (data ? toFinanceInputs(data.model, data.lines) : undefined), [data]);
  return {
    inputs,
    model: data?.model,
    lines: data?.lines,
    currency: listed ?? data?.currency ?? 'ILS',
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Engine summary for one scenario (default `expected`). Undefined until the inputs load. */
export function useFinanceSummary(businessId: string | null | undefined, scenario: ScenarioKey = 'expected'): FinanceSummary | undefined {
  const { inputs } = useFinanceInputs(businessId);
  return useMemo(() => (inputs ? summarize(inputs, scenario) : undefined), [inputs, scenario]);
}

/** All three scenario forecasts (memoized). */
export function useScenarioComparison(businessId: string | null | undefined): Record<ScenarioKey, Forecast> | undefined {
  const { inputs } = useFinanceInputs(businessId);
  return useMemo(() => (inputs ? compareScenarios(inputs) : undefined), [inputs]);
}

/* ============================================================================================== */
/* Line mutations                                                                                 */
/* ============================================================================================== */

function useInvalidateFinance(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return () => (businessId ? queryClient.invalidateQueries({ queryKey: financeKeys.all(businessId) }) : Promise.resolve());
}

function requireBusiness(businessId: string | null | undefined): string {
  if (!businessId) throw new AppErrorException(toAppError({ code: 'PGRST116', message: 'No active business' }));
  return businessId;
}

function isDraftOf<K extends LineKind>(kind: K) {
  return (d: LineDraft): d is Extract<LineDraft, { kind: K }> => d.kind === kind;
}

/** Inserts drafts with one insert per table (so "accept all" is atomic per kind). Returns new ids. */
async function insertLines(businessId: string, drafts: readonly LineDraft[], cached: FinanceLines | undefined): Promise<string[]> {
  const ids: string[] = [];
  const order = (kind: LineKind) => (cached ? nextSortOrder(linesOfKind(cached, kind)) : 0);
  const startup = drafts.filter(isDraftOf('startup'));
  if (startup.length > 0) {
    const start = order('startup');
    const rows = startup.map((d, i) => ({ ...draftToRow(d), business_id: businessId, sort_order: start + i }));
    ids.push(...unwrap(await supabase.from('startup_costs').insert(rows).select('id')).map((r) => r.id));
  }
  const expense = drafts.filter(isDraftOf('expense'));
  if (expense.length > 0) {
    const start = order('expense');
    const rows = expense.map((d, i) => ({ ...draftToRow(d), business_id: businessId, sort_order: start + i }));
    ids.push(...unwrap(await supabase.from('recurring_expenses').insert(rows).select('id')).map((r) => r.id));
  }
  const revenue = drafts.filter(isDraftOf('revenue'));
  if (revenue.length > 0) {
    const start = order('revenue');
    const rows = revenue.map((d, i) => ({ ...draftToRow(d), business_id: businessId, sort_order: start + i }));
    ids.push(...unwrap(await supabase.from('revenue_streams').insert(rows).select('id')).map((r) => r.id));
  }
  return ids;
}

function useCachedLines(businessId: string | null | undefined): () => FinanceLines | undefined {
  const queryClient = useQueryClient();
  return () => (businessId ? queryClient.getQueryData<FinanceData>(financeKeys.data(businessId))?.lines : undefined);
}

/** Inserts a new line of any kind. Resolves with the new row id. */
export function useCreateFinanceLine(businessId: string | null | undefined) {
  const invalidate = useInvalidateFinance(businessId);
  const cachedLines = useCachedLines(businessId);
  return useMutation<string, AppError, LineDraft>({
    mutationFn: async (draft) => {
      try {
        const [id] = await insertLines(requireBusiness(businessId), [draft], cachedLines());
        return id as string;
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSuccess: () => invalidate(),
  });
}

/** Replaces the editable columns of an existing line with a parsed form draft. */
export function useUpdateFinanceLine(businessId: string | null | undefined) {
  const invalidate = useInvalidateFinance(businessId);
  return useMutation<void, AppError, { id: string; draft: LineDraft }>({
    mutationFn: async ({ id, draft }) => {
      const bid = requireBusiness(businessId);
      try {
        const result =
          draft.kind === 'startup'
            ? await supabase.from('startup_costs').update(draftToRow(draft)).eq('id', id).eq('business_id', bid).select('id').single()
            : draft.kind === 'expense'
              ? await supabase.from('recurring_expenses').update(draftToRow(draft)).eq('id', id).eq('business_id', bid).select('id').single()
              : await supabase.from('revenue_streams').update(draftToRow(draft)).eq('id', id).eq('business_id', bid).select('id').single();
        unwrap(result);
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSuccess: () => invalidate(),
  });
}

/** Sets only the unit price of a revenue stream (pricing calculator "apply"). */
export function useSetRevenueStreamPrice(businessId: string | null | undefined) {
  const invalidate = useInvalidateFinance(businessId);
  return useMutation<void, AppError, { id: string; unitPriceMinor: number }>({
    mutationFn: async ({ id, unitPriceMinor }) => {
      const bid = requireBusiness(businessId);
      try {
        unwrap(
          await supabase
            .from('revenue_streams')
            .update({ unit_price_minor: unitPriceMinor })
            .eq('id', id)
            .eq('business_id', bid)
            .select('id')
            .single(),
        );
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSuccess: () => invalidate(),
  });
}

export function useDeleteFinanceLine(businessId: string | null | undefined) {
  const invalidate = useInvalidateFinance(businessId);
  return useMutation<void, AppError, { kind: LineKind; id: string }>({
    mutationFn: async ({ kind, id }) => {
      const bid = requireBusiness(businessId);
      try {
        const result =
          kind === 'startup'
            ? await supabase.from('startup_costs').delete().eq('id', id).eq('business_id', bid)
            : kind === 'expense'
              ? await supabase.from('recurring_expenses').delete().eq('id', id).eq('business_id', bid)
              : await supabase.from('revenue_streams').delete().eq('id', id).eq('business_id', bid);
        if (result.error) throw result.error;
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSuccess: () => invalidate(),
  });
}

export interface AddStartupCostInput {
  label: string;
  amountMinor: number;
  category?: string;
  /** Default `user_provided`; the advisor passes `ai_estimate`. */
  basis?: Basis;
}

export interface AddRecurringExpenseInput {
  label: string;
  monthlyAmountMinor: number;
  category?: string;
  basis?: Basis;
}

export type AddRevenueStreamInput = Omit<RevenueStreamDraft, 'kind' | 'basis'> & { basis?: Basis };

/** Contract export: adds one startup cost (used by the advisor's `add_startup_cost` action). */
export function useAddStartupCost(businessId: string | null | undefined) {
  const create = useCreateFinanceLine(businessId);
  return useMutation<string, AppError, AddStartupCostInput>({
    mutationFn: (input) => {
      const draft: StartupCostDraft = {
        kind: 'startup',
        label: input.label,
        amountMinor: input.amountMinor,
        category: input.category ?? '',
        basis: input.basis ?? 'user_provided',
      };
      return create.mutateAsync(draft);
    },
  });
}

/** Contract export: adds one recurring expense (used by the advisor's `add_recurring_expense` action). */
export function useAddRecurringExpense(businessId: string | null | undefined) {
  const create = useCreateFinanceLine(businessId);
  return useMutation<string, AppError, AddRecurringExpenseInput>({
    mutationFn: (input) => {
      const draft: RecurringExpenseDraft = {
        kind: 'expense',
        label: input.label,
        monthlyAmountMinor: input.monthlyAmountMinor,
        category: input.category ?? '',
        basis: input.basis ?? 'user_provided',
      };
      return create.mutateAsync(draft);
    },
  });
}

export function useAddRevenueStream(businessId: string | null | undefined) {
  const create = useCreateFinanceLine(businessId);
  return useMutation<string, AppError, AddRevenueStreamInput>({
    mutationFn: (input) => create.mutateAsync({ ...input, kind: 'revenue', basis: input.basis ?? 'user_provided' }),
  });
}

/* ============================================================================================== */
/* Financial model                                                                                */
/* ============================================================================================== */

/** AppError plus the plan's horizon limit when the DB rejected a longer forecast. */
export interface FinanceAppError extends AppError {
  maxForecastMonths?: number;
}

/** Updates starting capital, forecast horizon and/or scenario percentages. */
export function useUpdateFinancialModel(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<FinancialModelRow, FinanceAppError, FinancialModelPatch>({
    mutationFn: async (patch) => {
      const bid = requireBusiness(businessId);
      const row = modelPatchToRow(patch);
      try {
        let result = await supabase.from('financial_models').update(row).eq('business_id', bid).select('*').maybeSingle();
        if (!result.error && !result.data) {
          // The model row does not exist yet (first write before the first read): create it, retry.
          unwrap(await supabase.rpc('ensure_financial_model', { p_business_id: bid }));
          result = await supabase.from('financial_models').update(row).eq('business_id', bid).select('*').maybeSingle();
        }
        return mapModelRow(unwrap(result));
      } catch (e) {
        const appError: FinanceAppError = { ...toAppError(e) };
        const max = parseMaxForecastMonths(e);
        if (appError.code === 'forecast_limit_exceeded' && max !== null) appError.maxForecastMonths = max;
        throw appError;
      }
    },
    onSuccess: (model, patch) => {
      if (!businessId) return;
      // The returned row is authoritative; patch the cache so every screen updates without a refetch.
      queryClient.setQueryData<FinanceData>(financeKeys.data(businessId), (old) => (old ? { ...old, model: applyModelPatch(model, patch) } : old));
    },
  });
}

/* ============================================================================================== */
/* AI proposals                                                                                   */
/* ============================================================================================== */

export interface PlanFinanceProposal {
  proposal: FinanceProposal;
  planVersionId: string;
}

async function fetchPlanProposal(businessId: string): Promise<PlanFinanceProposal | null> {
  const planResult = await supabase.from('business_plans').select('id').eq('business_id', businessId).maybeSingle();
  if (planResult.error) throw new AppErrorException(toAppError(planResult.error));
  const plan = planResult.data;
  if (!plan) return null;
  const versionResult = await supabase
    .from('plan_versions')
    .select('id, finance_proposal')
    .eq('plan_id', plan.id)
    .eq('status', 'ready')
    .not('finance_proposal', 'is', null)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionResult.error) throw new AppErrorException(toAppError(versionResult.error));
  const version = versionResult.data;
  const proposal = version ? parseFinanceProposal(version.finance_proposal) : null;
  if (!version || !proposal || isProposalEmpty(proposal)) return null;
  return { proposal, planVersionId: version.id };
}

/** The AI finance proposal saved with the latest ready plan version (from plan generation), or null. */
export function useFinanceProposal(businessId: string | null | undefined) {
  const query = useQuery({
    queryKey: financeKeys.planProposal(businessId ?? ''),
    queryFn: () => fetchPlanProposal(businessId as string),
    enabled: !!businessId,
  });
  return {
    proposal: query.data?.proposal ?? null,
    planVersionId: query.data?.planVersionId ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Asks the AI for fresh assumptions (`finance.propose`). Nothing is saved to the model: the
 * proposal is kept on this device for review and returned.
 */
export function useProposeAssumptions(businessId: string | null | undefined) {
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const setFreshProposal = useFinanceUiStore((s) => s.setFreshProposal);
  return useMutation<FinanceProposal, AppError, void>({
    mutationFn: async () => {
      const bid = requireBusiness(businessId);
      try {
        const { proposal } = await invokeAi({ action: 'finance.propose', businessId: bid, locale });
        const parsed = parseFinanceProposal(proposal);
        if (!parsed) throw new AppErrorException(toAppError({ error: { code: 'ai_invalid_output', message: 'Invalid proposal' } }));
        return parsed;
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSuccess: (proposal) => {
      if (businessId) setFreshProposal(businessId, proposal);
      void queryClient.invalidateQueries({ queryKey: qk.me.aiUsage() });
    },
  });
}

export interface ActiveProposal {
  proposal: FinanceProposal | null;
  source: 'fresh' | 'plan' | null;
  /** Items not yet accepted or skipped on this device. */
  pending: ProposalItem[];
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

/** The proposal to review: the latest fresh AI call on this device, else the plan's proposal. */
export function useActiveProposal(businessId: string | null | undefined): ActiveProposal {
  const plan = useFinanceProposal(businessId);
  const fresh = useFreshProposal(businessId);
  const reviewed = useReviewedKeys(businessId);
  const proposal = fresh?.proposal ?? plan.proposal;
  const source = fresh ? 'fresh' : plan.proposal ? 'plan' : null;
  const pending = useMemo(() => pendingProposalItems(proposal, reviewed), [proposal, reviewed]);
  return { proposal, source, pending, isLoading: !fresh && plan.isLoading, error: fresh ? null : plan.error, refetch: plan.refetch };
}

/**
 * Accepts proposal items: lines are inserted with basis `ai_estimate`; the starting-capital item
 * replaces the model's starting capital. Accepted items are marked reviewed on this device.
 * Resolves with the number of items applied.
 */
export function useAcceptProposalItems(businessId: string | null | undefined, fallbackLabel: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateFinance(businessId);
  const cachedLines = useCachedLines(businessId);
  const markReviewed = useFinanceUiStore((s) => s.markReviewed);
  const updateModel = useUpdateFinancialModel(businessId);
  return useMutation<number, AppError, readonly ProposalItem[]>({
    mutationFn: async (items) => {
      const bid = requireBusiness(businessId);
      let applied = 0;
      try {
        const lineItems = items.filter((i) => i.kind !== 'capital');
        const drafts = lineItems.map((i) => proposalItemToDraft(i, fallbackLabel)).filter((d): d is LineDraft => d !== null);
        if (drafts.length > 0) {
          await insertLines(bid, drafts, cachedLines());
          markReviewed(
            bid,
            lineItems.map((i) => i.key),
          );
          applied += drafts.length;
        }
        const capital = items.find((i) => i.kind === 'capital');
        const capitalMinor = capital ? proposalCapitalMinor(capital) : null;
        if (capital && capitalMinor !== null) {
          await updateModel.mutateAsync({ startingCapitalMinor: capitalMinor });
          markReviewed(bid, [capital.key]);
          applied += 1;
        }
        return applied;
      } catch (e) {
        throw toAppError(e);
      }
    },
    onSettled: () => {
      void invalidate();
      if (businessId) void queryClient.invalidateQueries({ queryKey: financeKeys.data(businessId) });
    },
  });
}

/** Marks proposal items as skipped (not re-offered on this device). */
export function useSkipProposalItems(businessId: string | null | undefined) {
  const markReviewed = useFinanceUiStore((s) => s.markReviewed);
  return (items: readonly ProposalItem[]) => {
    if (businessId) markReviewed(
      businessId,
      items.map((i) => i.key),
    );
  };
}
