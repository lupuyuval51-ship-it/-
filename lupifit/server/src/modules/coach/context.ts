/**
 * Builds the coach's view of the CURRENT user's data: profile, active plan, recent
 * workouts, PRs, nutrition and body-weight trend. Every query is scoped by user_id.
 * The structured `CoachData` feeds the built-in coach; `formatContext` turns it into
 * a compact text block for the model (no email, no ids, no exact birth data).
 */
import { ADULT_AGE, type Locale, type PrType, type Units } from '@shared/constants';
import type { LocalizedText } from '@shared/content';
import { addDays, dateInTimeZone, diffDays, todayInTimeZone } from '@shared/dates';
import { round1, type Macros } from '@shared/nutrition';
import { setVolumeKg } from '@shared/training';
import type { ProfileDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getExerciseMap, type ExerciseRecord } from '../exercises/repository';
import { getProfile } from '../profile/repository';

export interface PlanExerciseInfo {
  exerciseId: string;
  name: LocalizedText;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetWeightKg: number | null;
}

export interface PlanInfo {
  name: string;
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  workouts: { name: string; focus: string; exercises: PlanExerciseInfo[] }[];
}

export interface SetInfo {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
}

export interface SessionExerciseInfo {
  exerciseId: string;
  name: LocalizedText;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  sets: SetInfo[];
}

export interface SessionInfo {
  date: string;
  name: string;
  durationMinutes: number | null;
  volumeKg: number;
  completedSets: number;
  exercises: SessionExerciseInfo[];
}

export interface PrInfo {
  exerciseId: string;
  name: LocalizedText;
  type: PrType;
  value: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  date: string;
}

export interface DayTotals extends Omit<Macros, 'fiberG'> {
  date: string;
  entries: number;
}

export interface NutritionInfo {
  /** Logged days in the window that ends yesterday (today is still in progress). */
  windowDays: number;
  daysLogged: number;
  /** Averages over the logged days of the window (null when none were logged). */
  average: Omit<Macros, 'fiberG'> | null;
  today: DayTotals | null;
}

export interface WeightPoint {
  date: string;
  kg: number;
}

export interface WeightInfo {
  latest: WeightPoint | null;
  /** First → last entry within the last 30 days (null with fewer than two entries). */
  trend: { from: WeightPoint; to: WeightPoint; changeKg: number; days: number; weeklyRateKg: number | null } | null;
  entriesLast30: number;
}

export interface TrainingStats {
  completedTotal: number;
  last7: number;
  last28: number;
  last30: number;
  volume30Kg: number;
  firstWorkoutDate: string | null;
}

export interface CoachData {
  displayName: string;
  locale: Locale;
  units: Units;
  timezone: string;
  today: string;
  profile: ProfileDTO;
  /** Lowest calorie target the app accepts for this user (null if the profile is incomplete). */
  minimumCalories: number | null;
  plan: PlanInfo | null;
  recentSessions: SessionInfo[];
  stats: TrainingStats;
  prs: PrInfo[];
  nutrition: NutritionInfo;
  weight: WeightInfo;
}

export const NUTRITION_WINDOW_DAYS = 7;
const UNKNOWN_NAME = (id: string): LocalizedText => ({ en: id.replace(/_/g, ' '), he: id.replace(/_/g, ' ') });
const num = (v: unknown): number | null => (v == null ? null : Number(v));

function nameOf(map: Map<string, ExerciseRecord>, id: string): LocalizedText {
  return map.get(id)?.name ?? UNKNOWN_NAME(id);
}

