/**
 * AI usage metering: every AI call is reserved BEFORE calling the model (per-feature monthly quota
 * + monthly cost cap, enforced atomically in SQL by `reserve_ai_usage`) and finalized afterwards
 * with the real token counts and cost — success or error — via `finalize_ai_usage`.
 * Both RPCs are service-role only.
 */
import type { Db } from './auth.ts';
import { type AiFeature, limitsFor, type Tier, type TierLimits } from './domain/entitlements.ts';
import { AppError, fromPostgrestError, logError, toAppError } from './errors.ts';
import { AiCallError } from './ai/errors.ts';
import { addUsage, type UsageTotals, ZERO_USAGE } from './ai/pricing.ts';

export interface UsageScope {
  /** Service-role client (reserve/finalize are not executable by `authenticated`). */
  svc: Db;
  userId: string;
  businessId: string | null;
  feature: AiFeature;
  model: string;
  limits: TierLimits;
}

/** Accumulates the usage of every model call made under one reservation. */
export class UsageMeter {
  #total: UsageTotals = { ...ZERO_USAGE };
  #absorbed = new WeakSet<AiCallError>();

  add(usage: UsageTotals | null | undefined): void {
    if (usage) this.#total = addUsage(this.#total, usage);
  }

  /** Adds the usage carried by a failed AI call exactly once (safe to call repeatedly). */
  absorb(err: unknown): void {
    if (err instanceof AiCallError && !this.#absorbed.has(err)) {
      this.#absorbed.add(err);
      this.add(err.usage);
    }
  }

  /** Runs one AI call: adds its usage on success, absorbs the failure's usage on error. */
  async track<R extends { usage: UsageTotals }>(call: () => Promise<R>): Promise<R> {
    try {
      const result = await call();
      this.add(result.usage);
      return result;
    } catch (err) {
      this.absorb(err);
      throw err;
    }
  }

  get total(): UsageTotals {
    return { ...this.#total };
  }
}

/** Reads the caller's tier through RLS (`current_tier()` defaults to auth.uid()). */
export async function loadTierLimits(db: Db): Promise<{ tier: Tier; limits: TierLimits }> {
  const { data, error } = await db.rpc('current_tier');
  if (error) throw fromPostgrestError(error, 'rpc:current_tier');
  const tier: Tier = data === 'pro' ? 'pro' : 'free';
  return { tier, limits: limitsFor(tier) };
}

export async function reserveUsage(scope: UsageScope): Promise<string> {
  const { data, error } = await scope.svc.rpc('reserve_ai_usage', {
    p_user: scope.userId,
    // The SQL function accepts null for usage not tied to a business; generated types say string.
    p_business: scope.businessId as string,
    p_feature: scope.feature,
    p_monthly_limit: scope.limits.monthlyAiCalls[scope.feature],
    p_cost_cap_micros: scope.limits.monthlyCostCapMicros,
    p_model: scope.model.slice(0, 100),
  });
  if (error) throw fromPostgrestError(error, 'rpc:reserve_ai_usage');
  if (typeof data !== 'string') throw new AppError('internal', undefined, { details: { op: 'rpc:reserve_ai_usage' } });
  return data;
}

/** Never throws: a failed finalize is logged (the reservation then stays 'reserved'). */
export async function finalizeUsage(
  svc: Db,
  reservationId: string,
  status: 'success' | 'error',
  usage: UsageTotals,
  errorCode: string | null,
): Promise<void> {
  try {
    const { error } = await svc.rpc('finalize_ai_usage', {
      p_id: reservationId,
      p_status: status,
      p_input: clampInt(usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens),
      p_output: clampInt(usage.outputTokens),
      p_cost: Math.max(0, Math.ceil(usage.costMicros)),
      ...(errorCode ? { p_error: errorCode } : {}),
    });
    if (error) logError('usage.finalize', fromPostgrestError(error, 'rpc:finalize_ai_usage'));
  } catch (err) {
    logError('usage.finalize', err);
  }
}

function clampInt(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 2_147_483_647);
}

/**
 * Reserves one call of `scope.feature`, runs `fn` with a meter, and ALWAYS finalizes (in `finally`)
 * with the metered usage: 'success' when `fn` resolves, 'error' (+ code) when it throws. Usage carried
 * by an AiCallError (tokens consumed by a refused / invalid answer) is added before finalizing.
 * Quota / cost-cap rejections surface as AppError('quota_exceeded' | 'cost_cap_reached') → 429.
 */
export async function runMetered<T>(scope: UsageScope, fn: (meter: UsageMeter) => Promise<T>): Promise<T> {
  const reservationId = await reserveUsage(scope);
  return await runReserved(scope.svc, reservationId, fn);
}

/** Same as runMetered for a reservation made earlier (e.g. before a 202 response). */
export async function runReserved<T>(svc: Db, reservationId: string, fn: (meter: UsageMeter) => Promise<T>): Promise<T> {
  const meter = new UsageMeter();
  let status: 'success' | 'error' = 'error';
  let errorCode: string | null = 'internal';
  try {
    const result = await fn(meter);
    status = 'success';
    errorCode = null;
    return result;
  } catch (err) {
    const appErr = toAppError(err);
    errorCode = appErr.code;
    meter.absorb(err);
    throw err;
  } finally {
    await finalizeUsage(svc, reservationId, status, meter.total, errorCode);
  }
}
