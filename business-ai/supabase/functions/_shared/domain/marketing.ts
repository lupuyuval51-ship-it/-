/**
 * Marketing Studio contract. Every asset uses the same editable shape: a summary and a list
 * of items (heading + body + optional short label such as a channel or a week).
 * Environment-neutral: imports only `zod`.
 */
import { z } from 'zod';

export const MARKETING_KINDS = [
  'positioning',
  'name_ideas',
  'taglines',
  'personas',
  'social_strategy',
  'content_calendar',
  'launch_campaign',
  'marketing_copy',
  'acquisition_experiments',
] as const;
export type MarketingKind = (typeof MARKETING_KINDS)[number];
export const MarketingKindSchema = z.enum(MARKETING_KINDS);

export const MarketingItemSchema = z.object({
  id: z.string().min(1).max(40),
  heading: z.string().trim().max(200),
  body: z.string().trim().max(3000),
  /** Short qualifier: channel, week, audience, metric… */
  label: z.string().trim().max(60).optional(),
});
export type MarketingItem = z.infer<typeof MarketingItemSchema>;

export const MarketingContentSchema = z.object({
  summary: z.string().trim().max(1200),
  items: z.array(MarketingItemSchema).max(40),
});
export type MarketingContent = z.infer<typeof MarketingContentSchema>;

/** Shape the AI returns (ids assigned server-side). */
export const AiMarketingContentSchema = z.object({
  title: z.string().max(140),
  summary: z.string().max(1200),
  items: z
    .array(z.object({ heading: z.string().max(200), body: z.string().max(3000), label: z.string().max(60) }))
    .min(1)
    .max(20),
});
export type AiMarketingContent = z.infer<typeof AiMarketingContentSchema>;

/** Row shape of public.marketing_assets as returned to the app. */
export interface MarketingAsset {
  id: string;
  business_id: string;
  kind: MarketingKind;
  title: string;
  content: MarketingContent;
  origin: 'ai' | 'user';
  created_at: string;
  updated_at: string;
}
