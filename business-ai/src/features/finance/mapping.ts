/**
 * Finance feature — pure mapping between DB rows, engine inputs (`@domain/finance`), form values
 * and AI proposals. No React, no I/O: everything here is unit-tested in `__tests__/mapping.test.ts`.
 *
 * Financial arithmetic stays in `@domain/finance`; this file only converts shapes and parses
 * user-typed text into integer minor units / 2-decimal quantities.
 */
import { z } from 'zod';
import type { Tables, TablesUpdate } from '@db';
import type { FinanceProposal } from '@domain/ai-api';
import {
  FINANCE_LIMITS,
  scenarioSettingsFromModel,
  type FinanceInputs,
  type FinanceValidationIssue,
  type FinanceValidationMessage,
  type ForecastMonth,
  type ScenarioAdjustments,
  type ScenarioKey,
} from '@domain/finance';
import { BASIS_VALUES, type Basis } from '@domain/plan';
import { parseMoneyInput } from '@/i18n/format';
import { fieldMessage } from '@/lib/forms';
import type { TranslationKey } from '@/i18n/translate';
import { intlLocale, type Locale } from '@/i18n/types';

/* ============================================================================================== */
/* Row types                                                                                      */
/* ============================================================================================== */

export type FinancialModelRow = Tables<'financial_models'>;
export type StartupCostRow = Tables<'startup_costs'>;
export type RecurringExpenseRow = Tables<'recurring_expenses'>;
export type RevenueStreamRow = Tables<'revenue_streams'>;

/** Route segment `/finance/line/[kind]/[id]`. */
export const LINE_KINDS = ['startup', 'expense', 'revenue'] as const;
export type LineKind = (typeof LINE_KINDS)[number];

export function isLineKind(value: unknown): value is LineKind {
  return typeof value === 'string' && (LINE_KINDS as readonly string[]).includes(value);
}

export const LINE_TABLES = {
  startup: 'startup_costs',
  expense: 'recurring_expenses',
  revenue: 'revenue_streams',
} as const satisfies Record<LineKind, string>;

export const LABEL_MAX = 120;
export const CATEGORY_MAX = 60;
/** Non-expected scenario percentages are DB integers 0…1000. */
export const SCENARIO_FIELDS = ['volumePct', 'pricePct', 'costPct'] as const;
export type ScenarioField = (typeof SCENARIO_FIELDS)[number];
export const EDITABLE_SCENARIOS = ['conservative', 'optimistic'] as const;
export type EditableScenario = (typeof EDITABLE_SCENARIOS)[number];

interface LineBase {
  id: string;
  label: string;
  basis: Basis;
  sortOrder: number;
}

export interface StartupCostLine extends LineBase {
  kind: 'startup';
  amountMinor: number;
  category: string;
}

export interface RecurringExpenseLine extends LineBase {
  kind: 'expense';
  monthlyAmountMinor: number;
  category: string;
}

export interface RevenueStreamLine extends LineBase {
  kind: 'revenue';
  unitPriceMinor: number;
  unitVariableCostMinor: number;
  /** 2 decimals. */
  monthlyUnits: number;
  /** Percent, 2 decimals. */
  monthlyGrowthPct: number;
}

export type FinanceLine = StartupCostLine | RecurringExpenseLine | RevenueStreamLine;

export interface FinanceLines {
  startupCosts: StartupCostLine[];
  recurringExpenses: RecurringExpenseLine[];
  revenueStreams: RevenueStreamLine[];
}

/* ============================================================================================== */
/* DB rows → typed lines / engine inputs                                                          */
/* ============================================================================================== */

