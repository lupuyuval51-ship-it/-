import { EQUIPMENT, generatePlan, GeneratePlanBodySchema, PlanPatchSchema, SavePlanBodySchema, type Equipment } from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { requireProfile, uid } from './util.ts';

export function planRoutes(r: Router, _d: Deps): void {
  // Deterministic rules-based generator: same profile + same seed => same plan; a new seed gives fresh valid variety.
  r.post('/api/plans/generate', async (ctx) => {
    const b = ctx.body as z.infer<typeof GeneratePlanBodySchema>;
    const p = await requireProfile(ctx.db, uid(ctx));
    const equipment: Equipment[] = p.place === 'gym' ? [...EQUIPMENT] : [...p.equipment]; // a gym provides its own equipment
    const plan = generatePlan({
      age: p.age, goal: p.goal, experience: p.experience, daysPerWeek: b.daysPerWeek ?? p.daysPerWeek, sessionMinutes: b.sessionMinutes ?? p.sessionMinutes,
      equipment, injuries: p.injuries, avoidIds: b.avoidIds, mode: b.mode ?? (equipment.length ? 'weights' : 'bodyweight'), seed: b.seed,
    }, EXERCISES);
    return { json: { plan } };
  }, { body: GeneratePlanBodySchema });

  r.get('/api/plans', async (ctx) => {
    const rows = await ctx.db.query<{ id: string; name: string; active: boolean; archived: boolean; plan: unknown; created_at: string }>('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC', [uid(ctx)]);
    return { json: { plans: rows.map((x) => ({ id: x.id, name: x.name, active: x.active, archived: x.archived, plan: x.plan, createdAt: x.created_at })) } };
  });

  r.post('/api/plans', async (ctx) => {
    const b = ctx.body as z.infer<typeof SavePlanBodySchema>;
    const id = randomId();
    await ctx.db.transaction(async (tx) => {
      if (b.activate) await tx.query('UPDATE workout_plans SET active = false WHERE user_id = $1', [uid(ctx)]);
      await tx.query('INSERT INTO workout_plans (id, user_id, name, active, plan) VALUES ($1,$2,$3,$4,$5)', [id, uid(ctx), b.name, b.activate, JSON.stringify(b.plan)]);
    });
    return { json: { id }, status: 201 };
  }, { body: SavePlanBodySchema });

  r.post('/api/plans/:id/activate', async (ctx) => {
    await ctx.db.transaction(async (tx) => {
      await tx.query('UPDATE workout_plans SET active = false WHERE user_id = $1', [uid(ctx)]);
      const up = await tx.query('UPDATE workout_plans SET active = true, archived = false WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
      if (up.length === 0) throw new ApiError(404, 'not_found');
    });
    return { json: { ok: true } };
  });

  r.post('/api/plans/:id/duplicate', async (ctx) => {
    const src = (await ctx.db.query<{ name: string; plan: unknown }>('SELECT name, plan FROM workout_plans WHERE id = $1 AND user_id = $2', [ctx.params['id'], uid(ctx)]))[0];
    if (!src) throw new ApiError(404, 'not_found');
    const id = randomId();
    await ctx.db.query('INSERT INTO workout_plans (id, user_id, name, plan) VALUES ($1,$2,$3,$4)', [id, uid(ctx), `${src.name} (copy)`, JSON.stringify(src.plan)]);
    return { json: { id }, status: 201 };
  });

  r.patch('/api/plans/:id', async (ctx) => {
    const b = ctx.body as z.infer<typeof PlanPatchSchema>;
    const up = await ctx.db.query('UPDATE workout_plans SET name = COALESCE($1, name), archived = COALESCE($2, archived), active = CASE WHEN $2 = true THEN false ELSE active END WHERE id = $3 AND user_id = $4 RETURNING id', [b.name ?? null, b.archived ?? null, ctx.params['id'], uid(ctx)]);
    if (up.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  }, { body: PlanPatchSchema });

  r.delete('/api/plans/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM workout_plans WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });
}