async function loadPlan(sql: Sql, userId: string, names: Map<string, ExerciseRecord>): Promise<PlanInfo | null> {
  const plan = await sql.maybeOne<{ id: string; name: string; days_per_week: number | null; session_minutes: number | null }>(
    `SELECT id, name, days_per_week, session_minutes FROM workout_plans WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId],
  );
  if (!plan) return null;
  const rows = await sql.many<{
    workout_id: string;
    workout_name: string;
    focus: string;
    exercise_id: string | null;
    sets: number | null;
    rep_min: number | null;
    rep_max: number | null;
    target_seconds: number | null;
    rest_seconds: number | null;
    target_weight_kg: number | null;
  }>(
    `SELECT w.id AS workout_id, w.name AS workout_name, w.focus, e.exercise_id, e.sets, e.rep_min, e.rep_max,
            e.target_seconds, e.rest_seconds, e.target_weight_kg
       FROM plan_workouts w
       LEFT JOIN plan_exercises e ON e.workout_id = w.id AND e.user_id = $1
      WHERE w.plan_id = $2 AND w.user_id = $1
      ORDER BY w.position, e.position`,
    [userId, plan.id],
  );
  const workouts: PlanInfo['workouts'] = [];
  const byId = new Map<string, PlanInfo['workouts'][number]>();
  for (const r of rows) {
    let w = byId.get(r.workout_id);
    if (!w) {
      w = { name: r.workout_name, focus: r.focus ?? '', exercises: [] };
      byId.set(r.workout_id, w);
      workouts.push(w);
    }
    if (r.exercise_id) {
      w.exercises.push({
        exerciseId: r.exercise_id,
        name: nameOf(names, r.exercise_id),
        sets: r.sets ?? 0,
        repMin: r.rep_min,
        repMax: r.rep_max,
        targetSeconds: r.target_seconds,
        restSeconds: r.rest_seconds ?? 0,
        targetWeightKg: num(r.target_weight_kg),
      });
    }
  }
  return { name: plan.name, daysPerWeek: plan.days_per_week, sessionMinutes: plan.session_minutes, workouts };
}

async function loadRecentSessions(sql: Sql, userId: string, tz: string, names: Map<string, ExerciseRecord>): Promise<SessionInfo[]> {
  const sessions = await sql.many<{ id: string; name: string; ended_at: Date; duration_seconds: number | null }>(
    `SELECT id, name, ended_at, duration_seconds FROM workout_sessions
      WHERE user_id = $1 AND status = 'completed' AND ended_at IS NOT NULL
      ORDER BY ended_at DESC LIMIT 5`,
    [userId],
  );
  if (!sessions.length) return [];
  const rows = await sql.many<{
    session_id: string;
    session_exercise_id: string;
    exercise_id: string;
    rep_min: number | null;
    rep_max: number | null;
    target_seconds: number | null;
    reps: number | null;
    weight_kg: number | null;
    duration_seconds: number | null;
  }>(
    `SELECT se.session_id, se.id AS session_exercise_id, se.exercise_id, se.rep_min, se.rep_max, se.target_seconds,
            ss.reps, ss.weight_kg, ss.duration_seconds
       FROM session_exercises se
       JOIN session_sets ss ON ss.session_exercise_id = se.id AND ss.completed AND ss.user_id = $1
      WHERE se.user_id = $1 AND se.session_id = ANY($2::uuid[])
      ORDER BY se.session_id, se.position, ss.set_number`,
    [userId, sessions.map((s) => s.id)],
  );
  const bySession = new Map<string, Map<string, SessionExerciseInfo>>();
  for (const r of rows) {
    let exercises = bySession.get(r.session_id);
    if (!exercises) {
      exercises = new Map();
      bySession.set(r.session_id, exercises);
    }
    let ex = exercises.get(r.session_exercise_id);
    if (!ex) {
      ex = { exerciseId: r.exercise_id, name: nameOf(names, r.exercise_id), repMin: r.rep_min, repMax: r.rep_max, targetSeconds: r.target_seconds, sets: [] };
      exercises.set(r.session_exercise_id, ex);
    }
    ex.sets.push({ reps: r.reps, weightKg: num(r.weight_kg), durationSeconds: r.duration_seconds });
  }
  return sessions.map((s) => {
    const exercises = [...(bySession.get(s.id)?.values() ?? [])];
    const allSets = exercises.flatMap((e) => e.sets);
    return {
      date: dateInTimeZone(s.ended_at, tz),
      name: s.name,
      durationMinutes: s.duration_seconds != null ? Math.round(s.duration_seconds / 60) : null,
      volumeKg: Math.round(allSets.reduce((sum, x) => sum + setVolumeKg(x.weightKg, x.reps), 0)),
      completedSets: allSets.length,
      exercises,
    };
  });
}

async function loadStats(sql: Sql, userId: string, tz: string): Promise<TrainingStats> {
  const row = await sql.one<{ total: number; last7: number; last28: number; last30: number; first: Date | null }>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE ended_at >= now() - interval '7 days')::int AS last7,
            count(*) FILTER (WHERE ended_at >= now() - interval '28 days')::int AS last28,
            count(*) FILTER (WHERE ended_at >= now() - interval '30 days')::int AS last30,
            min(ended_at) AS first
       FROM workout_sessions WHERE user_id = $1 AND status = 'completed' AND ended_at IS NOT NULL`,
    [userId],
  );
  const vol = await sql.one<{ volume: number | null }>(
    `SELECT COALESCE(sum(ss.weight_kg * ss.reps), 0) AS volume
       FROM session_sets ss JOIN workout_sessions ws ON ws.id = ss.session_id AND ws.user_id = $1
      WHERE ss.user_id = $1 AND ss.completed AND ws.status = 'completed'
        AND ws.ended_at >= now() - interval '30 days' AND ss.weight_kg > 0 AND ss.reps > 0`,
    [userId],
  );
  return {
    completedTotal: row.total,
    last7: row.last7,
    last28: row.last28,
    last30: row.last30,
    volume30Kg: Math.round(Number(vol.volume ?? 0)),
    firstWorkoutDate: row.first ? dateInTimeZone(row.first, tz) : null,
  };
}

