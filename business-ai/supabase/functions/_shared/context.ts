/**
 * Business context for prompts. Everything is loaded through the USER client (RLS applies, so a
 * user can only ever pull their own data into a prompt) and truncated to fixed limits.
 */
import type { Db } from './auth.ts';
import { AppError, fromPostgrestError } from './errors.ts';
import {
  DEFAULT_SCENARIOS,
  type FinanceInputs,
  type FinanceSummary,
  scenarioSettingsFromModel,
  summarize,
} from './domain/finance.ts';
import { ONBOARDING_KEYS, type OnboardingKey, parseOnboardingValue } from './domain/onboarding.ts';
import {
  PLAN_SECTION_KEYS,
  type PlanSectionContent,
  PlanSectionContentSchema,
  type PlanSectionKey,
} from './domain/plan.ts';
import { truncate } from './prompts/common.ts';

/* ------------------------------------------------------------------------------------------ */
/* Limits                                                                                     */
/* ------------------------------------------------------------------------------------------ */

export const CONTEXT_LIMITS = Object.freeze({
  /** Hard cap of the rendered context (characters). */
  maxChars: 48_000,
  field: 1_500,
  idea: 4_000,
  sectionSummary: 600,
  blockText: 400,
  blocksPerSection: 6,
  focusBlockText: 1_500,
  focusBlocks: 24,
  financeLines: 15,
  openTasks: 40,
  milestones: 20,
  goals: 10,
  actualMonths: 6,
});

/* ------------------------------------------------------------------------------------------ */
/* Types                                                                                      */
/* ------------------------------------------------------------------------------------------ */

export interface BusinessInfo {
  id: string;
  name: string;
  idea: string;
  stage: string;
  countryCode: string | null;
  currency: string;
}

export type OnboardingAnswerMap = Partial<Record<OnboardingKey, { value: unknown; skipped: boolean }>>;

export interface PlanSnapshot {
  planId: string;
  versionId: string;
  sections: { key: PlanSectionKey; content: PlanSectionContent }[];
}

export interface FinanceSnapshot {
  hasModel: boolean;
  forecastMonths: number;
  startingCapitalMinor: number;
  startupCosts: { label: string; amountMinor: number; basis: string }[];
  recurringExpenses: { label: string; monthlyAmountMinor: number; basis: string }[];
  revenueStreams: {
    label: string;
    unitPriceMinor: number;
    unitVariableCostMinor: number;
    monthlyUnits: number;
    monthlyGrowthPct: number;
    basis: string;
  }[];
  summary: FinanceSummary | null;
}

export interface RoadmapSnapshot {
  openTasks: {
    title: string;
    status: string;
    priority: string;
    phase: string | null;
    dueDate: string | null;
    source: string;
  }[];
  doneCount: number;
  aiTaskCount: number;
  milestones: { title: string; phase: string; targetDate: string | null; achieved: boolean }[];
}

export interface GoalSnapshot {
  title: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: string | null;
  status: string;
}

export interface ActualsSnapshot {
  months: { month: string; incomeMinor: number; expenseMinor: number; count: number }[];
}

export interface BusinessContext {
  business: BusinessInfo;
  onboarding: OnboardingAnswerMap;
  plan: PlanSnapshot | null;
  finance: FinanceSnapshot | null;
  roadmap: RoadmapSnapshot | null;
  goals: GoalSnapshot[] | null;
  actuals: ActualsSnapshot | null;
}

export interface ContextOptions {
  plan?: boolean;
  finance?: boolean;
  roadmap?: boolean;
  goals?: boolean;
  actuals?: boolean;
  /** Clock for "recent actuals" (tests). */
  now?: Date;
}

/* ------------------------------------------------------------------------------------------ */
/* Loading                                                                                    */
/* ------------------------------------------------------------------------------------------ */