/** PostgREST may return bigint/numeric as strings; never let NaN reach the engine. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function toBasis(value: unknown): Basis {
  return typeof value === 'string' && (BASIS_VALUES as readonly string[]).includes(value) ? (value as Basis) : 'user_provided';
}

export function mapModelRow(row: FinancialModelRow): FinancialModelRow {
  return {
    ...row,
    starting_capital_minor: toNumber(row.starting_capital_minor),
    forecast_months: toNumber(row.forecast_months, 12),
    conservative_volume_pct: toNumber(row.conservative_volume_pct, 70),
    conservative_price_pct: toNumber(row.conservative_price_pct, 100),
    conservative_cost_pct: toNumber(row.conservative_cost_pct, 110),
    optimistic_volume_pct: toNumber(row.optimistic_volume_pct, 130),
    optimistic_price_pct: toNumber(row.optimistic_price_pct, 100),
    optimistic_cost_pct: toNumber(row.optimistic_cost_pct, 95),
  };
}

export function mapStartupCostRow(row: StartupCostRow): StartupCostLine {
  return {
    kind: 'startup',
    id: row.id,
    label: row.label,
    amountMinor: toNumber(row.amount_minor),
    category: row.category ?? '',
    basis: toBasis(row.basis),
    sortOrder: toNumber(row.sort_order),
  };
}

export function mapRecurringExpenseRow(row: RecurringExpenseRow): RecurringExpenseLine {
  return {
    kind: 'expense',
    id: row.id,
    label: row.label,
    monthlyAmountMinor: toNumber(row.monthly_amount_minor),
    category: row.category ?? '',
    basis: toBasis(row.basis),
    sortOrder: toNumber(row.sort_order),
  };
}

export function mapRevenueStreamRow(row: RevenueStreamRow): RevenueStreamLine {
  return {
    kind: 'revenue',
    id: row.id,
    label: row.label,
    unitPriceMinor: toNumber(row.unit_price_minor),
    unitVariableCostMinor: toNumber(row.unit_variable_cost_minor),
    monthlyUnits: toNumber(row.monthly_units),
    monthlyGrowthPct: toNumber(row.monthly_growth_pct),
    basis: toBasis(row.basis),
    sortOrder: toNumber(row.sort_order),
  };
}

export function toFinanceInputs(model: FinancialModelRow, lines: FinanceLines): FinanceInputs {
  const m = mapModelRow(model);
  return {
    startingCapitalMinor: m.starting_capital_minor,
    forecastMonths: m.forecast_months,
    scenarios: scenarioSettingsFromModel(m),
    startupCosts: lines.startupCosts.map((l) => ({ id: l.id, label: l.label, amountMinor: l.amountMinor })),
    recurringExpenses: lines.recurringExpenses.map((l) => ({ id: l.id, label: l.label, monthlyAmountMinor: l.monthlyAmountMinor })),
    revenueStreams: lines.revenueStreams.map((l) => ({
      id: l.id,
      label: l.label,
      unitPriceMinor: l.unitPriceMinor,
      unitVariableCostMinor: l.unitVariableCostMinor,
      monthlyUnits: l.monthlyUnits,
      monthlyGrowthPct: l.monthlyGrowthPct,
    })),
  };
}

export function lineCount(lines: FinanceLines): number {
  return lines.startupCosts.length + lines.recurringExpenses.length + lines.revenueStreams.length;
}

/** Nothing entered yet: no lines and no starting capital. */
export function isFinanceEmpty(model: Pick<FinancialModelRow, 'starting_capital_minor'> | undefined, lines: FinanceLines): boolean {
  return lineCount(lines) === 0 && toNumber(model?.starting_capital_minor) === 0;
}

export function linesOfKind(lines: FinanceLines, kind: LineKind): FinanceLine[] {
  if (kind === 'startup') return lines.startupCosts;
  if (kind === 'expense') return lines.recurringExpenses;
  return lines.revenueStreams;
}

export function findLine(lines: FinanceLines, kind: LineKind, id: string): FinanceLine | undefined {
  return linesOfKind(lines, kind).find((l) => l.id === id);
}

export function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return items.reduce((max, l) => Math.max(max, l.sortOrder), -1) + 1;
}

/* ============================================================================================== */
/* Line drafts (parsed form values) → DB payloads                                                 */
/* ============================================================================================== */

export type StartupCostDraft = { kind: 'startup'; label: string; amountMinor: number; category: string; basis: Basis };
export type RecurringExpenseDraft = { kind: 'expense'; label: string; monthlyAmountMinor: number; category: string; basis: Basis };
export type RevenueStreamDraft = {
  kind: 'revenue';
  label: string;
  unitPriceMinor: number;
  unitVariableCostMinor: number;
  monthlyUnits: number;
  monthlyGrowthPct: number;
  basis: Basis;
};
export type LineDraft = StartupCostDraft | RecurringExpenseDraft | RevenueStreamDraft;

/** Editable columns per line table (assignable to both the Insert and Update row types). */
export interface StartupCostColumns {
  label: string;
  amount_minor: number;
  category: string;
  basis: Basis;
}
export interface RecurringExpenseColumns {
  label: string;
  monthly_amount_minor: number;
  category: string;
  basis: Basis;
}
export interface RevenueStreamColumns {
  label: string;
  unit_price_minor: number;
  unit_variable_cost_minor: number;
  monthly_units: number;
  monthly_growth_pct: number;
  basis: Basis;
}
type LinePayload = { startup: StartupCostColumns; expense: RecurringExpenseColumns; revenue: RevenueStreamColumns };

export function cleanLabel(label: string): string {
  return label.replace(/\s+/g, ' ').trim().slice(0, LABEL_MAX);
}

