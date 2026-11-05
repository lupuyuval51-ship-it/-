import { PHOTO_MAX_BASE64_CHARS, PhotoEstimateBodySchema, type Allergen } from '@lupu-fit/shared';
import { z } from 'zod';
import { ApiError } from '../core/errors.ts';
import { BoundedRateLimiter } from '../core/rateLimit.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { reserveQuota } from './coach.ts';
import { uid } from './util.ts';

/** Outbound Open Food Facts budget: time per lookup, lookups per user per minute (cache hits are free), cache lifetimes and size. */
export const BARCODE = { timeoutMs: 8_000, perUserPerMin: 20, hitTtlMs: 24 * 3600_000, missTtlMs: 3600_000, cacheSize: 2_000, maxBodyChars: 1_000_000 } as const;

/** Open Food Facts allergen / trace tags -> the app's allergen list (D6: structured allergens are always unioned with name keywords). */
const OFF_ALLERGENS: Record<string, Allergen> = {
  'en:milk': 'dairy', 'en:eggs': 'egg', 'en:peanuts': 'peanut', 'en:nuts': 'tree_nut', 'en:sesame-seeds': 'sesame', 'en:soybeans': 'soy',
  'en:gluten': 'gluten', 'en:fish': 'fish', 'en:crustaceans': 'shellfish', 'en:molluscs': 'shellfish',
};
const Tags = z.array(z.string().max(100)).max(200).optional().catch(undefined);
/** Crowd-edited data: every field is checked, nothing is passed through as it came. */
const OffSchema = z.object({
  status: z.unknown().optional(),
  product: z.object({
    product_name: z.unknown().optional(),
    nutriments: z.record(z.string(), z.unknown()).optional(),
    serving_quantity: z.unknown().optional(),
    allergens_tags: Tags, traces_tags: Tags,
  }).optional(),
});
const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'number' && typeof v !== 'string') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export interface BarcodeProduct {
  barcode: string; name: string; per100g: { kcal: number; proteinG: number; carbsG: number; fatG: number }; servingG: number | null;
  allergens: Allergen[]; allergensKnown: boolean; source: 'open_food_facts';
}

/** Turns an Open Food Facts reply into a product, or the 404 code to answer. Same limits as a custom food (kcal 0-900, macros 0-100 per 100 g). */
export function parseOffProduct(ean: string, raw: unknown): BarcodeProduct | 'product_not_found' | 'no_nutrition_data' {
  const j = OffSchema.safeParse(raw);
  if (!j.success || j.data.status === 0 || !j.data.product?.nutriments) return 'product_not_found';
  const p = j.data.product; const n = p.nutriments as Record<string, unknown>;
  const kj = num(n['energy_100g']);
  const kcalRaw = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (kcalRaw === undefined) return 'no_nutrition_data';
  const macro = (k: string) => num(n[k]) ?? 0; // a macro OFF does not list is shown as 0, as before
  const per100g = { kcal: Math.round(kcalRaw), proteinG: macro('proteins_100g'), carbsG: macro('carbohydrates_100g'), fatG: macro('fat_100g') };
  const inRange = (v: number, max: number) => Number.isFinite(v) && v >= 0 && v <= max;
  if (!inRange(kcalRaw, 900) || !inRange(per100g.proteinG, 100) || !inRange(per100g.carbsG, 100) || !inRange(per100g.fatG, 100) || per100g.proteinG + per100g.carbsG + per100g.fatG > 100.5) return 'no_nutrition_data';
  const name = typeof p.product_name === 'string' ? p.product_name.trim().slice(0, 120).trim() : '';
  const serving = num(p.serving_quantity);
  const tags = [...(p.allergens_tags ?? []), ...(p.traces_tags ?? [])];
  const allergens = [...new Set(tags.map((tg) => OFF_ALLERGENS[tg.toLowerCase()]).filter((a): a is Allergen => !!a))];
  return {
    barcode: ean, name: name || ean, per100g, servingG: serving !== undefined && Number.isFinite(serving) && serving >= 1 && serving <= 1000 ? serving : null,
    // OFF lists what the label declares; an empty list is not proof that a product is free of allergens.
    allergens, allergensKnown: tags.length > 0, source: 'open_food_facts',
  };
}