/** Loads a business the caller owns. RLS hides other users' rows → `not_found`. */
export async function loadBusiness(db: Db, businessId: string): Promise<BusinessInfo> {
  const { data, error } = await db
    .from('businesses')
    .select('id,name,idea,stage,country_code,currency,archived_at')
    .eq('id', businessId)
    .maybeSingle();
  if (error) throw fromPostgrestError(error, 'businesses.select');
  if (!data) throw new AppError('not_found', 'Business not found.');
  return {
    id: data.id,
    name: data.name,
    idea: data.idea,
    stage: data.stage,
    countryCode: data.country_code,
    currency: data.currency,
  };
}

export async function loadOnboarding(db: Db, businessId: string): Promise<OnboardingAnswerMap> {
  const { data, error } = await db
    .from('onboarding_responses')
    .select('question_key,value,skipped')
    .eq('business_id', businessId);
  if (error) throw fromPostgrestError(error, 'onboarding_responses.select');
  const out: OnboardingAnswerMap = {};
  for (const row of data ?? []) {
    if ((ONBOARDING_KEYS as readonly string[]).includes(row.question_key)) {
      out[row.question_key as OnboardingKey] = { value: row.value, skipped: row.skipped };
    }
  }
  return out;
}

/** The business idea answer (required before any plan generation), or null. */
export function businessIdeaAnswer(onboarding: OnboardingAnswerMap): { idea: string; name?: string } | null {
  const answer = onboarding.business_idea;
  if (!answer || answer.skipped) return null;
  return parseOnboardingValue('business_idea', answer.value);
}

export async function loadCurrentPlan(db: Db, businessId: string): Promise<PlanSnapshot | null> {
  const { data, error } = await db
    .from('business_plans')
    .select(
      'id,current_version_id,current:plan_versions!business_plans_current_version_id_fkey(id,status,plan_sections(section_key,content))',
    )
    .eq('business_id', businessId)
    .maybeSingle();
  if (error) throw fromPostgrestError(error, 'business_plans.select');
  const current = data?.current;
  if (!data || !current || current.status !== 'ready') return null;
  const sections: PlanSnapshot['sections'] = [];
  for (const row of current.plan_sections ?? []) {
    const parsed = PlanSectionContentSchema.safeParse(row.content);
    if (parsed.success && (PLAN_SECTION_KEYS as readonly string[]).includes(row.section_key)) {
      sections.push({ key: row.section_key as PlanSectionKey, content: parsed.data });
    }
  }
  sections.sort((a, b) => PLAN_SECTION_KEYS.indexOf(a.key) - PLAN_SECTION_KEYS.indexOf(b.key));
  return { planId: data.id, versionId: current.id, sections };
}

