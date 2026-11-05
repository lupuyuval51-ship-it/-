/**
 * BUSINESS AI — deterministic financial engine.
 *
 * Shared by the Expo app (via `@domain/finance`) and the Deno Edge Functions. Pure, synchronous,
 * dependency-free (no imports), never throws, never reads the clock or randomness. The same input
 * always produces the same output on every JS engine (Hermes, V8/Deno, browsers): all arithmetic
 * is done with exact integer (`BigInt`) arithmetic internally and converted back to `number` only
 * at the output boundary.
 *
 * RESULTS ARE PLANNING ESTIMATES BASED ON THE USER'S ASSUMPTIONS — NOT GUARANTEES OR FORECASTS OF
 * ACTUAL PERFORMANCE. The UI must label them as estimates.
 *
 * ── Units ──────────────────────────────────────────────────────────────────────────────────────
 * - Money is always an integer number of minor units (agorot / cents), suffixed `Minor`.
 * - Quantities (`monthlyUnits`, forecast `units`) have 2-decimal precision (DB: numeric(12,2)).
 * - Percentages (`monthlyGrowthPct`, scenario `*Pct`) are used with 2-decimal precision
 *   (hundredths of a percent). 100 = unchanged for scenario percentages.
 *
 * ── Rounding (one rule, applied at every step) ────────────────────────────────────────────────
 * - Every intermediate monetary value and every 2-decimal quantity is rounded to the nearest
 *   integer (minor unit / hundredth of a unit), ties HALF AWAY FROM ZERO (2.5 → 3, −2.5 → −3).
 *   Inputs are first converted to exact integers (minor units; hundredths of a unit or percent —
 *   finer input precision is rounded off), so a "half" is a true decimal half: 0.29 units × 50 =
 *   14.5 → 15, where naive floating point computes 14.499999999999998 → 14.
 * - Display ratios are rounded the same way: margin/markup percentages to 1 decimal, the
 *   contribution-margin ratio to 4 decimals.
 * - Thresholds ("how much is needed") are rounded UP (ceiling) so that reaching the returned
 *   value is actually sufficient: break-even revenue, break-even units, price for a target margin.
 *
 * ── Formulas (per scenario s with volume V%, price P%, cost C%) ───────────────────────────────
 *   adjusted price_i      = round(unitPrice_i × P / 100)
 *   adjusted unit cost_i  = round(unitVariableCost_i × C / 100)
 *   fixed costs / month   = round(Σ recurring monthly amounts × C / 100)   (constant each month)
 *   units_i(m)            = round2(monthlyUnits_i × (1 + g_i/100)^(m−1) × V / 100)   m = 1..N
 *   revenue_i(m)          = round(units_i(m) × adjusted price_i)
 *   variable costs_i(m)   = round(units_i(m) × adjusted unit cost_i)
 *   revenue(m)            = Σ_i revenue_i(m);   variable costs(m) = Σ_i variable costs_i(m)
 *   gross profit(m)       = revenue(m) − variable costs(m)
 *   net(m)                = gross profit(m) − fixed costs
 *   opening cash (m = 0)  = starting capital − Σ startup costs     (startup costs are one-off, month 0)
 *   cash(m)               = cash(m−1) + net(m)
 *   Identity (exact):       opening cash + Σ net(m) = ending cash
 *
 *   Break-even (monthly, on the month-1 mix):
 *     contribution margin ratio CMR = (revenue(1) − variable costs(1)) / revenue(1)
 *       (with exactly one revenue stream the mix is trivial and CMR = (price − cost) / price, so it
 *        is defined even when month-1 volume is 0)
 *     monthly revenue needed = ceil(fixed costs / CMR)            — null when CMR ≤ 0 or no revenue
 *     units needed           = ceil(fixed costs / (price − cost)) — single revenue stream only
 *   Payback (breakEvenMonth): first month whose cumulative net ≥ total startup costs.
 *   Runway: number of full months the cash lasts = (first month with cash < 0) − 1.
 *
 * ── Invalid and extreme input ─────────────────────────────────────────────────────────────────
 * `validateInputs` reports problems for the UI. The calculation functions never throw: they
 * project each input onto the valid domain that `validateInputs` enforces — NaN/non-numbers become
 * a neutral value (0 for money/units/growth, 100 for scenario percentages, 1 for forecastMonths),
 * values outside a range (including ±Infinity and negatives) are clamped to it, and integer fields
 * with a fraction are rounded. Valid input is therefore never altered.
 * Outputs always stay within ±Number.MAX_SAFE_INTEGER: values that would exceed it are clamped and
 * the forecast's `clamped` flag is set (validateInputs then reports field `forecast`).
 */