export function cleanCategory(category: string): string {
  return category.replace(/\s+/g, ' ').trim().slice(0, CATEGORY_MAX);
}

/** Snake-case column values for insert/update (without business_id / sort_order). */
export function draftToRow(draft: StartupCostDraft): LinePayload['startup'];
export function draftToRow(draft: RecurringExpenseDraft): LinePayload['expense'];
export function draftToRow(draft: RevenueStreamDraft): LinePayload['revenue'];
export function draftToRow(draft: LineDraft): LinePayload[LineKind];
export function draftToRow(draft: LineDraft): LinePayload[LineKind] {
  switch (draft.kind) {
    case 'startup':
      return { label: cleanLabel(draft.label), amount_minor: draft.amountMinor, category: cleanCategory(draft.category), basis: draft.basis };
    case 'expense':
      return {
        label: cleanLabel(draft.label),
        monthly_amount_minor: draft.monthlyAmountMinor,
        category: cleanCategory(draft.category),
        basis: draft.basis,
      };
    case 'revenue':
      return {
        label: cleanLabel(draft.label),
        unit_price_minor: draft.unitPriceMinor,
        unit_variable_cost_minor: draft.unitVariableCostMinor,
        monthly_units: round2(draft.monthlyUnits),
        monthly_growth_pct: round2(draft.monthlyGrowthPct),
        basis: draft.basis,
      };
  }
}

/** 2-decimal rounding, half away from zero, robust to binary representation (1.005 → 1.01). */
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const r = (Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-6)) / 100;
  return r === 0 ? 0 : r;
}

/**
 * Inputs as they would be after saving `draft` (replacing the line at `index`, or appended when
 * `index` is null). Used to run `validateInputs` on the whole model before saving one line.
 */
export function inputsWithDraft(inputs: FinanceInputs, draft: LineDraft, index: number | null): { inputs: FinanceInputs; index: number } {
  const replace = <T>(list: readonly T[], item: T): { list: T[]; index: number } => {
    if (index === null || index < 0 || index >= list.length) return { list: [...list, item], index: list.length };
    const next = [...list];
    next[index] = item;
    return { list: next, index };
  };
  if (draft.kind === 'startup') {
    const r = replace(inputs.startupCosts, { label: draft.label, amountMinor: draft.amountMinor });
    return { inputs: { ...inputs, startupCosts: r.list }, index: r.index };
  }
  if (draft.kind === 'expense') {
    const r = replace(inputs.recurringExpenses, { label: draft.label, monthlyAmountMinor: draft.monthlyAmountMinor });
    return { inputs: { ...inputs, recurringExpenses: r.list }, index: r.index };
  }
  const r = replace(inputs.revenueStreams, {
    label: draft.label,
    unitPriceMinor: draft.unitPriceMinor,
    unitVariableCostMinor: draft.unitVariableCostMinor,
    monthlyUnits: draft.monthlyUnits,
    monthlyGrowthPct: draft.monthlyGrowthPct,
  });
  return { inputs: { ...inputs, revenueStreams: r.list }, index: r.index };
}

/* ============================================================================================== */
/* Text input parsing / formatting                                                                */
/* ============================================================================================== */

export interface ParseDecimalOptions {
  min?: number;
  max?: number;
  /** Require a whole number. */
  integer?: boolean;
}

/** "1,234,567" style grouping: 1–3 leading digits then groups of exactly 3. */
function isGrouped(text: string, sep: string): boolean {
  const [first, ...rest] = text.split(sep);
  return first !== undefined && /^\d{1,3}$/.test(first) && rest.length > 0 && rest.every((g) => /^\d{3}$/.test(g));
}

/**
 * Parses a user-typed quantity or percentage with up to 2 decimals ("12.5", "12,5", "1,200",
 * "1,200.5", "15%", Arabic-Indic digits, bidi marks). Returns null when invalid or outside
 * [min, max]. Unlike money, a lone "." is always the decimal point ("1.234" is invalid, not 1234).
 */
