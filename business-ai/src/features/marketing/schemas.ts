/**
 * Edit form for a marketing asset (react-hook-form + zod). Field limits mirror
 * MarketingContentSchema / the marketing_assets CHECKs; messages are translation keys.
 */
import { z } from 'zod';
import { fieldMessage } from '@/lib/forms';
import { MAX_MARKETING_ITEMS, normalizeMarketingContent, type MarketingAsset, type MarketingContent } from './logic';

const tooLong = (max: number) => fieldMessage('errors.field.tooLong', { max });

export const AssetEditItemSchema = z.object({
  id: z.string().min(1).max(40),
  heading: z.string().trim().max(200, tooLong(200)),
  label: z.string().trim().max(60, tooLong(60)),
  body: z.string().trim().max(3000, tooLong(3000)),
});

export const AssetEditSchema = z.object({
  title: z.string().trim().min(1, fieldMessage('errors.field.required')).max(200, tooLong(200)),
  summary: z.string().trim().max(1200, tooLong(1200)),
  items: z.array(AssetEditItemSchema).max(MAX_MARKETING_ITEMS, fieldMessage('marketing.editor.maxItems', { max: MAX_MARKETING_ITEMS })),
});

export type AssetEditValues = z.input<typeof AssetEditSchema>;
export type AssetEditOutput = z.output<typeof AssetEditSchema>;

export function assetToEditValues(asset: Pick<MarketingAsset, 'title' | 'content'>): AssetEditValues {
  return {
    title: asset.title,
    summary: asset.content.summary,
    items: asset.content.items.map((item) => ({ id: item.id, heading: item.heading, label: item.label ?? '', body: item.body })),
  };
}

/** Validated form values → content ready for MarketingContentSchema (empty items dropped). */
export function editValuesToContent(values: AssetEditOutput): MarketingContent {
  return normalizeMarketingContent({ summary: values.summary, items: values.items });
}
