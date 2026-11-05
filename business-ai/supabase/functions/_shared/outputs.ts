/**
 * AI output schemas that are not part of the shared domain contract, and the conversions from
 * validated AI output to stored / returned shapes (ids assigned server-side, money converted to
 * integer minor units, strings trimmed to the DB limits).
 */
import { z } from 'zod';
import { type AdvisorAction, AdvisorActionSchema, type FinanceProposal, type RoadmapSuggestion } from './domain/ai-api.ts';
import type { AiMarketingContent, MarketingContent, MarketingKind } from './domain/marketing.ts';
import { MarketingContentSchema } from './domain/marketing.ts';
import {
  type AiFinanceProposal,
  type AiPlanSection,
  AiPlanSectionSchema,
  type AiRoadmap,
  type PlanSectionContent,
  PlanSectionContentSchema,
  type PlanSectionKey,
  ROADMAP_PHASES,
  RoadmapPhaseSchema,
  TASK_PRIORITIES,
  toMinorUnits,
} from './domain/plan.ts';
import type { Locale } from './domain/ai-api.ts';
import { AiCallError } from './ai/errors.ts';
import { MAX_ADVISOR_ACTIONS, MAX_FOLLOW_UPS } from './prompts/advisor.ts';

export type IdFactory = () => string;
export const randomId: IdFactory = () => crypto.randomUUID();

/** Max amount accepted by every *_minor column (0…1e13). */
export const MAX_MINOR = 10_000_000_000_000;

function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max).trimEnd();
}

/* ------------------------------------------------------------------------------------------ */
/* Plan                                                                                       */
/* ------------------------------------------------------------------------------------------ */

/** {"sections": {<key>: AiPlanSection, ...}} for one generation group (every key required). */
export function planGroupSchema(keys: readonly PlanSectionKey[]) {
  const shape: Record<string, typeof AiPlanSectionSchema> = {};
  for (const k of keys) shape[k] = AiPlanSectionSchema;
  return z.object({ sections: z.object(shape) });
}

/**
 * AI section → stored PlanSectionContent: blank blocks dropped, text trimmed to 2000 chars, block
 * ids b1…bn. Throws ai_invalid_output when nothing usable remains.
 */
export function toPlanSectionContent(ai: AiPlanSection): PlanSectionContent {
  const blocks = ai.blocks
    .map((b) => ({ text: clip(b.text, 2000), basis: b.basis }))
    .filter((b) => b.text.length > 0)
    .slice(0, 24)
    .map((b, i) => ({ id: `b${i + 1}`, text: b.text, basis: b.basis }));
  const content = { summary: clip(ai.summary, 600), blocks };
  const parsed = PlanSectionContentSchema.safeParse(content);
  if (!parsed.success) {
    throw new AiCallError('ai_invalid_output', undefined, { details: { op: 'plan_section:content' } });
  }
  return parsed.data;
}

/* ------------------------------------------------------------------------------------------ */
/* Roadmap                                                                                    */
/* ------------------------------------------------------------------------------------------ */

/** Ensures exactly one entry per phase and returns the phases in canonical order. */
export function normalizeRoadmap(ai: AiRoadmap): AiRoadmap {
  const byPhase = new Map(ai.phases.map((p) => [p.phase, p]));
  if (byPhase.size !== ROADMAP_PHASES.length) {
    throw new AiCallError('ai_invalid_output', undefined, { details: { op: 'roadmap:phases' } });
  }
  const phases = ROADMAP_PHASES.map((ph) => byPhase.get(ph)).filter((p): p is AiRoadmap['phases'][number] => !!p);
  return { phases };
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const AiRoadmapSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(1000),
        phase: RoadmapPhaseSchema,
        priority: z.enum(TASK_PRIORITIES),
        due_in_days: z.number().int().min(0).max(365),
        rationale: z.string().max(600),
      }),
    )
    .min(1)
    .max(8),
});
export type AiRoadmapSuggestions = z.infer<typeof AiRoadmapSuggestionsSchema>;

export function toRoadmapSuggestions(ai: AiRoadmapSuggestions, newId: IdFactory = randomId): RoadmapSuggestion[] {
  return ai.suggestions
    .map((s) => ({
      id: newId(),
      title: clip(s.title, 200),
      description: clip(s.description, 1000),
      phase: s.phase,
      priority: s.priority,
      dueInDays: Math.min(365, Math.max(0, Math.round(s.due_in_days))),
      rationale: clip(s.rationale, 600),
    }))
    .filter((s) => s.title.length > 0);
}

/* ------------------------------------------------------------------------------------------ */
/* Finance                                                                                    */
/* ------------------------------------------------------------------------------------------ */

