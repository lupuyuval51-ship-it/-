import { epley1RM, levelProgress, MUSCLE_TO_GROUP, isoWeekKey, ageBucket, ACHIEVEMENT_IDS, type MuscleGroup } from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { totalXp } from '../services/gamification.ts';
import { targetsFor } from './profile.ts';
import { addDays, isoDate, loadProfile, uid } from './util.ts';

const EX = new Map(EXERCISES.map((e) => [e.id, e]));
const RANGES: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

export function progressRoutes(r: Router, _d: Deps): void {
  r.get('/api/stats', async (ctx) => {
    const xp = await totalXp(ctx.db, uid(ctx));
    const ach = await ctx.db.query<{ achievement_id: string; unlocked_at: string }>('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1', [uid(ctx)]);
    return { json: { xp, level: levelProgress(xp), achievements: ach.map((a) => ({ id: a.achievement_id, unlockedAt: a.unlocked_at })), allAchievementIds: ACHIEVEMENT_IDS } };
  });

  r.get('/api/progress', async (ctx) => {
    const key = ctx.req.query['range'] ?? '30d';
    const days = RANGES[key] ?? 30;
    const today = isoDate(ctx.now); const from = addDays(today, -(days - 1));
    const p = await loadProfile(ctx.db, uid(ctx));

    const sessions = await ctx.db.query<{ id: string; local_date: string }>('SELECT id, local_date FROM workout_sessions WHERE user_id = $1 AND finished_at IS NOT NULL AND local_date BETWEEN $2 AND $3 ORDER BY local_date', [uid(ctx), from, today]);
    const sets = await ctx.db.query<{ local_date: string; exercise_id: string; reps: number | null; weight_kg: number | null }>(
      'SELECT s.local_date, e.exercise_id, t.reps, t.weight_kg FROM session_sets t JOIN session_exercises e ON e.id = t.session_exercise_id JOIN workout_sessions s ON s.id = e.session_id WHERE s.user_id = $1 AND s.finished_at IS NOT NULL AND s.local_date BETWEEN $2 AND $3', [uid(ctx), from, today]);

    const weekly = new Map<string, number>();
    for (const s of sessions) weekly.set(isoWeekKey(s.local_date), (weekly.get(isoWeekKey(s.local_date)) ?? 0) + 1);

    const groups: Record<MuscleGroup, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, legs: 0 };
    const curves = new Map<string, Map<string, number>>();
    for (const s of sets) {
      const ex = EX.get(s.exercise_id); if (!ex) continue;
      for (const g of new Set(ex.primary.map((m) => MUSCLE_TO_GROUP[m]))) groups[g]++;
      if (p && ageBucket(p.age) === 'minor') continue; // no 1RM estimates for minors
      const e1 = s.weight_kg && s.reps ? epley1RM(s.weight_kg, s.reps) : null;
      if (e1) { const m = curves.get(s.exercise_id) ?? new Map<string, number>(); m.set(s.local_date, Math.max(m.get(s.local_date) ?? 0, e1)); curves.set(s.exercise_id, m); }
    }
    const strength = [...curves.entries()].filter(([, m]) => m.size >= 2).sort((a, b) => b[1].size - a[1].size).slice(0, 5)
      .map(([id, m]) => ({ exerciseId: id, points: [...m.entries()].sort().map(([date, est1rm]) => ({ date, est1rm: Math.round(est1rm * 10) / 10 })) }));

    const food = await ctx.db.query<{ d: string; kcal: number; p: number; meals: number }>('SELECT logged_date AS d, SUM(kcal) AS kcal, SUM(protein_g) AS p, COUNT(DISTINCT slot)::int AS meals FROM food_log_entries WHERE user_id = $1 AND logged_date BETWEEN $2 AND $3 GROUP BY logged_date', [uid(ctx), from, today]);
    const t = p ? targetsFor(p) : null;
    const prs = await ctx.db.query<{ exercise_id: string; max_weight: number | null; est_1rm: number | null; max_reps: number | null; max_duration: number | null; updated_at: string }>('SELECT * FROM personal_records WHERE user_id = $1 ORDER BY updated_at DESC', [uid(ctx)]);

    return { json: {
      range: key, from, to: today,
      consistency: { sessions: sessions.length, weeks: [...weekly.entries()].sort().map(([week, count]) => ({ week, count })), weeklyGoal: p?.daysPerWeek ?? null },
      setsByGroup: groups, hasSets: sets.length > 0, strength,
      nutrition: { loggedDays: food.length, avgKcal: food.length ? Math.round(food.reduce((a, x) => a + Number(x.kcal), 0) / food.length) : null, avgProteinG: food.length ? Math.round(food.reduce((a, x) => a + Number(x.p), 0) / food.length) : null, targetKcal: t?.kcal ?? null, targetProteinG: t?.proteinG ?? null, daysOnProteinTarget: t ? food.filter((x) => Number(x.p) >= 0.9 * t.proteinG).length : 0 },
      prs: prs.map((x) => ({ exerciseId: x.exercise_id, maxWeight: x.max_weight, est1rm: p && ageBucket(p.age) === 'minor' ? null : x.est_1rm, maxReps: x.max_reps, maxDuration: x.max_duration, updatedAt: x.updated_at })),
    } };
  });
}