export async function loadFinance(db: Db, businessId: string): Promise<FinanceSnapshot | null> {
  const lim = CONTEXT_LIMITS.financeLines;
  const [model, costs, expenses, streams] = await Promise.all([
    db.from('financial_models').select('*').eq('business_id', businessId).maybeSingle(),
    db.from('startup_costs').select('label,amount_minor,basis').eq('business_id', businessId).order('sort_order').limit(
      lim,
    ),
    db.from('recurring_expenses').select('label,monthly_amount_minor,basis').eq('business_id', businessId).order(
      'sort_order',
    ).limit(lim),
    db
      .from('revenue_streams')
      .select('label,unit_price_minor,unit_variable_cost_minor,monthly_units,monthly_growth_pct,basis')
      .eq('business_id', businessId)
      .order('sort_order')
      .limit(lim),
  ]);
  for (
    const [res, op] of [[model, 'financial_models'], [costs, 'startup_costs'], [expenses, 'recurring_expenses'], [
      streams,
      'revenue_streams',
    ]] as const
  ) {
    if (res.error) throw fromPostgrestError(res.error, `${op}.select`);
  }
  const snapshot: FinanceSnapshot = {
    hasModel: !!model.data,
    forecastMonths: model.data?.forecast_months ?? 12,
    startingCapitalMinor: model.data?.starting_capital_minor ?? 0,
    startupCosts: (costs.data ?? []).map((r) => ({ label: r.label, amountMinor: r.amount_minor, basis: r.basis })),
    recurringExpenses: (expenses.data ?? []).map((r) => ({
      label: r.label,
      monthlyAmountMinor: r.monthly_amount_minor,
      basis: r.basis,
    })),
    revenueStreams: (streams.data ?? []).map((r) => ({
      label: r.label,
      unitPriceMinor: r.unit_price_minor,
      unitVariableCostMinor: r.unit_variable_cost_minor,
      monthlyUnits: Number(r.monthly_units),
      monthlyGrowthPct: Number(r.monthly_growth_pct),
      basis: r.basis,
    })),
    summary: null,
  };
  const hasLines =
    snapshot.startupCosts.length + snapshot.recurringExpenses.length + snapshot.revenueStreams.length > 0;
  if (!snapshot.hasModel && !hasLines) return null;
  if (hasLines) {
    const inputs: FinanceInputs = {
      startingCapitalMinor: snapshot.startingCapitalMinor,
      startupCosts: snapshot.startupCosts.map((c) => ({ label: c.label, amountMinor: c.amountMinor })),
      recurringExpenses: snapshot.recurringExpenses.map((e) => ({
        label: e.label,
        monthlyAmountMinor: e.monthlyAmountMinor,
      })),
      revenueStreams: snapshot.revenueStreams.map((s) => ({
        label: s.label,
        unitPriceMinor: s.unitPriceMinor,
        unitVariableCostMinor: s.unitVariableCostMinor,
        monthlyUnits: s.monthlyUnits,
        monthlyGrowthPct: s.monthlyGrowthPct,
      })),
      forecastMonths: snapshot.forecastMonths,
      scenarios: model.data ? scenarioSettingsFromModel(model.data) : {
        conservative: { ...DEFAULT_SCENARIOS.conservative },
        expected: { ...DEFAULT_SCENARIOS.expected },
        optimistic: { ...DEFAULT_SCENARIOS.optimistic },
      },
    };
    snapshot.summary = summarize(inputs, 'expected');
  }
  return snapshot;
}

export async function loadRoadmap(db: Db, businessId: string): Promise<RoadmapSnapshot> {
  const [open, done, ai, milestones] = await Promise.all([
    db
      .from('tasks')
      .select('title,status,priority,phase,due_date,source')
      .eq('business_id', businessId)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('sort_order')
      .limit(CONTEXT_LIMITS.openTasks),
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'done'),
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('source', 'ai'),
    db
      .from('milestones')
      .select('title,phase,target_date,achieved_at')
      .eq('business_id', businessId)
      .order('target_date', { ascending: true, nullsFirst: false })
      .limit(CONTEXT_LIMITS.milestones),
  ]);
  for (
    const [res, op] of [[open, 'tasks'], [done, 'tasks.count'], [ai, 'tasks.count_ai'], [
      milestones,
      'milestones',
    ]] as const
  ) {
    if (res.error) throw fromPostgrestError(res.error, `${op}.select`);
  }
  return {
    openTasks: (open.data ?? []).map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      phase: t.phase,
      dueDate: t.due_date,
      source: t.source,
    })),
    doneCount: done.count ?? 0,
    aiTaskCount: ai.count ?? 0,
    milestones: (milestones.data ?? []).map((m) => ({
      title: m.title,
      phase: m.phase,
      targetDate: m.target_date,
      achieved: m.achieved_at !== null,
    })),
  };
}

/** Number of AI-sourced tasks (any status) of a business. */
export async function countAiTasks(db: Db, businessId: string): Promise<number> {
  const { count, error } = await db
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('source', 'ai');
  if (error) throw fromPostgrestError(error, 'tasks.count_ai');
  return count ?? 0;
}

