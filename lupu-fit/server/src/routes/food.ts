import { ACCOUNT_LIMITS, CustomFoodBodySchema, FOOD_DAY_MAX_ENTRIES, FoodCopyBodySchema, FoodLogBodySchema, foodDayXp, proteinDayXp, SavedMealBodySchema, SavedMealLogBodySchema, type XpAward } from '@lupu-fit/shared';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { DbAdapter } from '../db/adapter.ts';
import type { Ctx, Deps } from '../core/types.ts';
import { awardXp, unlockAchievements } from '../services/gamification.ts';
import { targetsFor } from './profile.ts';
import { assertPlausibleDay, isoDate, loadProfile, uid } from './util.ts';

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
    const b = proteinDayXp(date, { proteinG: tot.proteinG, targetProteinG: t.proteinG, kcal: tot.kcal, targetKcal: t.kcal }, today);
    if (b && (await awardXp(ctx.db, uid(ctx), b))) gained += b.amount;
  }
  return gained;
}

/**
 * Room for `adding` more entries on one day (FOOD_DAY_MAX_ENTRIES), checked inside the caller's transaction after locking the user row,
 * so parallel requests of one person are counted one after the other and a day can never grow past the cap.
 */
async function assertDayRoom(tx: DbAdapter, userId: string, date: string, adding: number): Promise<void> {
  await tx.query('SELECT 1 FROM users WHERE id = $1 FOR NO KEY UPDATE', [userId]);
  const have = Number((await tx.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM food_log_entries WHERE user_id = $1 AND logged_date = $2', [userId, date]))[0]?.n ?? 0);
  if (have + adding > FOOD_DAY_MAX_ENTRIES) throw new ApiError(409, 'limit_reached', { scope: 'food_day', max: FOOD_DAY_MAX_ENTRIES });
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
    assertPlausibleDay(ctx, b.loggedDate, 'backfill', 'loggedDate');
    const id = randomId();
    await ctx.db.transaction(async (tx) => {
      await assertDayRoom(tx, uid(ctx), b.loggedDate, 1);
      await tx.query('INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [id, uid(ctx), b.loggedDate, b.slot, b.foodId ?? null, b.dishId ?? null, b.name, b.grams, b.kcal, b.proteinG, b.carbsG, b.fatG, b.estimated]);
    });
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
    const b = ctx.body as z.infer<typeof FoodCopyBodySchema>; // fromDate !== toDate is part of the schema
    assertPlausibleDay(ctx, b.fromDate, 'backfill', 'fromDate'); assertPlausibleDay(ctx, b.toDate, 'backfill', 'toDate');
    const u = uid(ctx);
    let alreadyCopied = false;
    const copied = await ctx.db.transaction(async (tx) => {
      await tx.query('SELECT 1 FROM users WHERE id = $1 FOR NO KEY UPDATE', [u]); // parallel copies of one person run one after the other
      const n = Number((await tx.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM food_log_entries WHERE user_id = $1 AND logged_date = $2', [u, b.fromDate]))[0]?.n ?? 0);
      if (n === 0) return 0;
      // A second tap of "copy yesterday": every source entry is already on the target day, so copying again would only double it.
      const missing = Number((await tx.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM food_log_entries s WHERE s.user_id = $1 AND s.logged_date = $2 AND NOT EXISTS (
        SELECT 1 FROM food_log_entries d WHERE d.user_id = $1 AND d.logged_date = $3 AND d.slot = s.slot AND d.name = s.name AND d.grams = s.grams AND d.kcal = s.kcal
          AND d.food_id IS NOT DISTINCT FROM s.food_id AND d.dish_id IS NOT DISTINCT FROM s.dish_id)`, [u, b.fromDate, b.toDate]))[0]?.n ?? 0);
      if (missing === 0) { alreadyCopied = true; return 0; } // nothing new to copy: answered as "copied 0", the day stays as it is
      await assertDayRoom(tx, u, b.toDate, n);
      // One set-based statement (bounded by statement_timeout), not one round trip per row.
      await tx.query(`INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated)
        SELECT gen_random_uuid()::text, user_id, $3::date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated FROM food_log_entries WHERE user_id = $1 AND logged_date = $2`, [u, b.fromDate, b.toDate]);
      return n;
    });
    if (copied === 0) return { json: { copied: 0, xp: 0, ...(alreadyCopied ? { alreadyCopied: true } : {}) } };
    const xp = await foodXp(ctx, b.toDate);
    return { json: { copied, xp }, status: 201 };
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
    // One query for every item of this account (not one per meal), grouped in a single pass.
    const items = await ctx.db.query<{ id: string; saved_meal_id: string; food_id: string | null; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>('SELECT i.* FROM saved_meal_items i JOIN saved_meals m ON m.id = i.saved_meal_id WHERE m.user_id = $1 ORDER BY i.saved_meal_id, i.id', [uid(ctx)]);
    const by = new Map<string, unknown[]>();
    for (const i of items) { const l = by.get(i.saved_meal_id) ?? []; by.set(i.saved_meal_id, l); l.push({ id: i.id, foodId: i.food_id, name: i.name, grams: i.grams, kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g }); }
    return { json: { meals: meals.map((m) => ({ ...m, items: by.get(m.id) ?? [] })) } };
  });
  r.post('/api/saved-meals', async (ctx) => {
    const b = ctx.body as z.infer<typeof SavedMealBodySchema>;
    const id = randomId();
    await ctx.db.transaction(async (tx) => {
      await tx.query('SELECT 1 FROM users WHERE id = $1 FOR NO KEY UPDATE', [uid(ctx)]); // parallel saves are counted one after the other
      const have = Number((await tx.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM saved_meals WHERE user_id = $1', [uid(ctx)]))[0]?.n ?? 0);
      if (have >= ACCOUNT_LIMITS.savedMeals) throw new ApiError(409, 'limit_reached', { scope: 'saved_meals', max: ACCOUNT_LIMITS.savedMeals });
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
    assertPlausibleDay(ctx, b.loggedDate, 'backfill', 'loggedDate');
    const m = (await ctx.db.query<{ id: string; slot: string }>('SELECT id, slot FROM saved_meals WHERE id = $1 AND user_id = $2', [ctx.params['id'], uid(ctx)]))[0];
    if (!m) throw new ApiError(404, 'not_found');
    const items = await ctx.db.query<{ food_id: string | null; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>('SELECT * FROM saved_meal_items WHERE saved_meal_id = $1', [m.id]);
    await ctx.db.transaction(async (tx) => {
      await assertDayRoom(tx, uid(ctx), b.loggedDate, items.length);
      await tx.query(`INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, name, grams, kcal, protein_g, carbs_g, fat_g)
        SELECT gen_random_uuid()::text, $2::text, $3::date, $4::text, food_id, name, grams, kcal, protein_g, carbs_g, fat_g FROM saved_meal_items WHERE saved_meal_id = $1`, [m.id, uid(ctx), b.loggedDate, b.slot ?? m.slot]);
    });
    const xp = await foodXp(ctx, b.loggedDate);
    return { json: { logged: items.length, xp }, status: 201 };
  }, { body: SavedMealLogBodySchema });
}