/* ============================================================================================== */
/* Public types and constants                                                                     */
/* ============================================================================================== */

export type ScenarioKey = 'conservative' | 'expected' | 'optimistic';

/** Display / iteration order. */
export const SCENARIO_KEYS: readonly ScenarioKey[] = ['conservative', 'expected', 'optimistic'];

export interface RevenueStreamInput {
  id?: string;
  label: string;
  /** Integer minor units, ≥ 0. */
  unitPriceMinor: number;
  /** Integer minor units, ≥ 0. */
  unitVariableCostMinor: number;
  /** Units sold in month 1 (expected scenario), ≥ 0, 2 decimals. */
  monthlyUnits: number;
  /** Compound month-over-month unit growth in percent, −100…1000, 2 decimals. */
  monthlyGrowthPct: number;
}

export interface StartupCostInput {
  id?: string;
  label: string;
  /** One-off cost in month 0. Integer minor units, ≥ 0. */
  amountMinor: number;
}

export interface RecurringExpenseInput {
  id?: string;
  label: string;
  /** Fixed monthly cost. Integer minor units, ≥ 0. */
  monthlyAmountMinor: number;
}

/** Scenario multipliers in percent. 100 = unchanged. `costPct` applies to variable AND recurring costs. */
export interface ScenarioAdjustments {
  volumePct: number;
  pricePct: number;
  costPct: number;
}

/** `expected` is always 100/100/100 (validateInputs reports anything else). */
export type ScenarioSettings = Record<ScenarioKey, ScenarioAdjustments>;

export interface FinanceInputs {
  /** Integer minor units, ≥ 0. */
  startingCapitalMinor: number;
  startupCosts: StartupCostInput[];
  recurringExpenses: RecurringExpenseInput[];
  revenueStreams: RevenueStreamInput[];
  /** Integer 1…36 (the DB additionally caps it per subscription tier). */
  forecastMonths: number;
  scenarios: ScenarioSettings;
}

/**
 * Validation bounds (inclusive), identical to the CHECK constraints / column precision in
 * migration `20261105000004_finance.sql` (money 0…1e13, monthly_units numeric(12,2),
 * monthly_growth_pct −100…1000, scenario pct integer 0…1000, forecast_months 1…36).
 */
export const FINANCE_LIMITS = Object.freeze({
  maxAmountMinor: 10_000_000_000_000,
  maxMonthlyUnits: 9_999_999_999.99,
  minGrowthPct: -100,
  maxGrowthPct: 1000,
  minScenarioPct: 0,
  maxScenarioPct: 1000,
  minForecastMonths: 1,
  maxForecastMonths: 36,
});

/** Matches the `financial_models` column defaults. */
export const DEFAULT_SCENARIOS: Readonly<Record<ScenarioKey, Readonly<ScenarioAdjustments>>> = Object.freeze({
  conservative: Object.freeze({ volumePct: 70, pricePct: 100, costPct: 110 }),
  expected: Object.freeze({ volumePct: 100, pricePct: 100, costPct: 100 }),
  optimistic: Object.freeze({ volumePct: 130, pricePct: 100, costPct: 95 }),
});

export interface ForecastMonth {
  /** 1-based month index. */
  month: number;
  /** Total units across all revenue streams, 2 decimals. */
  units: number;
  revenueMinor: number;
  variableCostsMinor: number;
  grossProfitMinor: number;
  fixedCostsMinor: number;
  netMinor: number;
  /** Cash balance at the end of the month. */
  cashBalanceMinor: number;
}

