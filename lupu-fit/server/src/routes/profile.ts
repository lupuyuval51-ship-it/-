import { computeNutrition, ProfileInputSchema, type ProfileInput } from '@lupu-fit/shared';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { loadProfile, requireProfile, uid } from './util.ts';

export function targetsFor(p: ProfileInput) {
  return computeNutrition({ sex: p.sex, age: p.age, heightCm: p.heightCm, weightKg: p.weightKg, goal: p.goal, activity: p.activityLevel, customKcal: p.customKcal });
}

export function profileRoutes(r: Router, _d: Deps): void {
  r.get('/api/profile', async (ctx) => {
    const p = await loadProfile(ctx.db, uid(ctx));
    if (!p) return { status: 404, body: { error: 'profile_required' } };
    return { json: { profile: p, targets: targetsFor(p) } };
  });

  r.put('/api/profile', async (ctx) => {
    const p = ctx.body as ProfileInput;
    await ctx.db.query(`INSERT INTO profiles (user_id, display_name, language, theme, units, sex, age, height_cm, weight_kg, goal, experience, place, equipment, injuries, days_per_week, session_minutes, activity_level, diet, allergies, restrictions, custom_kcal, onboarded_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$22)
      ON CONFLICT (user_id) DO UPDATE SET display_name=EXCLUDED.display_name, language=EXCLUDED.language, theme=EXCLUDED.theme, units=EXCLUDED.units, sex=EXCLUDED.sex, age=EXCLUDED.age, height_cm=EXCLUDED.height_cm, weight_kg=EXCLUDED.weight_kg, goal=EXCLUDED.goal, experience=EXCLUDED.experience, place=EXCLUDED.place, equipment=EXCLUDED.equipment, injuries=EXCLUDED.injuries, days_per_week=EXCLUDED.days_per_week, session_minutes=EXCLUDED.session_minutes, activity_level=EXCLUDED.activity_level, diet=EXCLUDED.diet, allergies=EXCLUDED.allergies, restrictions=EXCLUDED.restrictions, custom_kcal=EXCLUDED.custom_kcal, onboarded_at=COALESCE(profiles.onboarded_at, EXCLUDED.onboarded_at), updated_at=EXCLUDED.updated_at`,
      [uid(ctx), p.displayName ?? null, p.language, p.theme, p.units, p.sex, p.age, p.heightCm, p.weightKg, p.goal, p.experience, p.place, JSON.stringify(p.equipment), JSON.stringify(p.injuries), p.daysPerWeek, p.sessionMinutes, p.activityLevel, p.diet, JSON.stringify(p.allergies), JSON.stringify(p.restrictions), p.customKcal ?? null, ctx.now.toISOString()]);
    const saved = await requireProfile(ctx.db, uid(ctx));
    return { json: { profile: saved, targets: targetsFor(saved) } };
  }, { body: ProfileInputSchema });
}
