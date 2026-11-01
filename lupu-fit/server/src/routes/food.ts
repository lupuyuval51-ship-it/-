import { CustomFoodBodySchema, FoodCopyBodySchema, FoodLogBodySchema, foodDayXp, proteinDayXp, SavedMealBodySchema, SavedMealLogBodySchema, type XpAward } from '@lupu-fit/shared';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';
import { awardXp, unlockAchievements } from '../services/gamification.ts';
import { targetsFor } from './profile.ts';
import { isoDate, loadProfile, uid } from './util.ts';

interface Row { id: string; logged_date: string; slot: string; food_id: string | null; dish_id: string | null; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number; estimated: boolean }
const toEntry = (r: Row) => ({ id: r.id, loggedDate: r.logged_date, slot: r.slot, foodId: r.food_id, dishId: r.dish_id, name: r.name, grams: r.grams, kcal: r.kcal, proteinG: r.protein_g, carbsG: r.carbs_g, fatG: r.fat_g, estimated: r.estimated });

async function dayEntries(ctx: Ctx, date: string) {
  return (await ctx.db.query<Row>('SELECT * FROM food_log_entries WHERE user_id = $1 AND logged_date = $2 ORDER BY created_at', [uid(ctx), date])).map(toEntry);
}
const totalsOf = (es: { kcal: number; proteinG: number; carbsG: number; fatG: number }[]) => es.reduce((t, e) => ({ kcal: t.kcal + e.kcal, proteinG: t.proteinG + e.proteinG, carbsG: t.carbsG + e.carbsG, fatG: t.fatG + e.fatG }), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

/** Food-day and protein-day XP for one date (idempotent). Never rewards undereating. */
async function foodXp(ctx: Ctx, date: string): Promise<number> {
  const es = await dayEntries(ctx, date);
  const today = isoDate(ctx.now);
  let gained = 0;
  const a = foodDayXp(today, date, new Set(es.map((e) => e.slot)).size) as XpAward | null;
  if (a && (await awardXp(ctx.db, uid(ctx), a))) gained += a.amount;
  const p = await loadProfile(ctx.db, uid(ctx));
  if (p) {
    const t = targetsFor(p); const tot = totalsOf(es);
    const b = proteinDayXp(date, { proteinG: tot.proteinG, targetProteinG: t.proteinG, kcal: tot.kcal, targetKcal: t.kcal });
    if (b && (await awardXp(ctx.db, uid(ctx), b))) gained += b.amount;
  }
  return gained;
}

export function foodRoutes(r: Router, _d: Deps): void {
  r.get('/api/food-log', async (ctx) => {
    const date = ctx.req.query['date'];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'date_required');
    const entries = await dayEntries(ctx, date);
    return { json: { date, entries, totals: totalsOf(entries) } };
  });

  r.get('/api/food-log/range', async (ctx) => {
    const { from, to } = ctx.req.query;
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new ApiError(400, 'range_required');
    const rows = await ctx.db.query<{ d: string; kcal: number; p: number; c: number; f: number; meals: number }>('SELECT logged_date AS d, SUM(kcal) AS kcal, SUM(protein_g) AS p, SUM(carbs_g) AS c, SUM(fat_g) AS f, COUNT(DISTINCT slot)::int AS meals FROM food_log_entries WHERE user_id = $1 AND logged_date BETWEEN $2 AND $3 GROUP BY logged_date ORDER BY logged_date', [uid(ctx), from, to]);
    return { json: { days: rows.map((x) => ({ date: x.d, kcal: Number(x.kcal), proteinG: Number(x.p), carbsG: Number(x.c), fatG: Number(x.f), meals: x.meals })) } };
  });

  r.post('/api/food-log', async (ctx) => {
    const b = ctx.body as z.infer<typeof FoodLogBodySchema>;
    const id = randomId();
    await ctx.db.query('INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [id, uid(ctx), b.loggedDate, b.slot, b.foodId ?? null, b.dishId ?? null, b.name, b.grams, b.kcal, b.proteinG, b.carbsG, b.fatG, b.estimated]);
    const xp = await foodXp(ctx, b.loggedDate);
    const achievements = await unlockAchievements(ctx.db, uid(ctx), isoDate(ctx.now));
    return { json: { entry: toEntry((await ctx.db.query<Row>('SELECT * FROM food_log_entries WHERE id = $1', [id]))[0] as Row), xp, achievements }, status: 201 };
  }, { body: FoodLogBodySchema });

  r.delete('/api/food-log/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM food_log_entries WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });

  r.post('/api/food-log/copy', async (ctx) => {
    const b = ctx.body as z.infer<typeof FoodCopyBodySchema>;
    const src = await dayEntries(ctx, b.fromDate);
    await ctx.db.transaction(async (tx) => {
      for (const e of src) await tx.query('INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [randomId(), uid(ctx), b.toDate, e.slot, e.foodId, e.dishId, e.name, e.grams, e.kcal, e.proteinG, e.carbsG, e.fatG, e.estimated]);
    });
    const xp = await foodXp(ctx, b.toDate);
    return { json: { copied: src.length, xp }, status: 201 };
  }, { body: FoodCopyBodySchema });

  // ---- custom foods
  r.get('/api/foods/custom', async (ctx) => {
    const rows = await ctx.db.query<{ id: string; name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number; serving_g: number; barcode: string | null }>('SELECT * FROM custom_foods WHERE user_id = $1 ORDER BY name', [uid(ctx)]);
    return { json: { foods: rows.map((f) => ({ id: f.id, name: f.name, kcal: f.kcal, proteinG: f.protein_g, carbsG: f.carbs_g, fatG: f.fat_g, servingG: f.serving_g, barcode: f.barcode })) } };
  });
  r.post('/api/foods/custom', async (ctx) => {
    const b = ctx.body as z.infer<typeof CustomFoodBodySchema>;
    if (b.proteinG + b.carbsG + b.fatG > 100.5) throw new ApiError(400, 'macros_exceed_100g');
    const id = randomId();
    await ctx.db.query('INSERT INTO custom_foods (id, user_id, name, kcal, protein_g, carbs_g, fat_g, serving_g, barcode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, uid(ctx), b.name, b.kcal, b.proteinG, b.carbsG, b.fatG, b.servingG, b.barcode ?? null]);
    return { json: { id }, status: 201 };
  }, { body: CustomFoodBodySchema });
  r.delete('/api/foods/custom/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM custom_foods WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });

  // ---- saved meals
  r.get('/api/saved-meals', async (ctx) => {
    const meals = await ctx.db.query<{ id: string; name: string; slot: string }>('SELECT id, name, slot FROM saved_meals WHERE user_id = $1 ORDER BY created_at DESC', [uid(ctx)]);
    const out = [];
    for (const m of meals) {
      const items = await ctx.db.query<{ id: string; food_id: string | null; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>('SELECT * FROM saved_meal_items WHERE saved_meal_id = $1', [m.id]);
      out.push({ ...m, items: items.map((i) => ({ id: i.id, foodId: i.food_id, name: i.name, grams: i.grams, kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g })) });
    }
    return { json: { meals: out } };
  });
  r.post('/api/saved-meals', async (ctx) => {
    const b = ctx.body as z.infer<typeof SavedMealBodySchema>;
    const id = randomId();
    await ctx.db.transaction(async (tx) => {
      await tx.query('INSERT INTO saved_meals (id, user_id, name, slot) VALUES ($1,$2,$3,$4)', [id, uid(ctx), b.name, b.slot]);
      for (const i of b.items) await tx.query('INSERT INTO saved_meal_items (id, saved_meal_id, food_id, name, grams, kcal, protein_g, carbs_g, fat_g) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [randomId(), id, i.foodId ?? null, i.name, i.grams, i.kcal, i.proteinG, i.carbsG, i.fatG]);
    });
    return { json: { id }, status: 201 };
  }, { body: SavedMealBodySchema });
  r.delete('/api/saved-meals/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM saved_meals WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });
  r.post('/api/saved-meals/:id/log', async (ctx) => {
    const b = ctx.body as z.infer<typeof SavedMealLogBodySchema>;
    const m = (await ctx.db.query<{ id: string; slot: string }>('SELECT id, slot FROM saved_meals WHERE id = $1 AND user_id = $2', [ctx.params['id'], uid(ctx)]))[0];
    if (!m) throw new ApiError(404, 'not_found');
    const items = await ctx.db.query<{ food_id: string | null; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>('SELECT * FROM saved_meal_items WHERE saved_meal_id = $1', [m.id]);
    await ctx.db.transaction(async (tx) => {
      for (const i of items) await tx.query('INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, name, grams, kcal, protein_g, carbs_g, fat_g) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [randomId(), uid(ctx), b.loggedDate, b.slot ?? m.slot, i.food_id, i.name, i.grams, i.kcal, i.protein_g, i.carbs_g, i.fat_g]);
    });
    const xp = await foodXp(ctx, b.loggedDate);
    return { json: { logged: items.length, xp }, status: 201 };
  }, { body: SavedMealLogBodySchema });
}
