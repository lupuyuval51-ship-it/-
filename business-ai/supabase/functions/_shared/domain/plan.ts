/**
 * Business plan domain contract — shared by the Expo app (via the `@domain/*` alias)
 * and the Supabase Edge Functions (Deno). Keep this file environment-neutral:
 * it may only import `zod`.
 */
import { z } from 'zod';

/** Ordered list of plan sections. Order here is the display order. */
export const PLAN_SECTION_KEYS = [
  'executive_summary',
  'business_concept',
  'value_proposition',
  'target_audience',
  'customer_personas',
  'market_validation',
  'competitive_positioning',
  'revenue_model',
  'pricing_strategy',
  'startup_costs',
  'operating_expenses',
  'marketing_strategy',
  'launch_strategy',
  'risks_assumptions',
  'roadmap_30_60_90',
] as const;

export type PlanSectionKey = (typeof PLAN_SECTION_KEYS)[number];
export const PlanSectionKeySchema = z.enum(PLAN_SECTION_KEYS);

/**
 * Generation groups: sections generated together in one AI call so related sections stay
 * consistent while the whole plan is generated in parallel (latency).
 */
export const PLAN_GENERATION_GROUPS: readonly (readonly PlanSectionKey[])[] = [
  ['executive_summary', 'business_concept', 'value_proposition', 'target_audience', 'customer_personas'],
  ['market_validation', 'competitive_positioning', 'revenue_model', 'pricing_strategy'],
  ['startup_costs', 'operating_expenses', 'marketing_strategy', 'launch_strategy', 'risks_assumptions', 'roadmap_30_60_90'],
] as const;

/**
 * Provenance of every statement in the plan.
 * - user_provided: restates something the user told us (onboarding / edits)
 * - assumption: a working assumption that must be validated
 * - ai_estimate: a number or judgement estimated by the AI — never a guarantee
 * - verified: confirmed by the user against a source (only the user can set this; requires `source`)
 */
export const BASIS_VALUES = ['user_provided', 'assumption', 'ai_estimate', 'verified'] as const;
export type Basis = (typeof BASIS_VALUES)[number];
export const BasisSchema = z.enum(BASIS_VALUES);

/** The subset of bases the AI is allowed to emit. The AI can never mark content as verified. */
export const AI_BASIS_VALUES = ['user_provided', 'assumption', 'ai_estimate'] as const;
export type AiBasis = (typeof AI_BASIS_VALUES)[number];

export const SourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.url().max(500),
});
export type Source = z.infer<typeof SourceSchema>;

export const PlanBlockSchema = z
  .object({
    id: z.string().min(1).max(40),
    text: z.string().trim().min(1).max(2000),
    basis: BasisSchema,
    source: SourceSchema.nullable().optional(),
  })
  .refine((b) => b.basis !== 'verified' || !!b.source, {
    message: 'A verified statement must cite a source',
    path: ['source'],
  });
export type PlanBlock = z.infer<typeof PlanBlockSchema>;

/** Stored in plan_sections.content (jsonb). */
export const PlanSectionContentSchema = z.object({
  /** One or two sentence lede shown at the top of the section. */
  summary: z.string().trim().max(600),
  blocks: z.array(PlanBlockSchema).min(1).max(24),
});
export type PlanSectionContent = z.infer<typeof PlanSectionContentSchema>;

/** Shape the AI must return for a single section (ids are assigned server-side). */
export const AiPlanSectionSchema = z.object({
  summary: z.string().max(600),
  blocks: z
    .array(
      z.object({
        text: z.string().max(2000),
        basis: z.enum(AI_BASIS_VALUES),
      }),
    )
    .min(1)
    .max(12),
});
export type AiPlanSection = z.infer<typeof AiPlanSectionSchema>;

export const PLAN_VERSION_ORIGINS = ['ai_generated', 'user_edit', 'ai_section', 'restored'] as const;
export type PlanVersionOrigin = (typeof PLAN_VERSION_ORIGINS)[number];

export const PLAN_VERSION_STATUSES = ['generating', 'ready', 'failed'] as const;
export type PlanVersionStatus = (typeof PLAN_VERSION_STATUSES)[number];

export const ROADMAP_PHASES = ['days_30', 'days_60', 'days_90'] as const;
export type RoadmapPhase = (typeof ROADMAP_PHASES)[number];
export const RoadmapPhaseSchema = z.enum(ROADMAP_PHASES);

export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** AI output for roadmap generation. Offsets are days from the roadmap start date. */
export const AiRoadmapSchema = z.object({
  phases: z
    .array(
      z.object({
        phase: RoadmapPhaseSchema,
        objective: z.string().max(400),
        milestones: z
          .array(z.object({ title: z.string().max(200), offset_days: z.number().int().min(0).max(120) }))
          .max(4),
        tasks: z
          .array(
            z.object({
              /** Stable reference inside this payload, e.g. "t1" — used by depends_on. */
              ref: z.string().max(12),
              title: z.string().max(200),
              description: z.string().max(1000),
              priority: z.enum(TASK_PRIORITIES),
              offset_days: z.number().int().min(0).max(120),
              /** Index into this phase's milestones array, or null. */
              milestone_index: z.number().int().min(0).max(3).nullable(),
              depends_on: z.array(z.string().max(12)).max(4),
            }),
          )
          .min(1)
          .max(10),
      }),
    )
    .length(3),
});
export type AiRoadmap = z.infer<typeof AiRoadmapSchema>;

/** Money in AI payloads is expressed in major units (e.g. 1200.5) and converted to integer minor units server-side. */
export const AiFinanceProposalSchema = z.object({
  starting_capital: z.number().min(0).nullable(),
  startup_costs: z.array(z.object({ label: z.string().max(120), amount: z.number().min(0), category: z.string().max(60) })).max(15),
  recurring_expenses: z.array(z.object({ label: z.string().max(120), monthly_amount: z.number().min(0), category: z.string().max(60) })).max(15),
  revenue_streams: z
    .array(
      z.object({
        label: z.string().max(120),
        unit_price: z.number().min(0),
        unit_variable_cost: z.number().min(0),
        monthly_units: z.number().min(0),
        monthly_growth_pct: z.number().min(-50).max(100),
      }),
    )
    .max(6),
  notes: z.string().max(800),
});
export type AiFinanceProposal = z.infer<typeof AiFinanceProposalSchema>;

/** Convert a major-unit amount to integer minor units (2-decimal currencies). */
export function toMinorUnits(major: number): number {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * 100);
}