export function parseDecimalInput(text: string, opts: ParseDecimalOptions = {}): number | null {
  const min = opts.min ?? 0;
  const max = opts.max ?? FINANCE_LIMITS.maxMonthlyUnits;
  if (typeof text !== 'string') return null;
  let s = text
    .replace(/[؜‎‏‪-‮⁦-⁩]/g, '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s   ]/g, '')
    .replace(/[−‒–—]/g, '-')
    .replace(/%$/, '');
  let negative = false;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s)) return null;

  let integerPart = s;
  let fractionPart = '';
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const groupSep = decimalSep === '.' ? ',' : '.';
    const parts = s.split(decimalSep);
    if (parts.length !== 2 || !isGrouped(parts[0] ?? '', groupSep)) return null;
    integerPart = (parts[0] ?? '').split(groupSep).join('');
    fractionPart = parts[1] ?? '';
  } else if (lastDot >= 0) {
    const parts = s.split('.');
    if (parts.length !== 2) return null;
    integerPart = parts[0] ?? '';
    fractionPart = parts[1] ?? '';
  } else if (lastComma >= 0) {
    const parts = s.split(',');
    if (parts.length === 2 && (parts[1] ?? '').length <= 2) {
      integerPart = parts[0] ?? '';
      fractionPart = parts[1] ?? '';
    } else if (isGrouped(s, ',')) integerPart = parts.join('');
    else return null;
  }
  if (integerPart === '' && fractionPart === '') return null;
  if (!/^\d*$/.test(integerPart) || !/^\d{0,2}$/.test(fractionPart)) return null;
  const digits = (integerPart || '0').replace(/^0+(?=\d)/, '') + fractionPart.padEnd(2, '0');
  if (digits.length > 15) return null;
  const hundredths = Number(digits);
  const value = (negative ? -hundredths : hundredths) / 100;
  if (!Number.isFinite(value) || value < min || value > max) return null;
  if (opts.integer && !Number.isInteger(value)) return null;
  return value === 0 ? 0 : value;
}

/** Empty text counts as `emptyValue` (optional numeric fields default to 0). */
export function parseOptionalDecimal(text: string, opts: ParseDecimalOptions = {}, emptyValue = 0): number | null {
  return text.trim() === '' ? emptyValue : parseDecimalInput(text, opts);
}

export function parseOptionalMoney(text: string, currency: string, emptyValue = 0): number | null {
  return text.trim() === '' ? emptyValue : parseMoneyInput(text, currency);
}

/**
 * Minor units → editable text with grouping ("1,234.50"; whole amounts without decimals).
 * Plain Intl output without bidi isolates (it goes into a TextInput).
 */
export function formatMoneyInputText(minor: number | null | undefined, locale: Locale): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return '';
  const rounded = Math.round(minor);
  const fraction = rounded % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
    useGrouping: true,
  }).format(rounded / 100);
}

/** Re-formats typed money on blur; leaves unparseable text untouched so the error stays visible. */
export function reformatMoneyText(text: string, currency: string, locale: Locale): string {
  const minor = parseMoneyInput(text, currency);
  return minor === null ? text : formatMoneyInputText(minor, locale);
}

/** Quantity / percent → editable text (up to 2 decimals, no grouping). */
export function formatDecimalInputText(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  return String(round2(value));
}

/* ============================================================================================== */
/* Form values & schemas                                                                          */
/* ============================================================================================== */

/** All line editor fields as typed text. Fields that do not apply to a kind are ignored. */
export interface LineFormValues {
  label: string;
  category: string;
  basis: Basis;
  /** Startup amount or monthly amount. */
  amount: string;
  unitPrice: string;
  unitCost: string;
  monthlyUnits: string;
  growthPct: string;
}

export type LineFormField = keyof LineFormValues;

export function lineFormDefaults(line: FinanceLine | undefined, kind: LineKind, locale: Locale): LineFormValues {
  const base: LineFormValues = {
    label: line?.label ?? '',
    category: '',
    basis: line?.basis ?? 'user_provided',
    amount: '',
    unitPrice: '',
    unitCost: '',
    monthlyUnits: '',
    growthPct: '',
  };
  if (!line || line.kind !== kind) return base;
  if (line.kind === 'startup') return { ...base, category: line.category, amount: formatMoneyInputText(line.amountMinor, locale) };
  if (line.kind === 'expense') return { ...base, category: line.category, amount: formatMoneyInputText(line.monthlyAmountMinor, locale) };
  return {
    ...base,
    unitPrice: formatMoneyInputText(line.unitPriceMinor, locale),
    unitCost: formatMoneyInputText(line.unitVariableCostMinor, locale),
    monthlyUnits: formatDecimalInputText(line.monthlyUnits),
    growthPct: formatDecimalInputText(line.monthlyGrowthPct),
  };
}

const K = {
  required: 'errors.field.required',
  amountInvalid: 'errors.field.amountInvalid',
  numberInvalid: 'errors.field.numberInvalid',
  labelTooLong: 'finance.validation.labelTooLong',
  categoryTooLong: 'finance.validation.categoryTooLong',
  unitsInvalid: 'finance.validation.unitsInvalid',
  growthInvalid: 'finance.validation.growthInvalid',
  scenarioPctInvalid: 'finance.validation.scenarioPctInvalid',
  forecastMonthsInvalid: 'finance.validation.forecastMonthsInvalid',
  marginInvalid: 'finance.validation.marginInvalid',
} as const satisfies Record<string, TranslationKey>;

