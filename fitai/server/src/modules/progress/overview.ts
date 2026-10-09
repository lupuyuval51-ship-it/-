/**
 * Progress overview for the last N days, computed only from recorded data: completed
 * workouts, completed sets, personal records, body-weight entries and food logs.
 */
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP, type MuscleGroup, type ProgressPeriod } from '@shared/constants';
import { addDays, dateRange, startOfWeek } from '@shared/dates';
import { round1 } from '@shared/nutrition';
import type { Macros } from '@shared/nutrition';
import type { ProgressOverviewDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getExerciseMap } from '../exercises/repository';
import { getProfile } from '../profile/repository';
import { weeklyStatus } from '../gamification/service';
import { instantBounds, loadCompletedWorkouts, loadExerciseSetStats, loadRecentRecords, localDate, type UserContext, type WorkoutRecord } from './data';
import { buildInsights } from './insights';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

function totals(workouts: WorkoutRecord[]) {
  return {
    count: workouts.length,
    durationSeconds: sum(workouts.map((w) => w.durationSeconds)),
    sets: sum(workouts.map((w) => w.completedSets)),
    reps: sum(workouts.map((w) => w.reps)),
    volumeKg: round1(sum(workouts.map((w) => w.volumeKg))),
  };
}

interface NutritionDayRow {
  logged_on: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

/** `history` (all completed workouts) may be passed when the caller already loaded it. */
export async function computeOverview(sql: Sql, ctx: UserContext, period: ProgressPeriod, history?: WorkoutRecord[]): Promise<ProgressOverviewDTO> {
  const to = ctx.today;
  const from = addDays(to, -(period - 1));
  const prevFrom = addDays(from, -period);
  const prevTo = addDays(from, -1);

  const all = history ?? (await loadCompletedWorkouts(sql, ctx));
  const inRange = all.filter((w) => w.date >= from && w.date <= to);
  const previous = all.filter((w) => w.date >= prevFrom && w.date <= prevTo);
  const current = totals(inRange);
  const prev = totals(previous);

  // ------------------------------------------------------------------ daily & weekly
  const daily = dateRange(from, to).map((date) => {
    const day = inRange.filter((w) => w.date === date);
    return {
      date,
      workouts: day.length,
      volumeKg: round1(sum(day.map((w) => w.volumeKg))),
      durationSeconds: sum(day.map((w) => w.durationSeconds)),
    };
  });

  const status = weeklyStatus(ctx, all);
  const goal = ctx.weeklyGoal;
  const firstWeek = startOfWeek(from, ctx.weekStart);
  // Weeks before the user started tracking (account creation or first workout) are not "missed".
  const firstActivity = all[0]?.date;
  const startWeek = startOfWeek(firstActivity && firstActivity < ctx.createdOn ? firstActivity : ctx.createdOn, ctx.weekStart);
  const weekly: ProgressOverviewDTO['weekly'] = [];
  let weeksMet = 0;
  let weeksTotal = 0;
  let finishedMet = 0;
  let finishedTotal = 0;
  for (let ws = firstWeek; ws <= ctx.currentWeekStart; ws = addDays(ws, 7)) {
    const we = addDays(ws, 6);
    const week = all.filter((w) => w.date >= ws && w.date <= we);
    const goalMet = (status.weekCounts.get(ws) ?? 0) >= goal;
    weekly.push({ weekStart: ws, workouts: week.length, volumeKg: round1(sum(week.map((w) => w.volumeKg))), goalMet });
    // The running week and the (partial) first week only count once their goal is met.
    const counted = ws >= startWeek && (goalMet || (ws > startWeek && ws < ctx.currentWeekStart));
    if (!counted) continue;
    weeksTotal++;
    if (goalMet) weeksMet++;
    if (ws < ctx.currentWeekStart) {
      finishedTotal++;
      if (goalMet) finishedMet++;
    }
  }

  // ------------------------------------------------------------------ body weight
  const weights = await sql.many<{ measured_on: string; weight_kg: number }>(
    `SELECT measured_on, weight_kg FROM body_weight_entries
      WHERE user_id = $1 AND measured_on BETWEEN $2 AND $3 ORDER BY measured_on`,
    [ctx.userId, from, to],
  );
  const bwEntries = weights.map((w) => ({ date: w.measured_on, weightKg: Number(w.weight_kg) }));
  const bwFirst = bwEntries[0];
  const bwLast = bwEntries[bwEntries.length - 1];

  // ------------------------------------------------------------------ nutrition
  const days = await sql.many<NutritionDayRow>(
    `SELECT logged_on, SUM(kcal)::float8 AS kcal, SUM(protein_g)::float8 AS protein_g, SUM(carbs_g)::float8 AS carbs_g,
            SUM(fat_g)::float8 AS fat_g, SUM(fiber_g)::float8 AS fiber_g
       FROM food_log_entries
      WHERE user_id = $1 AND logged_on BETWEEN $2 AND $3
      GROUP BY logged_on ORDER BY logged_on`,
    [ctx.userId, from, to],
  );
  const lastLog = await sql.one<{ last: string | null }>(
    'SELECT MAX(logged_on) AS last FROM food_log_entries WHERE user_id = $1 AND logged_on <= $2',
    [ctx.userId, to],
  );
  const profile = await getProfile(sql, ctx.userId);
  const targetCalories = profile.targets?.calories ?? null;
  const targetProteinG = profile.targets?.proteinG ?? null;
  const n = days.length;
  const averages: Macros | null = n
    ? {
        kcal: Math.round(sum(days.map((d) => Number(d.kcal))) / n),
        proteinG: round1(sum(days.map((d) => Number(d.protein_g))) / n),
        carbsG: round1(sum(days.map((d) => Number(d.carbs_g))) / n),
        fatG: round1(sum(days.map((d) => Number(d.fat_g))) / n),
        fiberG: round1(sum(days.map((d) => Number(d.fiber_g))) / n),
      }
    : null;
  const withinCalories = targetCalories ? days.filter((d) => Math.abs(Number(d.kcal) - targetCalories) <= targetCalories * 0.1).length : 0;
  const proteinDays = targetProteinG ? days.filter((d) => Number(d.protein_g) >= targetProteinG * 0.9).length : 0;

  // ------------------------------------------------------------------ muscle groups & strength
  const setStats = await loadExerciseSetStats(sql, ctx, from, to);
  const rangeSessions = new Map(inRange.map((w) => [w.id, w]));
  const exercises = await getExerciseMap();
  const groupSets = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]));
  const strengthByExercise = new Map<string, { date: string; at: number; est1rmKg: number }[]>();
  for (const stat of setStats) {
    const session = rangeSessions.get(stat.sessionId);
    if (!session) continue;
    const ex = exercises.get(stat.exerciseId);
    if (ex) {
      for (const g of new Set(ex.primaryMuscles.map((m) => MUSCLE_TO_GROUP[m]))) groupSets.set(g, (groupSets.get(g) ?? 0) + stat.sets);
    }
    if (stat.bestEst1rmKg != null) {
      const list = strengthByExercise.get(stat.exerciseId) ?? [];
      list.push({ date: session.date, at: session.endedAt.getTime(), est1rmKg: stat.bestEst1rmKg });
      strengthByExercise.set(stat.exerciseId, list);
    }
  }
  const totalGroupSets = sum(Array.from(groupSets.values()));
  const muscleGroupSets = totalGroupSets
    ? MUSCLE_GROUPS.map((group) => ({ group, sets: groupSets.get(group) ?? 0 })).sort((a, b) => b.sets - a.sets)
    : [];

  // ------------------------------------------------------------------ records
  const recentRecords = await loadRecentRecords(sql, ctx.userId, 500, instantBounds(from, to)[0]);
  const records = recentRecords
    .filter((r) => {
      const d = localDate(new Date(r.achievedAt), ctx.timezone);
      return d >= from && d <= to;
    })
    .slice(0, 50);

  const insights = buildInsights({
    period,
    today: to,
    workouts: { count: current.count, previousCount: prev.count, volumeKg: current.volumeKg, previousVolumeKg: prev.volumeKg },
    currentStreakWeeks: status.streak.currentWeeks,
    finishedWeeks: { met: finishedMet, total: finishedTotal },
    trainingDates: all.filter((w) => w.date <= to && w.date >= addDays(to, -30)).map((w) => w.date),
    strength: Array.from(strengthByExercise.entries()).map(([id, points]) => ({
      name: exercises.get(id)?.name ?? { en: id, he: id },
      points: points.sort((a, b) => a.at - b.at).map(({ date, est1rmKg }) => ({ date, est1rmKg })),
    })),
    bodyWeight: bwEntries,
    nutritionDays: days.map((d) => ({ date: d.logged_on, kcal: Number(d.kcal), proteinG: Number(d.protein_g) })),
    targetCalories,
    targetProteinG,
    lastFoodLogDate: lastLog.last,
  });

  return {
    period,
    from,
    to,
    workouts: {
      count: current.count,
      totalDurationSeconds: current.durationSeconds,
      totalSets: current.sets,
      totalReps: current.reps,
      totalVolumeKg: current.volumeKg,
      averagePerWeek: round1(current.count / (period / 7)),
      previousCount: prev.count,
      previousVolumeKg: prev.volumeKg,
    },
    daily,
    weekly,
    consistency: {
      weeklyGoal: goal,
      weeksMet,
      weeksTotal,
      percent: weeksTotal ? Math.round((weeksMet / weeksTotal) * 100) : 0,
      currentStreakWeeks: status.streak.currentWeeks,
    },
    bodyWeight: {
      entries: bwEntries,
      latestKg: bwLast ? bwLast.weightKg : null,
      changeKg: bwFirst && bwLast && bwEntries.length >= 2 ? round1(bwLast.weightKg - bwFirst.weightKg) : null,
    },
    nutrition: {
      daysLogged: n,
      averages,
      targetCalories,
      targetProteinG,
      calorieAdherencePercent: targetCalories && n ? Math.round((withinCalories / n) * 100) : null,
      proteinTargetDays: proteinDays,
    },
    muscleGroupSets,
    records,
    insights,
  };
}