async function loadPrs(sql: Sql, userId: string, tz: string, names: Map<string, ExerciseRecord>): Promise<PrInfo[]> {
  const rows = await sql.many<{
    exercise_id: string;
    record_type: PrType;
    value: number;
    weight_kg: number | null;
    reps: number | null;
    duration_seconds: number | null;
    achieved_at: Date;
  }>(
    `SELECT DISTINCT ON (exercise_id, record_type) exercise_id, record_type, value, weight_kg, reps, duration_seconds, achieved_at
       FROM personal_records WHERE user_id = $1 AND achieved_at >= now() - interval '90 days'
      ORDER BY exercise_id, record_type, achieved_at DESC`,
    [userId],
  );
  return rows
    .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
    .slice(0, 6)
    .map((r) => ({
      exerciseId: r.exercise_id,
      name: nameOf(names, r.exercise_id),
      type: r.record_type,
      value: Number(r.value),
      weightKg: num(r.weight_kg),
      reps: r.reps,
      durationSeconds: r.duration_seconds,
      date: dateInTimeZone(r.achieved_at, tz),
    }));
}

async function loadNutrition(sql: Sql, userId: string, today: string): Promise<NutritionInfo> {
  const from = addDays(today, -NUTRITION_WINDOW_DAYS);
  const rows = await sql.many<{ logged_on: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number; entries: number }>(
    `SELECT logged_on, sum(kcal) AS kcal, sum(protein_g) AS protein_g, sum(carbs_g) AS carbs_g, sum(fat_g) AS fat_g, count(*)::int AS entries
       FROM food_log_entries WHERE user_id = $1 AND logged_on BETWEEN $2 AND $3
      GROUP BY logged_on ORDER BY logged_on`,
    [userId, from, today],
  );
  const days: DayTotals[] = rows.map((r) => ({
    date: r.logged_on,
    kcal: round1(Number(r.kcal)),
    proteinG: round1(Number(r.protein_g)),
    carbsG: round1(Number(r.carbs_g)),
    fatG: round1(Number(r.fat_g)),
    entries: r.entries,
  }));
  const past = days.filter((d) => d.date < today);
  const avg = (pick: (d: DayTotals) => number) => Math.round(past.reduce((s, d) => s + pick(d), 0) / past.length);
  return {
    windowDays: NUTRITION_WINDOW_DAYS,
    daysLogged: past.length,
    average: past.length ? { kcal: avg((d) => d.kcal), proteinG: avg((d) => d.proteinG), carbsG: avg((d) => d.carbsG), fatG: avg((d) => d.fatG) } : null,
    today: days.find((d) => d.date === today) ?? null,
  };
}

