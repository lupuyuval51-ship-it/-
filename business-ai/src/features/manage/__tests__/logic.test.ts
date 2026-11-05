import { forecast as runForecast, DEFAULT_SCENARIOS, type FinanceInputs } from '@domain/finance';
import {
  addMonths,
  filterByKind,
  forecastMonthIndex,
  goalProgress,
  groupByMonth,
  monthKey,
  monthOverMonth,
  monthlyTotals,
  monthsBetween,
  planStartDate,
  planVsActual,
  previousMonthKey,
  sumTransactions,
  totalsForMonth,
  type TransactionLike,
} from '../logic';

const tx = (kind: string, amount: number, date: string, extra: Partial<TransactionLike> = {}): TransactionLike => ({
  kind,
  amount_minor: amount,
  occurred_on: date,
  ...extra,
});

const TXS: TransactionLike[] = [
  tx('income', 100_00, '2026-11-01', { id: 'a' }),
  tx('income', 250_50, '2026-11-15', { id: 'b' }),
  tx('expense', 80_00, '2026-11-03', { id: 'c' }),
  tx('income', 200_00, '2026-10-30', { id: 'd' }),
  tx('expense', 300_00, '2026-10-02', { id: 'e' }),
  tx('expense', 10_00, '2025-12-31', { id: 'f' }),
];

describe('months', () => {
  it('parses month keys', () => {
    expect(monthKey('2026-11-05')).toBe('2026-11');
    expect(monthKey('2026-11-05T10:00:00Z')).toBe('2026-11');
    expect(monthKey('2026-13-01')).toBeNull();
    expect(monthKey('')).toBeNull();
    expect(monthKey(null)).toBeNull();
  });

  it('shifts across year boundaries', () => {
    expect(previousMonthKey('2026-01')).toBe('2025-12');
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-11', -23)).toBe('2024-12');
    expect(addMonths('bad', 1)).toBe('bad');
    expect(monthsBetween('2026-11', '2027-01')).toBe(2);
    expect(monthsBetween('2027-01', '2026-11')).toBe(-2);
  });
});

describe('totals', () => {
  it('sums one month in minor units', () => {
    expect(totalsForMonth(TXS, '2026-11')).toEqual({ month: '2026-11', incomeMinor: 350_50, expenseMinor: 80_00, netMinor: 270_50, count: 3 });
    expect(totalsForMonth(TXS, '2026-09')).toEqual({ month: '2026-09', incomeMinor: 0, expenseMinor: 0, netMinor: 0, count: 0 });
  });

  it('ignores unknown kinds and non-finite amounts', () => {
    const t = sumTransactions([tx('refund', 5, '2026-11-01'), tx('income', Number.NaN, '2026-11-01'), tx('income', 7, '2026-11-01')]);
    expect(t).toMatchObject({ incomeMinor: 7, expenseMinor: 0, count: 2 });
  });

  it('groups per month, newest first', () => {
    expect(monthlyTotals(TXS).map((m) => [m.month, m.netMinor])).toEqual([
      ['2026-11', 270_50],
      ['2026-10', -100_00],
      ['2025-12', -10_00],
    ]);
  });

  it('groups items by month with newest items first', () => {
    const groups = groupByMonth(TXS);
    expect(groups.map((g) => g.month)).toEqual(['2026-11', '2026-10', '2025-12']);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(groups[0]?.totals.incomeMinor).toBe(350_50);
  });

  it('breaks same-day ties by created_at then id', () => {
    const items = [
      tx('income', 1, '2026-11-01', { id: 'x', created_at: '2026-11-01T08:00:00Z' }),
      tx('income', 1, '2026-11-01', { id: 'y', created_at: '2026-11-01T09:00:00Z' }),
      tx('income', 1, '2026-11-01', { id: 'z', created_at: '2026-11-01T09:00:00Z' }),
    ];
    expect(groupByMonth(items)[0]?.items.map((i) => i.id)).toEqual(['z', 'y', 'x']);
  });

  it('filters by kind', () => {
    expect(filterByKind(TXS, 'income').map((t) => t.id)).toEqual(['a', 'b', 'd']);
    expect(filterByKind(TXS, 'expense')).toHaveLength(3);
    expect(filterByKind(TXS, 'all')).toHaveLength(6);
  });
});

describe('month over month', () => {
  it('compares with the previous calendar month', () => {
    const mom = monthOverMonth(TXS, '2026-11');
    expect(mom.previous.month).toBe('2026-10');
    expect(mom.income).toEqual({ deltaMinor: 150_50, changePct: 75.3 });
    expect(mom.expenses).toEqual({ deltaMinor: -220_00, changePct: -73.3 });
    // previous net −100 → current +270.50: change relative to |previous|
    expect(mom.net).toEqual({ deltaMinor: 370_50, changePct: 370.5 });
  });

  it('has no percentage when the previous month is zero', () => {
    const mom = monthOverMonth(TXS, '2026-12');
    expect(mom.current.count).toBe(0);
    expect(mom.income).toEqual({ deltaMinor: -350_50, changePct: -100 });
    const fresh = monthOverMonth([tx('income', 5_00, '2026-11-02')], '2026-11');
    expect(fresh.income).toEqual({ deltaMinor: 5_00, changePct: null });
  });
});

