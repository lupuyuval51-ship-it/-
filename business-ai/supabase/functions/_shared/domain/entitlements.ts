/**
 * Subscription tiers and limits — single source of truth for the app UI (display only)
 * and the Edge Functions (enforcement). Database-level limits (max businesses, forecast
 * horizon) are mirrored in SQL function `public.tier_limits(text)`; a test asserts they match.
 */
export const TIERS = ['free', 'pro'] as const;
export type Tier = (typeof TIERS)[number];

export const AI_FEATURES = [
  'plan_generation',
  'section_regeneration',
  'roadmap_generation',
  'roadmap_recommendation',
  'advisor_message',
  'marketing_generation',
  'finance_proposal',
] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

export interface TierLimits {
  /** Max successful (or in-flight) AI calls per calendar month (UTC) per feature. */
  monthlyAiCalls: Record<AiFeature, number>;
  /** Hard monthly AI spend ceiling per user, in USD micros (1 USD = 1_000_000). */
  monthlyCostCapMicros: number;
  /** Max non-archived businesses per account. Enforced by DB trigger. */
  maxBusinesses: number;
  /** Max cash-flow forecast horizon in months. Enforced by DB trigger. */
  maxForecastMonths: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    monthlyAiCalls: {
      plan_generation: 2,
      section_regeneration: 10,
      roadmap_generation: 3,
      roadmap_recommendation: 10,
      advisor_message: 30,
      marketing_generation: 10,
      finance_proposal: 3,
    },
    monthlyCostCapMicros: 1_500_000,
    maxBusinesses: 1,
    maxForecastMonths: 12,
  },
  pro: {
    monthlyAiCalls: {
      plan_generation: 30,
      section_regeneration: 200,
      roadmap_generation: 30,
      roadmap_recommendation: 200,
      advisor_message: 1000,
      marketing_generation: 200,
      finance_proposal: 30,
    },
    monthlyCostCapMicros: 25_000_000,
    maxBusinesses: 10,
    maxForecastMonths: 36,
  },
};

export function limitsFor(tier: string | null | undefined): TierLimits {
  return tier === 'pro' ? TIER_LIMITS.pro : TIER_LIMITS.free;
}