async function loadWeight(sql: Sql, userId: string, today: string): Promise<WeightInfo> {
  const latest = await sql.maybeOne<{ measured_on: string; weight_kg: number }>(
    'SELECT measured_on, weight_kg FROM body_weight_entries WHERE user_id = $1 ORDER BY measured_on DESC LIMIT 1',
    [userId],
  );
  const recent = await sql.many<{ measured_on: string; weight_kg: number }>(
    'SELECT measured_on, weight_kg FROM body_weight_entries WHERE user_id = $1 AND measured_on >= $2 ORDER BY measured_on',
    [userId, addDays(today, -30)],
  );
  const points = recent.map((r) => ({ date: r.measured_on, kg: Number(r.weight_kg) }));
  let trend: WeightInfo['trend'] = null;
  if (points.length >= 2) {
    const from = points[0]!;
    const to = points[points.length - 1]!;
    const days = diffDays(to.date, from.date);
    const changeKg = round1(to.kg - from.kg);
    trend = { from, to, changeKg, days, weeklyRateKg: days >= 7 ? round1((changeKg / days) * 7) : null };
  }
  return {
    latest: latest ? { date: latest.measured_on, kg: Number(latest.weight_kg) } : null,
    trend,
    entriesLast30: points.length,
  };
}

/** Everything the coach may know about the signed-in user (and nothing about anyone else). */
export async function loadCoachData(sql: Sql, userId: string): Promise<CoachData> {
  const user = await sql.one<{ display_name: string; locale: Locale; units: Units; timezone: string }>(
    'SELECT display_name, locale, units, timezone FROM users WHERE id = $1',
    [userId],
  );
  const today = todayInTimeZone(user.timezone);
  const names = await getExerciseMap();
  const profile = await getProfile(sql, userId);
  const [plan, recentSessions, stats, prs, nutrition, weight] = await Promise.all([
    loadPlan(sql, userId, names),
    loadRecentSessions(sql, userId, user.timezone, names),
    loadStats(sql, userId, user.timezone),
    loadPrs(sql, userId, user.timezone, names),
    loadNutrition(sql, userId, today),
    loadWeight(sql, userId, today),
  ]);
  return {
    displayName: user.display_name,
    locale: user.locale,
    units: user.units,
    timezone: user.timezone,
    today,
    profile,
    minimumCalories: profile.targets?.computed?.minimumCalories ?? null,
    plan,
    recentSessions,
    stats,
    prs,
    nutrition,
    weight,
  };
}

/** Current body weight: the latest logged entry, else the profile weight. */
export function currentWeightKg(data: Pick<CoachData, 'weight' | 'profile'>): number | null {
  return data.weight.latest?.kg ?? data.profile.weightKg ?? null;
}

/** Age bracket instead of the exact age (privacy): "teen (13–17)", "adult 25–34", … */
export function ageGroup(age: number | null): string | null {
  if (age == null) return null;
  if (age < ADULT_AGE) return 'teen (13–17)';
  const brackets: [number, number][] = [
    [18, 24],
    [25, 34],
    [35, 44],
    [45, 54],
    [55, 64],
  ];
  for (const [lo, hi] of brackets) if (age >= lo && age <= hi) return `adult ${lo}–${hi}`;
  return 'adult 65+';
}

// ---------------------------------------------------------------------------- text block

const quote = (s: string, max = 200) => `"${s.replace(/\s+/g, ' ').trim().slice(0, max).replace(/"/g, "'")}"`;
const kg = (n: number | null | undefined) => (n == null ? '?' : `${round1(n)} kg`);

function exName(name: LocalizedText, lang: Locale): string {
  return lang === 'he' && name.he && name.he !== name.en ? `${name.en} (${name.he})` : name.en;
}

export function prescription(e: { sets: number; repMin: number | null; repMax: number | null; targetSeconds: number | null }): string {
  const target =
    e.repMin != null && e.repMax != null && e.repMin !== e.repMax
      ? `${e.repMin}–${e.repMax} reps`
      : e.repMax != null || e.repMin != null
        ? `${e.repMax ?? e.repMin} reps`
        : e.targetSeconds != null
          ? `${e.targetSeconds} s`
          : '';
  return `${e.sets}×${target}`.replace(/×$/, ' sets');
}