/** zod schema for the line editor. Error messages are translation keys (render with `t(message)`). */
export function lineFormSchema(kind: LineKind, currency: string) {
  return z
    .object({
      label: z.string(),
      category: z.string(),
      basis: z.enum(BASIS_VALUES),
      amount: z.string(),
      unitPrice: z.string(),
      unitCost: z.string(),
      monthlyUnits: z.string(),
      growthPct: z.string(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: LineFormField, message: TranslationKey) => ctx.addIssue({ code: 'custom', path: [path], message });
      const label = v.label.trim();
      if (label === '') issue('label', K.required);
      else if (label.length > LABEL_MAX) issue('label', K.labelTooLong);
      if (kind !== 'revenue' && v.category.trim().length > CATEGORY_MAX) issue('category', K.categoryTooLong);
      if (kind === 'revenue') {
        if (v.unitPrice.trim() === '') issue('unitPrice', K.required);
        else if (parseMoneyInput(v.unitPrice, currency) === null) issue('unitPrice', K.amountInvalid);
        if (parseOptionalMoney(v.unitCost, currency) === null) issue('unitCost', K.amountInvalid);
        if (parseOptionalDecimal(v.monthlyUnits, { min: 0, max: FINANCE_LIMITS.maxMonthlyUnits }) === null) issue('monthlyUnits', K.unitsInvalid);
        if (parseOptionalDecimal(v.growthPct, { min: FINANCE_LIMITS.minGrowthPct, max: FINANCE_LIMITS.maxGrowthPct }) === null)
          issue('growthPct', K.growthInvalid);
      } else if (v.amount.trim() === '') issue('amount', K.required);
      else if (parseMoneyInput(v.amount, currency) === null) issue('amount', K.amountInvalid);
    });
}

/** Parses validated form values into a draft. Returns null if any field does not parse. */
export function parseLineForm(kind: LineKind, v: LineFormValues, currency: string): LineDraft | null {
  const label = cleanLabel(v.label);
  if (label === '') return null;
  if (kind === 'startup' || kind === 'expense') {
    const amount = parseMoneyInput(v.amount, currency);
    if (amount === null) return null;
    const category = cleanCategory(v.category);
    return kind === 'startup'
      ? { kind, label, amountMinor: amount, category, basis: v.basis }
      : { kind, label, monthlyAmountMinor: amount, category, basis: v.basis };
  }
  const price = parseMoneyInput(v.unitPrice, currency);
  const cost = parseOptionalMoney(v.unitCost, currency);
  const units = parseOptionalDecimal(v.monthlyUnits, { min: 0, max: FINANCE_LIMITS.maxMonthlyUnits });
  const growth = parseOptionalDecimal(v.growthPct, { min: FINANCE_LIMITS.minGrowthPct, max: FINANCE_LIMITS.maxGrowthPct });
  if (price === null || cost === null || units === null || growth === null) return null;
  return {
    kind,
    label,
    unitPriceMinor: price,
    unitVariableCostMinor: cost,
    monthlyUnits: units,
    monthlyGrowthPct: growth,
    basis: v.basis,
  };
}

/* ----- Model settings (starting capital, forecast horizon) ----- */

export interface CapitalFormValues {
  startingCapital: string;
}

export function capitalFormSchema(currency: string) {
  return z.object({ startingCapital: z.string() }).superRefine((v, ctx) => {
    if (parseOptionalMoney(v.startingCapital, currency) === null)
      ctx.addIssue({ code: 'custom', path: ['startingCapital'], message: K.amountInvalid });
  });
}

export interface HorizonFormValues {
  forecastMonths: string;
}

/** `maxMonths` is the plan's limit (useEntitlement().limits.maxForecastMonths). */
export function horizonFormSchema(maxMonths: number) {
  return z.object({ forecastMonths: z.string() }).superRefine((v, ctx) => {
    const months = parseDecimalInput(v.forecastMonths, { min: FINANCE_LIMITS.minForecastMonths, max: FINANCE_LIMITS.maxForecastMonths, integer: true });
    if (months === null) ctx.addIssue({ code: 'custom', path: ['forecastMonths'], message: K.forecastMonthsInvalid });
    else if (months > maxMonths)
      ctx.addIssue({ code: 'custom', path: ['forecastMonths'], message: fieldMessage('finance.horizon.overLimit', { max: maxMonths }) });
  });
}