export interface Forecast {
  scenario: ScenarioKey;
  months: ForecastMonth[];
  /** Starting capital minus startup costs (month 0). */
  openingCashMinor: number;
  totalRevenueMinor: number;
  totalNetMinor: number;
  endingCashMinor: number;
  /** Minimum of the opening balance and every month-end balance. */
  lowestCashMinor: number;
  /** Month of `lowestCashMinor` (earliest on ties); 0 = opening. */
  lowestCashMonth: number;
  /** First month with net > 0, or null. */
  firstProfitableMonth: number | null;
  /** First month whose cash balance is < 0 (0 when the opening balance is already negative), or null. */
  cashOutMonth: number | null;
  /** First month whose cumulative net ≥ total startup costs (payback), or null. */
  breakEvenMonth: number | null;
  /**
   * True when at least one value exceeded ±Number.MAX_SAFE_INTEGER and was clamped. Results are
   * then not meaningful (the cash identity no longer holds); show the inputs as out of range.
   */
  clamped: boolean;
}

export interface BreakEven {
  /** (revenue − variable costs) / revenue on the month-1 mix, 4 decimals; null without revenue. Can be negative. */
  contributionMarginRatio: number | null;
  /** Monthly revenue at which net = 0 (rounded up); null when CMR ≤ 0 or no revenue. */
  monthlyRevenueNeededMinor: number | null;
  /** Whole units per month needed (rounded up). Only when exactly one revenue stream; null otherwise. */
  unitsNeeded: number | null;
  /** True when some forecast month has revenue > 0 and net ≥ 0 (operating break-even within the horizon). */
  reachableInForecast: boolean;
}

export interface FinanceSummary {
  scenario: ScenarioKey;
  startupCostsMinor: number;
  /** Scenario-adjusted. */
  monthlyFixedCostsMinor: number;
  month1RevenueMinor: number;
  month1NetMinor: number;
  breakEven: BreakEven;
  forecast: Forecast;
}

export type FinanceValidationMessage = 'negative' | 'not_integer' | 'out_of_range';

/**
 * `field` is a dotted path into FinanceInputs using array indices, e.g. `startingCapitalMinor`,
 * `revenueStreams.0.unitPriceMinor`, `scenarios.conservative.volumePct` (react-hook-form style),
 * or `forecast` when individually valid inputs produce values beyond the safe numeric range.
 */
export interface FinanceValidationIssue {
  field: string;
  message: FinanceValidationMessage;
}

/** Row shape of the scenario columns of `public.financial_models`. */
export interface FinancialModelScenarioRow {
  conservative_volume_pct: number;
  conservative_price_pct: number;
  conservative_cost_pct: number;
  optimistic_volume_pct: number;
  optimistic_price_pct: number;
  optimistic_cost_pct: number;
}

/* ============================================================================================== */
/* Exact integer helpers (BigInt, no literals / `**` so every bundler and engine handles them)    */
/* ============================================================================================== */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const HUNDRED = BigInt(100);
const THOUSAND = BigInt(1000);
const TEN_THOUSAND = BigInt(10000);
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/** Nearest integer, ties away from zero; never returns -0. */
function roundHalfAwayFromZero(x: number): number {
  const r = x < 0 ? -Math.round(-x) : Math.round(x);
  return r === 0 ? 0 : r;
}

/** n / d rounded to the nearest integer, ties away from zero. Requires d > 0. */
function divRound(n: bigint, d: bigint): bigint {
  const q = n / d;
  const r = n % d;
  const twiceAbsR = (r < ZERO ? -r : r) * TWO;
  if (twiceAbsR >= d) return n < ZERO ? q - ONE : q + ONE;
  return q;
}

/** ceil(n / d). Requires d > 0. (BigInt division truncates toward zero, which is ceil for n < 0.) */
function divCeil(n: bigint, d: bigint): bigint {
  const q = n / d;
  return n % d > ZERO ? q + ONE : q;
}