describe('goal progress', () => {
  it('revenue goals use all recorded income (minor units)', () => {
    const p = goalProgress({ metric: 'revenue', target_value: 1000_00, current_value: 999_999 }, TXS);
    expect(p).toEqual({ current: 550_50, target: 1000_00, ratio: 0.5505, percent: 55, reached: false, source: 'transactions', isMoney: true });
  });

  it('profit goals use income minus expenses and clamp negatives to 0%', () => {
    const p = goalProgress({ metric: 'profit', target_value: 500_00, current_value: 0 }, TXS);
    expect(p.current).toBe(550_50 - 390_00);
    expect(p.percent).toBe(32);
    const loss = goalProgress({ metric: 'profit', target_value: 100, current_value: 0 }, [tx('expense', 50, '2026-11-01')]);
    expect(loss).toMatchObject({ current: -50, ratio: 0, percent: 0, reached: false });
  });

  it('customers / custom goals use the manual current value', () => {
    expect(goalProgress({ metric: 'customers', target_value: 40, current_value: 10 }, TXS)).toMatchObject({
      current: 10,
      percent: 25,
      source: 'manual',
      isMoney: false,
    });
    expect(goalProgress({ metric: 'custom', target_value: 3, current_value: 5 }, [])).toMatchObject({ ratio: 1, percent: 100, reached: true });
  });

  it('never shows 100% before the target is reached', () => {
    expect(goalProgress({ metric: 'customers', target_value: 1000, current_value: 999 }, []).percent).toBe(99);
  });

  it('handles a zero target', () => {
    expect(goalProgress({ metric: 'custom', target_value: 0, current_value: 0 }, [])).toMatchObject({ reached: true, percent: 100 });
  });
});

describe('plan vs actual', () => {
  const inputs: FinanceInputs = {
    startingCapitalMinor: 10_000_00,
    startupCosts: [{ label: 'Setup', amountMinor: 2_000_00 }],
    recurringExpenses: [{ label: 'Rent', monthlyAmountMinor: 1_000_00 }],
    revenueStreams: [{ label: 'Coffee', unitPriceMinor: 12_00, unitVariableCostMinor: 4_00, monthlyUnits: 200, monthlyGrowthPct: 10 }],
    forecastMonths: 3,
    scenarios: { ...DEFAULT_SCENARIOS },
  };
  const expected = runForecast(inputs, 'expected');

  it('picks the plan start: roadmap first, then plan creation', () => {
    expect(planStartDate({ roadmapStartsOn: '2026-10-10', planCreatedOn: '2026-09-01' })).toBe('2026-10-10');
    expect(planStartDate({ roadmapStartsOn: null, planCreatedOn: '2026-09-01' })).toBe('2026-09-01');
    expect(planStartDate({})).toBeNull();
  });

  it('maps calendar months to 1-based forecast months', () => {
    expect(forecastMonthIndex('2026-10-31', '2026-10')).toBe(1);
    expect(forecastMonthIndex('2026-10-31', '2026-11')).toBe(2);
    expect(forecastMonthIndex('2026-10-31', '2026-09')).toBe(0);
    expect(forecastMonthIndex('bad', '2026-09')).toBeNull();
  });

  it('compares the actual month with the matching expected forecast month', () => {
    const actual = totalsForMonth(TXS, '2026-11');
    const r = planVsActual(expected, '2026-10-01', '2026-11', actual);
    const month2 = expected.months[1]!;
    expect(r.status).toBe('compared');
    expect(r.monthIndex).toBe(2);
    expect(r.planned).toEqual({
      revenueMinor: month2.revenueMinor,
      costsMinor: month2.variableCostsMinor + month2.fixedCostsMinor,
      netMinor: month2.netMinor,
    });
    expect(r.planned!.revenueMinor - r.planned!.costsMinor).toBe(r.planned!.netMinor);
    expect(r.variance).toEqual({
      revenueMinor: 350_50 - month2.revenueMinor,
      costsMinor: 80_00 - (month2.variableCostsMinor + month2.fixedCostsMinor),
      netMinor: 270_50 - month2.netMinor,
    });
  });

  it('reports months outside the forecast', () => {
    const actual = totalsForMonth(TXS, '2026-11');
    expect(planVsActual(expected, '2026-06-01', '2026-11', actual)).toMatchObject({ status: 'beyond_horizon', monthIndex: 6, planned: null });
    expect(planVsActual(expected, '2026-12-01', '2026-11', actual)).toMatchObject({ status: 'before_start', planned: null });
    expect(planVsActual(expected, null, '2026-11', actual)).toMatchObject({ status: 'no_start', monthIndex: null });
    expect(planVsActual(undefined, '2026-11-01', '2026-11', actual)).toMatchObject({ status: 'beyond_horizon' });
  });
});
