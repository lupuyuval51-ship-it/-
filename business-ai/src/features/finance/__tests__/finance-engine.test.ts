/**
 * Tests for the deterministic financial engine (`@domain/finance`).
 *
 * Expected values are computed by hand; the arithmetic is shown next to each assertion.
 * Rounding rule under test: every step rounds to the nearest integer, ties half away from zero;
 * thresholds (break-even revenue/units, price for target margin) round up.
 */
import {
  DEFAULT_SCENARIOS,
  FINANCE_LIMITS,
  SCENARIO_KEYS,
  breakEven,
  compareScenarios,
  forecast,
  grossMarginPct,
  markupPct,
  monthlyFixedCostsMinor,
  priceForTargetMargin,
  runwayMonths,
  scenarioSettingsFromModel,
  summarize,
  totalStartupCostsMinor,
  unitContributionMinor,
  validateInputs,
  type FinanceInputs,
  type Forecast,
  type ForecastMonth,
  type RevenueStreamInput,
  type ScenarioKey,
  type ScenarioSettings,
} from '@domain/finance';

/* ---------------------------------------------------------------------------------------------- */
/* Helpers                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

function scenarios(): ScenarioSettings {
  return {
    conservative: { ...DEFAULT_SCENARIOS.conservative },
    expected: { ...DEFAULT_SCENARIOS.expected },
    optimistic: { ...DEFAULT_SCENARIOS.optimistic },
  };
}

function stream(overrides: Partial<RevenueStreamInput> = {}): RevenueStreamInput {
  return {
    label: 'Stream',
    unitPriceMinor: 0,
    unitVariableCostMinor: 0,
    monthlyUnits: 0,
    monthlyGrowthPct: 0,
    ...overrides,
  };
}

function model(overrides: Partial<FinanceInputs> = {}): FinanceInputs {
  return {
    startingCapitalMinor: 0,
    startupCosts: [],
    recurringExpenses: [],
    revenueStreams: [],
    forecastMonths: 12,
    scenarios: scenarios(),
    ...overrides,
  };
}

/**
 * Reference fixture ("cafe"):
 *   capital 5,000,000; startup 2,000,000 + 500,000 = 2,500,000; recurring 400,000 + 50,000 = 450,000/month;
 *   one stream: price 2,000, unit cost 800, 300 units in month 1, +10%/month; 6 months.
 */
function cafe(): FinanceInputs {
  return model({
    startingCapitalMinor: 5_000_000,
    startupCosts: [
      { id: 's1', label: 'Equipment', amountMinor: 2_000_000 },
      { id: 's2', label: 'Deposit', amountMinor: 500_000 },
    ],
    recurringExpenses: [
      { id: 'r1', label: 'Rent', monthlyAmountMinor: 400_000 },
      { id: 'r2', label: 'Software', monthlyAmountMinor: 50_000 },
    ],
    revenueStreams: [
      stream({ id: 'v1', label: 'Coffee', unitPriceMinor: 2_000, unitVariableCostMinor: 800, monthlyUnits: 300, monthlyGrowthPct: 10 }),
    ],
    forecastMonths: 6,
  });
}

function monthAt(f: Forecast, month: number): ForecastMonth {
  const m = f.months[month - 1];
  if (!m) throw new Error(`month ${month} missing`);
  return m;
}

/** [units, revenue, variable costs, gross profit, fixed costs, net, cash] per month. */
function table(f: Forecast): number[][] {
  return f.months.map((m) => [
    m.units,
    m.revenueMinor,
    m.variableCostsMinor,
    m.grossProfitMinor,
    m.fixedCostsMinor,
    m.netMinor,
    m.cashBalanceMinor,
  ]);
}

function unitsOf(f: Forecast): number[] {
  return f.months.map((m) => m.units);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
    Object.freeze(value);
  }
  return value;
}

/** mulberry32 — tiny deterministic PRNG so property tests are reproducible. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random but representable models: growth is capped at +20%/month so that even the optimistic
 * scenario over 36 months stays far below Number.MAX_SAFE_INTEGER
 * (10,000 units × 3 × 1.2^35 ≈ 1.8e7 units × 1e6 price ≈ 1.8e13 per stream-month).
 */
function randomInputs(rand: () => number, maxGrowthPct = 20): FinanceInputs {
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const list = <T>(max: number, make: (i: number) => T): T[] => Array.from({ length: int(0, max) }, (_, i) => make(i));
  return {
    startingCapitalMinor: int(0, 100_000_000),
    startupCosts: list(3, (i) => ({ label: `s${i}`, amountMinor: int(0, 10_000_000) })),
    recurringExpenses: list(3, (i) => ({ label: `r${i}`, monthlyAmountMinor: int(0, 1_000_000) })),
    revenueStreams: list(4, (i) =>
      stream({
        label: `v${i}`,
        unitPriceMinor: int(0, 1_000_000),
        unitVariableCostMinor: int(0, 1_000_000),
        monthlyUnits: int(0, 1_000_000) / 100, // 0 … 10,000.00
        monthlyGrowthPct: int(-10_000, maxGrowthPct * 100) / 100, // −100.00 … maxGrowthPct
      }),
    ),
    forecastMonths: int(1, 36),
    scenarios: {
      conservative: { volumePct: int(0, 100), pricePct: 100, costPct: int(100, 200) },
      expected: { volumePct: 100, pricePct: 100, costPct: 100 },
      optimistic: { volumePct: int(100, 300), pricePct: 100, costPct: int(50, 100) },
    },
  };
}

const MONEY_FIELDS = [
  'revenueMinor',
  'variableCostsMinor',
  'grossProfitMinor',
  'fixedCostsMinor',
  'netMinor',
  'cashBalanceMinor',
] as const;

function expectSafeInteger(n: number): void {
  expect(Number.isSafeInteger(n)).toBe(true);
}

/** n is exactly the double nearest to some k / 100 (works at any magnitude, unlike an absolute epsilon). */
function expectTwoDecimals(n: number): void {
  expect(Number.isFinite(n)).toBe(true);
  expect(Math.round(n * 100) / 100).toBe(n);
}

/* ---------------------------------------------------------------------------------------------- */
/* Constants & scenario settings                                                                  */
/* ---------------------------------------------------------------------------------------------- */

