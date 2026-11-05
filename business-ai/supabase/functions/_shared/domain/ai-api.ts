/**
 * HTTP contracts between the app and the AI Edge Functions.
 *
 * - `ai`      : POST JSON  -> JSON         (plan, roadmap, marketing, finance proposals)
 * - `advisor` : POST JSON  -> text/event-stream (contextual chat)
 *
 * Every request carries the user's Supabase JWT (Authorization: Bearer ...). The functions
 * read and write through RLS as that user; only usage records and assistant messages are
 * written with the service role.
 */
import { z } from 'zod';
import { PlanSectionKeySchema, RoadmapPhaseSchema, TASK_PRIORITIES, type PlanSectionContent } from './plan.ts';
import { MarketingKindSchema, type MarketingAsset } from './marketing.ts';

export const LocaleSchema = z.enum(['he', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

const Uuid = z.uuid();
const Instruction = z.string().trim().max(1000).optional();

export const AiRequestSchema = z.discriminatedUnion('action', [
  /** Starts async generation; returns 202 with the new plan version id (status 'generating'). */
  z.object({ action: z.literal('plan.generate'), businessId: Uuid, locale: LocaleSchema }),
  /** Returns a proposed replacement for one section. Nothing is persisted until the user accepts. */
  z.object({
    action: z.literal('plan.regenerateSection'),
    businessId: Uuid,
    sectionKey: PlanSectionKeySchema,
    instruction: Instruction,
    locale: LocaleSchema,
  }),
  /**
   * Generates the 30/60/90 roadmap from the current plan and persists phases, milestones and tasks.
   * mode 'create' fails with `conflict` if AI tasks already exist; 'replace_ai_items' removes open
   * AI-sourced tasks/milestones first (user-created and completed items are always kept).
   */
  z.object({
    action: z.literal('roadmap.generate'),
    businessId: Uuid,
    mode: z.enum(['create', 'replace_ai_items']),
    locale: LocaleSchema,
  }),
  /** Suggests new tasks given current progress. Nothing is persisted. */
  z.object({ action: z.literal('roadmap.recommend'), businessId: Uuid, instruction: Instruction, locale: LocaleSchema }),
  /** Generates a marketing asset and saves it as a new editable asset. */
  z.object({
    action: z.literal('marketing.generate'),
    businessId: Uuid,
    kind: MarketingKindSchema,
    instruction: Instruction,
    locale: LocaleSchema,
  }),
  /** Proposes financial assumptions. Nothing is persisted; the user accepts items individually. */
  z.object({ action: z.literal('finance.propose'), businessId: Uuid, locale: LocaleSchema }),
]);
export type AiRequest = z.infer<typeof AiRequestSchema>;
export type AiAction = AiRequest['action'];

export interface RoadmapSuggestion {
  id: string;
  title: string;
  description: string;
  phase: z.infer<typeof RoadmapPhaseSchema>;
  priority: (typeof TASK_PRIORITIES)[number];
  dueInDays: number;
  rationale: string;
}

/** Proposal amounts are integer minor units. */
export interface FinanceProposal {
  startingCapitalMinor: number | null;
  startupCosts: { id: string; label: string; amountMinor: number; category: string }[];
  recurringExpenses: { id: string; label: string; monthlyAmountMinor: number; category: string }[];
  revenueStreams: {
    id: string;
    label: string;
    unitPriceMinor: number;
    unitVariableCostMinor: number;
    monthlyUnits: number;
    monthlyGrowthPct: number;
  }[];
  notes: string;
}

export interface AiResponseMap {
  'plan.generate': { planVersionId: string; status: 'generating' };
  'plan.regenerateSection': { sectionKey: z.infer<typeof PlanSectionKeySchema>; content: PlanSectionContent };
  'roadmap.generate': { phases: number; milestones: number; tasks: number };
  'roadmap.recommend': { suggestions: RoadmapSuggestion[] };
  'marketing.generate': { asset: MarketingAsset };
  'finance.propose': { proposal: FinanceProposal };
}
export type AiResponse<A extends AiAction> = AiResponseMap[A];

export const AI_ERROR_CODES = [
  'unauthorized',
  'forbidden',
  'not_found',
  'invalid_request',
  'conflict',
  'precondition_failed',
  'quota_exceeded',
  'cost_cap_reached',
  'rate_limited',
  'ai_unavailable',
  'ai_refused',
  'ai_invalid_output',
  'not_configured',
  'internal',
] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export interface AiErrorBody {
  error: { code: AiErrorCode; message: string; details?: Record<string, unknown> };
}

/* ------------------------------------------------------------------ */
/* Advisor (SSE)                                                       */
/* ------------------------------------------------------------------ */

export const AdvisorRequestSchema = z.object({
  businessId: Uuid,
  /** Omit to start a new conversation. */
  conversationId: Uuid.optional(),
  message: z.string().trim().min(1).max(4000),
  locale: LocaleSchema,
});
export type AdvisorRequest = z.infer<typeof AdvisorRequestSchema>;

/**
 * Actions the advisor may PROPOSE. They are never executed server-side; the app shows them
 * as buttons and performs the write through RLS only after the user taps.
 */
export const AdvisorActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('add_task'),
    id: z.string(),
    label: z.string().max(140),
    title: z.string().max(200),
    description: z.string().max(1000),
    phase: RoadmapPhaseSchema,
    priority: z.enum(TASK_PRIORITIES),
    dueInDays: z.number().int().min(0).max(365).nullable(),
  }),
  z.object({
    type: z.literal('add_milestone'),
    id: z.string(),
    label: z.string().max(140),
    title: z.string().max(200),
    phase: RoadmapPhaseSchema,
    dueInDays: z.number().int().min(0).max(365).nullable(),
  }),
  z.object({
    type: z.literal('add_recurring_expense'),
    id: z.string(),
    label: z.string().max(140),
    expenseLabel: z.string().max(120),
    monthlyAmountMinor: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('add_startup_cost'),
    id: z.string(),
    label: z.string().max(140),
    costLabel: z.string().max(120),
    amountMinor: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('open_plan_section'),
    id: z.string(),
    label: z.string().max(140),
    sectionKey: PlanSectionKeySchema,
  }),
]);
export type AdvisorAction = z.infer<typeof AdvisorActionSchema>;

/** Server-sent events emitted by the advisor function, in order. */
export type AdvisorEvent =
  | { event: 'meta'; data: { conversationId: string; userMessageId: string } }
  | { event: 'delta'; data: { text: string } }
  | { event: 'actions'; data: { actions: AdvisorAction[]; followUps: string[] } }
  | { event: 'done'; data: { assistantMessageId: string } }
  | { event: 'error'; data: { code: AiErrorCode; message: string } };