const EstimateSchema = z.object({
  items: z.array(z.object({ name: z.string().min(1).max(120), grams: z.number().min(1).max(3000), kcal: z.number().min(0).max(3000), proteinG: z.number().min(0).max(300), carbsG: z.number().min(0).max(500), fatG: z.number().min(0).max(300) })).min(1).max(12),
  notes: z.string().max(300).optional(),
});

export function nutritionRoutes(r: Router, d: Deps): void {
  const f = d.fetch ?? fetch;

  /** Open Food Facts barcode lookup. Values are per 100 g as published; nothing is logged here. */
  const cache = new Map<string, { at: number; v: BarcodeProduct | 'product_not_found' }>();
  const perUser = new BoundedRateLimiter(BARCODE.perUserPerMin);
  r.get('/api/nutrition/barcode/:ean', async (ctx) => {
    const ean = ctx.params['ean'] as string;
    if (!/^\d{8,14}$/.test(ean)) throw new ApiError(400, 'invalid_barcode');
    const nowMs = ctx.now.getTime();
    const c = cache.get(ean);
    const answer = (v: BarcodeProduct | 'product_not_found') => { if (v === 'product_not_found') throw new ApiError(404, 'product_not_found'); return { json: v }; };
    if (c && nowMs - c.at < (c.v === 'product_not_found' ? BARCODE.missTtlMs : BARCODE.hitTtlMs)) return answer(c.v);
    // Every miss is a live call from this server's one address: bounded per user, so one account cannot get it blocked for everyone.
    if (!perUser.hit(uid(ctx), nowMs)) throw new ApiError(429, 'rate_limited', undefined, { 'retry-after': '60' });
    let text: string; let status: number;
    try {
      const res = await f(`https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=product_name,nutriments,serving_quantity,allergens_tags,traces_tags`, { headers: { 'user-agent': 'LUPU-FIT/0.1 (fitness app)' }, signal: AbortSignal.timeout(BARCODE.timeoutMs) });
      status = res.status;
      text = res.ok ? await res.text() : '';
    } catch { throw new ApiError(502, 'lookup_failed'); } // network error, timeout or abort
    if (status === 404) { remember(cache, ean, { at: nowMs, v: 'product_not_found' }); throw new ApiError(404, 'product_not_found'); }
    if (status < 200 || status >= 300 || text.length > BARCODE.maxBodyChars) throw new ApiError(502, 'lookup_failed');
    let raw: unknown;
    try { raw = JSON.parse(text); } catch { throw new ApiError(502, 'lookup_failed'); }
    const v = parseOffProduct(ean, raw);
    if (v === 'no_nutrition_data') throw new ApiError(404, 'no_nutrition_data');
    remember(cache, ean, { at: nowMs, v });
    return answer(v);
  });

  /** AI meal-photo estimate. Returns a labelled ESTIMATE only; the user must review and confirm before anything is logged. */
  r.post('/api/nutrition/photo-estimate', async (ctx) => {
    const b = ctx.body as z.infer<typeof PhotoEstimateBodySchema>;
    if (!d.ai?.describeImage) throw new ApiError(503, 'ai_unavailable');
    await reserveQuota(ctx, 'photo');
    const text = await d.ai.describeImage({
      system: 'You estimate the nutrition of a meal from a photo. Reply with JSON only: {"items":[{"name":string,"grams":number,"kcal":number,"proteinG":number,"carbsG":number,"fatG":number}],"notes":string}. Be conservative; these are rough estimates. If no food is visible return {"items":[]}.',
      prompt: b.lang === 'he' ? 'Name the items in Hebrew.' : 'Name the items in English.', jpegBase64: b.jpegBase64,
    }).catch(() => { throw new ApiError(502, 'ai_failed'); });
    let parsed: unknown;
    try { parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim()); } catch { throw new ApiError(502, 'bad_estimate'); }
    const ok = EstimateSchema.safeParse(parsed);
    if (!ok.success) throw new ApiError(502, 'bad_estimate');
    return { json: { estimated: true, requiresConfirmation: true, ...ok.data } };
  }, { body: PhotoEstimateBodySchema, maxBodyBytes: PHOTO_MAX_BASE64_CHARS + 4 * 1024, replayBody: false });
}

/** Bounded cache: the oldest entry goes first once it is full. */
function remember<V>(cache: Map<string, V>, k: string, v: V): void {
  cache.delete(k); cache.set(k, v);
  while (cache.size > BARCODE.cacheSize) { const oldest = cache.keys().next().value as string | undefined; if (oldest === undefined) break; cache.delete(oldest); }
}