function minor(major: number): number {
  return Math.min(MAX_MINOR, Math.max(0, toMinorUnits(major)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** AI finance proposal (major units) → FinanceProposal (integer minor units, ids, trimmed labels). */
export function toFinanceProposal(ai: AiFinanceProposal, newId: IdFactory = randomId): FinanceProposal {
  return {
    startingCapitalMinor: ai.starting_capital === null ? null : minor(ai.starting_capital),
    startupCosts: ai.startup_costs
      .map((c) => ({ id: newId(), label: clip(c.label, 120), amountMinor: minor(c.amount), category: clip(c.category, 60) }))
      .filter((c) => c.label.length > 0),
    recurringExpenses: ai.recurring_expenses
      .map((e) => ({
        id: newId(),
        label: clip(e.label, 120),
        monthlyAmountMinor: minor(e.monthly_amount),
        category: clip(e.category, 60),
      }))
      .filter((e) => e.label.length > 0),
    revenueStreams: ai.revenue_streams
      .map((s) => ({
        id: newId(),
        label: clip(s.label, 120),
        unitPriceMinor: minor(s.unit_price),
        unitVariableCostMinor: minor(s.unit_variable_cost),
        monthlyUnits: Math.min(9_999_999_999.99, Math.max(0, round2(s.monthly_units))),
        monthlyGrowthPct: Math.min(100, Math.max(-50, round2(s.monthly_growth_pct))),
      }))
      .filter((s) => s.label.length > 0),
    notes: clip(ai.notes, 800),
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Marketing                                                                                  */
/* ------------------------------------------------------------------------------------------ */

const DEFAULT_MARKETING_TITLES: Record<Locale, Record<MarketingKind, string>> = {
  he: {
    positioning: 'מיצוב',
    name_ideas: 'רעיונות לשם',
    taglines: 'סלוגנים',
    personas: 'פרסונות',
    social_strategy: 'אסטרטגיית רשתות חברתיות',
    content_calendar: 'לוח תוכן',
    launch_campaign: 'קמפיין השקה',
    marketing_copy: 'טקסטים שיווקיים',
    acquisition_experiments: 'ניסויי גיוס לקוחות',
  },
  en: {
    positioning: 'Positioning',
    name_ideas: 'Name ideas',
    taglines: 'Taglines',
    personas: 'Personas',
    social_strategy: 'Social media strategy',
    content_calendar: 'Content calendar',
    launch_campaign: 'Launch campaign',
    marketing_copy: 'Marketing copy',
    acquisition_experiments: 'Acquisition experiments',
  },
};

export function toMarketingContent(
  ai: AiMarketingContent,
  kind: MarketingKind,
  locale: Locale,
): { title: string; content: MarketingContent } {
  const items = ai.items
    .map((it) => ({ heading: clip(it.heading, 200), body: clip(it.body, 3000), label: clip(it.label, 60) }))
    .filter((it) => it.heading.length > 0 || it.body.length > 0)
    .slice(0, 40)
    .map((it, i) => ({ id: `i${i + 1}`, heading: it.heading, body: it.body, ...(it.label ? { label: it.label } : {}) }));
  const content = { summary: clip(ai.summary, 1200), items };
  const parsed = MarketingContentSchema.safeParse(content);
  if (!parsed.success || items.length === 0) {
    throw new AiCallError('ai_invalid_output', undefined, { details: { op: 'marketing:content' } });
  }
  const title = clip(ai.title, 140) || DEFAULT_MARKETING_TITLES[locale][kind];
  return { title, content: parsed.data };
}

/* ------------------------------------------------------------------------------------------ */
/* Advisor actions                                                                            */
/* ------------------------------------------------------------------------------------------ */

const STRING_LIMITS: Record<string, number> = {
  label: 140,
  title: 200,
  description: 1000,
  expenseLabel: 120,
  costLabel: 120,
};

function normalizeActionFields(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  for (const [key, max] of Object.entries(STRING_LIMITS)) {
    const v = out[key];
    if (typeof v === 'string') out[key] = clip(v, max);
  }
  if (typeof out.dueInDays === 'number' && Number.isFinite(out.dueInDays)) {
    out.dueInDays = Math.min(365, Math.max(0, Math.round(out.dueInDays)));
  }
  for (const key of ['monthlyAmountMinor', 'amountMinor']) {
    const v = out[key];
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = Math.min(MAX_MINOR, Math.max(0, Math.round(v)));
  }
  return out;
}

/**
 * Validates `propose_actions` tool input. Never throws: invalid actions are dropped, blank labels
 * rejected, ids assigned server-side; follow-ups are trimmed, de-duplicated and capped at 3.
 */
export function parseProposeActionsInput(
  input: unknown,
  newId: IdFactory = randomId,
): { actions: AdvisorAction[]; followUps: string[] } {
  const actions: AdvisorAction[] = [];
  const followUps: string[] = [];
  if (typeof input !== 'object' || input === null) return { actions, followUps };
  const obj = input as Record<string, unknown>;
  if (Array.isArray(obj.actions)) {
    for (const raw of obj.actions) {
      if (actions.length >= MAX_ADVISOR_ACTIONS) break;
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue;
      const candidate = { ...normalizeActionFields(raw as Record<string, unknown>), id: newId() };
      const parsed = AdvisorActionSchema.safeParse(candidate);
      if (!parsed.success) continue;
      const a = parsed.data;
      if (a.label.length === 0) continue;
      if ((a.type === 'add_task' || a.type === 'add_milestone') && a.title.length === 0) continue;
      if (a.type === 'add_recurring_expense' && a.expenseLabel.length === 0) continue;
      if (a.type === 'add_startup_cost' && a.costLabel.length === 0) continue;
      actions.push(a);
    }
  }
  const rawFollowUps = Array.isArray(obj.follow_ups) ? obj.follow_ups : Array.isArray(obj.followUps) ? obj.followUps : [];
  for (const f of rawFollowUps) {
    if (followUps.length >= MAX_FOLLOW_UPS) break;
    if (typeof f !== 'string') continue;
    const t = clip(f, 200);
    if (t && !followUps.includes(t)) followUps.push(t);
  }
  return { actions, followUps };
}