export function parseForecastMonths(text: string): number | null {
  return parseDecimalInput(text, { min: FINANCE_LIMITS.minForecastMonths, max: FINANCE_LIMITS.maxForecastMonths, integer: true });
}

/* ----- Scenarios ----- */

export type ScenarioFormValues = Record<EditableScenario, Record<ScenarioField, string>>;

export function scenarioFormDefaults(model: FinancialModelRow): ScenarioFormValues {
  const s = scenarioSettingsFromModel(mapModelRow(model));
  const pick = (a: ScenarioAdjustments) => ({ volumePct: String(a.volumePct), pricePct: String(a.pricePct), costPct: String(a.costPct) });
  return { conservative: pick(s.conservative), optimistic: pick(s.optimistic) };
}

export function parseScenarioPct(text: string): number | null {
  return parseDecimalInput(text, { min: FINANCE_LIMITS.minScenarioPct, max: FINANCE_LIMITS.maxScenarioPct, integer: true });
}

export function scenarioFormSchema() {
  const pct = z.string().refine((s) => parseScenarioPct(s) !== null, { message: K.scenarioPctInvalid });
  const group = z.object({ volumePct: pct, pricePct: pct, costPct: pct });
  return z.object({ conservative: group, optimistic: group });
}

/** Parsed scenario values, or null if any field is invalid. */
export function parseScenarioForm(v: ScenarioFormValues): Record<EditableScenario, ScenarioAdjustments> | null {
  const out = {} as Record<EditableScenario, ScenarioAdjustments>;
  for (const key of EDITABLE_SCENARIOS) {
    const volumePct = parseScenarioPct(v[key].volumePct);
    const pricePct = parseScenarioPct(v[key].pricePct);
    const costPct = parseScenarioPct(v[key].costPct);
    if (volumePct === null || pricePct === null || costPct === null) return null;
    out[key] = { volumePct, pricePct, costPct };
  }
  return out;
}

/* ----- Model patch ----- */

export interface FinancialModelPatch {
  startingCapitalMinor?: number;
  forecastMonths?: number;
  conservative?: Partial<ScenarioAdjustments>;
  optimistic?: Partial<ScenarioAdjustments>;
}

export function modelPatchToRow(patch: FinancialModelPatch): TablesUpdate<'financial_models'> {
  const row: TablesUpdate<'financial_models'> = {};
  if (patch.startingCapitalMinor !== undefined) row.starting_capital_minor = patch.startingCapitalMinor;
  if (patch.forecastMonths !== undefined) row.forecast_months = patch.forecastMonths;
  if (patch.conservative?.volumePct !== undefined) row.conservative_volume_pct = patch.conservative.volumePct;
  if (patch.conservative?.pricePct !== undefined) row.conservative_price_pct = patch.conservative.pricePct;
  if (patch.conservative?.costPct !== undefined) row.conservative_cost_pct = patch.conservative.costPct;
  if (patch.optimistic?.volumePct !== undefined) row.optimistic_volume_pct = patch.optimistic.volumePct;
  if (patch.optimistic?.pricePct !== undefined) row.optimistic_price_pct = patch.optimistic.pricePct;
  if (patch.optimistic?.costPct !== undefined) row.optimistic_cost_pct = patch.optimistic.costPct;
  return row;
}

/** Applies a patch to a cached model row (optimistic cache update). */
export function applyModelPatch(model: FinancialModelRow, patch: FinancialModelPatch): FinancialModelRow {
  return { ...model, ...modelPatchToRow(patch) } as FinancialModelRow;
}

/* ----- Pricing calculator ----- */

export function parseTargetMargin(text: string): number | null {
  // Margin can be negative in theory, but a target below 0 makes no sense for pricing.
  return parseDecimalInput(text, { min: 0, max: 99.99 });
}

/* ============================================================================================== */
/* Engine validation issues → form fields                                                         */
/* ============================================================================================== */

export type FinanceIssueTarget =
  | { scope: 'model'; field: 'startingCapitalMinor' | 'forecastMonths' }
  | { scope: 'scenario'; scenario: ScenarioKey; field: ScenarioField | null }
  | { scope: 'line'; kind: LineKind; index: number; id: string | undefined; field: LineFormField }
  | { scope: 'forecast' };

const ENGINE_LINE_FIELDS: Record<string, { kind: LineKind; fields: Record<string, LineFormField> }> = {
  startupCosts: { kind: 'startup', fields: { amountMinor: 'amount' } },
  recurringExpenses: { kind: 'expense', fields: { monthlyAmountMinor: 'amount' } },
  revenueStreams: {
    kind: 'revenue',
    fields: { unitPriceMinor: 'unitPrice', unitVariableCostMinor: 'unitCost', monthlyUnits: 'monthlyUnits', monthlyGrowthPct: 'growthPct' },
  },
};

