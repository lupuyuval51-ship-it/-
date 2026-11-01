import { ACHIEVEMENT_IDS, evaluateAchievements, isoWeekKey, levelFromXp, type AchievementId, type AchievementStats, type XpAward } from '@lupu-fit/shared';
import { randomId } from '../crypto/portableCrypto.ts';
import type { DbAdapter } from '../db/adapter.ts';

/** Idempotent: the (user, source_type, source_key) unique key means the same event can never pay twice. */
export async function awardXp(db: DbAdapter, userId: string, a: XpAward): Promise<boolean> {
  const rows = await db.query('INSERT INTO xp_events (id, user_id, source_type, source_key, amount) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id, source_type, source_key) DO NOTHING RETURNING id', [randomId(), userId, a.sourceType, a.sourceKey, a.amount]);
  return rows.length > 0;
}

export async function totalXp(db: DbAdapter, userId: string): Promise<number> {
  return Number((await db.query<{ t: number }>('SELECT COALESCE(SUM(amount),0)::int AS t FROM xp_events WHERE user_id = $1', [userId]))[0]?.t ?? 0);
}
export const levelOf = levelFromXp;

const n = async (db: DbAdapter, sql: string, p: unknown[]): Promise<number> => Number((await db.query<{ c: number }>(sql, p))[0]?.c ?? 0);

/** Consecutive ISO weeks (ending this week or last week) in which the weekly goal XP was earned. */
function consecutiveWeeks(keys: string[], todayIso: string): number {
  const set = new Set(keys);
  let d = Date.parse(`${todayIso}T00:00:00Z`);
  if (!set.has(isoWeekKey(new Date(d).toISOString().slice(0, 10)))) d -= 7 * 86400_000; // this week may not be finished yet
  let run = 0;
  while (set.has(isoWeekKey(new Date(d).toISOString().slice(0, 10)))) { run++; d -= 7 * 86400_000; }
  return run;
}

export async function collectStats(db: DbAdapter, userId: string, todayIso: string): Promise<AchievementStats> {
  const weeks = (await db.query<{ source_key: string }>("SELECT source_key FROM xp_events WHERE user_id = $1 AND source_type = 'weekly_goal'", [userId])).map((r) => r.source_key);
  return {
    workouts: await n(db, 'SELECT COUNT(*)::int AS c FROM workout_sessions s WHERE s.user_id = $1 AND s.finished_at IS NOT NULL AND EXISTS (SELECT 1 FROM session_exercises e JOIN session_sets t ON t.session_exercise_id = e.id WHERE e.session_id = s.id)', [userId]),
    prs: await n(db, "SELECT COALESCE(SUM(amount)/15,0)::int AS c FROM xp_events WHERE user_id = $1 AND source_type = 'pr'", [userId]),
    consecutiveGoalWeeks: consecutiveWeeks(weeks, todayIso),
    weeklyGoalHits: weeks.length,
    foodLogDays: await n(db, 'SELECT COUNT(DISTINCT logged_date)::int AS c FROM food_log_entries WHERE user_id = $1', [userId]),
    proteinDays: await n(db, "SELECT COUNT(*)::int AS c FROM xp_events WHERE user_id = $1 AND source_type = 'protein_day'", [userId]),
    weighIns: await n(db, 'SELECT COUNT(*)::int AS c FROM body_weight_entries WHERE user_id = $1', [userId]),
    finishers: await n(db, 'SELECT COUNT(DISTINCT s.id)::int AS c FROM workout_sessions s JOIN session_exercises e ON e.session_id = s.id WHERE s.user_id = $1 AND s.finished_at IS NOT NULL AND e.is_finisher = true', [userId]),
    coachThreads: await n(db, 'SELECT COUNT(*)::int AS c FROM coach_threads WHERE user_id = $1', [userId]),
  };
}

/** Unlocks newly earned achievements (idempotent) and queues a notification for each. */
export async function unlockAchievements(db: DbAdapter, userId: string, todayIso: string): Promise<AchievementId[]> {
  const have = new Set((await db.query<{ achievement_id: AchievementId }>('SELECT achievement_id FROM user_achievements WHERE user_id = $1', [userId])).map((r) => r.achievement_id));
  const fresh = evaluateAchievements(await collectStats(db, userId, todayIso), have);
  const done: AchievementId[] = [];
  for (const id of fresh) {
    if (!(ACHIEVEMENT_IDS as readonly string[]).includes(id)) continue;
    const ins = await db.query('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING achievement_id', [userId, id]);
    if (ins.length > 0) { done.push(id); await db.query("INSERT INTO notifications (id, user_id, kind, payload) VALUES ($1,$2,'achievement',$3)", [randomId(), userId, JSON.stringify({ id })]); }
  }
  return done;
}