describe('scenario settings', () => {
  it('DEFAULT_SCENARIOS match the financial_models column defaults', () => {
    expect(DEFAULT_SCENARIOS).toEqual({
      conservative: { volumePct: 70, pricePct: 100, costPct: 110 },
      expected: { volumePct: 100, pricePct: 100, costPct: 100 },
      optimistic: { volumePct: 130, pricePct: 100, costPct: 95 },
    });
    expect(SCENARIO_KEYS).toEqual(['conservative', 'expected', 'optimistic']);
  });

  it('DEFAULT_SCENARIOS cannot be mutated by accident', () => {
    expect(Object.isFrozen(DEFAULT_SCENARIOS)).toBe(true);
    expect(Object.isFrozen(DEFAULT_SCENARIOS.conservative)).toBe(true);
  });

  it('scenarioSettingsFromModel maps DB columns and pins expected to 100/100/100', () => {
    expect(
      scenarioSettingsFromModel({
        conservative_volume_pct: 60,
        conservative_price_pct: 95,
        conservative_cost_pct: 115,
        optimistic_volume_pct: 140,
        optimistic_price_pct: 105,
        optimistic_cost_pct: 90,
      }),
    ).toEqual({
      conservative: { volumePct: 60, pricePct: 95, costPct: 115 },
      expected: { volumePct: 100, pricePct: 100, costPct: 100 },
      optimistic: { volumePct: 140, pricePct: 105, costPct: 90 },
    });
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Unit economics                                                                                 */
/* ---------------------------------------------------------------------------------------------- */

describe('grossMarginPct', () => {
  it('computes (price − cost) / price in percent with 1 decimal', () => {
    expect(grossMarginPct(10_000, 6_000)).toBe(40); // 4,000 / 10,000 = 40.0%
    expect(grossMarginPct(2_000, 800)).toBe(60); // 1,200 / 2,000 = 60.0%
    expect(grossMarginPct(3_000, 1_000)).toBe(66.7); // 2,000 / 3,000 = 66.666…% → 66.7
    expect(grossMarginPct(3, 4)).toBe(-33.3); // −1 / 3 = −33.33…% → −33.3
    expect(grossMarginPct(500, 0)).toBe(100);
  });

  it('rounds ties half away from zero (both signs)', () => {
    expect(grossMarginPct(400, 351)).toBe(12.3); // 49 / 400 = 12.25% → 12.3
    expect(grossMarginPct(400, 449)).toBe(-12.3); // −49 / 400 = −12.25% → −12.3 (Math.round would give −12.2)
  });

  it('never returns −0', () => {
    expect(Object.is(grossMarginPct(10_000, 10_000), 0)).toBe(true);
    expect(Object.is(grossMarginPct(100_000, 100_004), 0)).toBe(true); // −0.004% → 0.0
  });

  it('is null when the price is 0', () => {
    expect(grossMarginPct(0, 100)).toBeNull();
    expect(grossMarginPct(0, 0)).toBeNull();
    expect(grossMarginPct(Number.NaN, 100)).toBeNull(); // invalid price is treated as 0
  });
});

describe('unitContributionMinor', () => {
  it('is price − cost and can be negative', () => {
    expect(unitContributionMinor(2_000, 800)).toBe(1_200);
    expect(unitContributionMinor(800, 2_000)).toBe(-1_200);
    expect(unitContributionMinor(0, 0)).toBe(0);
  });
});

describe('markupPct', () => {
  it('computes (price − cost) / cost in percent with 1 decimal', () => {
    expect(markupPct(10_000, 6_000)).toBe(66.7); // 4,000 / 6,000 = 66.666…% → 66.7
    expect(markupPct(2_000, 800)).toBe(150); // 1,200 / 800 = 150%
    expect(markupPct(1_005, 1_000)).toBe(0.5); // 5 / 1,000 = 0.5%
    expect(markupPct(0, 500)).toBe(-100);
  });

  it('is null when the cost is 0', () => {
    expect(markupPct(1_000, 0)).toBeNull();
  });
});

describe('priceForTargetMargin', () => {
  it('returns the smallest integer price whose margin reaches the target', () => {
    expect(priceForTargetMargin(6_000, 40)).toBe(10_000); // 6,000 / 0.6 = 10,000 exactly
    expect(priceForTargetMargin(800, 60)).toBe(2_000); // 800 / 0.4 = 2,000
    // 100 / 0.67 = 149.25… → 150. Check: (149 − 100) / 149 = 32.9% < 33%; (150 − 100) / 150 = 33.3% ≥ 33%
    expect(priceForTargetMargin(100, 33)).toBe(150);
    expect(priceForTargetMargin(1_000, 33.33)).toBe(1_500); // 1,000 / 0.6667 = 1,499.92… → 1,500
    expect(priceForTargetMargin(3, 50)).toBe(6);
    expect(priceForTargetMargin(100, 0)).toBe(100);
    expect(priceForTargetMargin(100, 99.99)).toBe(1_000_000); // 100 / 0.0001
  });

  it('returns 0 for a zero cost', () => {
    expect(priceForTargetMargin(0, 50)).toBe(0);
  });

  it('is null for targets ≥ 100%, < 0% or not finite', () => {
    expect(priceForTargetMargin(100, 100)).toBeNull();
    expect(priceForTargetMargin(100, 120)).toBeNull();
    expect(priceForTargetMargin(100, 99.996)).toBeNull(); // rounds to 100.00%
    expect(priceForTargetMargin(100, -1)).toBeNull();
    expect(priceForTargetMargin(100, Number.NaN)).toBeNull();
    expect(priceForTargetMargin(100, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('property: price reaches the margin and price − 1 does not', () => {
    const rand = prng(7);
    for (let i = 0; i < 500; i++) {
      const cost = Math.floor(rand() * 1_000_000) + 1;
      const target = Math.floor(rand() * 100); // integer 0…99
      const price = priceForTargetMargin(cost, target);
      expect(price).not.toBeNull();
      const p = price as number;
      // margin ≥ target ⟺ 100 × (p − c) ≥ target × p (exact integer arithmetic)
      expect(100 * (p - cost)).toBeGreaterThanOrEqual(target * p);
      expect(100 * (p - 1 - cost)).toBeLessThan(target * (p - 1));
    }
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Cost totals                                                                                    */
/* ---------------------------------------------------------------------------------------------- */

describe('cost totals', () => {
  it('totalStartupCostsMinor sums one-off costs', () => {
    expect(totalStartupCostsMinor(cafe())).toBe(2_500_000); // 2,000,000 + 500,000
    expect(totalStartupCostsMinor({ startupCosts: [] })).toBe(0);
  });

  it('monthlyFixedCostsMinor applies the scenario cost percentage to the total', () => {
    const inputs = cafe();
    expect(monthlyFixedCostsMinor(inputs)).toBe(450_000); // expected: 400,000 + 50,000
    expect(monthlyFixedCostsMinor(inputs, 'conservative')).toBe(495_000); // 450,000 × 1.10
    expect(monthlyFixedCostsMinor(inputs, 'optimistic')).toBe(427_500); // 450,000 × 0.95
  });

  it('monthlyFixedCostsMinor uses DEFAULT_SCENARIOS when no scenarios are given', () => {
    expect(monthlyFixedCostsMinor({ recurringExpenses: [{ label: 'Rent', monthlyAmountMinor: 450_000 }] }, 'conservative')).toBe(
      495_000,
    );
  });

  it('monthlyFixedCostsMinor rounds once, half away from zero', () => {
    const one = (amount: number) => ({ recurringExpenses: [{ label: 'x', monthlyAmountMinor: amount }], scenarios: scenarios() });
    expect(monthlyFixedCostsMinor(one(5), 'conservative')).toBe(6); // 5 × 1.10 = 5.5 → 6
    expect(monthlyFixedCostsMinor(one(10), 'optimistic')).toBe(10); // 10 × 0.95 = 9.5 → 10
    expect(monthlyFixedCostsMinor(one(333_333), 'conservative')).toBe(366_666); // 366,666.3 → 366,666
    expect(monthlyFixedCostsMinor(one(333_333), 'optimistic')).toBe(316_666); // 316,666.35 → 316,666
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Forecast — hand-computed reference                                                             */
/* ---------------------------------------------------------------------------------------------- */

describe('forecast (reference fixture)', () => {
  it('expected scenario: month-by-month table', () => {
    const f = forecast(cafe(), 'expected');
    // units(m) = 300 × 1.1^(m−1); revenue = units × 2,000; variable = units × 800; fixed = 450,000
    // opening cash = 5,000,000 − 2,500,000 = 2,500,000
    expect(table(f)).toEqual([
      // 300 × 2,000 = 600,000; 300 × 800 = 240,000; 360,000 − 450,000 = −90,000; 2,500,000 − 90,000
      [300, 600_000, 240_000, 360_000, 450_000, -90_000, 2_410_000],
      // 330 units
      [330, 660_000, 264_000, 396_000, 450_000, -54_000, 2_356_000],
      // 363 units
      [363, 726_000, 290_400, 435_600, 450_000, -14_400, 2_341_600],
      // 399.3 units: 399.3 × 2,000 = 798,600; × 800 = 319,440
      [399.3, 798_600, 319_440, 479_160, 450_000, 29_160, 2_370_760],
      // 439.23 units: × 2,000 = 878,460; × 800 = 351,384
      [439.23, 878_460, 351_384, 527_076, 450_000, 77_076, 2_447_836],
      // 300 × 1.1^5 = 483.153 → 483.15 units: × 2,000 = 966,300; × 800 = 386,520
      [483.15, 966_300, 386_520, 579_780, 450_000, 129_780, 2_577_616],
    ]);
    expect(f.months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(f).toMatchObject({
      scenario: 'expected',
      openingCashMinor: 2_500_000,
      // 600,000 + 660,000 + 726,000 + 798,600 + 878,460 + 966,300
      totalRevenueMinor: 4_629_360,
      // −90,000 − 54,000 − 14,400 + 29,160 + 77,076 + 129,780
      totalNetMinor: 77_616,
      endingCashMinor: 2_577_616, // 2,500,000 + 77,616
      lowestCashMinor: 2_341_600,
      lowestCashMonth: 3,
      firstProfitableMonth: 4,
      cashOutMonth: null,
      breakEvenMonth: null, // cumulative net 77,616 never reaches startup costs 2,500,000
      clamped: false,
    });
  });

  it('conservative scenario: volume 70%, cost 110% on variable and fixed costs', () => {
    const f = forecast(cafe(), 'conservative');
    // unit cost 800 × 1.1 = 880; fixed 450,000 × 1.1 = 495,000
    expect(table(f).slice(0, 2)).toEqual([
      // 300 × 0.7 = 210 units; 210 × 2,000 = 420,000; 210 × 880 = 184,800; 235,200 − 495,000 = −259,800
      [210, 420_000, 184_800, 235_200, 495_000, -259_800, 2_240_200],
      // 300 × 1.1 × 0.7 = 231 units; 462,000; 203,280; 258,720 − 495,000 = −236,280
      [231, 462_000, 203_280, 258_720, 495_000, -236_280, 2_003_920],
    ]);
  });

  it('optimistic scenario: volume 130%, cost 95%', () => {
    // 300 × 1.3 = 390 units; 390 × 2,000 = 780,000; unit cost 760 → 296,400; fixed 427,500
    // net = 483,600 − 427,500 = 56,100; cash = 2,500,000 + 56,100
    expect(table(forecast(cafe(), 'optimistic'))[0]).toEqual([390, 780_000, 296_400, 483_600, 427_500, 56_100, 2_556_100]);
  });

  it('compareScenarios returns one forecast per scenario, identical to forecast()', () => {
    const inputs = cafe();
    const all = compareScenarios(inputs);
    for (const key of SCENARIO_KEYS) expect(all[key]).toEqual(forecast(inputs, key));
  });

  it('produces exactly forecastMonths months', () => {
    expect(forecast(model({ forecastMonths: 1 }), 'expected').months).toHaveLength(1);
    expect(forecast(model({ forecastMonths: 36 }), 'expected').months).toHaveLength(36);
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Rounding                                                                                       */
/* ---------------------------------------------------------------------------------------------- */

describe('rounding (exact decimal halves, half away from zero)', () => {
  it('revenue = round(units × price) on true decimal values', () => {
    // 0.29 × 50 = 14.5 → 15 (naive floating point: 14.499999999999998 → 14)
    const f = forecast(model({ forecastMonths: 1, revenueStreams: [stream({ unitPriceMinor: 50, monthlyUnits: 0.29 })] }), 'expected');
    expect(monthAt(f, 1).revenueMinor).toBe(15);
  });

  it('variable costs = round(units × unit cost)', () => {
    // 0.5 × 3 = 1.5 → 2 for both revenue and variable costs
    const f = forecast(
      model({ forecastMonths: 1, revenueStreams: [stream({ unitPriceMinor: 3, unitVariableCostMinor: 3, monthlyUnits: 0.5 })] }),
      'expected',
    );
    expect(monthAt(f, 1)).toMatchObject({ revenueMinor: 2, variableCostsMinor: 2, grossProfitMinor: 0 });
  });

  it('scenario price adjustment is rounded before multiplying by units', () => {
    const s = scenarios();
    s.conservative = { volumePct: 100, pricePct: 70, costPct: 100 };
    // 45 × 0.70 = 31.5 → 32 per unit; 10 units → 320 (not round(10 × 31.5) = 315)
    const f = forecast(
      model({ forecastMonths: 1, scenarios: s, revenueStreams: [stream({ unitPriceMinor: 45, monthlyUnits: 10 })] }),
      'conservative',
    );
    expect(monthAt(f, 1).revenueMinor).toBe(320);
  });

  it('units are rounded to 2 decimals after growth and volume', () => {
    // 100 × 1.05² × 0.70 = 77.175 → 77.18
    const f = forecast(
      model({ forecastMonths: 3, revenueStreams: [stream({ unitPriceMinor: 100, monthlyUnits: 100, monthlyGrowthPct: 5 })] }),
      'conservative',
    );
    expect(unitsOf(f)).toEqual([70, 73.5, 77.18]); // 70; 100 × 1.05 × 0.7 = 73.5; 77.175 → 77.18
    expect(monthAt(f, 3).revenueMinor).toBe(7_718); // 77.18 × 100
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Edge cases                                                                                     */
/* ---------------------------------------------------------------------------------------------- */

describe('growth edge cases', () => {
  it('negative growth compounds down', () => {
    const f = forecast(
      model({ forecastMonths: 6, revenueStreams: [stream({ unitPriceMinor: 100, monthlyUnits: 100, monthlyGrowthPct: -50 })] }),
      'expected',
    );
    // 100, 50, 25, 12.5, 6.25, 3.125 → 3.13
    expect(unitsOf(f)).toEqual([100, 50, 25, 12.5, 6.25, 3.13]);
    expect(monthAt(f, 6).revenueMinor).toBe(313); // 3.13 × 100
  });

  it('−100% growth sells only in month 1', () => {
    const f = forecast(
      model({ forecastMonths: 3, revenueStreams: [stream({ unitPriceMinor: 100, monthlyUnits: 40, monthlyGrowthPct: -100 })] }),
      'expected',
    );
    expect(unitsOf(f)).toEqual([40, 0, 0]);
    expect(f.totalRevenueMinor).toBe(4_000);
  });

  it('sums units across streams', () => {
    const f = forecast(
      model({
        forecastMonths: 1,
        revenueStreams: [stream({ monthlyUnits: 1.25 }), stream({ monthlyUnits: 2.5 })],
      }),
      'expected',
    );
    expect(monthAt(f, 1).units).toBe(3.75);
  });
});

describe('cash, runway and payback', () => {
  it('no revenue streams: burns fixed costs; cash-out and runway', () => {
    // capital 1,000, fixed 300 → balances 700, 400, 100, −200
    const inputs = model({
      startingCapitalMinor: 1_000,
      recurringExpenses: [{ label: 'Rent', monthlyAmountMinor: 300 }],
      forecastMonths: 4,
    });
    const f = forecast(inputs, 'expected');
    expect(f.months.map((m) => m.cashBalanceMinor)).toEqual([700, 400, 100, -200]);
    expect(f).toMatchObject({
      totalRevenueMinor: 0,
      totalNetMinor: -1_200,
      lowestCashMinor: -200,
      lowestCashMonth: 4,
      firstProfitableMonth: null,
      cashOutMonth: 4,
      breakEvenMonth: null,
    });
    expect(runwayMonths(inputs)).toBe(3); // 3 full months funded; cash runs out during month 4

    // Within a 3-month horizon the cash never drops below 0.
    expect(runwayMonths({ ...inputs, forecastMonths: 3 })).toBeNull();
    expect(forecast({ ...inputs, forecastMonths: 3 }, 'expected').cashOutMonth).toBeNull();
  });

  it('opening balance already negative → cash-out month 0, runway 0, lowest at month 0', () => {
    const inputs = model({ startingCapitalMinor: 100, startupCosts: [{ label: 'Fit-out', amountMinor: 250 }], forecastMonths: 2 });
    const f = forecast(inputs, 'expected');
    expect(f).toMatchObject({ openingCashMinor: -150, cashOutMonth: 0, lowestCashMinor: -150, lowestCashMonth: 0 });
    expect(runwayMonths(inputs)).toBe(0);
  });

  it('a balance of exactly 0 is not a cash-out; lowest-cash ties keep the earliest month', () => {
    const f = forecast(model({ forecastMonths: 3 }), 'expected');
    expect(f).toMatchObject({ openingCashMinor: 0, endingCashMinor: 0, lowestCashMinor: 0, lowestCashMonth: 0, cashOutMonth: null });
  });

  it('payback month: first month cumulative net ≥ startup costs', () => {
    // capital 1,000 − startup 1,000 = opening 0; net = 1 × 1,000 − 500 = 500/month
    // cumulative net: 500 (< 1,000), 1,000 (≥ 1,000) → month 2
    const f = forecast(
      model({
        startingCapitalMinor: 1_000,
        startupCosts: [{ label: 'Kit', amountMinor: 1_000 }],
        recurringExpenses: [{ label: 'Rent', monthlyAmountMinor: 500 }],
        revenueStreams: [stream({ unitPriceMinor: 1_000, monthlyUnits: 1 })],
        forecastMonths: 3,
      }),
      'expected',
    );
    expect(f.months.map((m) => m.cashBalanceMinor)).toEqual([500, 1_000, 1_500]);
    expect(f).toMatchObject({ breakEvenMonth: 2, firstProfitableMonth: 1, lowestCashMonth: 0, cashOutMonth: null });
  });

  it('zero price: revenue 0, variable costs still incurred', () => {
    const inputs = model({
      forecastMonths: 1,
      revenueStreams: [stream({ unitPriceMinor: 0, unitVariableCostMinor: 100, monthlyUnits: 10 })],
    });
    expect(table(forecast(inputs, 'expected'))).toEqual([[10, 0, 1_000, -1_000, 0, -1_000, -1_000]]);
    expect(breakEven(inputs)).toEqual({
      contributionMarginRatio: null,
      monthlyRevenueNeededMinor: null,
      unitsNeeded: null,
      reachableInForecast: false,
    });
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Break-even                                                                                     */
/* ---------------------------------------------------------------------------------------------- */

describe('breakEven', () => {
  it('single stream (expected): fixed / CMR and whole units needed', () => {
    // CMR = (2,000 − 800) / 2,000 = 0.6; 450,000 / 0.6 = 750,000; 450,000 / 1,200 = 375 units
    expect(breakEven(cafe())).toEqual({
      contributionMarginRatio: 0.6,
      monthlyRevenueNeededMinor: 750_000,
      unitsNeeded: 375,
      reachableInForecast: true, // month 4: net 29,160 ≥ 0
    });
  });

  it('single stream (conservative): adjusted unit cost and fixed costs, rounded up', () => {
    // unit cost 880, fixed 495,000; CMR = 1,120 / 2,000 = 0.56
    // revenue = ceil(495,000 × 2,000 / 1,120) = ceil(883,928.57…) = 883,929
    // units = ceil(495,000 / 1,120) = ceil(441.96…) = 442
    expect(breakEven(cafe(), 'conservative')).toEqual({
      contributionMarginRatio: 0.56,
      monthlyRevenueNeededMinor: 883_929,
      unitsNeeded: 442,
      reachableInForecast: false, // conservative never reaches net ≥ 0 within 6 months
    });
  });

  it('multiple streams: weighted by month-1 revenue mix, no unitsNeeded', () => {
    const inputs = model({
      recurringExpenses: [{ label: 'Rent', monthlyAmountMinor: 100_000 }],
      revenueStreams: [
        stream({ unitPriceMinor: 10_000, unitVariableCostMinor: 4_000, monthlyUnits: 10 }), // R 100,000 V 40,000
        stream({ unitPriceMinor: 5_000, unitVariableCostMinor: 4_000, monthlyUnits: 20 }), // R 100,000 V 80,000
      ],
      forecastMonths: 3,
    });
    // CMR = (200,000 − 120,000) / 200,000 = 0.4; 100,000 / 0.4 = 250,000
    expect(breakEven(inputs)).toEqual({
      contributionMarginRatio: 0.4,
      monthlyRevenueNeededMinor: 250_000,
      unitsNeeded: null,
      reachableInForecast: false, // net = 80,000 − 100,000 = −20,000 every month
    });
    // Conservative: unit costs 4,400; units 7 and 14 → R = 70,000 + 70,000 = 140,000;
    // V = 30,800 + 61,600 = 92,400; CMR = 47,600 / 140,000 = 0.34; fixed 110,000
    // revenue = ceil(110,000 × 140,000 / 47,600) = ceil(323,529.41…) = 323,530
    expect(breakEven(inputs, 'conservative')).toMatchObject({ contributionMarginRatio: 0.34, monthlyRevenueNeededMinor: 323_530 });
  });

  it('CMR is rounded to 4 decimals', () => {
    // (3,000 − 1,000) / 3,000 = 0.6666… → 0.6667; revenue = 10,000 × 3,000 / 2,000 = 15,000; units = 5
    const inputs = model({
      recurringExpenses: [{ label: 'x', monthlyAmountMinor: 10_000 }],
      revenueStreams: [stream({ unitPriceMinor: 3_000, unitVariableCostMinor: 1_000, monthlyUnits: 1 })],
    });
    expect(breakEven(inputs)).toMatchObject({ contributionMarginRatio: 0.6667, monthlyRevenueNeededMinor: 15_000, unitsNeeded: 5 });
  });

  it('negative contribution margin → nothing is needed-able', () => {
    const inputs = model({
      recurringExpenses: [{ label: 'x', monthlyAmountMinor: 1_000 }],
      revenueStreams: [stream({ unitPriceMinor: 1_000, unitVariableCostMinor: 1_500, monthlyUnits: 10 })],
    });
    expect(breakEven(inputs)).toEqual({
      contributionMarginRatio: -0.5, // (1,000 − 1,500) / 1,000
      monthlyRevenueNeededMinor: null,
      unitsNeeded: null,
      reachableInForecast: false,
    });
  });

  it('no fixed costs → break-even at 0', () => {
    const inputs = model({ revenueStreams: [stream({ unitPriceMinor: 1_000, unitVariableCostMinor: 400, monthlyUnits: 1 })] });
    expect(breakEven(inputs)).toEqual({
      contributionMarginRatio: 0.6,
      monthlyRevenueNeededMinor: 0,
      unitsNeeded: 0,
      reachableInForecast: true,
    });
  });

  it('single stream with no month-1 volume still has unit-economics break-even', () => {
    const inputs = cafe();
    inputs.revenueStreams = [stream({ unitPriceMinor: 2_000, unitVariableCostMinor: 800, monthlyUnits: 0 })];
    expect(breakEven(inputs)).toEqual({
      contributionMarginRatio: 0.6,
      monthlyRevenueNeededMinor: 750_000,
      unitsNeeded: 375,
      reachableInForecast: false, // there is never any revenue
    });
  });

  it('no revenue streams, or several streams without month-1 revenue → null', () => {
    const empty = { contributionMarginRatio: null, monthlyRevenueNeededMinor: null, unitsNeeded: null, reachableInForecast: false };
    expect(breakEven(model({ recurringExpenses: [{ label: 'x', monthlyAmountMinor: 1 }] }))).toEqual(empty);
    expect(
      breakEven(
        model({
          revenueStreams: [stream({ unitPriceMinor: 1_000, monthlyUnits: 0 }), stream({ unitPriceMinor: 500, monthlyUnits: 0 })],
        }),
      ),
    ).toEqual(empty);
  });

  it('reachableInForecast follows the forecast, not the month-1 mix', () => {
    // Month 1: A loses 500/unit (10 units), B earns 1,000 (1 unit): R 11,000, V 15,000 → CMR −0.3636, net −4,000
    // Month 2: A has −100% growth → 0 units; B doubles → R 2,000, V 0, net 2,000 ≥ 0
    const inputs = model({
      forecastMonths: 2,
      revenueStreams: [
        stream({ unitPriceMinor: 1_000, unitVariableCostMinor: 1_500, monthlyUnits: 10, monthlyGrowthPct: -100 }),
        stream({ unitPriceMinor: 1_000, monthlyUnits: 1, monthlyGrowthPct: 100 }),
      ],
    });
    expect(breakEven(inputs)).toEqual({
      contributionMarginRatio: -0.3636,
      monthlyRevenueNeededMinor: null,
      unitsNeeded: null,
      reachableInForecast: true,
    });
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Summary                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

describe('summarize', () => {
  it('collects the headline numbers for a scenario', () => {
    const inputs = cafe();
    expect(summarize(inputs)).toEqual({
      scenario: 'expected',
      startupCostsMinor: 2_500_000,
      monthlyFixedCostsMinor: 450_000,
      month1RevenueMinor: 600_000,
      month1NetMinor: -90_000,
      breakEven: breakEven(inputs, 'expected'),
      forecast: forecast(inputs, 'expected'),
    });
    expect(summarize(inputs, 'conservative')).toMatchObject({
      scenario: 'conservative',
      monthlyFixedCostsMinor: 495_000,
      month1RevenueMinor: 420_000,
      month1NetMinor: -259_800,
    });
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Validation and invalid input                                                                   */
/* ---------------------------------------------------------------------------------------------- */

describe('validateInputs', () => {
  it('accepts valid input, including bounds', () => {
    expect(validateInputs(cafe())).toEqual([]);
    const bounds = cafe();
    bounds.startingCapitalMinor = FINANCE_LIMITS.maxAmountMinor;
    bounds.forecastMonths = 36;
    bounds.revenueStreams = [
      stream({ monthlyUnits: 12.5, monthlyGrowthPct: -100 }),
      stream({ monthlyUnits: FINANCE_LIMITS.maxMonthlyUnits, monthlyGrowthPct: 0 }),
    ];
    expect(validateInputs(bounds)).toEqual([]);
    expect(validateInputs({ ...cafe(), forecastMonths: 1 })).toEqual([]);
  });

  it('reports money problems with field paths', () => {
    const inputs = cafe();
    inputs.startingCapitalMinor = -1;
    inputs.startupCosts = [
      { label: 'a', amountMinor: 1 },
      { label: 'b', amountMinor: 10.5 },
    ];
    inputs.recurringExpenses = [{ label: 'c', monthlyAmountMinor: Number.NaN }];
    inputs.revenueStreams = [
      stream({ unitPriceMinor: FINANCE_LIMITS.maxAmountMinor + 1, unitVariableCostMinor: Number.POSITIVE_INFINITY }),
    ];
    expect(validateInputs(inputs)).toEqual([
      { field: 'startingCapitalMinor', message: 'negative' },
      { field: 'startupCosts.1.amountMinor', message: 'not_integer' },
      { field: 'recurringExpenses.0.monthlyAmountMinor', message: 'out_of_range' },
      { field: 'revenueStreams.0.unitPriceMinor', message: 'out_of_range' },
      { field: 'revenueStreams.0.unitVariableCostMinor', message: 'out_of_range' },
    ]);
  });

  it('reports units and growth problems', () => {
    const inputs = cafe();
    inputs.revenueStreams = [
      stream({ monthlyUnits: -2, monthlyGrowthPct: -100.01 }),
      stream({ monthlyUnits: 10_000_000_000, monthlyGrowthPct: 1_000.5 }),
      stream({ monthlyUnits: Number.NaN, monthlyGrowthPct: Number.NaN }),
    ];
    expect(validateInputs(inputs)).toEqual([
      { field: 'revenueStreams.0.monthlyUnits', message: 'negative' },
      { field: 'revenueStreams.0.monthlyGrowthPct', message: 'out_of_range' },
      { field: 'revenueStreams.1.monthlyUnits', message: 'out_of_range' },
      { field: 'revenueStreams.1.monthlyGrowthPct', message: 'out_of_range' },
      { field: 'revenueStreams.2.monthlyUnits', message: 'out_of_range' },
      { field: 'revenueStreams.2.monthlyGrowthPct', message: 'out_of_range' },
    ]);
  });

  it('reports forecastMonths outside 1…36 or fractional', () => {
    const issue = (forecastMonths: number) => validateInputs({ ...cafe(), forecastMonths });
    expect(issue(0)).toEqual([{ field: 'forecastMonths', message: 'out_of_range' }]);
    expect(issue(37)).toEqual([{ field: 'forecastMonths', message: 'out_of_range' }]);
    expect(issue(2.5)).toEqual([{ field: 'forecastMonths', message: 'not_integer' }]);
    expect(issue(-1)).toEqual([{ field: 'forecastMonths', message: 'negative' }]);
  });

  it('reports scenario problems; expected must be exactly 100/100/100', () => {
    const inputs = cafe();
    inputs.scenarios = scenarios();
    inputs.scenarios.conservative.volumePct = -1;
    inputs.scenarios.conservative.costPct = 1_001;
    inputs.scenarios.expected.costPct = 105;
    inputs.scenarios.optimistic.pricePct = 102.5; // DB columns are integers
    expect(validateInputs(inputs)).toEqual([
      { field: 'scenarios.conservative.volumePct', message: 'negative' },
      { field: 'scenarios.conservative.costPct', message: 'out_of_range' },
      { field: 'scenarios.expected.costPct', message: 'out_of_range' },
      { field: 'scenarios.optimistic.pricePct', message: 'not_integer' },
    ]);

    const missing = { ...cafe(), scenarios: { conservative: scenarios().conservative, expected: scenarios().expected } };
    expect(validateInputs(missing as unknown as FinanceInputs)).toEqual([{ field: 'scenarios.optimistic', message: 'out_of_range' }]);
  });

  it('reports `forecast` when individually valid inputs exceed the safe numeric range', () => {
    const huge = model({
      startingCapitalMinor: FINANCE_LIMITS.maxAmountMinor,
      revenueStreams: [
        stream({
          unitPriceMinor: FINANCE_LIMITS.maxAmountMinor,
          monthlyUnits: FINANCE_LIMITS.maxMonthlyUnits,
          monthlyGrowthPct: FINANCE_LIMITS.maxGrowthPct,
        }),
      ],
      forecastMonths: 36,
    });
    expect(validateInputs(huge)).toEqual([{ field: 'forecast', message: 'out_of_range' }]);
  });
});

describe('invalid input is projected onto the valid domain (never throws, never NaN)', () => {
  const base = cafe();
  const f = (inputs: FinanceInputs, s: ScenarioKey = 'expected') => forecast(inputs, s);

  it('NaN money → 0, values above the limit → limit, negatives → 0', () => {
    expect(f({ ...base, startingCapitalMinor: Number.NaN })).toEqual(f({ ...base, startingCapitalMinor: 0 }));
    expect(f({ ...base, startingCapitalMinor: -5 })).toEqual(f({ ...base, startingCapitalMinor: 0 }));
    const priced = (unitPriceMinor: number) => ({ ...base, revenueStreams: [stream({ unitPriceMinor, monthlyUnits: 1 })] });
    expect(f(priced(1e14))).toEqual(f(priced(FINANCE_LIMITS.maxAmountMinor)));
    expect(f(priced(Number.POSITIVE_INFINITY))).toEqual(f(priced(FINANCE_LIMITS.maxAmountMinor)));
    expect(f(priced(10.4))).toEqual(f(priced(10)));
  });

  it('forecastMonths is clamped to 1…36 and rounded', () => {
    expect(f({ ...base, forecastMonths: 0 }).months).toHaveLength(1);
    expect(f({ ...base, forecastMonths: 37 }).months).toHaveLength(36);
    expect(f({ ...base, forecastMonths: 2.5 }).months).toHaveLength(3);
    expect(f({ ...base, forecastMonths: Number.NaN }).months).toHaveLength(1);
  });

  it('growth below −100% is treated as −100%; negative units as 0', () => {
    const grow = (monthlyGrowthPct: number) => ({
      ...base,
      revenueStreams: [stream({ unitPriceMinor: 1, monthlyUnits: 10, monthlyGrowthPct })],
    });
    expect(f(grow(-150))).toEqual(f(grow(-100)));
    expect(unitsOf(f({ ...base, revenueStreams: [stream({ monthlyUnits: -3 })] }))).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('NaN scenario percentage → 100 (unchanged)', () => {
    const s = scenarios();
    s.conservative = { volumePct: Number.NaN, pricePct: 100, costPct: 100 };
    const inputs = { ...base, scenarios: s };
    expect(unitsOf(f(inputs, 'conservative'))).toEqual(unitsOf(f(inputs, 'expected')));
  });

  it('missing arrays are treated as empty', () => {
    const broken = { ...base, startupCosts: undefined, recurringExpenses: null, revenueStreams: undefined };
    const out = f(broken as unknown as FinanceInputs);
    expect(out.openingCashMinor).toBe(5_000_000);
    expect(out.totalRevenueMinor).toBe(0);
    expect(out.totalNetMinor).toBe(0);
  });
});

describe('huge numbers', () => {
  it('large but representable values stay exact', () => {
    // 1 unit × 10,000,000,000,000 per month × 36 months = 360,000,000,000,000 (< 2^53)
    const out = forecast(
      model({
        revenueStreams: [stream({ unitPriceMinor: FINANCE_LIMITS.maxAmountMinor, monthlyUnits: 1 })],
        forecastMonths: 36,
      }),
      'expected',
    );
    expect(out.totalRevenueMinor).toBe(360_000_000_000_000);
    expect(out.endingCashMinor).toBe(360_000_000_000_000);
    expect(out.clamped).toBe(false);
  });

  it('values beyond Number.MAX_SAFE_INTEGER are clamped and flagged', () => {
    const out = forecast(
      model({
        startingCapitalMinor: FINANCE_LIMITS.maxAmountMinor,
        revenueStreams: [
          stream({
            unitPriceMinor: FINANCE_LIMITS.maxAmountMinor,
            monthlyUnits: FINANCE_LIMITS.maxMonthlyUnits,
            monthlyGrowthPct: FINANCE_LIMITS.maxGrowthPct,
          }),
        ],
        forecastMonths: 36,
      }),
      'optimistic',
    );
    expect(out.clamped).toBe(true);
    for (const m of out.months) {
      for (const key of MONEY_FIELDS) expectSafeInteger(m[key]);
      expect(Number.isFinite(m.units)).toBe(true);
    }
    for (const n of [out.openingCashMinor, out.totalRevenueMinor, out.totalNetMinor, out.endingCashMinor, out.lowestCashMinor]) {
      expectSafeInteger(n);
    }
    expect(out.endingCashMinor).toBe(Number.MAX_SAFE_INTEGER);
  });
});

/* ---------------------------------------------------------------------------------------------- */
/* Properties (deterministic pseudo-random inputs)                                                */
/* ---------------------------------------------------------------------------------------------- */

describe('properties', () => {
  const rand = prng(20261105);
  const cases = Array.from({ length: 150 }, () => randomInputs(rand));

  it('generated inputs are valid', () => {
    for (const inputs of cases) expect(validateInputs(inputs)).toEqual([]);
  });

  it('with extreme growth, validateInputs reports `forecast` exactly when a scenario is clamped', () => {
    const wild = prng(99);
    let clampedCases = 0;
    for (let i = 0; i < 100; i++) {
      const inputs = randomInputs(wild, FINANCE_LIMITS.maxGrowthPct);
      const all = compareScenarios(inputs);
      const clamped = SCENARIO_KEYS.some((k) => all[k].clamped);
      if (clamped) clampedCases++;
      expect(validateInputs(inputs)).toEqual(clamped ? [{ field: 'forecast', message: 'out_of_range' }] : []);
      for (const key of SCENARIO_KEYS) {
        for (const m of all[key].months) for (const field of MONEY_FIELDS) expectSafeInteger(m[field]);
      }
    }
    expect(clampedCases).toBeGreaterThan(0); // the generator really exercises the overflow path
  });

  it('accounting identities hold in every month and scenario', () => {
    for (const inputs of cases) {
      for (const key of SCENARIO_KEYS) {
        const f = forecast(inputs, key);
        const fixed = monthlyFixedCostsMinor(inputs, key);
        expect(f.clamped).toBe(false);
        expect(f.months).toHaveLength(inputs.forecastMonths);
        expect(f.openingCashMinor).toBe(inputs.startingCapitalMinor - totalStartupCostsMinor(inputs));

        let cash = f.openingCashMinor;
        let cumulative = 0;
        let revenue = 0;
        let lowest = cash;
        let lowestMonth = 0;
        let firstProfitable: number | null = null;
        let cashOut: number | null = cash < 0 ? 0 : null;
        let payback: number | null = null;
        for (const m of f.months) {
          for (const field of MONEY_FIELDS) expectSafeInteger(m[field]);
          expectTwoDecimals(m.units);
          expect(m.grossProfitMinor).toBe(m.revenueMinor - m.variableCostsMinor);
          expect(m.fixedCostsMinor).toBe(fixed);
          expect(m.netMinor).toBe(m.grossProfitMinor - m.fixedCostsMinor);
          cash += m.netMinor;
          cumulative += m.netMinor;
          revenue += m.revenueMinor;
          expect(m.cashBalanceMinor).toBe(cash);
          if (cash < lowest) {
            lowest = cash;
            lowestMonth = m.month;
          }
          if (firstProfitable === null && m.netMinor > 0) firstProfitable = m.month;
          if (cashOut === null && cash < 0) cashOut = m.month;
          if (payback === null && cumulative >= totalStartupCostsMinor(inputs)) payback = m.month;
        }
        // opening + Σ net = ending
        expect(f.openingCashMinor + f.totalNetMinor).toBe(f.endingCashMinor);
        expect(f.totalNetMinor).toBe(cumulative);
        expect(f.totalRevenueMinor).toBe(revenue);
        expect(f.lowestCashMinor).toBe(lowest);
        expect(f.lowestCashMonth).toBe(lowestMonth);
        expect(f.firstProfitableMonth).toBe(firstProfitable);
        expect(f.cashOutMonth).toBe(cashOut);
        expect(f.breakEvenMonth).toBe(payback);
        expect(runwayMonths(inputs, key)).toBe(cashOut === null ? null : Math.max(0, cashOut - 1));
      }
    }
  });

  it('scenario ordering with price at 100%: units and revenue conservative ≤ expected ≤ optimistic; fixed costs reversed', () => {
    for (const inputs of cases) {
      const { conservative, expected, optimistic } = compareScenarios(inputs);
      expected.months.forEach((e, i) => {
        const c = conservative.months[i];
        const o = optimistic.months[i];
        if (!c || !o) throw new Error('month count mismatch');
        expect(c.units).toBeLessThanOrEqual(e.units);
        expect(e.units).toBeLessThanOrEqual(o.units);
        expect(c.revenueMinor).toBeLessThanOrEqual(e.revenueMinor);
        expect(e.revenueMinor).toBeLessThanOrEqual(o.revenueMinor);
        expect(c.fixedCostsMinor).toBeGreaterThanOrEqual(e.fixedCostsMinor);
        expect(e.fixedCostsMinor).toBeGreaterThanOrEqual(o.fixedCostsMinor);
      });
      expect(conservative.totalRevenueMinor).toBeLessThanOrEqual(expected.totalRevenueMinor);
      expect(expected.totalRevenueMinor).toBeLessThanOrEqual(optimistic.totalRevenueMinor);
    }
  });

  it('break-even thresholds are the smallest sufficient values (single stream)', () => {
    for (const inputs of cases) {
      const only = inputs.revenueStreams.length === 1 ? inputs.revenueStreams[0] : undefined;
      if (!only) continue;
      const be = breakEven(inputs);
      const fixed = monthlyFixedCostsMinor(inputs);
      const p = only.unitPriceMinor;
      const contribution = p - only.unitVariableCostMinor;
      if (p === 0 || contribution <= 0) {
        expect(be.monthlyRevenueNeededMinor).toBeNull();
        expect(be.unitsNeeded).toBeNull();
        continue;
      }
      const revenue = be.monthlyRevenueNeededMinor as number;
      const units = be.unitsNeeded as number;
      // revenue × CMR ≥ fixed ⟺ revenue × contribution ≥ fixed × price (all < 2^53 here)
      expect(revenue * contribution).toBeGreaterThanOrEqual(fixed * p);
      if (revenue > 0) expect((revenue - 1) * contribution).toBeLessThan(fixed * p);
      expect(units * contribution).toBeGreaterThanOrEqual(fixed);
      if (units > 0) expect((units - 1) * contribution).toBeLessThan(fixed);
    }
  });

  it('summary is consistent with forecast and breakEven', () => {
    for (const inputs of cases.slice(0, 40)) {
      for (const key of SCENARIO_KEYS) {
        const s = summarize(inputs, key);
        const f = forecast(inputs, key);
        expect(s.forecast).toEqual(f);
        expect(s.breakEven).toEqual(breakEven(inputs, key));
        expect(s.month1RevenueMinor).toBe(monthAt(f, 1).revenueMinor);
        expect(s.month1NetMinor).toBe(monthAt(f, 1).netMinor);
        expect(s.monthlyFixedCostsMinor).toBe(monthlyFixedCostsMinor(inputs, key));
        expect(s.startupCostsMinor).toBe(totalStartupCostsMinor(inputs));
      }
    }
  });

  it('is deterministic and never mutates its input', () => {
    for (const inputs of cases.slice(0, 40)) {
      const snapshot = JSON.stringify(inputs);
      const frozen = deepFreeze(JSON.parse(snapshot) as FinanceInputs);
      const first = { all: compareScenarios(frozen), summary: summarize(frozen), issues: validateInputs(frozen) };
      const second = { all: compareScenarios(frozen), summary: summarize(frozen), issues: validateInputs(frozen) };
      expect(second).toEqual(first);
      expect(JSON.stringify(frozen)).toBe(snapshot);
    }
  });
});
