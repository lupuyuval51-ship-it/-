import { EXERCISES } from '@lupu-fit/shared/content';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { uid } from './util.ts';

const IDS = new Set(EXERCISES.map((e) => e.id));

export function exerciseHistoryRoutes(r: Router, _d: Deps): void {
  /** Last N finished sessions that included this exercise, newest first, plus the stored personal record. */
  r.get('/api/exercises/:id/history', async (ctx) => {
    const id = ctx.params['id'] as string;
    if (!IDS.has(id)) throw new ApiError(404, 'not_found');
    const limit = Math.min(Math.max(Number(ctx.req.query['limit'] ?? 5) || 5, 1), 30);
    const sessions = await ctx.db.query<{ session_id: string; local_date: string; se_id: string }>(
      'SELECT s.id AS session_id, s.local_date, e.id AS se_id FROM session_exercises e JOIN workout_sessions s ON s.id = e.session_id WHERE s.user_id = $1 AND e.exercise_id = $2 AND s.finished_at IS NOT NULL ORDER BY s.started_at DESC LIMIT $3',
      [uid(ctx), id, limit]);
    const history = [];
    for (const s of sessions) {
      const sets = await ctx.db.query<{ set_no: number; reps: number | null; weight_kg: number | null; duration_sec: number | null; rpe: number | null }>('SELECT set_no, reps, weight_kg, duration_sec, rpe FROM session_sets WHERE session_exercise_id = $1 ORDER BY set_no', [s.se_id]);
      history.push({ sessionId: s.session_id, date: s.local_date, sets: sets.map((t) => ({ setNo: t.set_no, reps: t.reps, weightKg: t.weight_kg, durationSec: t.duration_sec, rpe: t.rpe })) });
    }
    const pr = (await ctx.db.query<{ max_weight: number | null; est_1rm: number | null; max_reps: number | null; max_volume: number | null; max_duration: number | null; updated_at: string }>('SELECT max_weight, est_1rm, max_reps, max_volume, max_duration, updated_at FROM personal_records WHERE user_id = $1 AND exercise_id = $2', [uid(ctx), id]))[0];
    return { json: { exerciseId: id, history, record: pr ? { maxWeight: pr.max_weight, est1rm: pr.est_1rm, maxReps: pr.max_reps, maxVolume: pr.max_volume, maxDuration: pr.max_duration, updatedAt: pr.updated_at } : null } };
  });
}
