/**
 * Token pricing and cost math for usage records. Prices are USD per 1M tokens, which is the same
 * number as USD micros per token (1 USD = 1_000_000 micros), so cost_micros = Σ tokens × price.
 *
 * Source: Anthropic first-party pricing (2026). Cache reads cost 0.1× input, 5-minute cache writes
 * 1.25× input. Unknown models are priced as Claude Opus 5.5 (the default model).
 */

export interface ModelPrice {
  /** USD per 1M input tokens (= micros per token). */
  input: number;
  /** USD per 1M output tokens (= micros per token). */
  output: number;
}

export const CACHE_READ_MULTIPLIER = 0.1;
export const CACHE_WRITE_MULTIPLIER = 1.25;

export const MODEL_PRICES: Readonly<Record<string, ModelPrice>> = Object.freeze({
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  // Server-side refusal fallbacks can route a request to these models; price them exactly.
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 2, output: 10 },
});

export const DEFAULT_PRICE: ModelPrice = MODEL_PRICES['claude-opus-5-5'] as ModelPrice;

export function priceFor(model: string | null | undefined): ModelPrice {
  if (!model) return DEFAULT_PRICE;
  return MODEL_PRICES[model] ?? DEFAULT_PRICE;
}

/** Token counts of one model attempt. `inputTokens` excludes cache reads/writes (API semantics). */
export interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

function nonNegInt(n: number | null | undefined): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Exact cost in USD micros, rounded UP to a whole micro (conservative for the cost cap). */
export function costMicros(model: string | null | undefined, tokens: TokenCounts): number {
  const p = priceFor(model);
  const raw = nonNegInt(tokens.inputTokens) * p.input +
    nonNegInt(tokens.outputTokens) * p.output +
    nonNegInt(tokens.cacheReadTokens) * p.input * CACHE_READ_MULTIPLIER +
    nonNegInt(tokens.cacheWriteTokens) * p.input * CACHE_WRITE_MULTIPLIER;
  // Guard against binary floating point noise (e.g. 0.1 × 3 = 0.30000000000000004) before ceil.
  return Math.ceil(Math.round(raw * 1e6) / 1e6);
}

/** Aggregated usage of one or more model calls, as recorded in ai_usage_records. */
export interface UsageTotals extends TokenCounts {
  costMicros: number;
}

export const ZERO_USAGE: Readonly<UsageTotals> = Object.freeze({
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  costMicros: 0,
});

export function addUsage(a: UsageTotals, b: UsageTotals): UsageTotals {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    costMicros: a.costMicros + b.costMicros,
  };
}

/** Shape of `usage` on a Messages API response (beta), reduced to what billing needs. */
export interface ApiUsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  iterations?:
    | ReadonlyArray<{
      type: string;
      model?: string | null;
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number | null;
      cache_creation_input_tokens?: number | null;
    }>
    | null;
}

/**
 * Usage of one API response. With server-side fallbacks the per-attempt `usage.iterations` is the
 * billing source of truth (each attempt priced at the model that ran it); otherwise top-level usage
 * is priced at `responseModel`.
 */
export function usageFromApi(
  usage: ApiUsageLike | null | undefined,
  requestedModel: string,
  responseModel?: string | null,
): UsageTotals {
  if (!usage) return { ...ZERO_USAGE };
  const iterations = usage.iterations ?? null;
  if (iterations && iterations.length > 0) {
    let total: UsageTotals = { ...ZERO_USAGE };
    for (const it of iterations) {
      const model = it.model ?? (it.type === 'message' ? requestedModel : responseModel ?? requestedModel);
      const tokens: TokenCounts = {
        inputTokens: nonNegInt(it.input_tokens),
        outputTokens: nonNegInt(it.output_tokens),
        cacheReadTokens: nonNegInt(it.cache_read_input_tokens),
        cacheWriteTokens: nonNegInt(it.cache_creation_input_tokens),
      };
      total = addUsage(total, { ...tokens, costMicros: costMicros(model, tokens) });
    }
    return total;
  }
  const tokens: TokenCounts = {
    inputTokens: nonNegInt(usage.input_tokens),
    outputTokens: nonNegInt(usage.output_tokens),
    cacheReadTokens: nonNegInt(usage.cache_read_input_tokens),
    cacheWriteTokens: nonNegInt(usage.cache_creation_input_tokens),
  };
  return { ...tokens, costMicros: costMicros(responseModel ?? requestedModel, tokens) };
}