export async function loadGoals(db: Db, businessId: string): Promise<GoalSnapshot[]> {
  const { data, error } = await db
    .from('business_goals')
    .select('title,metric,target_value,current_value,unit,due_date,status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(CONTEXT_LIMITS.goals);
  if (error) throw fromPostgrestError(error, 'business_goals.select');
  return (data ?? []).map((g) => ({
    title: g.title,
    metric: g.metric,
    targetValue: Number(g.target_value),
    currentValue: Number(g.current_value),
    unit: g.unit,
    dueDate: g.due_date,
    status: g.status,
  }));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function loadActuals(db: Db, businessId: string, now: Date): Promise<ActualsSnapshot> {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (CONTEXT_LIMITS.actualMonths - 1), 1));
  const { data, error } = await db
    .from('transactions')
    .select('kind,amount_minor,occurred_on')
    .eq('business_id', businessId)
    .gte('occurred_on', isoDate(from))
    .order('occurred_on', { ascending: false })
    .limit(1000);
  if (error) throw fromPostgrestError(error, 'transactions.select');
  const byMonth = new Map<string, { incomeMinor: number; expenseMinor: number; count: number }>();
  for (const t of data ?? []) {
    const month = t.occurred_on.slice(0, 7);
    const agg = byMonth.get(month) ?? { incomeMinor: 0, expenseMinor: 0, count: 0 };
    if (t.kind === 'income') agg.incomeMinor += t.amount_minor;
    else agg.expenseMinor += t.amount_minor;
    agg.count += 1;
    byMonth.set(month, agg);
  }
  const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  return { months };
}

export async function loadBusinessContext(
  db: Db,
  businessId: string,
  opts: ContextOptions = {},
): Promise<BusinessContext> {
  const business = await loadBusiness(db, businessId);
  const [onboarding, plan, finance, roadmap, goals, actuals] = await Promise.all([
    loadOnboarding(db, businessId),
    opts.plan ? loadCurrentPlan(db, businessId) : Promise.resolve(null),
    opts.finance ? loadFinance(db, businessId) : Promise.resolve(null),
    opts.roadmap ? loadRoadmap(db, businessId) : Promise.resolve(null),
    opts.goals ? loadGoals(db, businessId) : Promise.resolve(null),
    opts.actuals ? loadActuals(db, businessId, opts.now ?? new Date()) : Promise.resolve(null),
  ]);
  return { business, onboarding, plan, finance, roadmap, goals, actuals };
}

/* ------------------------------------------------------------------------------------------ */
/* Rendering (plain text for the model; wrapped in <business_data> by the prompt builders)    */
/* ------------------------------------------------------------------------------------------ */

/** Major-unit display for prompts (2-decimal currencies, matching domain/plan.ts toMinorUnits). */
export function formatMinor(minor: number, currency: string): string {
  const major = minor / 100;
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${text} ${currency}`;
}

const EXPERIENCE_TEXT: Record<string, string> = {
  none: 'no business experience',
  some: 'some business experience',
  industry: 'experience in this industry',
  founder: 'has founded a business before',
};
const GOAL_TEXT: Record<string, string> = {
  side_income: 'side income',
  full_time: 'replace a full-time income',
  scale: 'build a scalable company',
  impact: 'social / community impact',
  other: 'other',
};
const HOURS_TEXT: Record<string, string> = {
  lt5: 'under 5 hours per week',
  h5_10: '5-10 hours per week',
  h10_20: '10-20 hours per week',
  h20_40: '20-40 hours per week',
  gt40: 'more than 40 hours per week',
};
const TIMELINE_TEXT: Record<string, string> = {
  m1: 'within 1 month',
  m3: 'within 3 months',
  m6: 'within 6 months',
  m12: 'within 12 months',
  unsure: 'not sure yet',
};

function renderOnboarding(o: OnboardingAnswerMap): string[] {
  const L = CONTEXT_LIMITS;
  const lines: string[] = [];
  const get = <K extends OnboardingKey>(key: K) => {
    const a = o[key];
    return a && !a.skipped ? parseOnboardingValue(key, a.value) : null;
  };
  const idea = get('business_idea');
  if (idea) {
    if (idea.name) lines.push(`- Working name: ${truncate(idea.name, 120)}`);
    lines.push(`- Business idea (user's words): ${truncate(idea.idea, L.idea)}`);
  }
  const country = get('country');
  if (country) lines.push(`- Country: ${country.code}`);
  const budget = get('starting_budget');
  if (budget) lines.push(`- Starting budget: ${formatMinor(budget.amount_minor, budget.currency)}`);
  const exp = get('experience');
  if (exp) {
    lines.push(
      `- Experience: ${EXPERIENCE_TEXT[exp.level] ?? exp.level}${
        exp.details ? ` — ${truncate(exp.details, L.field)}` : ''
      }`,
    );
  }
  const customers = get('target_customers');
  if (customers) lines.push(`- Target customers (user's words): ${truncate(customers.text, L.field)}`);
  const goal = get('primary_goal');
  if (goal) {
    lines.push(
      `- Primary goal: ${GOAL_TEXT[goal.goal] ?? goal.goal}${
        goal.details ? ` — ${truncate(goal.details, L.field)}` : ''
      }`,
    );
  }
  const hours = get('weekly_hours');
  if (hours) lines.push(`- Time available: ${HOURS_TEXT[hours.range] ?? hours.range}`);
  const timeline = get('launch_timeline');
  if (timeline) lines.push(`- Desired launch: ${TIMELINE_TEXT[timeline.timeline] ?? timeline.timeline}`);
  const skipped = ONBOARDING_KEYS.filter((k) => o[k]?.skipped || !o[k]);
  if (skipped.length > 0) lines.push(`- Not answered: ${skipped.join(', ')} (treat as unknown; do not assume values)`);
  return lines;
}

