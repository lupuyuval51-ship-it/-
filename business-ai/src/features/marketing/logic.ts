/**
 * Marketing Studio pure logic: row parsing, grouping, item editing helpers, share text and quota.
 * No React, no Supabase.
 */
import { limitsFor, type AiFeature } from '@domain/entitlements';
import {
  MARKETING_KINDS,
  MarketingContentSchema,
  MarketingItemSchema,
  MarketingKindSchema,
  type MarketingAsset,
  type MarketingContent,
  type MarketingItem,
  type MarketingKind,
} from '@domain/marketing';
import type { Json, Row } from '@/lib/database';

export type { MarketingAsset, MarketingContent, MarketingItem, MarketingKind } from '@domain/marketing';

export const MAX_MARKETING_ITEMS = 40;

export const EMPTY_MARKETING_CONTENT: MarketingContent = { summary: '', items: [] };

export function isMarketingKind(value: unknown): value is MarketingKind {
  return MarketingKindSchema.safeParse(value).success;
}

/**
 * Parses stored content. The DB validates the same shape, so a failure means a schema drift —
 * fall back to whatever is salvageable instead of crashing the screen.
 */
export function parseMarketingContent(value: Json | unknown): MarketingContent {
  const parsed = MarketingContentSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  const loose = (typeof value === 'object' && value !== null ? value : {}) as { summary?: unknown; items?: unknown };
  const items = Array.isArray(loose.items)
    ? loose.items.flatMap((item): MarketingItem[] => {
        const one = MarketingItemSchema.safeParse(item);
        return one.success ? [one.data] : [];
      })
    : [];
  return { summary: typeof loose.summary === 'string' ? loose.summary : '', items };
}

/** Narrows a DB row; rows with an unknown kind are dropped (null). */
export function parseMarketingAsset(row: Row<'marketing_assets'>): MarketingAsset | null {
  if (!isMarketingKind(row.kind)) return null;
  return {
    id: row.id,
    business_id: row.business_id,
    kind: row.kind,
    title: row.title,
    content: parseMarketingContent(row.content),
    origin: row.origin === 'ai' ? 'ai' : 'user',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface MarketingGroup {
  kind: MarketingKind;
  assets: MarketingAsset[];
}

/** Non-empty groups in MARKETING_KINDS order, most recently updated first within each. */
export function groupAssetsByKind(assets: readonly MarketingAsset[]): MarketingGroup[] {
  return MARKETING_KINDS.flatMap((kind) => {
    const inKind = assets.filter((a) => a.kind === kind).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return inKind.length > 0 ? [{ kind, assets: inKind }] : [];
  });
}

/* ------------------------------------------------------------------ */
/* Item editing                                                        */
/* ------------------------------------------------------------------ */

let idCounter = 0;

/** Short unique id for a new item (≤ 40 chars, as the schema requires). */
export function newMarketingItemId(now: number = Date.now()): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `u${now.toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyMarketingItem(): MarketingItem {
  return { id: newMarketingItemId(), heading: '', body: '', label: '' };
}

/** Moves the item at `index` by `delta` (−1 up, +1 down). Out-of-range moves return a copy. */
export function moveItem<T>(items: readonly T[], index: number, delta: number): T[] {
  const target = index + delta;
  const next = [...items];
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return next;
  const [moved] = next.splice(index, 1);
  if (moved !== undefined) next.splice(target, 0, moved);
  return next;
}

/**
 * Normalizes edited content before saving: trims text, drops items with neither heading nor body,
 * removes empty labels (stored as absent), and keeps ids unique.
 */
export function normalizeMarketingContent(content: MarketingContent): MarketingContent {
  const seen = new Set<string>();
  const items: MarketingItem[] = [];
  for (const item of content.items) {
    const heading = item.heading.trim();
    const body = item.body.trim();
    if (heading === '' && body === '') continue;
    let id = item.id.trim().slice(0, 40) || newMarketingItemId();
    if (seen.has(id)) id = newMarketingItemId();
    seen.add(id);
    const label = item.label?.trim();
    items.push(label ? { id, heading, body, label } : { id, heading, body });
  }
  return { summary: content.summary.trim(), items };
}

/* ------------------------------------------------------------------ */
/* Share                                                               */
/* ------------------------------------------------------------------ */

/** Plain-text rendering for the system share sheet. */
export function marketingAssetToText(asset: Pick<MarketingAsset, 'title' | 'content'>): string {
  const parts: string[] = [asset.title.trim()];
  const summary = asset.content.summary.trim();
  if (summary) parts.push(summary);
  for (const item of asset.content.items) {
    const heading = item.heading.trim();
    const label = item.label?.trim();
    const head = [heading, label ? `(${label})` : ''].filter(Boolean).join(' ');
    const body = item.body.trim();
    const block = [head, body].filter(Boolean).join('\n');
    if (block) parts.push(block);
  }
  return parts.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Quota (display only — the server enforces)                          */
/* ------------------------------------------------------------------ */

/**
 * Remaining marketing generations this month for the tier; null while usage is unknown.
 * `usage` is the per-feature map cached by `useAiUsage()` (settings feature).
 */
export function remainingMarketingGenerations(
  tier: string | null | undefined,
  usage: Readonly<Partial<Record<AiFeature, number>>> | undefined,
): number | null {
  if (!usage) return null;
  const limit = limitsFor(tier).monthlyAiCalls.marketing_generation;
  return Math.max(0, limit - (usage.marketing_generation ?? 0));
}
