/**
 * Cross-module reward hooks (CONTRACT). Other modules call these inside their own
 * transaction after a qualifying action; implementations must be idempotent
 * (xp_events has UNIQUE (user_id, source_type, source_key)) and must never throw for
 * "no reward" situations. Owned by the gamification module.
 *
 * Every hook runs inside a SAVEPOINT when given a transaction: an unexpected failure in
 * the reward logic is rolled back and logged, and never breaks the caller's action
 * (finishing a workout, logging food…).
 */
import { addDays, isValidDateString, startOfWeek } from '@shared/dates';
import { XP_RULES, isQualifyingWorkout } from '@shared/gamification';
import { EMPTY_REWARD, type RewardResultDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getExerciseMap } from '../exercises/repository';
import { getProfile } from '../profile/repository';
import { loadCompletedWorkouts, loadUserContext, totalXp } from '../progress/data';
import { checkLevelUp, evaluateAchievements, insertXp, notify, unlockAchievement } from './service';

export interface WorkoutCompletedEvent {
  userId: string;
  sessionId: string;
  /** Calendar date (user time zone) the session ended. */
  date: string;
  endedAt: Date;
  durationSeconds: number;
  completedSets: number;
  totalVolumeKg: number;
  /** Personal records set in this session. */
  personalRecordIds: string[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAVEPOINT = 'fitai_gamification_hook';

async function guarded(sql: Sql, name: string, fn: () => Promise<RewardResultDTO>): Promise<RewardResultDTO> {
  let inTransaction = false;
  try {
    await sql.exec(`SAVEPOINT ${SAVEPOINT}`);
    inTransaction = true;
  } catch {
    // Called outside a transaction (pool handle): run without a savepoint.
  }
  try {
    const result = await fn();
    if (inTransaction) await sql.exec(`RELEASE SAVEPOINT ${SAVEPOINT}`);
    return result;
  } catch (err) {
    if (inTransaction) await sql.exec(`ROLLBACK TO SAVEPOINT ${SAVEPOINT}`).catch(() => undefined);
    console.error(`[gamification] ${name} failed:`, err instanceof Error ? err.message : err);
    return { ...EMPTY_REWARD, newAchievements: [], notes: [] };
  }
}

/**
 * Workout XP (base + capped per-set bonus) unless the session was too short, the user
 * already earned workout XP that day, or the week is already past goal + buffer
 * (rest matters). Plus PR XP (capped per session) with a notification per PR, the weekly
 * goal bonus, achievements and level-ups.
 */
export async function onWorkoutCompleted(sql: Sql, event: WorkoutCompletedEvent): Promise<RewardResultDTO> {
  return guarded(sql, 'onWorkoutCompleted', async () => {
    const { userId, sessionId } = event;
    const ctx = await loadUserContext(sql, userId);
    const before = await totalXp(sql, userId);
    const date = isValidDateString(event.date) ? event.date : ctx.today;
    const weekStart = startOfWeek(date, ctx.weekStart);
    const otherQualifyingThisWeek = (await loadCompletedWorkouts(sql, ctx, { from: weekStart, to: addDays(weekStart, 6) })).filter(
      (w) => w.id !== sessionId && w.qualifies,
    );
    const qualifies = isQualifyingWorkout(event.durationSeconds, event.completedSets);

    const notes: string[] = [];
    let workoutXp = 0;
    if (!qualifies) {
      notes.push('too_short');
    } else {
      const today = await sql.one<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM xp_events
          WHERE user_id = $1 AND source_type = 'workout' AND xp > 0 AND meta->>'date' = $2 AND source_key <> $3`,
        [userId, date, sessionId],
      );
      const ordinal = otherQualifyingThisWeek.filter((w) => w.endedAt.getTime() <= new Date(event.endedAt).getTime()).length + 1;
      if (Number(today.n) >= XP_RULES.maxRewardedWorkoutsPerDay) notes.push('daily_workout_cap');
      else if (ordinal > ctx.weeklyGoal + XP_RULES.extraWorkoutsPerWeekRewarded) notes.push('rest_matters');
      else workoutXp = XP_RULES.workoutCompleted + Math.min(XP_RULES.perCompletedSet * event.completedSets, XP_RULES.perSessionSetXpCap);
    }

    // One row per completed session (even with 0 XP) makes repeated calls detectable.
    const firstCall = await insertXp(sql, userId, 'workout', sessionId, workoutXp, {
      date,
      sets: event.completedSets,
      durationSeconds: event.durationSeconds,
      notes,
    });
    if (!firstCall) {
      const stored = await sql.maybeOne<{ notes: unknown }>(
        `SELECT meta->'notes' AS notes FROM xp_events WHERE user_id = $1 AND source_type = 'workout' AND source_key = $2`,
        [userId, sessionId],
      );
      return { ...EMPTY_REWARD, newAchievements: [], notes: Array.isArray(stored?.notes) ? (stored.notes as string[]) : [] };
    }
    let xp = workoutXp;

    const prIds = event.personalRecordIds.filter((id) => UUID_RE.test(id));
    if (prIds.length) {
      const prs = await sql.many<{ id: string; exercise_id: string; record_type: string; value: number; previous_value: number | null }>(
        `SELECT id, exercise_id, record_type, value, previous_value FROM personal_records
          WHERE user_id = $1 AND id = ANY($2::uuid[]) ORDER BY array_position($2::uuid[], id)`,
        [userId, prIds],
      );
      const exercises = await getExerciseMap();
      let rewarded = 0;
      for (const pr of prs) {
        if (
          rewarded < XP_RULES.maxRewardedPrsPerSession &&
          (await insertXp(sql, userId, 'personal_record', pr.id, XP_RULES.personalRecord, { sessionId, exerciseId: pr.exercise_id, recordType: pr.record_type }))
        ) {
          xp += XP_RULES.personalRecord;
          rewarded++;
        }
        await notify(
          sql,
          userId,
          'personal_record',
          {
            exerciseId: pr.exercise_id,
            exerciseName: exercises.get(pr.exercise_id)?.name ?? { en: pr.exercise_id, he: pr.exercise_id },
            recordType: pr.record_type,
            value: Number(pr.value),
            previousValue: pr.previous_value == null ? null : Number(pr.previous_value),
          },
          `pr:${pr.id}`,
        );
      }
    }

    const completedThisWeek = otherQualifyingThisWeek.length + (qualifies ? 1 : 0);
    if (
      completedThisWeek >= ctx.weeklyGoal &&
      (await insertXp(sql, userId, 'weekly_goal', weekStart, XP_RULES.weeklyGoalMet, { goal: ctx.weeklyGoal, completed: completedThisWeek }))
    ) {
      xp += XP_RULES.weeklyGoalMet;
      await notify(sql, userId, 'weekly_goal', { weekStart, goal: ctx.weeklyGoal, completed: completedThisWeek }, `weekly_goal:${weekStart}`);
    }

    const newAchievements = await evaluateAchievements(sql, ctx);
    const levelUp = await checkLevelUp(sql, userId, before);
    return { xpAwarded: xp, newAchievements, levelUp, notes };
  });
}

/**
 * Food-logging XP for a (recent) day: logging at least `foodLogMinMeals` meal types, and
 * reaching the protein threshold of the target. Never rewards eating less.
 */
export async function onFoodLogged(sql: Sql, event: { userId: string; date: string }): Promise<RewardResultDTO> {
  return guarded(sql, 'onFoodLogged', async () => {
    const { userId, date } = event;
    const ctx = await loadUserContext(sql, userId);
    const before = await totalXp(sql, userId);
    const notes: string[] = [];
    let xp = 0;
    if (!isValidDateString(date) || date > ctx.today || date < addDays(ctx.today, -XP_RULES.foodRewardWindowDays)) {
      notes.push('outside_reward_window');
    } else {
      const day = await sql.one<{ meal_types: number; protein: number }>(
        `SELECT COUNT(DISTINCT meal_type)::int AS meal_types, COALESCE(SUM(protein_g), 0)::float8 AS protein
           FROM food_log_entries WHERE user_id = $1 AND logged_on = $2`,
        [userId, date],
      );
      if (Number(day.meal_types) >= XP_RULES.foodLogMinMeals && (await insertXp(sql, userId, 'food_day', date, XP_RULES.foodLoggedDay, { mealTypes: Number(day.meal_types) }))) {
        xp += XP_RULES.foodLoggedDay;
      }
      const target = (await getProfile(sql, userId)).targets?.proteinG ?? null;
      const protein = Number(day.protein);
      if (
        target != null &&
        protein >= target * XP_RULES.proteinTargetThreshold &&
        (await insertXp(sql, userId, 'protein_day', date, XP_RULES.proteinTargetDay, { proteinG: protein, targetG: target }))
      ) {
        xp += XP_RULES.proteinTargetDay;
      }
    }
    const newAchievements = await evaluateAchievements(sql, ctx);
    const levelUp = await checkLevelUp(sql, userId, before);
    return { xpAwarded: xp, newAchievements, levelUp, notes };
  });
}

/** Weigh-in XP at most once per calendar week (the week of logging, so back-filling earns nothing extra). */
export async function onBodyWeightLogged(sql: Sql, event: { userId: string; date: string }): Promise<RewardResultDTO> {
  return guarded(sql, 'onBodyWeightLogged', async () => {
    const { userId } = event;
    const ctx = await loadUserContext(sql, userId);
    const before = await totalXp(sql, userId);
    const notes: string[] = [];
    let xp = 0;
    if (await insertXp(sql, userId, 'body_weight', ctx.currentWeekStart, XP_RULES.bodyWeightWeekly, { date: event.date })) {
      xp += XP_RULES.bodyWeightWeekly;
    } else {
      notes.push('weekly_weigh_in_cap');
    }
    const newAchievements = await evaluateAchievements(sql, ctx);
    const levelUp = await checkLevelUp(sql, userId, before);
    return { xpAwarded: xp, newAchievements, levelUp, notes };
  });
}

/** First coach question unlocks an achievement (no XP — asking questions is not farmable). */
export async function onCoachQuestion(sql: Sql, event: { userId: string }): Promise<RewardResultDTO> {
  return guarded(sql, 'onCoachQuestion', async () => {
    const ctx = await loadUserContext(sql, event.userId);
    const newAchievements: string[] = [];
    if (await unlockAchievement(sql, event.userId, 'coach_first_question')) newAchievements.push('coach_first_question');
    newAchievements.push(...(await evaluateAchievements(sql, ctx)));
    return { xpAwarded: 0, newAchievements, levelUp: null, notes: [] };
  });
}