export function formatSet(s: SetInfo): string {
  if (s.durationSeconds != null && s.reps == null) return `${s.durationSeconds} s`;
  if (s.weightKg != null && s.weightKg > 0) return `${round1(s.weightKg)}kg×${s.reps ?? '?'}`;
  return `${s.reps ?? '?'} reps`;
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Compact, human-readable description of the user's data for the system prompt. */
export function formatContext(data: CoachData, lang: Locale): string {
  const p = data.profile;
  const lines: string[] = [];
  lines.push(`Today: ${data.today} (time zone ${data.timezone}). Preferred units: ${data.units === 'imperial' ? 'imperial (show weights in lb)' : 'metric (kg)'}.`);
  lines.push('', 'PROFILE');
  lines.push(`- Name: ${quote(data.displayName, 60)}`);
  if (!p.onboardingCompletedAt) lines.push('- The user has not completed the onboarding questionnaire; most profile fields are missing.');
  lines.push(`- Age group: ${ageGroup(p.currentAge) ?? 'unknown'}${p.isMinor ? ' — MINOR: no calorie deficit, no max-effort lifting' : ''}`);
  lines.push(`- Sex: ${p.sex ?? 'unknown'}; height: ${p.heightCm != null ? `${p.heightCm} cm` : 'unknown'}; profile weight: ${p.weightKg != null ? kg(p.weightKg) : 'unknown'}`);
  lines.push(`- Experience: ${p.experienceLevel ?? 'unknown'}; goal: ${p.goal ?? 'unknown'}`);
  lines.push(`- Trains at: ${p.trainingLocation ?? 'unknown'}; equipment: ${p.equipment.length ? p.equipment.join(', ') : 'none (bodyweight only)'}`);
  lines.push(
    `- Schedule: ${p.daysPerWeek ?? '?'} days/week, ${p.sessionMinutes ?? '?'} min/session; weekly workout goal: ${p.weeklyWorkoutGoal ?? 'not set'}`,
  );
  if (p.preferredDays.length) {
    lines.push(`- Preferred training days: ${p.preferredDays.map((d) => WEEKDAY_NAMES[d] ?? '?').join(', ')} (the home screen suggests rest on the other days when the weekly goal allows)`);
  }
  if (p.focusMuscleGroups.length) lines.push(`- Wants extra focus on: ${p.focusMuscleGroups.join(', ')}`);
  const bench = Object.entries(p.ability).filter(([, v]) => v != null).map(([k, v]) => `${k}=${v}`);
  if (bench.length) lines.push(`- Self-reported benchmarks: ${bench.join(', ')}`);
  if (p.mealsPerDay) lines.push(`- Meals per day: ${p.mealsPerDay}`);
  const injuries = p.injuries.length ? p.injuries.join(', ') : 'none reported';
  lines.push(`- Injuries: ${injuries}${p.injuryNotes ? `; notes: ${quote(p.injuryNotes)}` : ''}${p.limitations ? `; limitations: ${quote(p.limitations)}` : ''}`);
  if (p.exerciseLikes || p.exerciseDislikes) {
    lines.push(`- Likes: ${p.exerciseLikes ? quote(p.exerciseLikes) : '—'}; dislikes: ${p.exerciseDislikes ? quote(p.exerciseDislikes) : '—'}`);
  }
  lines.push(
    `- Diet: ${p.dietType ?? 'unknown'}; allergies: ${p.allergies.length ? p.allergies.join(', ') : 'none'}; restrictions: ${p.dietaryRestrictions.length ? p.dietaryRestrictions.join(', ') : 'none'}${p.dislikedFoods ? `; dislikes: ${quote(p.dislikedFoods)}` : ''}`,
  );
  if (p.sleepHours != null || p.stressLevel) lines.push(`- Sleep: ${p.sleepHours ?? '?'} h/night; stress: ${p.stressLevel ?? 'unknown'}`);
  if (p.targets) {
    lines.push(
      `- Daily nutrition targets: ${p.targets.calories} kcal, protein ${p.targets.proteinG} g, carbs ${p.targets.carbsG} g, fat ${p.targets.fatG} g${p.targets.custom ? ' (set by the user)' : ''}${data.minimumCalories ? `; safe minimum for this user: ${data.minimumCalories} kcal` : ''}`,
    );
  } else {
    lines.push('- Daily nutrition targets: not available (profile incomplete).');
  }

  lines.push('', 'ACTIVE WORKOUT PLAN');
  if (!data.plan) {
    lines.push('- No active plan.');
  } else {
    lines.push(`- ${quote(data.plan.name, 80)}: ${data.plan.daysPerWeek ?? '?'} days/week, ~${data.plan.sessionMinutes ?? '?'} min`);
    data.plan.workouts.forEach((w, i) => {
      const exercises = w.exercises.map((e) => `${exName(e.name, lang)} ${prescription(e)}${e.targetWeightKg ? ` @ ${kg(e.targetWeightKg)}` : ''}`);
      lines.push(`  - Day ${i + 1} ${quote(w.name, 60)}: ${exercises.length ? exercises.join('; ') : 'no exercises'}`);
    });
  }

  lines.push('', 'TRAINING HISTORY');
  if (data.stats.completedTotal === 0) {
    lines.push('- No workouts recorded yet.');
  } else {
    lines.push(
      `- Completed workouts: ${data.stats.last7} in the last 7 days, ${data.stats.last30} in the last 30 days, ${data.stats.completedTotal} in total (first on ${data.stats.firstWorkoutDate}). Volume in the last 30 days: ${data.stats.volume30Kg} kg.`,
    );
    lines.push('- Last completed workouts (newest first):');
    for (const s of data.recentSessions) {
      const ex = s.exercises.map((e) => `${exName(e.name, lang)} ${e.sets.map(formatSet).join(', ')}`);
      const meta = [s.durationMinutes != null ? `${s.durationMinutes} min` : null, `volume ${s.volumeKg} kg`].filter(Boolean).join(', ');
      lines.push(`  - ${s.date} ${quote(s.name, 60)} (${meta}): ${ex.length ? ex.join('; ') : 'no completed sets'}`);
    }
  }

  lines.push('', 'PERSONAL RECORDS (last 90 days)');
  if (!data.prs.length) lines.push('- No personal records recorded yet.');
  for (const r of data.prs) {
    const detail = r.type === 'max_duration' ? `${r.value} s` : r.type === 'max_reps' ? `${r.value} reps` : `${round1(r.value)} kg`;
    lines.push(`- ${r.date}: ${exName(r.name, lang)} — ${r.type} ${detail}${r.weightKg != null && r.reps != null ? ` (${round1(r.weightKg)} kg × ${r.reps})` : ''}`);
  }

  lines.push('', `NUTRITION (previous ${data.nutrition.windowDays} days, excluding today)`);
  if (!data.nutrition.average) {
    lines.push('- No food logged in this period.');
  } else {
    const a = data.nutrition.average;
    lines.push(`- Logged ${data.nutrition.daysLogged} of ${data.nutrition.windowDays} days. Average per logged day: ${a.kcal} kcal, protein ${a.proteinG} g, carbs ${a.carbsG} g, fat ${a.fatG} g.`);
  }
  const t = data.nutrition.today;
  lines.push(t ? `- Today so far: ${t.kcal} kcal, protein ${t.proteinG} g, carbs ${t.carbsG} g, fat ${t.fatG} g (${t.entries} entries).` : '- Nothing logged today yet.');

  lines.push('', 'BODY WEIGHT');
  if (!data.weight.latest) {
    lines.push('- No body-weight entries yet.');
  } else {
    lines.push(`- Latest: ${kg(data.weight.latest.kg)} on ${data.weight.latest.date}.`);
    const tr = data.weight.trend;
    if (tr) {
      lines.push(
        `- Last 30 days: ${kg(tr.from.kg)} (${tr.from.date}) → ${kg(tr.to.kg)} (${tr.to.date}), change ${tr.changeKg > 0 ? '+' : ''}${tr.changeKg} kg${tr.weeklyRateKg != null ? ` (~${tr.weeklyRateKg > 0 ? '+' : ''}${tr.weeklyRateKg} kg/week)` : ''}; ${data.weight.entriesLast30} entries.`,
      );
    }
  }
  return lines.join('\n');
}

/** Days between two dates, used by the built-in coach for "x days ago". */
export const daysAgo = (date: string, today: string) => diffDays(today, date);
