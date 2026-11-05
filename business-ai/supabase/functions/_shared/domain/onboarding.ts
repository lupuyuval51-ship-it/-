/**
 * Onboarding contract — 8 short, skippable steps. Answers are stored one row per
 * question in `onboarding_responses` (value jsonb, skipped boolean).
 * Environment-neutral: imports only `zod`.
 */
import { z } from 'zod';

export const ONBOARDING_KEYS = [
  'business_idea',
  'country',
  'starting_budget',
  'experience',
  'target_customers',
  'primary_goal',
  'weekly_hours',
  'launch_timeline',
] as const;
export type OnboardingKey = (typeof ONBOARDING_KEYS)[number];
export const OnboardingKeySchema = z.enum(ONBOARDING_KEYS);

export const EXPERIENCE_LEVELS = ['none', 'some', 'industry', 'founder'] as const;
export const PRIMARY_GOALS = ['side_income', 'full_time', 'scale', 'impact', 'other'] as const;
export const WEEKLY_HOURS = ['lt5', 'h5_10', 'h10_20', 'h20_40', 'gt40'] as const;
export const LAUNCH_TIMELINES = ['m1', 'm3', 'm6', 'm12', 'unsure'] as const;

/** ISO 3166-1 alpha-2, upper-case. */
export const CountryCodeSchema = z.string().regex(/^[A-Z]{2}$/);
/** ISO 4217, upper-case. */
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const OnboardingValueSchemas = {
  /** `name` is an optional working name; `idea` is the free-text description. */
  business_idea: z.object({
    idea: z.string().trim().min(3).max(4000),
    name: z.string().trim().max(120).optional(),
  }),
  country: z.object({ code: CountryCodeSchema }),
  /** Integer minor units (e.g. agorot / cents). */
  starting_budget: z.object({ amount_minor: z.number().int().min(0).max(1e13), currency: CurrencyCodeSchema }),
  experience: z.object({ level: z.enum(EXPERIENCE_LEVELS), details: z.string().trim().max(1000).optional() }),
  target_customers: z.object({ text: z.string().trim().min(1).max(2000) }),
  primary_goal: z.object({ goal: z.enum(PRIMARY_GOALS), details: z.string().trim().max(1000).optional() }),
  weekly_hours: z.object({ range: z.enum(WEEKLY_HOURS) }),
  launch_timeline: z.object({ timeline: z.enum(LAUNCH_TIMELINES) }),
} as const satisfies Record<OnboardingKey, z.ZodType>;

export type OnboardingValue<K extends OnboardingKey> = z.infer<(typeof OnboardingValueSchemas)[K]>;
export type OnboardingAnswers = { [K in OnboardingKey]?: { value: OnboardingValue<K> | null; skipped: boolean } };

/** Only the first question is required: it creates the business record. */
export const REQUIRED_ONBOARDING_KEYS: readonly OnboardingKey[] = ['business_idea'];

export function parseOnboardingValue<K extends OnboardingKey>(key: K, value: unknown): OnboardingValue<K> | null {
  const res = OnboardingValueSchemas[key].safeParse(value);
  return res.success ? (res.data as OnboardingValue<K>) : null;
}

/** Default currency suggestion per country (user can always change it). */
export const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, string> = {
  IL: 'ILS',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
};
