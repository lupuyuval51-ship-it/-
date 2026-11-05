import { summarize, validateInputs, type FinanceInputs } from '@domain/finance';
import type { FinanceProposal } from '@domain/ai-api';
import {
  applyModelPatch,
  calendarMonthFor,
  draftToRow,
  findLine,
  formatDecimalInputText,
  formatMoneyInputText,
  forecastTotalCostsMinor,
  hashString,
  horizonFormSchema,
  inputsWithDraft,
  isFinanceEmpty,
  isLineKind,
  issueTarget,
  lineFormDefaults,
  lineFormSchema,
  lineIssueErrors,
  mapModelRow,
  mapRecurringExpenseRow,
  mapRevenueStreamRow,
  mapStartupCostRow,
  modelPatchToRow,
  monthCostsMinor,
  nextSortOrder,
  parseDecimalInput,
  parseFinanceProposal,
  parseForecastMonths,
  parseLineForm,
  parseMaxForecastMonths,
  parseScenarioForm,
  parseTargetMargin,
  pendingProposalItems,
  proposalCapitalMinor,
  proposalItemToDraft,
  proposalItems,
  reformatMoneyText,
  scenarioFormDefaults,
  scenarioFormSchema,
  toFinanceInputs,
  toNumber,
  validationMessageKey,
  type FinanceLines,
  type FinancialModelRow,
  type LineFormValues,
  type RecurringExpenseRow,
  type RevenueStreamRow,
  type StartupCostRow,
} from '../mapping';

const NOW = '2026-11-05T10:00:00Z';

