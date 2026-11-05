/**
 * Per-step form schemas (react-hook-form + zod). Fields are plain strings as typed; each schema
 * validates and transforms them into the domain value stored in `onboarding_responses`.
 * Error messages are translation keys (rendered with `t()` in the screen).
 */
import { z } from 'zod';
import {
  EXPERIENCE_LEVELS,
  LAUNCH_TIMELINES,
  PRIMARY_GOALS,
  WEEKLY_HOURS,
  type OnboardingKey,
  type OnboardingValue,
} from '@domain/onboarding';
import { minorToInputText, parseMoneyInput } from '@/i18n/format';
import type { TranslationKey } from '@/i18n/translate';
import type { DraftFields } from './store';

export const FIELD_LIMITS = {
  idea: 4000,
  name: 120,
  details: 1000,
  customers: 2000,
} as const;

const TOO_LONG: TranslationKey = 'errors.field.tooLong';

function choice<const T extends readonly string[]>(values: T) {
  return z.string().transform((v, ctx): T[number] => {
    if (!(values as readonly string[]).includes(v)) {
      ctx.addIssue({ code: 'custom', message: 'onboarding.errors.chooseOne' satisfies TranslationKey });
      return z.NEVER;
    }
    return v as T[number];
  });
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, TOO_LONG)
    .transform((v) => (v ? v : undefined));

export const stepSchemas = {
  business_idea: z
    .object({
      idea: z.string().trim().min(3, 'onboarding.errors.ideaTooShort' satisfies TranslationKey).max(FIELD_LIMITS.idea, TOO_LONG),
      name: optionalText(FIELD_LIMITS.name),
    })
    .transform(({ idea, name }): OnboardingValue<'business_idea'> => (name ? { idea, name } : { idea })),
  country: z
    .object({ code: z.string().regex(/^[A-Z]{2}$/, 'onboarding.errors.countryRequired' satisfies TranslationKey) })
    .transform(({ code }): OnboardingValue<'country'> => ({ code })),
  starting_budget: z
    .object({ amount: z.string(), currency: z.string().regex(/^[A-Z]{3}$/, 'errors.field.required' satisfies TranslationKey) })
    .transform(({ amount, currency }, ctx): OnboardingValue<'starting_budget'> => {
      if (!amount.trim()) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'onboarding.errors.amountRequired' satisfies TranslationKey });
        return z.NEVER;
      }
      const minor = parseMoneyInput(amount, currency);
      if (minor === null) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'errors.field.amountInvalid' satisfies TranslationKey });
        return z.NEVER;
      }
      return { amount_minor: minor, currency };
    }),
  experience: z
    .object({ level: choice(EXPERIENCE_LEVELS), details: optionalText(FIELD_LIMITS.details) })
    .transform(({ level, details }): OnboardingValue<'experience'> => (details ? { level, details } : { level })),
  target_customers: z
    .object({
      text: z
        .string()
        .trim()
        .min(1, 'onboarding.errors.customersRequired' satisfies TranslationKey)
        .max(FIELD_LIMITS.customers, TOO_LONG),
    })
    .transform(({ text }): OnboardingValue<'target_customers'> => ({ text })),
  primary_goal: z
    .object({ goal: choice(PRIMARY_GOALS), details: optionalText(FIELD_LIMITS.details) })
    .transform(({ goal, details }): OnboardingValue<'primary_goal'> => (details ? { goal, details } : { goal })),
  weekly_hours: z.object({ range: choice(WEEKLY_HOURS) }).transform(({ range }): OnboardingValue<'weekly_hours'> => ({ range })),
  launch_timeline: z
    .object({ timeline: choice(LAUNCH_TIMELINES) })
    .transform(({ timeline }): OnboardingValue<'launch_timeline'> => ({ timeline })),
} as const satisfies Record<OnboardingKey, z.ZodType>;

/** Raw form values per step (what react-hook-form holds and what drafts store). */
export interface StepFieldMap {
  business_idea: { idea: string; name: string };
  country: { code: string };
  starting_budget: { amount: string; currency: string };
  experience: { level: string; details: string };
  target_customers: { text: string };
  primary_goal: { goal: string; details: string };
  weekly_hours: { range: string };
  launch_timeline: { timeline: string };
}
export type StepFields<K extends OnboardingKey> = StepFieldMap[K];

