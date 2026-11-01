import { smoothWeights, suggestTrendAdjustment, weighInXp, WeightBodySchema, type XpAward } from '@lupu-fit/shared';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { awardXp, unlockAchievements } from '../services/gamification.ts';
import { targetsFor } from './profile.ts';
import { addDays, isoDate, loadProfile, uid } from './util.ts';

export function weightRoutes(r: Router, _d: Deps): void {
  r.get('/api/weights', async (ctx) => {
    const days = Math.min(Math.max(Number(ctx.req.query['days'] ?? 90) || 90, 1), 3650);
    const from = addDays(isoDate(ctx.now), -days);
    const rows = await ctx.db.query<{ id: string; logged_date: string; weight_kg: number; note: string | null }>('SELECT id, logged_date, weight_kg, note FROM body_weight_entries WHERE user_id = $1 AND logged_date >= $2 ORDER BY logged_date', [uid(ctx), from]);
    const entries = rows.map((x) => ({ id: x.id, loggedDate: x.logged_date, weightKg: x.weight_kg, note: x.note }));
    const smoothed = smoothWeights(entries.map((e) => ({ date: e.loggedDate, weightKg: e.weightKg })));
    const p = await loadProfile(ctx.db, uid(ctx));
    const suggestion = p ? suggestTrendAdjustment(entries.map((e) => ({ date: e.loggedDate, weightKg: e.weightKg })), p.goal, targetsFor(p).kcal, p.sex, p.age) : null;
    return { json: { entries, smoothed, suggestion } };
  });

  r.post('/api/weights', async (ctx) => {
    const b = ctx.body as z.infer<typeof WeightBodySchema>;
    await ctx.db.query('INSERT INTO body_weight_entries (id, user_id, logged_date, weight_kg, note) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id, logged_date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, note = EXCLUDED.note', [randomId(), uid(ctx), b.loggedDate, b.weightKg, b.note ?? null]);
    const weekStart = addDays(b.loggedDate, -((new Date(`${b.loggedDate}T00:00:00Z`).getUTCDay() + 6) % 7));
    const hasXpThisWeek = (await ctx.db.query('SELECT 1 FROM xp_events WHERE user_id = $1 AND source_type = $2 AND created_at >= $3', [uid(ctx), 'weigh_in', `${weekStart}T00:00:00Z`])).length > 0;
    const award = weighInXp(b.loggedDate, hasXpThisWeek) as XpAward | null;
    const gained = award ? await awardXp(ctx.db, uid(ctx), award) : false;
    const achievements = await unlockAchievements(ctx.db, uid(ctx), isoDate(ctx.now));
    return { json: { ok: true, xp: gained ? award?.amount ?? 0 : 0, achievements }, status: 201 };
  }, { body: WeightBodySchema });

  r.delete('/api/weights/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM body_weight_entries WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });
}