function modelRow(overrides: Partial<FinancialModelRow> = {}): FinancialModelRow {
  return {
    business_id: 'b1',
    starting_capital_minor: 0,
    forecast_months: 12,
    conservative_volume_pct: 70,
    conservative_price_pct: 100,
    conservative_cost_pct: 110,
    optimistic_volume_pct: 130,
    optimistic_price_pct: 100,
    optimistic_cost_pct: 95,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function startupRow(overrides: Partial<StartupCostRow> = {}): StartupCostRow {
  return {
    id: 's1',
    business_id: 'b1',
    label: 'Equipment',
    amount_minor: 2_000_000,
    category: 'equipment',
    basis: 'user_provided',
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function expenseRow(overrides: Partial<RecurringExpenseRow> = {}): RecurringExpenseRow {
  return {
    id: 'e1',
    business_id: 'b1',
    label: 'Rent',
    monthly_amount_minor: 400_000,
    category: 'rent',
    basis: 'assumption',
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function revenueRow(overrides: Partial<RevenueStreamRow> = {}): RevenueStreamRow {
  return {
    id: 'r1',
    business_id: 'b1',
    label: 'Coffee',
    unit_price_minor: 2_000,
    unit_variable_cost_minor: 800,
    monthly_units: 300,
    monthly_growth_pct: 10,
    basis: 'ai_estimate',
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function emptyLines(): FinanceLines {
  return { startupCosts: [], recurringExpenses: [], revenueStreams: [] };
}

function formValues(overrides: Partial<LineFormValues> = {}): LineFormValues {
  return {
    label: 'Item',
    category: '',
    basis: 'user_provided',
    amount: '',
    unitPrice: '',
    unitCost: '',
    monthlyUnits: '',
    growthPct: '',
    ...overrides,
  };
}

/** PostgREST can return bigint / numeric columns as strings. */
function asStrings<T extends object>(row: T, keys: (keyof T)[]): T {
  const copy = { ...row } as Record<keyof T, unknown>;
  for (const k of keys) copy[k] = String(copy[k]);
  return copy as T;
}

describe('row mapping', () => {
  it('coerces numeric strings with Number() and never yields NaN', () => {
    expect(toNumber('12.50')).toBe(12.5);
    expect(toNumber(7)).toBe(7);
    expect(toNumber('abc')).toBe(0);
    expect(toNumber('', 5)).toBe(5);
    expect(toNumber(null, 3)).toBe(3);
    expect(toNumber(Number.NaN)).toBe(0);
  });

  it('maps lines from string-typed numeric columns', () => {
    const r = mapRevenueStreamRow(
      asStrings(revenueRow({ monthly_units: 12.25, monthly_growth_pct: -5.5 }), [
        'unit_price_minor',
        'unit_variable_cost_minor',
        'monthly_units',
        'monthly_growth_pct',
      ]),
    );
    expect(r).toEqual({
      kind: 'revenue',
      id: 'r1',
      label: 'Coffee',
      unitPriceMinor: 2000,
      unitVariableCostMinor: 800,
      monthlyUnits: 12.25,
      monthlyGrowthPct: -5.5,
      basis: 'ai_estimate',
      sortOrder: 0,
    });
    expect(mapStartupCostRow(asStrings(startupRow(), ['amount_minor'])).amountMinor).toBe(2_000_000);
    expect(mapRecurringExpenseRow(expenseRow()).monthlyAmountMinor).toBe(400_000);
  });

  it('falls back to user_provided for an unknown basis', () => {
    expect(mapStartupCostRow(startupRow({ basis: 'guess' })).basis).toBe('user_provided');
  });

  it('builds engine inputs whose summary matches the engine fixture', () => {
    const model = mapModelRow(asStrings(modelRow({ starting_capital_minor: 5_000_000, forecast_months: 6 }), ['starting_capital_minor']));
    const lines: FinanceLines = {
      startupCosts: [mapStartupCostRow(startupRow()), mapStartupCostRow(startupRow({ id: 's2', amount_minor: 500_000 }))],
      recurringExpenses: [mapRecurringExpenseRow(expenseRow()), mapRecurringExpenseRow(expenseRow({ id: 'e2', monthly_amount_minor: 50_000 }))],
      revenueStreams: [mapRevenueStreamRow(revenueRow())],
    };
    const inputs = toFinanceInputs(model, lines);
    expect(inputs.startingCapitalMinor).toBe(5_000_000);
    expect(inputs.forecastMonths).toBe(6);
    expect(inputs.scenarios.expected).toEqual({ volumePct: 100, pricePct: 100, costPct: 100 });
    expect(inputs.scenarios.conservative).toEqual({ volumePct: 70, pricePct: 100, costPct: 110 });
    expect(validateInputs(inputs)).toEqual([]);
    const s = summarize(inputs, 'expected');
    expect(s.startupCostsMinor).toBe(2_500_000);
    expect(s.monthlyFixedCostsMinor).toBe(450_000);
    expect(s.month1RevenueMinor).toBe(600_000); // 300 × 2,000
    expect(s.forecast.openingCashMinor).toBe(2_500_000);
  });

  it('detects an empty model', () => {
    expect(isFinanceEmpty(modelRow(), emptyLines())).toBe(true);
    expect(isFinanceEmpty(modelRow({ starting_capital_minor: 1 }), emptyLines())).toBe(false);
    expect(isFinanceEmpty(modelRow(), { ...emptyLines(), startupCosts: [mapStartupCostRow(startupRow())] })).toBe(false);
    expect(isFinanceEmpty(undefined, emptyLines())).toBe(true);
  });

  it('finds lines and computes the next sort order', () => {
    const lines = { ...emptyLines(), revenueStreams: [mapRevenueStreamRow(revenueRow({ sort_order: 4 }))] };
    expect(findLine(lines, 'revenue', 'r1')?.label).toBe('Coffee');
    expect(findLine(lines, 'startup', 'r1')).toBeUndefined();
    expect(nextSortOrder(lines.revenueStreams)).toBe(5);
    expect(nextSortOrder([])).toBe(0);
  });

  it('validates route kinds', () => {
    expect(isLineKind('startup')).toBe(true);
    expect(isLineKind('expense')).toBe(true);
    expect(isLineKind('revenue')).toBe(true);
    expect(isLineKind('other')).toBe(false);
    expect(isLineKind(undefined)).toBe(false);
  });
});

describe('text parsing', () => {
  it('parses quantities with decimal comma, percent sign and bidi marks', () => {
    expect(parseDecimalInput('12.5')).toBe(12.5);
    expect(parseDecimalInput('12,5')).toBe(12.5);
    expect(parseDecimalInput('1,200')).toBe(1200);
    expect(parseDecimalInput('⁨ 15% ⁩', { min: -100, max: 1000 })).toBe(15);
    expect(parseDecimalInput('٣٠')).toBe(30);
    expect(parseDecimalInput('-5', { min: -100, max: 1000 })).toBe(-5);
    expect(parseDecimalInput('-5')).toBeNull(); // min 0 by default
    expect(parseDecimalInput('1.234')).toBeNull(); // a lone dot is a decimal point: 3 decimals → invalid
    expect(parseDecimalInput('1,234.5')).toBe(1234.5);
    expect(parseDecimalInput('.5')).toBe(0.5);
    expect(parseDecimalInput('1.2.3')).toBeNull();
    expect(parseDecimalInput('12a')).toBeNull();
    expect(parseDecimalInput('1.2345')).toBeNull();
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('1001', { min: -100, max: 1000 })).toBeNull();
    expect(parseDecimalInput('2.5', { integer: true })).toBeNull();
    expect(parseDecimalInput('-0', { min: -100, max: 100 })).toBe(0);
  });

  it('parses forecast months and scenario percentages as integers in range', () => {
    expect(parseForecastMonths('12')).toBe(12);
    expect(parseForecastMonths('0')).toBeNull();
    expect(parseForecastMonths('37')).toBeNull();
    expect(parseForecastMonths('6.5')).toBeNull();
    expect(parseTargetMargin('60')).toBe(60);
    expect(parseTargetMargin('100')).toBeNull();
  });

  it('formats money for inputs with grouping and no isolates, and re-formats on blur', () => {
    expect(formatMoneyInputText(123_450, 'en')).toBe('1,234.50');
    expect(formatMoneyInputText(500_000, 'he')).toBe('5,000');
    expect(formatMoneyInputText(null, 'en')).toBe('');
    expect(reformatMoneyText('1234.5', 'ILS', 'en')).toBe('1,234.50');
    expect(reformatMoneyText('abc', 'ILS', 'en')).toBe('abc');
    expect(formatDecimalInputText(12.255)).toBe('12.26');
    expect(formatDecimalInputText(-0)).toBe('0');
  });
});

describe('line form', () => {
  it('round-trips a revenue stream through form defaults and parsing', () => {
    const line = mapRevenueStreamRow(revenueRow({ unit_price_minor: 123_450, monthly_units: 12.5 }));
    const values = lineFormDefaults(line, 'revenue', 'en');
    expect(values).toMatchObject({ label: 'Coffee', unitPrice: '1,234.50', unitCost: '8', monthlyUnits: '12.5', growthPct: '10', basis: 'ai_estimate' });
    expect(parseLineForm('revenue', values, 'ILS')).toEqual({
      kind: 'revenue',
      label: 'Coffee',
      unitPriceMinor: 123_450,
      unitVariableCostMinor: 800,
      monthlyUnits: 12.5,
      monthlyGrowthPct: 10,
      basis: 'ai_estimate',
    });
  });

  it('defaults optional revenue fields to 0 and trims labels', () => {
    const draft = parseLineForm('revenue', formValues({ label: '  Tea   time ', unitPrice: '15' }), 'ILS');
    expect(draft).toEqual({
      kind: 'revenue',
      label: 'Tea time',
      unitPriceMinor: 1500,
      unitVariableCostMinor: 0,
      monthlyUnits: 0,
      monthlyGrowthPct: 0,
      basis: 'user_provided',
    });
  });

  it('parses startup and expense amounts', () => {
    expect(parseLineForm('startup', formValues({ amount: '₪ 1,200', category: ' equipment ' }), 'ILS')).toEqual({
      kind: 'startup',
      label: 'Item',
      amountMinor: 120_000,
      category: 'equipment',
      basis: 'user_provided',
    });
    expect(parseLineForm('expense', formValues({ amount: '99.9' }), 'ILS')).toMatchObject({ kind: 'expense', monthlyAmountMinor: 9_990 });
    expect(parseLineForm('expense', formValues({ amount: '' }), 'ILS')).toBeNull();
  });

  it('reports field errors as translation keys', () => {
    const schema = lineFormSchema('revenue', 'ILS');
    const result = schema.safeParse(formValues({ label: ' ', unitPrice: 'x', unitCost: '-1', monthlyUnits: '1.234', growthPct: '2000' }));
    expect(result.success).toBe(false);
    const byPath = Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));
    expect(byPath).toEqual({
      label: 'errors.field.required',
      unitPrice: 'errors.field.amountInvalid',
      unitCost: 'errors.field.amountInvalid',
      monthlyUnits: 'finance.validation.unitsInvalid',
      growthPct: 'finance.validation.growthInvalid',
    });
    expect(lineFormSchema('startup', 'ILS').safeParse(formValues({ amount: '' })).error?.issues[0]?.message).toBe('errors.field.required');
    expect(lineFormSchema('startup', 'ILS').safeParse(formValues({ amount: '10', category: 'x'.repeat(61) })).error?.issues[0]?.path).toEqual([
      'category',
    ]);
    expect(lineFormSchema('expense', 'ILS').safeParse(formValues({ amount: '10' })).success).toBe(true);
  });

  it('maps drafts to DB columns', () => {
    expect(draftToRow({ kind: 'expense', label: 'Rent', monthlyAmountMinor: 100, category: '', basis: 'verified' })).toEqual({
      label: 'Rent',
      monthly_amount_minor: 100,
      category: '',
      basis: 'verified',
    });
    expect(
      draftToRow({ kind: 'revenue', label: 'A', unitPriceMinor: 1, unitVariableCostMinor: 2, monthlyUnits: 1.005, monthlyGrowthPct: 3, basis: 'assumption' }),
    ).toEqual({ label: 'A', unit_price_minor: 1, unit_variable_cost_minor: 2, monthly_units: 1.01, monthly_growth_pct: 3, basis: 'assumption' });
  });
});

describe('model settings', () => {
  it('validates the forecast horizon against the plan limit', () => {
    expect(horizonFormSchema(12).safeParse({ forecastMonths: '12' }).success).toBe(true);
    expect(horizonFormSchema(12).safeParse({ forecastMonths: '24' }).error?.issues[0]?.message).toBe('finance.horizon.overLimit?max=12');
    expect(horizonFormSchema(36).safeParse({ forecastMonths: '40' }).error?.issues[0]?.message).toBe('finance.validation.forecastMonthsInvalid');
  });

  it('round-trips scenario percentages', () => {
    const values = scenarioFormDefaults(modelRow({ optimistic_cost_pct: 90 }));
    expect(values.optimistic).toEqual({ volumePct: '130', pricePct: '100', costPct: '90' });
    expect(parseScenarioForm(values)).toEqual({
      conservative: { volumePct: 70, pricePct: 100, costPct: 110 },
      optimistic: { volumePct: 130, pricePct: 100, costPct: 90 },
    });
    expect(parseScenarioForm({ ...values, conservative: { ...values.conservative, costPct: '10.5' } })).toBeNull();
    expect(scenarioFormSchema().safeParse({ ...values, optimistic: { ...values.optimistic, volumePct: '1001' } }).success).toBe(false);
  });

  it('maps patches to columns and applies them to a cached row', () => {
    const patch = { startingCapitalMinor: 10, forecastMonths: 24, optimistic: { costPct: 90 } };
    expect(modelPatchToRow(patch)).toEqual({ starting_capital_minor: 10, forecast_months: 24, optimistic_cost_pct: 90 });
    const next = applyModelPatch(modelRow(), patch);
    expect(next.starting_capital_minor).toBe(10);
    expect(next.optimistic_volume_pct).toBe(130);
    expect(modelPatchToRow({})).toEqual({});
  });

  it('reads the plan limit from a forecast_limit_exceeded error', () => {
    expect(parseMaxForecastMonths({ code: 'P0001', message: 'forecast_limit_exceeded', details: 'max_forecast_months=12' })).toBe(12);
    expect(parseMaxForecastMonths({ maxForecastMonths: 36 })).toBe(36);
    expect(parseMaxForecastMonths({ message: 'other' })).toBeNull();
    expect(parseMaxForecastMonths(null)).toBeNull();
  });
});

describe('validation path mapping', () => {
  const inputs: FinanceInputs = {
    startingCapitalMinor: 0,
    forecastMonths: 12,
    scenarios: {
      conservative: { volumePct: 70, pricePct: 100, costPct: 110 },
      expected: { volumePct: 100, pricePct: 100, costPct: 100 },
      optimistic: { volumePct: 130, pricePct: 100, costPct: 95 },
    },
    startupCosts: [{ id: 's1', label: 'A', amountMinor: 1 }],
    recurringExpenses: [],
    revenueStreams: [
      { id: 'r1', label: 'A', unitPriceMinor: 1, unitVariableCostMinor: 0, monthlyUnits: 1, monthlyGrowthPct: 0 },
      { id: 'r2', label: 'B', unitPriceMinor: -1, unitVariableCostMinor: 0, monthlyUnits: 1, monthlyGrowthPct: 0 },
    ],
  };

  it('maps engine paths to screens and form fields', () => {
    expect(issueTarget({ field: 'revenueStreams.1.unitPriceMinor', message: 'negative' }, inputs)).toEqual({
      scope: 'line',
      kind: 'revenue',
      index: 1,
      id: 'r2',
      field: 'unitPrice',
    });
    expect(issueTarget({ field: 'startupCosts.0.amountMinor', message: 'out_of_range' }, inputs)).toMatchObject({ kind: 'startup', id: 's1', field: 'amount' });
    expect(issueTarget({ field: 'recurringExpenses.3.monthlyAmountMinor', message: 'not_integer' })).toEqual({
      scope: 'line',
      kind: 'expense',
      index: 3,
      id: undefined,
      field: 'amount',
    });
    expect(issueTarget({ field: 'revenueStreams.0.monthlyGrowthPct', message: 'out_of_range' })).toMatchObject({ field: 'growthPct' });
    expect(issueTarget({ field: 'scenarios.optimistic.costPct', message: 'out_of_range' })).toEqual({
      scope: 'scenario',
      scenario: 'optimistic',
      field: 'costPct',
    });
    expect(issueTarget({ field: 'scenarios.expected', message: 'out_of_range' })).toEqual({ scope: 'scenario', scenario: 'expected', field: null });
    expect(issueTarget({ field: 'startingCapitalMinor', message: 'negative' })).toEqual({ scope: 'model', field: 'startingCapitalMinor' });
    expect(issueTarget({ field: 'forecastMonths', message: 'out_of_range' })).toEqual({ scope: 'model', field: 'forecastMonths' });
    expect(issueTarget({ field: 'forecast', message: 'out_of_range' })).toEqual({ scope: 'forecast' });
    expect(issueTarget({ field: 'revenueStreams.x.unitPriceMinor', message: 'negative' })).toBeNull();
    expect(issueTarget({ field: 'revenueStreams.0.label', message: 'negative' })).toBeNull();
    expect(issueTarget({ field: 'unknown', message: 'negative' })).toBeNull();
  });

  it('collects the errors of one line from a real validation run', () => {
    const issues = validateInputs(inputs);
    expect(issues).toEqual([{ field: 'revenueStreams.1.unitPriceMinor', message: 'negative' }]);
    expect(lineIssueErrors(issues, 'revenue', 1)).toEqual({ fields: { unitPrice: 'finance.validation.negative' }, forecast: false });
    expect(lineIssueErrors(issues, 'revenue', 0)).toEqual({ fields: {}, forecast: false });
    expect(lineIssueErrors([{ field: 'forecast', message: 'out_of_range' }], 'startup', 0).forecast).toBe(true);
    expect(validationMessageKey('not_integer')).toBe('finance.validation.notInteger');
    expect(validationMessageKey('out_of_range')).toBe('finance.validation.outOfRange');
  });

  it('replaces or appends a draft before validating the whole model', () => {
    const replaced = inputsWithDraft(
      inputs,
      { kind: 'revenue', label: 'B', unitPriceMinor: 5, unitVariableCostMinor: 0, monthlyUnits: 1, monthlyGrowthPct: 0, basis: 'user_provided' },
      1,
    );
    expect(replaced.index).toBe(1);
    expect(replaced.inputs.revenueStreams[1]?.unitPriceMinor).toBe(5);
    expect(validateInputs(replaced.inputs)).toEqual([]);
    const appended = inputsWithDraft(inputs, { kind: 'startup', label: 'C', amountMinor: 3, category: '', basis: 'user_provided' }, null);
    expect(appended.index).toBe(1);
    expect(appended.inputs.startupCosts).toHaveLength(2);
    expect(inputs.startupCosts).toHaveLength(1); // not mutated
  });

  it('flags a model that overflows the safe range as a forecast issue', () => {
    const huge: FinanceInputs = {
      ...inputs,
      revenueStreams: [
        { label: 'Huge', unitPriceMinor: 10_000_000_000_000, unitVariableCostMinor: 0, monthlyUnits: 9_999_999_999.99, monthlyGrowthPct: 0 },
      ],
      startupCosts: [],
    };
    const issues = validateInputs(huge);
    expect(lineIssueErrors(issues, 'revenue', 0).forecast).toBe(true);
  });
});

describe('forecast helpers', () => {
  it('sums the costs of a month', () => {
    expect(monthCostsMinor({ variableCostsMinor: 240_000, fixedCostsMinor: 450_000 })).toBe(690_000);
    expect(
      forecastTotalCostsMinor([
        { variableCostsMinor: 1, fixedCostsMinor: 2 },
        { variableCostsMinor: 3, fixedCostsMinor: 4 },
      ]),
    ).toBe(10);
    expect(forecastTotalCostsMinor([])).toBe(0);
  });

  it('maps forecast months to calendar months starting with the current month', () => {
    const start = new Date(2026, 10, 5); // 5 Nov 2026
    expect(calendarMonthFor(start, 1)).toEqual(new Date(2026, 10, 1));
    expect(calendarMonthFor(start, 3)).toEqual(new Date(2027, 0, 1));
  });
});

describe('AI proposals', () => {
  const proposal: FinanceProposal = {
    startingCapitalMinor: 5_000_000,
    startupCosts: [{ id: 'sc1', label: 'Espresso machine', amountMinor: 1_500_000.4, category: 'equipment' }],
    recurringExpenses: [{ id: 're1', label: '', monthlyAmountMinor: 400_000, category: 'rent' }],
    revenueStreams: [
      { id: 'rs1', label: 'Coffee', unitPriceMinor: 1_200, unitVariableCostMinor: 300, monthlyUnits: 1200.456, monthlyGrowthPct: 5 },
    ],
    notes: 'Based on a small café.',
  };

  it('parses stored jsonb defensively', () => {
    expect(parseFinanceProposal(proposal)).toEqual(proposal);
    expect(parseFinanceProposal(null)).toBeNull();
    expect(parseFinanceProposal({ startupCosts: 'nope' })).toBeNull();
    expect(parseFinanceProposal({})).toEqual({ startingCapitalMinor: null, startupCosts: [], recurringExpenses: [], revenueStreams: [], notes: '' });
  });

  it('lists items with stable, content-based keys', () => {
    const items = proposalItems(proposal);
    expect(items.map((i) => i.kind)).toEqual(['capital', 'startup', 'expense', 'revenue']);
    const again = proposalItems(JSON.parse(JSON.stringify(proposal)) as FinanceProposal);
    expect(again.map((i) => i.key)).toEqual(items.map((i) => i.key));
    const changed = proposalItems({ ...proposal, startupCosts: [{ ...proposal.startupCosts[0]!, amountMinor: 1 }] });
    expect(changed[1]?.key).not.toBe(items[1]?.key);
    expect(changed[2]?.key).toBe(items[2]?.key);
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
  });

  it('filters reviewed items', () => {
    const items = proposalItems(proposal);
    expect(pendingProposalItems(proposal, [items[0]!.key, items[3]!.key]).map((i) => i.kind)).toEqual(['startup', 'expense']);
    expect(pendingProposalItems(proposal, new Set(items.map((i) => i.key)))).toEqual([]);
    expect(pendingProposalItems(null, [])).toEqual([]);
  });

  it('turns accepted items into ai_estimate drafts with sanitized values', () => {
    const [capital, startup, expense, revenue] = proposalItems(proposal);
    expect(proposalItemToDraft(capital!, 'AI suggestion')).toBeNull();
    expect(proposalCapitalMinor(capital!)).toBe(5_000_000);
    expect(proposalCapitalMinor(startup!)).toBeNull();
    expect(proposalItemToDraft(startup!, 'AI suggestion')).toEqual({
      kind: 'startup',
      label: 'Espresso machine',
      amountMinor: 1_500_000,
      category: 'equipment',
      basis: 'ai_estimate',
    });
    expect(proposalItemToDraft(expense!, 'AI suggestion')).toMatchObject({ kind: 'expense', label: 'AI suggestion', basis: 'ai_estimate' });
    expect(proposalItemToDraft(revenue!, 'AI suggestion')).toMatchObject({ kind: 'revenue', monthlyUnits: 1200.46, basis: 'ai_estimate' });
  });

  it('hashes deterministically', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});