// Compile-time check: each schema accepts exactly the declared fields and yields the domain value.
type SchemaMatches = {
  [K in OnboardingKey]: z.input<(typeof stepSchemas)[K]> extends StepFieldMap[K]
    ? StepFieldMap[K] extends z.input<(typeof stepSchemas)[K]>
      ? z.output<(typeof stepSchemas)[K]> extends OnboardingValue<K>
        ? true
        : false
      : false
    : false;
};
const schemaMatches: SchemaMatches = {
  business_idea: true,
  country: true,
  starting_budget: true,
  experience: true,
  target_customers: true,
  primary_goal: true,
  weekly_hours: true,
  launch_timeline: true,
};
void schemaMatches;

/* ------------------------------------------------------------------ */
/* Business details form (/businesses/[id])                            */
/* ------------------------------------------------------------------ */

export const BUSINESS_STAGE_VALUES = ['idea', 'planning', 'launching', 'operating', 'growing'] as const;

export const businessEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'errors.field.required' satisfies TranslationKey)
    .max(FIELD_LIMITS.name, TOO_LONG),
  stage: choice(BUSINESS_STAGE_VALUES),
  countryCode: z.string().regex(/^([A-Z]{2})?$/),
  currency: z.string().regex(/^[A-Z]{3}$/, 'errors.field.required' satisfies TranslationKey),
});
export type BusinessEditFields = z.input<typeof businessEditSchema>;
export type BusinessEditValues = z.output<typeof businessEditSchema>;

/** Max length for "too long" messages, by field name. */
export function fieldMax(field: string): number | undefined {
  if (field === 'idea') return FIELD_LIMITS.idea;
  if (field === 'name') return FIELD_LIMITS.name;
  if (field === 'details') return FIELD_LIMITS.details;
  if (field === 'text') return FIELD_LIMITS.customers;
  return undefined;
}

export interface FieldDefaults {
  /** Business country (ISO-2) used as the default selection on the country step. */
  countryCode?: string | null;
  /** Business currency used as the default budget currency. */
  currency: string;
}

function draftString(draft: DraftFields | undefined, field: string): string | undefined {
  const v = draft?.[field];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Initial form values for a step: the in-progress draft (if any) wins, then the saved answer,
 * then sensible defaults from the business.
 */
export function initialFields<K extends OnboardingKey>(
  key: K,
  saved: OnboardingValue<K> | null,
  draft: DraftFields | undefined,
  defaults: FieldDefaults,
): StepFields<K> {
  const pick = (field: string, fallback: string) => draftString(draft, field) ?? fallback;
  let fields: Record<string, string>;
  switch (key) {
    case 'business_idea': {
      const v = saved as OnboardingValue<'business_idea'> | null;
      fields = { idea: pick('idea', v?.idea ?? ''), name: pick('name', v?.name ?? '') };
      break;
    }
    case 'country': {
      const v = saved as OnboardingValue<'country'> | null;
      fields = { code: pick('code', v?.code ?? defaults.countryCode ?? '') };
      break;
    }
    case 'starting_budget': {
      const v = saved as OnboardingValue<'starting_budget'> | null;
      fields = { amount: pick('amount', minorToInputText(v?.amount_minor)), currency: pick('currency', v?.currency ?? defaults.currency) };
      break;
    }
    case 'experience': {
      const v = saved as OnboardingValue<'experience'> | null;
      fields = { level: pick('level', v?.level ?? ''), details: pick('details', v?.details ?? '') };
      break;
    }
    case 'target_customers': {
      const v = saved as OnboardingValue<'target_customers'> | null;
      fields = { text: pick('text', v?.text ?? '') };
      break;
    }
    case 'primary_goal': {
      const v = saved as OnboardingValue<'primary_goal'> | null;
      fields = { goal: pick('goal', v?.goal ?? ''), details: pick('details', v?.details ?? '') };
      break;
    }
    case 'weekly_hours': {
      const v = saved as OnboardingValue<'weekly_hours'> | null;
      fields = { range: pick('range', v?.range ?? '') };
      break;
    }
    case 'launch_timeline': {
      const v = saved as OnboardingValue<'launch_timeline'> | null;
      fields = { timeline: pick('timeline', v?.timeline ?? '') };
      break;
    }
    default:
      fields = {};
  }
  return fields as StepFields<K>;
}

/** True when the draft differs from what the saved answer would show (worth telling the user). */
export function draftDiffers<K extends OnboardingKey>(
  key: K,
  saved: OnboardingValue<K> | null,
  draft: DraftFields | undefined,
  defaults: FieldDefaults,
): boolean {
  if (!draft) return false;
  const withDraft = initialFields(key, saved, draft, defaults) as Record<string, string>;
  const without = initialFields(key, saved, undefined, defaults) as Record<string, string>;
  return Object.keys(withDraft).some((f) => (withDraft[f] ?? '').trim() !== (without[f] ?? '').trim());
}