/**
 * Maps a `validateInputs` issue path (`revenueStreams.0.unitPriceMinor`, `scenarios.optimistic.costPct`,
 * `startingCapitalMinor`, `forecast`) to the screen/field that owns it. Null for unknown paths.
 */
export function issueTarget(issue: FinanceValidationIssue, inputs?: FinanceInputs): FinanceIssueTarget | null {
  const parts = issue.field.split('.');
  const [head, second, third] = parts;
  if (head === 'forecast' && parts.length === 1) return { scope: 'forecast' };
  if ((head === 'startingCapitalMinor' || head === 'forecastMonths') && parts.length === 1) return { scope: 'model', field: head };
  if (head === 'scenarios' && (second === 'conservative' || second === 'expected' || second === 'optimistic')) {
    const field = (SCENARIO_FIELDS as readonly string[]).includes(third ?? '') ? (third as ScenarioField) : null;
    if (parts.length > 3 || (third !== undefined && field === null)) return null;
    return { scope: 'scenario', scenario: second, field };
  }
  const spec = head ? ENGINE_LINE_FIELDS[head] : undefined;
  if (spec && second !== undefined && /^\d+$/.test(second) && third !== undefined && parts.length === 3) {
    const field = spec.fields[third];
    if (!field) return null;
    const index = Number(second);
    const list = inputs ? (inputs[head as 'startupCosts' | 'recurringExpenses' | 'revenueStreams'] as { id?: string }[]) : undefined;
    return { scope: 'line', kind: spec.kind, index, id: list?.[index]?.id, field };
  }
  return null;
}

export function validationMessageKey(message: FinanceValidationMessage): TranslationKey {
  switch (message) {
    case 'negative':
      return 'finance.validation.negative';
    case 'not_integer':
      return 'finance.validation.notInteger';
    case 'out_of_range':
      return 'finance.validation.outOfRange';
  }
}

export interface LineIssueErrors {
  fields: Partial<Record<LineFormField, TranslationKey>>;
  /** The model as a whole exceeds the calculable range. */
  forecast: boolean;
}

/** Errors for the line at (`kind`, `index`) from a whole-model validation. */
export function lineIssueErrors(issues: readonly FinanceValidationIssue[], kind: LineKind, index: number): LineIssueErrors {
  const out: LineIssueErrors = { fields: {}, forecast: false };
  for (const issue of issues) {
    const target = issueTarget(issue);
    if (!target) continue;
    if (target.scope === 'forecast') out.forecast = true;
    else if (target.scope === 'line' && target.kind === kind && target.index === index && !out.fields[target.field])
      out.fields[target.field] = validationMessageKey(issue.message);
  }
  return out;
}

/* ============================================================================================== */
/* Forecast presentation helpers                                                                  */
/* ============================================================================================== */

/** Total costs of a month (variable + fixed), as shown in the forecast table. */
export function monthCostsMinor(month: Pick<ForecastMonth, 'variableCostsMinor' | 'fixedCostsMinor'>): number {
  return month.variableCostsMinor + month.fixedCostsMinor;
}

/** Calendar month of forecast month `month` (1-based), month 1 = the month of `start`. */
export function calendarMonthFor(start: Date, month: number): Date {
  return new Date(start.getFullYear(), start.getMonth() + month - 1, 1);
}

/** "Nov 26" style label (no isolates; wrap at render time). */
export function calendarMonthLabel(start: Date, month: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', year: '2-digit' }).format(calendarMonthFor(start, month));
}

/** Reads `max_forecast_months=N` from a `forecast_limit_exceeded` error (PostgREST `details`). */
export function parseMaxForecastMonths(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  const e = error as { details?: unknown; message?: unknown; maxForecastMonths?: unknown };
  if (typeof e.maxForecastMonths === 'number') return e.maxForecastMonths;
  for (const text of [e.details, e.message]) {
    if (typeof text !== 'string') continue;
    const m = /max_forecast_months\s*=\s*(\d+)/.exec(text);
    if (m) return Number(m[1]);
  }
  return null;
}

/* ============================================================================================== */
/* AI proposals                                                                                   */
/* ============================================================================================== */

const money = z.number().finite().min(0);