interface ClampTracker {
  clamped: boolean;
}

function toSafeNumber(v: bigint, tracker?: ClampTracker): number {
  if (v > MAX_SAFE) {
    if (tracker) tracker.clamped = true;
    return Number.MAX_SAFE_INTEGER;
  }
  if (v < -MAX_SAFE) {
    if (tracker) tracker.clamped = true;
    return -Number.MAX_SAFE_INTEGER;
  }
  return Number(v);
}

/* ============================================================================================== */
/* Input projection onto the valid domain                                                         */
/* ============================================================================================== */

function clampNumber(x: number, min: number, max: number, fallback: number): number {
  if (typeof x !== 'number' || Number.isNaN(x)) return fallback;
  return x < min ? min : x > max ? max : x;
}

/** Money: integer minor units in [0, maxAmountMinor]. */
function moneyToBig(x: number): bigint {
  return BigInt(roundHalfAwayFromZero(clampNumber(x, 0, FINANCE_LIMITS.maxAmountMinor, 0)));
}

/** Value with 2-decimal precision → integer hundredths. */
function hundredthsToBig(x: number, min: number, max: number, fallback: number): bigint {
  return BigInt(roundHalfAwayFromZero(clampNumber(x, min, max, fallback) * 100));
}

function sanitizeForecastMonths(x: number): number {
  return roundHalfAwayFromZero(
    clampNumber(x, FINANCE_LIMITS.minForecastMonths, FINANCE_LIMITS.maxForecastMonths, FINANCE_LIMITS.minForecastMonths),
  );
}

function listOf<T>(v: readonly T[] | null | undefined): readonly T[] {
  return Array.isArray(v) ? v : [];
}

interface NormalizedScenario {
  /** Hundredths of a percent: 100% = 10000. */
  volumeH: bigint;
  priceH: bigint;
  costH: bigint;
}

interface NormalizedStream {
  /** Month-1 units in hundredths. */
  unitsH: bigint;
  /** Monthly growth factor (1 + g) as a reduced fraction growthNum / growthDen (0% → 1/1, 10% → 11/10). */
  growthNum: bigint;
  growthDen: bigint;
  priceMinor: bigint;
  costMinor: bigint;
}

interface NormalizedModel {
  startingCapital: bigint;
  startupTotal: bigint;
  recurringTotal: bigint;
  streams: NormalizedStream[];
  months: number;
  scenarios: Record<ScenarioKey, NormalizedScenario>;
}

function normalizeScenario(adj: ScenarioAdjustments | null | undefined, key: ScenarioKey): NormalizedScenario {
  const fallback = DEFAULT_SCENARIOS[key];
  const source = adj ?? fallback;
  const pct = (v: number) => hundredthsToBig(v, FINANCE_LIMITS.minScenarioPct, FINANCE_LIMITS.maxScenarioPct, 100);
  return { volumeH: pct(source.volumePct), priceH: pct(source.pricePct), costH: pct(source.costPct) };
}

function normalizeScenarios(settings: ScenarioSettings | null | undefined): Record<ScenarioKey, NormalizedScenario> {
  return {
    conservative: normalizeScenario(settings?.conservative, 'conservative'),
    expected: normalizeScenario(settings?.expected, 'expected'),
    optimistic: normalizeScenario(settings?.optimistic, 'optimistic'),
  };
}

function sumStartupCosts(items: readonly StartupCostInput[] | null | undefined): bigint {
  let total = ZERO;
  for (const item of listOf(items)) total += moneyToBig(item.amountMinor);
  return total;
}