function renderSection(key: PlanSectionKey, content: PlanSectionContent, full: boolean): string[] {
  const L = CONTEXT_LIMITS;
  const lines = [`## ${key}`, `Summary: ${truncate(content.summary, L.sectionSummary)}`];
  const blocks = content.blocks.slice(0, full ? L.focusBlocks : L.blocksPerSection);
  for (const b of blocks) {
    lines.push(`- [${b.basis}] ${truncate(b.text, full ? L.focusBlockText : L.blockText)}`);
  }
  if (content.blocks.length > blocks.length) {
    lines.push(`- (${content.blocks.length - blocks.length} more statements omitted)`);
  }
  return lines;
}

export interface RenderOptions {
  /** Section rendered in full (section regeneration). */
  focusSection?: PlanSectionKey;
  /** Omit the focus section from the "other sections" list. */
  excludeFocusFromPlan?: boolean;
}

export function renderBusinessContext(ctx: BusinessContext, opts: RenderOptions = {}): string {
  const L = CONTEXT_LIMITS;
  const cur = ctx.business.currency;
  const out: string[] = [];

  out.push('# Business');
  out.push(`- Name: ${truncate(ctx.business.name, 120)}`);
  if (ctx.business.idea.trim()) out.push(`- Description: ${truncate(ctx.business.idea, L.idea)}`);
  out.push(`- Stage: ${ctx.business.stage}`);
  if (ctx.business.countryCode) out.push(`- Country: ${ctx.business.countryCode}`);
  out.push(`- Currency: ${cur}`);

  const onboarding = renderOnboarding(ctx.onboarding);
  if (onboarding.length > 0) out.push('', '# Onboarding answers', ...onboarding);

  if (ctx.plan && ctx.plan.sections.length > 0) {
    if (opts.focusSection) {
      const focus = ctx.plan.sections.find((s) => s.key === opts.focusSection);
      out.push('', '# Current version of the section to rewrite');
      if (focus) out.push(...renderSection(focus.key, focus.content, true));
      else out.push('(this section is empty in the current plan)');
    }
    const others = ctx.plan.sections.filter((s) => !(opts.excludeFocusFromPlan && s.key === opts.focusSection));
    if (others.length > 0) {
      out.push('', '# Current business plan (abridged)');
      for (const s of others) out.push(...renderSection(s.key, s.content, false));
    }
  }

  if (ctx.finance) {
    const f = ctx.finance;
    out.push('', '# Financial model (user-entered assumptions; amounts per unit/month)');
    out.push(
      `- Starting capital: ${formatMinor(f.startingCapitalMinor, cur)}; forecast horizon ${f.forecastMonths} months`,
    );
    for (const c of f.startupCosts) {
      out.push(`- Startup cost: ${truncate(c.label, 120)} = ${formatMinor(c.amountMinor, cur)} [${c.basis}]`);
    }
    for (const e of f.recurringExpenses) {
      out.push(`- Monthly expense: ${truncate(e.label, 120)} = ${formatMinor(e.monthlyAmountMinor, cur)} [${e.basis}]`);
    }
    for (const s of f.revenueStreams) {
      out.push(
        `- Revenue stream: ${truncate(s.label, 120)} — price ${formatMinor(s.unitPriceMinor, cur)}, variable cost ${
          formatMinor(s.unitVariableCostMinor, cur)
        }, ${s.monthlyUnits} units in month 1, growth ${s.monthlyGrowthPct}%/month [${s.basis}]`,
      );
    }
    if (f.summary) {
      const s = f.summary;
      const fc = s.forecast;
      out.push('- Computed by the app (expected scenario, estimates only):');
      out.push(
        `  - Total startup costs ${formatMinor(s.startupCostsMinor, cur)}; fixed costs ${
          formatMinor(s.monthlyFixedCostsMinor, cur)
        }/month`,
      );
      out.push(
        `  - Month 1 revenue ${formatMinor(s.month1RevenueMinor, cur)}, month 1 net ${
          formatMinor(s.month1NetMinor, cur)
        }`,
      );
      out.push(
        `  - Break-even revenue needed ${
          s.breakEven.monthlyRevenueNeededMinor === null
            ? 'not reachable with current margins'
            : `${formatMinor(s.breakEven.monthlyRevenueNeededMinor, cur)}/month`
        }${s.breakEven.unitsNeeded === null ? '' : ` (${s.breakEven.unitsNeeded} units/month)`}`,
      );
      out.push(
        `  - Cash: opening ${formatMinor(fc.openingCashMinor, cur)}, lowest ${
          formatMinor(fc.lowestCashMinor, cur)
        } (month ${fc.lowestCashMonth}), ending ${formatMinor(fc.endingCashMinor, cur)}; first profitable month ${
          fc.firstProfitableMonth ?? 'none'
        }; cash runs out in month ${fc.cashOutMonth ?? 'never within horizon'}; payback month ${
          fc.breakEvenMonth ?? 'none'
        }`,
      );
    }
  }

  if (ctx.roadmap) {
    const r = ctx.roadmap;
    out.push('', `# Roadmap progress: ${r.doneCount} tasks done, ${r.openTasks.length} open shown`);
    for (const m of r.milestones) {
      out.push(
        `- Milestone (${m.phase}${m.targetDate ? `, ${m.targetDate}` : ''}${m.achieved ? ', achieved' : ''}): ${
          truncate(m.title, 200)
        }`,
      );
    }
    for (const t of r.openTasks) {
      out.push(
        `- Task [${t.status}, ${t.priority}${t.phase ? `, ${t.phase}` : ''}${t.dueDate ? `, due ${t.dueDate}` : ''}]: ${
          truncate(t.title, 200)
        }`,
      );
    }
  }

  if (ctx.goals && ctx.goals.length > 0) {
    out.push('', '# Active goals');
    for (const g of ctx.goals) {
      const money = g.metric === 'revenue' || g.metric === 'profit';
      const target = money
        ? formatMinor(g.targetValue, cur)
        : `${g.targetValue}${g.unit ? ` ${truncate(g.unit, 20)}` : ''}`;
      const current = money ? '' : `, current ${g.currentValue}`;
      out.push(
        `- ${truncate(g.title, 200)} (${g.metric}: target ${target}${current}${g.dueDate ? `, due ${g.dueDate}` : ''})`,
      );
    }
  }

  if (ctx.actuals && ctx.actuals.months.length > 0) {
    out.push('', '# Actual results recorded by the user (by month)');
    for (const m of ctx.actuals.months) {
      out.push(
        `- ${m.month}: income ${formatMinor(m.incomeMinor, cur)}, expenses ${
          formatMinor(m.expenseMinor, cur)
        } (${m.count} entries)`,
      );
    }
  }

  const text = out.join('\n');
  return text.length > L.maxChars ? `${text.slice(0, L.maxChars)}\n(context truncated)` : text;
}