/** Validates the jsonb in `plan_versions.finance_proposal` (or an AI response) before use. */
export const FinanceProposalSchema = z.object({
  startingCapitalMinor: money.nullable().default(null),
  startupCosts: z.array(z.object({ id: z.string(), label: z.string(), amountMinor: money, category: z.string().default('') })).default([]),
  recurringExpenses: z
    .array(z.object({ id: z.string(), label: z.string(), monthlyAmountMinor: money, category: z.string().default('') }))
    .default([]),
  revenueStreams: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        unitPriceMinor: money,
        unitVariableCostMinor: money,
        monthlyUnits: money,
        monthlyGrowthPct: z.number().finite(),
      }),
    )
    .default([]),
  notes: z.string().default(''),
});

export function parseFinanceProposal(value: unknown): FinanceProposal | null {
  if (value === null || value === undefined) return null;
  const parsed = FinanceProposalSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isProposalEmpty(p: FinanceProposal): boolean {
  return p.startingCapitalMinor === null && p.startupCosts.length === 0 && p.recurringExpenses.length === 0 && p.revenueStreams.length === 0;
}

export type ProposalItem =
  | { key: string; kind: 'capital'; amountMinor: number }
  | { key: string; kind: 'startup'; item: FinanceProposal['startupCosts'][number] }
  | { key: string; kind: 'expense'; item: FinanceProposal['recurringExpenses'][number] }
  | { key: string; kind: 'revenue'; item: FinanceProposal['revenueStreams'][number] };

/** FNV-1a 32-bit, base-36. Deterministic and good enough to fingerprint short JSON. */
export function hashString(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Canonical JSON (sorted keys) so equal content always hashes equally. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * Stable key of a proposal item: kind + item id + content fingerprint. Plan versions copy the
 * same proposal forward on every edit, so keys must not depend on the version id; and a new AI
 * proposal that reuses an id for different content is a different item.
 */
export function proposalItemKey(kind: ProposalItem['kind'], content: unknown): string {
  const id = typeof content === 'object' && content !== null && 'id' in content ? String((content as { id: unknown }).id) : '';
  return `${kind}:${id}:${hashString(canonical(content))}`;
}

export function proposalItems(p: FinanceProposal): ProposalItem[] {
  const items: ProposalItem[] = [];
  if (p.startingCapitalMinor !== null)
    items.push({ key: proposalItemKey('capital', { amountMinor: p.startingCapitalMinor }), kind: 'capital', amountMinor: p.startingCapitalMinor });
  for (const item of p.startupCosts) items.push({ key: proposalItemKey('startup', item), kind: 'startup', item });
  for (const item of p.recurringExpenses) items.push({ key: proposalItemKey('expense', item), kind: 'expense', item });
  for (const item of p.revenueStreams) items.push({ key: proposalItemKey('revenue', item), kind: 'revenue', item });
  return items;
}

export function pendingProposalItems(p: FinanceProposal | null | undefined, reviewed: readonly string[] | ReadonlySet<string>): ProposalItem[] {
  if (!p) return [];
  const set = reviewed instanceof Set ? reviewed : new Set(reviewed as readonly string[]);
  return proposalItems(p).filter((i) => !set.has(i.key));
}

/** Line draft for an accepted proposal item (basis `ai_estimate`). Null for the capital item. */
export function proposalItemToDraft(item: ProposalItem, fallbackLabel: string): LineDraft | null {
  const label = (raw: string) => cleanLabel(raw) || cleanLabel(fallbackLabel);
  const int = (n: number) => Math.min(FINANCE_LIMITS.maxAmountMinor, Math.max(0, Math.round(n)));
  switch (item.kind) {
    case 'capital':
      return null;
    case 'startup':
      return { kind: 'startup', label: label(item.item.label), amountMinor: int(item.item.amountMinor), category: cleanCategory(item.item.category), basis: 'ai_estimate' };
    case 'expense':
      return {
        kind: 'expense',
        label: label(item.item.label),
        monthlyAmountMinor: int(item.item.monthlyAmountMinor),
        category: cleanCategory(item.item.category),
        basis: 'ai_estimate',
      };
    case 'revenue':
      return {
        kind: 'revenue',
        label: label(item.item.label),
        unitPriceMinor: int(item.item.unitPriceMinor),
        unitVariableCostMinor: int(item.item.unitVariableCostMinor),
        monthlyUnits: Math.min(FINANCE_LIMITS.maxMonthlyUnits, Math.max(0, round2(item.item.monthlyUnits))),
        monthlyGrowthPct: Math.min(FINANCE_LIMITS.maxGrowthPct, Math.max(FINANCE_LIMITS.minGrowthPct, round2(item.item.monthlyGrowthPct))),
        basis: 'ai_estimate',
      };
  }
}

export function proposalCapitalMinor(item: ProposalItem): number | null {
  return item.kind === 'capital' ? Math.min(FINANCE_LIMITS.maxAmountMinor, Math.max(0, Math.round(item.amountMinor))) : null;
}