function sumRecurring(items: readonly RecurringExpenseInput[] | null | undefined): bigint {
  let total = ZERO;
  for (const item of listOf(items)) total += moneyToBig(item.monthlyAmountMinor);
  return total;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** (1 + g) = (10000 + g in hundredths of a percent) / 10000, reduced so the powers stay small. */
function growthFraction(growthPct: number): { growthNum: bigint; growthDen: bigint } {
  const factorH =
    10000 + roundHalfAwayFromZero(clampNumber(growthPct, FINANCE_LIMITS.minGrowthPct, FINANCE_LIMITS.maxGrowthPct, 0) * 100);
  const divisor = gcd(factorH, 10000); // ≥ 1 because 10000 ≠ 0; factorH = 0 (−100%) gives 0 / 1
  return { growthNum: BigInt(factorH / divisor), growthDen: BigInt(10000 / divisor) };
}

function normalize(inputs: FinanceInputs): NormalizedModel {
  return {
    startingCapital: moneyToBig(inputs.startingCapitalMinor),
    startupTotal: sumStartupCosts(inputs.startupCosts),
    recurringTotal: sumRecurring(inputs.recurringExpenses),
    streams: listOf(inputs.revenueStreams).map((s) => ({
      unitsH: hundredthsToBig(s.monthlyUnits, 0, FINANCE_LIMITS.maxMonthlyUnits, 0),
      ...growthFraction(s.monthlyGrowthPct),
      priceMinor: moneyToBig(s.unitPriceMinor),
      costMinor: moneyToBig(s.unitVariableCostMinor),
    })),
    months: sanitizeForecastMonths(inputs.forecastMonths),
    scenarios: normalizeScenarios(inputs.scenarios),
  };
}

/** round(amount × pct / 100) with pct in hundredths of a percent. */
function applyPct(amount: bigint, pctH: bigint): bigint {
  return divRound(amount * pctH, TEN_THOUSAND);
}

/* ============================================================================================== */
/* Core forecast run (exact)                                                                      */
/* ============================================================================================== */

interface AdjustedStream {
  unitsH: bigint;
  growthNum: bigint;
  growthDen: bigint;
  priceMinor: bigint;
  costMinor: bigint;
}

interface ExactMonth {
  unitsH: bigint;
  revenue: bigint;
  variableCosts: bigint;
  net: bigint;
}

interface ForecastRun {
  forecast: Forecast;
  fixedCosts: bigint;
  streams: AdjustedStream[];
  exactMonths: ExactMonth[];
}

function runForecast(model: NormalizedModel, scenario: ScenarioKey): ForecastRun {
  const adj = model.scenarios[scenario];
  const tracker: ClampTracker = { clamped: false };
  const fixedCosts = applyPct(model.recurringTotal, adj.costH);
  const streams: AdjustedStream[] = model.streams.map((s) => ({
    unitsH: s.unitsH,
    growthNum: s.growthNum,
    growthDen: s.growthDen,
    priceMinor: applyPct(s.priceMinor, adj.priceH),
    costMinor: applyPct(s.costMinor, adj.costH),
  }));

  // units_i(m) [hundredths] = round(unitsH × growthNum^(m−1) × volumeH / (growthDen^(m−1) × 10000))
  const growthPowers = streams.map((s) => ({ stream: s, num: ONE, den: TEN_THOUSAND }));

  const opening = model.startingCapital - model.startupTotal;
  let cash = opening;
  let cumulativeNet = ZERO;
  let totalRevenue = ZERO;
  let lowest = opening;
  let lowestMonth = 0;
  let firstProfitableMonth: number | null = null;
  let cashOutMonth: number | null = opening < ZERO ? 0 : null;
  let breakEvenMonth: number | null = null;

  const months: ForecastMonth[] = [];
  const exactMonths: ExactMonth[] = [];

  for (let month = 1; month <= model.months; month++) {
    let unitsH = ZERO;
    let revenue = ZERO;
    let variableCosts = ZERO;
    for (const entry of growthPowers) {
      const s = entry.stream;
      const streamUnitsH = divRound(s.unitsH * entry.num * adj.volumeH, entry.den);
      unitsH += streamUnitsH;
      revenue += divRound(streamUnitsH * s.priceMinor, HUNDRED);
      variableCosts += divRound(streamUnitsH * s.costMinor, HUNDRED);
      entry.num *= s.growthNum;
      entry.den *= s.growthDen;
    }

    const gross = revenue - variableCosts;
    const net = gross - fixedCosts;
    cash += net;
    cumulativeNet += net;
    totalRevenue += revenue;

    if (cash < lowest) {
      lowest = cash;
      lowestMonth = month;
    }
    if (firstProfitableMonth === null && net > ZERO) firstProfitableMonth = month;
    if (cashOutMonth === null && cash < ZERO) cashOutMonth = month;
    if (breakEvenMonth === null && cumulativeNet >= model.startupTotal) breakEvenMonth = month;

    exactMonths.push({ unitsH, revenue, variableCosts, net });
    months.push({
      month,
      units: toSafeNumber(unitsH, tracker) / 100,
      revenueMinor: toSafeNumber(revenue, tracker),
      variableCostsMinor: toSafeNumber(variableCosts, tracker),
      grossProfitMinor: toSafeNumber(gross, tracker),
      fixedCostsMinor: toSafeNumber(fixedCosts, tracker),
      netMinor: toSafeNumber(net, tracker),
      cashBalanceMinor: toSafeNumber(cash, tracker),
    });
  }

  const forecast: Forecast = {
    scenario,
    months,
    openingCashMinor: toSafeNumber(opening, tracker),
    totalRevenueMinor: toSafeNumber(totalRevenue, tracker),
    totalNetMinor: toSafeNumber(cumulativeNet, tracker),
    endingCashMinor: toSafeNumber(cash, tracker),
    lowestCashMinor: toSafeNumber(lowest, tracker),
    lowestCashMonth: lowestMonth,
    firstProfitableMonth,
    cashOutMonth,
    breakEvenMonth,
    clamped: false,
  };
  forecast.clamped = tracker.clamped;
  return { forecast, fixedCosts, streams, exactMonths };
}

function breakEvenFromRun(run: ForecastRun): BreakEven {
  const single = run.streams.length === 1 ? run.streams[0] : undefined;
  let revenueBase = ZERO;
  let contribution = ZERO;
  if (single) {
    // One stream: the mix is trivial, CMR depends only on unit economics.
    revenueBase = single.priceMinor;
    contribution = single.priceMinor - single.costMinor;
  } else {
    const first = run.exactMonths[0];
    if (first) {
      revenueBase = first.revenue;
      contribution = first.revenue - first.variableCosts;
    }
  }

  const hasRevenue = revenueBase > ZERO;
  const contributionMarginRatio = hasRevenue ? toSafeNumber(divRound(contribution * TEN_THOUSAND, revenueBase)) / 10000 : null;
  const monthlyRevenueNeededMinor =
    hasRevenue && contribution > ZERO ? toSafeNumber(divCeil(run.fixedCosts * revenueBase, contribution)) : null;
  const unitContribution = single ? single.priceMinor - single.costMinor : ZERO;
  const unitsNeeded = single && unitContribution > ZERO ? toSafeNumber(divCeil(run.fixedCosts, unitContribution)) : null;
  const reachableInForecast = run.exactMonths.some((m) => m.revenue > ZERO && m.net >= ZERO);

  return { contributionMarginRatio, monthlyRevenueNeededMinor, unitsNeeded, reachableInForecast };
}

/* ============================================================================================== */
/* Public API                                                                                     */
/* ============================================================================================== */

/** Builds scenario settings from a `financial_models` row. `expected` is always 100/100/100. */
export function scenarioSettingsFromModel(row: FinancialModelScenarioRow): ScenarioSettings {
  return {
    conservative: {
      volumePct: row.conservative_volume_pct,
      pricePct: row.conservative_price_pct,
      costPct: row.conservative_cost_pct,
    },
    expected: { volumePct: 100, pricePct: 100, costPct: 100 },
    optimistic: {
      volumePct: row.optimistic_volume_pct,
      pricePct: row.optimistic_price_pct,
      costPct: row.optimistic_cost_pct,
    },
  };
}

/** (price − cost) / price in percent, 1 decimal (can be negative). Null when price is 0. */
export function grossMarginPct(priceMinor: number, unitCostMinor: number): number | null {
  const price = moneyToBig(priceMinor);
  if (price <= ZERO) return null;
  const cost = moneyToBig(unitCostMinor);
  return Number(divRound((price - cost) * THOUSAND, price)) / 10;
}

/** price − cost per unit (can be negative). */
export function unitContributionMinor(priceMinor: number, unitCostMinor: number): number {
  return Number(moneyToBig(priceMinor) - moneyToBig(unitCostMinor));
}

/**
 * Smallest integer price whose gross margin is ≥ the target: ceil(cost / (1 − target/100)).
 * Null if the target is ≥ 100, < 0 or not a finite number. A cost of 0 yields 0.
 */
export function priceForTargetMargin(unitCostMinor: number, targetMarginPct: number): number | null {
  if (typeof targetMarginPct !== 'number' || !Number.isFinite(targetMarginPct)) return null;
  if (targetMarginPct < 0 || targetMarginPct >= 100) return null;
  const marginH = BigInt(roundHalfAwayFromZero(targetMarginPct * 100));
  const keepH = TEN_THOUSAND - marginH; // (1 − m) in hundredths of a percent
  if (keepH <= ZERO) return null; // e.g. 99.996 rounds to 100.00
  // p ≥ c × 10000 / (10000 − mH)  ⟺  (p − c) / p ≥ mH / 10000
  return toSafeNumber(divCeil(moneyToBig(unitCostMinor) * TEN_THOUSAND, keepH));
}

/** (price − cost) / cost in percent, 1 decimal (can be negative). Null when cost is 0. */
export function markupPct(priceMinor: number, unitCostMinor: number): number | null {
  const cost = moneyToBig(unitCostMinor);
  if (cost <= ZERO) return null;
  const price = moneyToBig(priceMinor);
  return Number(divRound((price - cost) * THOUSAND, cost)) / 10;
}

/** Σ startup (one-off) costs. */
export function totalStartupCostsMinor(inputs: Pick<FinanceInputs, 'startupCosts'>): number {
  return toSafeNumber(sumStartupCosts(inputs.startupCosts));
}

/** Σ recurring monthly costs × scenario costPct / 100, rounded. Without `scenarios`, defaults apply. */
export function monthlyFixedCostsMinor(
  inputs: Pick<FinanceInputs, 'recurringExpenses'> & { scenarios?: ScenarioSettings },
  scenario: ScenarioKey = 'expected',
): number {
  const adj = normalizeScenario(inputs.scenarios?.[scenario], scenario);
  return toSafeNumber(applyPct(sumRecurring(inputs.recurringExpenses), adj.costH));
}

/** Month-by-month cash-flow forecast for one scenario. */
export function forecast(inputs: FinanceInputs, scenario: ScenarioKey): Forecast {
  return runForecast(normalize(inputs), scenario).forecast;
}

/** Monthly break-even on the month-1 revenue mix (see header). */
export function breakEven(inputs: FinanceInputs, scenario: ScenarioKey = 'expected'): BreakEven {
  return breakEvenFromRun(runForecast(normalize(inputs), scenario));
}

/**
 * Full months the cash lasts before the balance first drops below 0 within the forecast
 * (cashOutMonth − 1; 0 when the opening balance is already negative). Null if cash never drops
 * below 0 within the forecast horizon.
 */
export function runwayMonths(inputs: FinanceInputs, scenario: ScenarioKey = 'expected'): number | null {
  const { cashOutMonth } = forecast(inputs, scenario);
  return cashOutMonth === null ? null : Math.max(0, cashOutMonth - 1);
}

export function summarize(inputs: FinanceInputs, scenario: ScenarioKey = 'expected'): FinanceSummary {
  const model = normalize(inputs);
  const run = runForecast(model, scenario);
  const first = run.exactMonths[0];
  return {
    scenario,
    startupCostsMinor: toSafeNumber(model.startupTotal),
    monthlyFixedCostsMinor: toSafeNumber(run.fixedCosts),
    month1RevenueMinor: first ? toSafeNumber(first.revenue) : 0,
    month1NetMinor: first ? toSafeNumber(first.net) : 0,
    breakEven: breakEvenFromRun(run),
    forecast: run.forecast,
  };
}

export function compareScenarios(inputs: FinanceInputs): Record<ScenarioKey, Forecast> {
  const model = normalize(inputs);
  return {
    conservative: runForecast(model, 'conservative').forecast,
    expected: runForecast(model, 'expected').forecast,
    optimistic: runForecast(model, 'optimistic').forecast,
  };
}

/* ============================================================================================== */
/* Validation                                                                                     */
/* ============================================================================================== */

/**
 * Field-level checks, in this order per field: not a finite number → `out_of_range`;
 * below 0 for a non-negative field → `negative`; fraction in an integer field → `not_integer`;
 * outside the FINANCE_LIMITS range → `out_of_range`. Integer fields: money, forecastMonths and the
 * scenario percentages (DB integer columns). `scenarios.expected.*` must be exactly 100.
 * When every field is valid, the three scenario forecasts are run and `{ field: 'forecast',
 * message: 'out_of_range' }` is reported if any of them exceeds the safe numeric range.
 * Returns [] for valid input.
 */
export function validateInputs(inputs: FinanceInputs): FinanceValidationIssue[] {
  const issues: FinanceValidationIssue[] = [];

  const check = (field: string, value: number, min: number, max: number, integer: boolean): void => {
    let message: FinanceValidationMessage | null = null;
    if (typeof value !== 'number' || !Number.isFinite(value)) message = 'out_of_range';
    else if (value < 0 && min >= 0) message = 'negative';
    else if (integer && !Number.isInteger(value)) message = 'not_integer';
    else if (value < min || value > max) message = 'out_of_range';
    if (message) issues.push({ field, message });
  };
  const money = (field: string, value: number) => check(field, value, 0, FINANCE_LIMITS.maxAmountMinor, true);

  money('startingCapitalMinor', inputs.startingCapitalMinor);
  listOf(inputs.startupCosts).forEach((c, i) => money(`startupCosts.${i}.amountMinor`, c.amountMinor));
  listOf(inputs.recurringExpenses).forEach((e, i) => money(`recurringExpenses.${i}.monthlyAmountMinor`, e.monthlyAmountMinor));
  listOf(inputs.revenueStreams).forEach((s, i) => {
    const p = `revenueStreams.${i}`;
    money(`${p}.unitPriceMinor`, s.unitPriceMinor);
    money(`${p}.unitVariableCostMinor`, s.unitVariableCostMinor);
    check(`${p}.monthlyUnits`, s.monthlyUnits, 0, FINANCE_LIMITS.maxMonthlyUnits, false);
    check(`${p}.monthlyGrowthPct`, s.monthlyGrowthPct, FINANCE_LIMITS.minGrowthPct, FINANCE_LIMITS.maxGrowthPct, false);
  });
  check('forecastMonths', inputs.forecastMonths, FINANCE_LIMITS.minForecastMonths, FINANCE_LIMITS.maxForecastMonths, true);

  const pctKeys = ['volumePct', 'pricePct', 'costPct'] as const;
  for (const key of SCENARIO_KEYS) {
    const adj: ScenarioAdjustments | undefined = inputs.scenarios?.[key];
    if (!adj) {
      issues.push({ field: `scenarios.${key}`, message: 'out_of_range' });
      continue;
    }
    for (const pk of pctKeys) {
      const field = `scenarios.${key}.${pk}`;
      if (key === 'expected') {
        if (adj[pk] !== 100) issues.push({ field, message: 'out_of_range' });
      } else {
        // Integer, matching the `financial_models.*_pct integer` columns.
        check(field, adj[pk], FINANCE_LIMITS.minScenarioPct, FINANCE_LIMITS.maxScenarioPct, true);
      }
    }
  }

  if (issues.length === 0) {
    const all = compareScenarios(inputs);
    if (SCENARIO_KEYS.some((k) => all[k].clamped)) issues.push({ field: 'forecast', message: 'out_of_range' });
  }
  return issues;
}
