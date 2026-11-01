import { PhotoEstimateBodySchema } from '@lupu-fit/shared';
import { z } from 'zod';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { assertQuota, recordUsage } from './coach.ts';

const EstimateSchema = z.object({
  items: z.array(z.object({ name: z.string().min(1).max(120), grams: z.number().min(1).max(3000), kcal: z.number().min(0).max(3000), proteinG: z.number().min(0).max(300), carbsG: z.number().min(0).max(500), fatG: z.number().min(0).max(300) })).min(1).max(12),
  notes: z.string().max(300).optional(),
});

export function nutritionRoutes(r: Router, d: Deps): void {
  const f = d.fetch ?? fetch;

  /** Open Food Facts barcode lookup. Values are per 100 g as published; nothing is logged here. */
  r.get('/api/nutrition/barcode/:ean', async (ctx) => {
    const ean = ctx.params['ean'] as string;
    if (!/^\d{8,14}$/.test(ean)) throw new ApiError(400, 'invalid_barcode');
    let res: Response;
    try {
      res = await f(`https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=product_name,nutriments,serving_quantity`, { headers: { 'user-agent': 'LUPU-FIT/0.1 (fitness app)' } });
    } catch { throw new ApiError(502, 'lookup_failed'); }
    if (res.status === 404) throw new ApiError(404, 'product_not_found');
    if (!res.ok) throw new ApiError(502, 'lookup_failed');
    const j = (await res.json()) as { status?: number; product?: { product_name?: string; nutriments?: Record<string, number>; serving_quantity?: number | string } };
    const n = j.product?.nutriments;
    if (j.status === 0 || !j.product || !n) throw new ApiError(404, 'product_not_found');
    const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : undefined);
    if (kcal === undefined) throw new ApiError(404, 'no_nutrition_data');
    return { json: { barcode: ean, name: j.product.product_name || ean, per100g: { kcal: Math.round(kcal), proteinG: n['proteins_100g'] ?? 0, carbsG: n['carbohydrates_100g'] ?? 0, fatG: n['fat_100g'] ?? 0 }, servingG: Number(j.product.serving_quantity) || null, source: 'open_food_facts' } };
  });

  /** AI meal-photo estimate. Returns a labelled ESTIMATE only; the user must review and confirm before anything is logged. */
  r.post('/api/nutrition/photo-estimate', async (ctx) => {
    const b = ctx.body as z.infer<typeof PhotoEstimateBodySchema>;
    if (!d.ai?.describeImage) throw new ApiError(503, 'ai_unavailable');
    await assertQuota(ctx, 'photo');
    const text = await d.ai.describeImage({
      system: 'You estimate the nutrition of a meal from a photo. Reply with JSON only: {"items":[{"name":string,"grams":number,"kcal":number,"proteinG":number,"carbsG":number,"fatG":number}],"notes":string}. Be conservative; these are rough estimates. If no food is visible return {"items":[]}.',
      prompt: b.lang === 'he' ? 'Name the items in Hebrew.' : 'Name the items in English.', jpegBase64: b.jpegBase64,
    }).catch(() => { throw new ApiError(502, 'ai_failed'); });
    await recordUsage(ctx, 'photo');
    let parsed: unknown;
    try { parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim()); } catch { throw new ApiError(502, 'bad_estimate'); }
    const ok = EstimateSchema.safeParse(parsed);
    if (!ok.success) throw new ApiError(502, 'bad_estimate');
    return { json: { estimated: true, requiresConfirmation: true, ...ok.data } };
  }, { body: PhotoEstimateBodySchema, maxBodyBytes: 8 * 1024 * 1024 });
}
