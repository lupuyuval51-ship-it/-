/**
 * Workout plans: generation, CRUD, day editing, alternatives and progression.
 * Every query is scoped by `user_id`; another user's plan behaves exactly like a missing
 * one (404 `plan_not_found`). Multi-step writes run in `db.tx` and lock the plan row
 * (`SELECT … FOR UPDATE`) so concurrent edits of the same plan are serialized.
 */
import { z } from 'zod';
import {
  DEFAULT_EQUIPMENT_BY_LOCATION,
  EQUIPMENT,
  EXPERIENCE_LEVELS,
  GOALS,
  LIMITS,
  LOCATIONS,
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
  type Equipment,
  type Goal,
  type InjuryArea,
  type Locale,
  type PlanStatus,
  type SplitType,
} from '@shared/constants';
import { isWorkoutFocus, type GeneratePlanBody, type UpdateWorkoutBody } from '@shared/schemas/workouts';
import type {
  ApplyProgressionResponse,
  ExerciseAlternativeDTO,
  ExerciseSummaryDTO,
  GenerationNote,
  PlanExerciseDTO,
  PlanWorkoutDTO,
  PrescriptionTargets,
  ProfileDTO,
  ProgressionChangeDTO,
  WorkoutPlanDTO,
  WorkoutPlanSummaryDTO,
} from '@shared/types';
import { db, type Sql } from '../../db/pool';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { getAllExercises, getExerciseMap, toExerciseSummary, userContextFor, type ExerciseRecord } from '../exercises/repository';
import { getProfile } from '../profile/repository';
import { suggestProgressions } from '../sessions/progression';
import {
  estimateWorkoutMinutes,
  generatePlan,
  generateWorkout,
  muscleGroupsOf,
  type GeneratedExercise,
  type GeneratedPlan,
  type GeneratorInput,
} from './generator';
import { copyName, fill, strings } from './i18n';
import { EMPTY_PREFERENCES, interpretPreferences, isEmptyPreferences, type ParsedPreferences } from './preferences';

// ---------------------------------------------------------------- Errors

export const planNotFound = () => notFound('plan_not_found', 'Workout plan not found');
const workoutNotFound = () => notFound('workout_not_found', 'Workout day not found');
const planExerciseNotFound = () => notFound('plan_exercise_not_found', 'Plan exercise not found');

// ---------------------------------------------------------------- Rows & mapping

interface PlanRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: PlanStatus;
  goal: Goal | null;
  split_type: SplitType;
  days_per_week: number | null;
  session_minutes: number | null;
  source: 'generated' | 'custom' | 'duplicate';
  generator_version: string | null;
  generation_input: Record<string, unknown> | null;
  generation_notes: GenerationNote[] | null;
  next_workout_index: number;
  created_at: Date;
  updated_at: Date;
}

interface SummaryRow extends PlanRow {
  workout_count: number;
  exercise_count: number;
}

interface WorkoutRow {
  id: string;
  position: number;
  name: string;
  focus: string;
  notes: string;
  estimated_minutes: number | null;
}

interface PlanExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  rep_min: number | null;
  rep_max: number | null;
  target_seconds: number | null;
  rest_seconds: number;
  target_rpe: number | null;
  target_weight_kg: number | null;
  notes: string;
}

const iso = (d: Date | string) => new Date(d).toISOString();

function toSummary(row: PlanRow, workoutCount: number, exerciseCount: number): WorkoutPlanSummaryDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    goal: row.goal,
    splitType: row.split_type,
    daysPerWeek: row.days_per_week,
    sessionMinutes: row.session_minutes,
    source: row.source,
    workoutCount,
    exerciseCount,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

/** Summary for a catalog id that is no longer in the cached library (keeps the row visible). */
function unknownExerciseSummary(id: string): ExerciseSummaryDTO {
  return {
    id,
    name: { en: id, he: id },
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: [],
    category: 'bodyweight',
    movementPattern: 'core',
    difficulty: 'beginner',
    trackingType: 'reps',
    unilateral: false,
    hasMedia: false,
  };
}

function toPlanExerciseDTO(r: PlanExerciseRow, catalog: Map<string, ExerciseRecord>): PlanExerciseDTO {
  const e = catalog.get(r.exercise_id);
  return {
    id: r.id,
    exerciseId: r.exercise_id,
    exercise: e ? toExerciseSummary(e) : unknownExerciseSummary(r.exercise_id),
    position: r.position,
    sets: r.sets,
    repMin: r.rep_min,
    repMax: r.rep_max,
    targetSeconds: r.target_seconds,
    restSeconds: r.rest_seconds,
    targetRpe: r.target_rpe != null ? Number(r.target_rpe) : null,
    targetWeightKg: r.target_weight_kg != null ? Number(r.target_weight_kg) : null,
    notes: r.notes,
  };
}

export async function listPlans(sql: Sql, userId: string, includeArchived: boolean): Promise<WorkoutPlanSummaryDTO[]> {
  const rows = await sql.many<SummaryRow>(
    `SELECT p.*,
            (SELECT count(*) FROM plan_workouts w WHERE w.plan_id = p.id)::int AS workout_count,
            (SELECT count(*) FROM plan_exercises e JOIN plan_workouts w ON w.id = e.workout_id WHERE w.plan_id = p.id)::int AS exercise_count
       FROM workout_plans p
      WHERE p.user_id = $1 AND ($2::boolean OR p.status <> 'archived')
      ORDER BY CASE p.status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, p.updated_at DESC, p.created_at DESC`,
    [userId, includeArchived],
  );
  return rows.map((r) => toSummary(r, r.workout_count, r.exercise_count));
}

export async function getPlanDTO(sql: Sql, userId: string, planId: string): Promise<WorkoutPlanDTO> {
  const plan = await sql.maybeOne<PlanRow>('SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2', [planId, userId]);
  if (!plan) throw planNotFound();
  const workouts = await sql.many<WorkoutRow>(
    `SELECT id, position, name, focus, notes, estimated_minutes FROM plan_workouts
      WHERE plan_id = $1 AND user_id = $2 ORDER BY position, created_at`,
    [planId, userId],
  );
  const exercises = await sql.many<PlanExerciseRow>(
    `SELECT pe.id, pe.workout_id, pe.exercise_id, pe.position, pe.sets, pe.rep_min, pe.rep_max, pe.target_seconds,
            pe.rest_seconds, pe.target_rpe, pe.target_weight_kg, pe.notes
       FROM plan_exercises pe JOIN plan_workouts w ON w.id = pe.workout_id
      WHERE w.plan_id = $1 AND pe.user_id = $2
      ORDER BY pe.position, pe.created_at`,
    [planId, userId],
  );
  const catalog = await getExerciseMap();
  const byWorkout = new Map<string, PlanExerciseDTO[]>();
  for (const r of exercises) {
    const list = byWorkout.get(r.workout_id) ?? [];
    list.push(toPlanExerciseDTO(r, catalog));
    byWorkout.set(r.workout_id, list);
  }
  const workoutDTOs: PlanWorkoutDTO[] = workouts.map((w) => ({
    id: w.id,
    position: w.position,
    name: w.name,
    focus: w.focus,
    notes: w.notes,
    estimatedMinutes: w.estimated_minutes,
    exercises: byWorkout.get(w.id) ?? [],
  }));
  const count = workoutDTOs.length;
  return {
    ...toSummary(plan, count, exercises.length),
    workouts: workoutDTOs,
    generationNotes: Array.isArray(plan.generation_notes) ? plan.generation_notes : [],
    generationInput: plan.generation_input ?? {},
    nextWorkoutIndex: count ? ((plan.next_workout_index % count) + count) % count : 0,
  };
}

// ---------------------------------------------------------------- Low-level writes

async function lockPlan(tx: Sql, userId: string, planId: string): Promise<PlanRow> {
  const plan = await tx.maybeOne<PlanRow>('SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2 FOR UPDATE', [planId, userId]);
  if (!plan) throw planNotFound();
  return plan;
}

async function touchPlan(tx: Sql, planId: string, fields: { daysPerWeek?: number; nextWorkoutIndex?: number } = {}) {
  await tx.exec(
    `UPDATE workout_plans
        SET updated_at = now(),
            days_per_week = COALESCE($2, days_per_week),
            next_workout_index = COALESCE($3, next_workout_index)
      WHERE id = $1`,
    [planId, fields.daysPerWeek ?? null, fields.nextWorkoutIndex ?? null],
  );
}

async function planWorkouts(tx: Sql, userId: string, planId: string): Promise<WorkoutRow[]> {
  return tx.many<WorkoutRow>(
    'SELECT id, position, name, focus, notes, estimated_minutes FROM plan_workouts WHERE plan_id = $1 AND user_id = $2 ORDER BY position, created_at',
    [planId, userId],
  );
}

async function setPositions(tx: Sql, ids: string[]) {
  if (!ids.length) return;
  await tx.exec(
    `UPDATE plan_workouts w SET position = v.position
       FROM unnest($1::uuid[], $2::int[]) AS v(id, position)
      WHERE w.id = v.id`,
    [ids, ids.map((_, i) => i)],
  );
}

interface ExerciseInsert {
  exerciseId: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
  notes: string;
  position: number;
}

async function insertExercises(tx: Sql, userId: string, workoutId: string, rows: ExerciseInsert[]) {
  if (!rows.length) return;
  await tx.exec(
    `INSERT INTO plan_exercises (workout_id, user_id, exercise_id, position, sets, rep_min, rep_max, target_seconds,
                                 rest_seconds, target_rpe, target_weight_kg, notes)
     SELECT $1, $2, v.exercise_id, v.position, v.sets, v.rep_min, v.rep_max, v.target_seconds, v.rest_seconds,
            v.target_rpe, v.target_weight_kg, v.notes
       FROM unnest($3::text[], $4::int[], $5::int[], $6::int[], $7::int[], $8::int[], $9::int[], $10::numeric[], $11::numeric[], $12::text[])
         AS v(exercise_id, position, sets, rep_min, rep_max, target_seconds, rest_seconds, target_rpe, target_weight_kg, notes)`,
    [
      workoutId,
      userId,
      rows.map((r) => r.exerciseId),
      rows.map((r) => r.position),
      rows.map((r) => r.sets),
      rows.map((r) => r.repMin),
      rows.map((r) => r.repMax),
      rows.map((r) => r.targetSeconds),
      rows.map((r) => r.restSeconds),
      rows.map((r) => r.targetRpe),
      rows.map((r) => r.targetWeightKg),
      rows.map((r) => r.notes),
    ],
  );
}

async function insertWorkout(
  tx: Sql,
  userId: string,
  planId: string,
  w: { position: number; name: string; focus: string; notes: string; estimatedMinutes: number | null },
): Promise<string> {
  const row = await tx.one<{ id: string }>(
    `INSERT INTO plan_workouts (plan_id, user_id, position, name, focus, notes, estimated_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [planId, userId, w.position, w.name, w.focus, w.notes, w.estimatedMinutes],
  );
  return row.id;
}

/** Copies a day's exercises into another workout (deep copy, same order). */
async function copyExercises(tx: Sql, userId: string, fromWorkoutId: string, toWorkoutId: string) {
  await tx.exec(
    `INSERT INTO plan_exercises (workout_id, user_id, exercise_id, position, sets, rep_min, rep_max, target_seconds,
                                 rest_seconds, target_rpe, target_weight_kg, notes)
     SELECT $2, user_id, exercise_id, position, sets, rep_min, rep_max, target_seconds, rest_seconds, target_rpe,
            target_weight_kg, notes
       FROM plan_exercises WHERE workout_id = $1 AND user_id = $3
      ORDER BY position, created_at`,
    [fromWorkoutId, toWorkoutId, userId],
  );
}

const toInsert = (x: GeneratedExercise, position: number): ExerciseInsert => ({ ...x, position });

async function insertGeneratedPlan(tx: Sql, userId: string, plan: GeneratedPlan, notes: GenerationNote[]): Promise<string> {
  const row = await tx.one<{ id: string }>(
    `INSERT INTO workout_plans (user_id, name, description, status, goal, split_type, days_per_week, session_minutes, source,
                                generator_version, generation_input, generation_notes)
     VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, 'generated', $8, $9, $10) RETURNING id`,
    [
      userId,
      plan.name,
      plan.description,
      plan.goal,
      plan.splitType,
      plan.daysPerWeek,
      plan.sessionMinutes,
      plan.generatorVersion,
      JSON.stringify(plan.input),
      JSON.stringify(notes),
    ],
  );
  for (const [i, w] of plan.workouts.entries()) {
    const workoutId = await insertWorkout(tx, userId, row.id, { position: i, name: w.name, focus: w.focus, notes: w.notes, estimatedMinutes: w.estimatedMinutes });
    await insertExercises(tx, userId, workoutId, w.exercises.map(toInsert));
  }
  return row.id;
}

const unique = <T>(a: readonly T[]): T[] => Array.from(new Set(a));

function mergeNotes(existing: GenerationNote[], extra: GenerationNote[]): GenerationNote[] {
  const key = (n: GenerationNote) => n.code + JSON.stringify(n.params ?? {});
  const seen = new Set(existing.map(key));
  const out = [...existing];
  for (const n of extra) if (!seen.has(key(n))) {
    seen.add(key(n));
    out.push(n);
  }
  return out;
}

// ---------------------------------------------------------------- Generation

function requireOnboarded(profile: ProfileDTO) {
  if (!profile.onboardingCompletedAt) throw conflict('onboarding_required', 'Complete onboarding before generating a plan');
}

async function nextVariationSeed(sql: Sql, userId: string): Promise<number> {
  const row = await sql.one<{ seed: number }>(
    `SELECT COALESCE(MAX((generation_input->>'variationSeed')::int) + 1, 0)::int AS seed
       FROM workout_plans WHERE user_id = $1 AND generation_input ? 'variationSeed'`,
    [userId],
  );
  return row.seed;
}

function preferenceNotes(interpreter: 'ai' | 'keywords', prefs: ParsedPreferences, injuryAreas: InjuryArea[]): GenerationNote[] {
  const notes: GenerationNote[] = [{ code: interpreter === 'ai' ? 'preferences_ai' : 'preferences_keywords' }];
  if (isEmptyPreferences(prefs)) notes.push({ code: 'preferences_not_understood' });
  for (const p of prefs.avoidPatterns) notes.push({ code: 'pattern_avoided', params: { pattern: p } });
  for (const area of injuryAreas) notes.push({ code: 'pref_injury_area', params: { area } });
  if (prefs.preferBodyweight) notes.push({ code: 'pref_bodyweight' });
  return notes;
}

/** POST /plans/generate — profile + overrides + interpreted preferences → stored draft plan. */
export async function generatePlanForUser(userId: string, locale: Locale, body: GeneratePlanBody): Promise<WorkoutPlanDTO> {
  const profile = await getProfile(db, userId);
  requireOnboarded(profile);
  const catalog = await getAllExercises();

  const text = body.notes?.trim() ?? '';
  const interpreted = text ? await interpretPreferences(text, catalog) : null;
  const prefs = interpreted?.prefs ?? EMPTY_PREFERENCES;

  const location = body.location ?? profile.trainingLocation ?? 'gym';
  const equipment: Equipment[] =
    body.equipment ?? (body.location && body.location !== profile.trainingLocation ? DEFAULT_EQUIPMENT_BY_LOCATION[body.location] : profile.equipment);

  const input: GeneratorInput = {
    locale,
    goal: body.goal ?? profile.goal ?? 'general_fitness',
    experience: profile.experienceLevel ?? 'beginner',
    isMinor: profile.isMinor,
    location,
    equipment: unique(equipment),
    daysPerWeek: body.daysPerWeek ?? profile.daysPerWeek ?? 3,
    sessionMinutes: body.sessionMinutes ?? profile.sessionMinutes ?? 45,
    injuries: profile.injuries,
    avoidExerciseIds: unique([...profile.avoidExerciseIds, ...prefs.avoidExerciseIds]),
    avoidPatterns: prefs.avoidPatterns,
    focusMuscleGroups: unique([...(body.focusMuscleGroups ?? profile.focusMuscleGroups), ...prefs.focusMuscleGroups]),
    ability: profile.ability,
    likes: profile.exerciseLikes,
    dislikes: profile.exerciseDislikes,
    preferBodyweight: prefs.preferBodyweight,
    intensity: prefs.intensity,
    variationSeed: await nextVariationSeed(db, userId),
    planName: body.name?.trim() || null,
    preferenceInterpreter: interpreted?.interpreter ?? null,
    preferenceOptions: { interpreter: interpreted?.interpreter ?? null, ...prefs },
  };
  const plan = generatePlan(input, catalog);
  const notes = interpreted ? mergeNotes(preferenceNotes(interpreted.interpreter, prefs, interpreted.injuryAreas), plan.notes) : plan.notes;
  const id = await db.tx((tx) => insertGeneratedPlan(tx, userId, plan, notes));
  return getPlanDTO(db, userId, id);
}

/** Generated-plan inputs read back from JSON (defensive: every field optional). */
const storedInputSchema = z
  .object({
    goal: z.enum(GOALS),
    experience: z.enum(EXPERIENCE_LEVELS),
    location: z.enum(LOCATIONS),
    equipment: z.array(z.enum(EQUIPMENT)),
    sessionMinutes: z.number().int().min(LIMITS.sessionMinutesMin).max(LIMITS.sessionMinutesMax),
    focusMuscleGroups: z.array(z.enum(MUSCLE_GROUPS)),
    preferences: z
      .object({
        avoidExerciseIds: z.array(z.string()),
        avoidPatterns: z.array(z.enum(MOVEMENT_PATTERNS)),
        preferBodyweight: z.boolean(),
        intensity: z.enum(['easier', 'normal', 'harder']),
      })
      .partial(),
    variationSeed: z.number().int(),
    regenerationCount: z.number().int(),
  })
  .partial();

/** Generator input for regenerating one day: plan-shaping fields from the plan, safety fields from the current profile. */
function regenerationInput(plan: PlanRow, profile: ProfileDTO, locale: Locale): { input: GeneratorInput; nextCount: number } {
  const parsed = storedInputSchema.safeParse(plan.generation_input ?? {});
  const gi = parsed.success ? parsed.data : {};
  const prefs = gi.preferences ?? {};
  const count = (gi.regenerationCount ?? 0) + 1;
  return {
    nextCount: count,
    input: {
      locale,
      goal: plan.goal ?? gi.goal ?? profile.goal ?? 'general_fitness',
      experience: profile.experienceLevel ?? gi.experience ?? 'beginner',
      isMinor: profile.isMinor,
      location: gi.location ?? profile.trainingLocation ?? 'gym',
      equipment: gi.equipment ?? profile.equipment,
      daysPerWeek: plan.days_per_week ?? 3,
      sessionMinutes: plan.session_minutes ?? gi.sessionMinutes ?? profile.sessionMinutes ?? 45,
      injuries: profile.injuries,
      avoidExerciseIds: unique([...profile.avoidExerciseIds, ...(prefs.avoidExerciseIds ?? [])]),
      avoidPatterns: prefs.avoidPatterns ?? [],
      focusMuscleGroups: gi.focusMuscleGroups ?? profile.focusMuscleGroups,
      ability: profile.ability,
      likes: profile.exerciseLikes,
      dislikes: profile.exerciseDislikes,
      preferBodyweight: prefs.preferBodyweight ?? false,
      intensity: prefs.intensity ?? 'normal',
      variationSeed: (gi.variationSeed ?? 0) + 1000 * count,
    },
  };
}

// ---------------------------------------------------------------- Plan CRUD

export async function createCustomPlan(userId: string, locale: Locale, body: { name: string; description: string }): Promise<WorkoutPlanDTO> {
  const id = await db.tx(async (tx) => {
    const row = await tx.one<{ id: string }>(
      `INSERT INTO workout_plans (user_id, name, description, status, split_type, days_per_week, source)
       VALUES ($1, $2, $3, 'draft', 'custom', 1, 'custom') RETURNING id`,
      [userId, body.name, body.description],
    );
    await insertWorkout(tx, userId, row.id, { position: 0, name: fill(strings(locale).dayName, { n: 1 }), focus: '', notes: '', estimatedMinutes: null });
    return row.id;
  });
  return getPlanDTO(db, userId, id);
}

export async function updatePlan(userId: string, planId: string, patch: { name?: string; description?: string }): Promise<WorkoutPlanDTO> {
  const n = await db.exec(
    `UPDATE workout_plans SET name = COALESCE($3, name), description = COALESCE($4, description), updated_at = now()
      WHERE id = $1 AND user_id = $2`,
    [planId, userId, patch.name ?? null, patch.description ?? null],
  );
  if (!n) throw planNotFound();
  return getPlanDTO(db, userId, planId);
}

/** Makes the plan the single active one; the previously active plan becomes a draft. */
export async function activatePlan(userId: string, planId: string): Promise<WorkoutPlanDTO> {
  return db.tx(async (tx) => {
    // Lock all of the user's plans so concurrent activations are serialized.
    const plans = await tx.many<{ id: string }>('SELECT id FROM workout_plans WHERE user_id = $1 ORDER BY id FOR UPDATE', [userId]);
    if (!plans.some((p) => p.id === planId)) throw planNotFound();
    await tx.exec(`UPDATE workout_plans SET status = 'draft' WHERE user_id = $1 AND status = 'active' AND id <> $2`, [userId, planId]);
    await tx.exec(`UPDATE workout_plans SET status = 'active', updated_at = now() WHERE id = $1 AND user_id = $2`, [planId, userId]);
    return getPlanDTO(tx, userId, planId);
  });
}

export async function archivePlan(userId: string, planId: string): Promise<WorkoutPlanDTO> {
  const n = await db.exec(`UPDATE workout_plans SET status = 'archived', updated_at = now() WHERE id = $1 AND user_id = $2`, [planId, userId]);
  if (!n) throw planNotFound();
  return getPlanDTO(db, userId, planId);
}

/** Deletes the plan; recorded sessions keep their history (FK ON DELETE SET NULL). */
export async function deletePlan(userId: string, planId: string): Promise<void> {
  const n = await db.exec('DELETE FROM workout_plans WHERE id = $1 AND user_id = $2', [planId, userId]);
  if (!n) throw planNotFound();
}

export async function duplicatePlan(userId: string, locale: Locale, planId: string): Promise<WorkoutPlanDTO> {
  const id = await db.tx(async (tx) => {
    const src = await lockPlan(tx, userId, planId);
    const row = await tx.one<{ id: string }>(
      `INSERT INTO workout_plans (user_id, name, description, status, goal, split_type, days_per_week, session_minutes, source,
                                  generator_version, generation_input, generation_notes)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, 'duplicate', $8, $9, $10) RETURNING id`,
      [
        userId,
        copyName(src.name, locale),
        src.description,
        src.goal,
        src.split_type,
        src.days_per_week,
        src.session_minutes,
        src.generator_version,
        JSON.stringify(src.generation_input ?? {}),
        JSON.stringify(src.generation_notes ?? []),
      ],
    );
    for (const w of await planWorkouts(tx, userId, planId)) {
      const newId = await insertWorkout(tx, userId, row.id, { position: w.position, name: w.name, focus: w.focus, notes: w.notes, estimatedMinutes: w.estimated_minutes });
      await copyExercises(tx, userId, w.id, newId);
    }
    return row.id;
  });
  return getPlanDTO(db, userId, id);
}

// ---------------------------------------------------------------- Workout days

function findWorkout(workouts: WorkoutRow[], workoutId: string): WorkoutRow {
  const w = workouts.find((x) => x.id === workoutId);
  if (!w) throw workoutNotFound();
  return w;
}

export async function addWorkout(userId: string, planId: string, body: { name: string; focus: string }): Promise<WorkoutPlanDTO> {
  return db.tx(async (tx) => {
    await lockPlan(tx, userId, planId);
    const workouts = await planWorkouts(tx, userId, planId);
    if (workouts.length >= LIMITS.workoutsPerPlanMax) throw conflict('plan_workout_limit', 'A plan can have at most 7 workout days');
    await insertWorkout(tx, userId, planId, { position: workouts.length, name: body.name, focus: body.focus, notes: '', estimatedMinutes: null });
    await setPositions(tx, workouts.map((w) => w.id));
    await touchPlan(tx, planId, { daysPerWeek: workouts.length + 1 });
    return getPlanDTO(tx, userId, planId);
  });
}

/**
 * Replaces a day's name/focus/notes and its full ordered exercise list. Rows with an `id`
 * keep their identity (must belong to this day), new rows are inserted, omitted rows deleted.
 */
export async function updateWorkout(userId: string, planId: string, workoutId: string, body: UpdateWorkoutBody): Promise<WorkoutPlanDTO> {
  const catalog = await getExerciseMap();
  const unknown = unique(body.exercises.map((x) => x.exerciseId).filter((id) => !catalog.has(id)));
  if (unknown.length) throw badRequest('unknown_exercise', 'Unknown exercise id', { exerciseIds: unknown });
  const ids = body.exercises.map((x) => x.id).filter((x): x is string => !!x);
  if (new Set(ids).size !== ids.length) throw badRequest('duplicate_plan_exercise', 'An exercise row appears twice');

  return db.tx(async (tx) => {
    const plan = await lockPlan(tx, userId, planId);
    findWorkout(await planWorkouts(tx, userId, planId), workoutId);
    const existing = new Set(
      (await tx.many<{ id: string }>('SELECT id FROM plan_exercises WHERE workout_id = $1 AND user_id = $2', [workoutId, userId])).map((r) => r.id),
    );
    const foreign = ids.filter((id) => !existing.has(id));
    if (foreign.length) throw badRequest('unknown_plan_exercise', 'Exercise row does not belong to this workout', { ids: foreign });

    const keep = new Set(ids);
    const toDelete = [...existing].filter((id) => !keep.has(id));
    if (toDelete.length) await tx.exec('DELETE FROM plan_exercises WHERE id = ANY($1::uuid[]) AND workout_id = $2', [toDelete, workoutId]);

    const rows = body.exercises.map((x, position) => ({ ...x, position }));
    const updates = rows.filter((r) => r.id);
    if (updates.length) {
      await tx.exec(
        `UPDATE plan_exercises pe
            SET exercise_id = v.exercise_id, position = v.position, sets = v.sets, rep_min = v.rep_min, rep_max = v.rep_max,
                target_seconds = v.target_seconds, rest_seconds = v.rest_seconds, target_rpe = v.target_rpe,
                target_weight_kg = v.target_weight_kg, notes = v.notes
           FROM unnest($2::uuid[], $3::text[], $4::int[], $5::int[], $6::int[], $7::int[], $8::int[], $9::int[], $10::numeric[], $11::numeric[], $12::text[])
             AS v(id, exercise_id, position, sets, rep_min, rep_max, target_seconds, rest_seconds, target_rpe, target_weight_kg, notes)
          WHERE pe.id = v.id AND pe.workout_id = $1`,
        [
          workoutId,
          updates.map((r) => r.id),
          updates.map((r) => r.exerciseId),
          updates.map((r) => r.position),
          updates.map((r) => r.sets),
          updates.map((r) => r.repMin),
          updates.map((r) => r.repMax),
          updates.map((r) => r.targetSeconds),
          updates.map((r) => r.restSeconds),
          updates.map((r) => r.targetRpe),
          updates.map((r) => r.targetWeightKg),
          updates.map((r) => r.notes),
        ],
      );
    }
    await insertExercises(tx, userId, workoutId, rows.filter((r) => !r.id));

    const estimated = estimateWorkoutMinutes(rows, catalog, plan.session_minutes);
    await tx.exec('UPDATE plan_workouts SET name = $2, focus = $3, notes = $4, estimated_minutes = $5 WHERE id = $1', [
      workoutId,
      body.name,
      body.focus,
      body.notes,
      estimated,
    ]);
    await touchPlan(tx, planId);
    return getPlanDTO(tx, userId, planId);
  });
}

export async function deleteWorkout(userId: string, planId: string, workoutId: string): Promise<WorkoutPlanDTO> {
  return db.tx(async (tx) => {
    const plan = await lockPlan(tx, userId, planId);
    const workouts = await planWorkouts(tx, userId, planId);
    const target = findWorkout(workouts, workoutId);
    if (workouts.length <= 1) throw conflict('plan_requires_workout', 'A plan needs at least one workout day');
    const index = workouts.indexOf(target);
    await tx.exec('DELETE FROM plan_workouts WHERE id = $1 AND user_id = $2', [workoutId, userId]);
    const remaining = workouts.filter((w) => w.id !== workoutId);
    await setPositions(tx, remaining.map((w) => w.id));
    const current = ((plan.next_workout_index % workouts.length) + workouts.length) % workouts.length;
    const next = (index < current ? current - 1 : current) % remaining.length;
    await touchPlan(tx, planId, { daysPerWeek: remaining.length, nextWorkoutIndex: next });
    return getPlanDTO(tx, userId, planId);
  });
}

export async function duplicateWorkout(userId: string, locale: Locale, planId: string, workoutId: string): Promise<WorkoutPlanDTO> {
  return db.tx(async (tx) => {
    await lockPlan(tx, userId, planId);
    const workouts = await planWorkouts(tx, userId, planId);
    const src = findWorkout(workouts, workoutId);
    if (workouts.length >= LIMITS.workoutsPerPlanMax) throw conflict('plan_workout_limit', 'A plan can have at most 7 workout days');
    const newId = await insertWorkout(tx, userId, planId, {
      position: workouts.length,
      name: copyName(src.name, locale),
      focus: src.focus,
      notes: src.notes,
      estimatedMinutes: src.estimated_minutes,
    });
    await copyExercises(tx, userId, src.id, newId);
    await setPositions(tx, [...workouts.map((w) => w.id), newId]);
    await touchPlan(tx, planId, { daysPerWeek: workouts.length + 1 });
    return getPlanDTO(tx, userId, planId);
  });
}

/** New exercises for the same focus (training engine, new seed); name and notes are kept. */
export async function regenerateWorkout(userId: string, locale: Locale, planId: string, workoutId: string): Promise<WorkoutPlanDTO> {
  const profile = await getProfile(db, userId);
  requireOnboarded(profile);
  const catalog = await getAllExercises();
  return db.tx(async (tx) => {
    const plan = await lockPlan(tx, userId, planId);
    const workouts = await planWorkouts(tx, userId, planId);
    const target = findWorkout(workouts, workoutId);
    if (!isWorkoutFocus(target.focus)) throw conflict('focus_not_generatable', 'Only days with a training-engine focus can be regenerated');
    const rows = await tx.many<{ workout_id: string; exercise_id: string }>(
      `SELECT pe.workout_id, pe.exercise_id FROM plan_exercises pe JOIN plan_workouts w ON w.id = pe.workout_id
        WHERE w.plan_id = $1 AND pe.user_id = $2`,
      [planId, userId],
    );
    const { input, nextCount } = regenerationInput(plan, profile, locale);
    const { workout, notes } = generateWorkout(input, catalog, target.focus, {
      dayIndex: workouts.indexOf(target),
      usedElsewhere: rows.filter((r) => r.workout_id !== workoutId).map((r) => r.exercise_id),
      currentIds: rows.filter((r) => r.workout_id === workoutId).map((r) => r.exercise_id),
    });
    await tx.exec('DELETE FROM plan_exercises WHERE workout_id = $1 AND user_id = $2', [workoutId, userId]);
    await insertExercises(tx, userId, workoutId, workout.exercises.map(toInsert));
    await tx.exec('UPDATE plan_workouts SET estimated_minutes = $2 WHERE id = $1', [workoutId, workout.estimatedMinutes]);
    await tx.exec(
      `UPDATE workout_plans
          SET generation_input = generation_input || jsonb_build_object('regenerationCount', $2::int),
              generation_notes = $3, updated_at = now()
        WHERE id = $1`,
      [planId, nextCount, JSON.stringify(mergeNotes(plan.generation_notes ?? [], notes))],
    );
    return getPlanDTO(tx, userId, planId);
  });
}

export async function reorderWorkouts(userId: string, planId: string, workoutIds: string[]): Promise<WorkoutPlanDTO> {
  return db.tx(async (tx) => {
    const plan = await lockPlan(tx, userId, planId);
    const workouts = await planWorkouts(tx, userId, planId);
    const current = new Set(workouts.map((w) => w.id));
    if (workoutIds.length !== workouts.length || !workoutIds.every((id) => current.has(id))) {
      throw badRequest('invalid_reorder', 'workoutIds must contain every workout of the plan exactly once');
    }
    const nextId = workouts.length ? workouts[((plan.next_workout_index % workouts.length) + workouts.length) % workouts.length]!.id : null;
    await setPositions(tx, workoutIds);
    await touchPlan(tx, planId, { nextWorkoutIndex: nextId ? workoutIds.indexOf(nextId) : 0 });
    return getPlanDTO(tx, userId, planId);
  });
}

// ---------------------------------------------------------------- Alternatives

const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

/**
 * Easier & harder variations from the library plus up to 6 "similar" exercises (same
 * movement pattern or shared primary muscles), each flagged for the user's equipment and
 * injuries. Suitable alternatives come first (stable within each relation).
 */
export function computeAlternatives(base: ExerciseRecord, catalog: ExerciseRecord[], equipment: Equipment[], injuries: InjuryArea[]): ExerciseAlternativeDTO[] {
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const out: ExerciseAlternativeDTO[] = [];
  const seen = new Set<string>([base.id]);
  const push = (e: ExerciseRecord, relation: ExerciseAlternativeDTO['relation']) => {
    if (seen.has(e.id)) return;
    seen.add(e.id);
    const ctx = userContextFor(e, equipment, injuries);
    out.push({ exercise: toExerciseSummary(e), relation, suitable: ctx.hasRequiredEquipment && ctx.injuryConflicts.length === 0, missingEquipment: ctx.missingEquipment });
  };
  for (const id of base.easierAlternatives) {
    const e = byId.get(id);
    if (e) push(e, 'easier');
  }
  for (const id of base.harderAlternatives) {
    const e = byId.get(id);
    if (e) push(e, 'harder');
  }
  const baseGroups = new Set(muscleGroupsOf(base));
  const similar = catalog
    .filter((e) => !seen.has(e.id) && e.movementPattern !== 'mobility')
    .map((e) => {
      const sharedPrimary = e.primaryMuscles.filter((m) => base.primaryMuscles.includes(m)).length;
      const samePattern = e.movementPattern === base.movementPattern;
      const sameGroup = muscleGroupsOf(e).some((g) => baseGroups.has(g));
      const score = (samePattern ? 4 : 0) + sharedPrimary * 2 + (sameGroup ? 0.5 : 0) + (e.isCompound === base.isCompound ? 0.5 : 0) - 0.5 * Math.abs(DIFFICULTY_RANK[e.difficulty] - DIFFICULTY_RANK[base.difficulty]);
      const suitable = (() => {
        const c = userContextFor(e, equipment, injuries);
        return c.hasRequiredEquipment && c.injuryConflicts.length === 0;
      })();
      return { e, score, relevant: samePattern || sharedPrimary > 0, suitable };
    })
    .filter((x) => x.relevant)
    .sort((a, b) => Number(b.suitable) - Number(a.suitable) || b.score - a.score || a.e.id.localeCompare(b.e.id))
    .slice(0, 6);
  for (const s of similar) push(s.e, 'similar');
  const order = { easier: 0, harder: 1, similar: 2 } as const;
  return out
    .map((a, i) => ({ a, i }))
    .sort((x, y) => Number(y.a.suitable) - Number(x.a.suitable) || order[x.a.relation] - order[y.a.relation] || x.i - y.i)
    .map((x) => x.a);
}

export async function alternativesFor(
  userId: string,
  planId: string,
  ref: { workoutId: string; planExerciseId: string } | null,
  exerciseIdOverride: string | undefined,
): Promise<ExerciseAlternativeDTO[]> {
  const plan = await db.maybeOne<{ id: string }>('SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2', [planId, userId]);
  if (!plan) throw planNotFound();
  let baseId = exerciseIdOverride ?? null;
  if (ref) {
    const workout = await db.maybeOne('SELECT id FROM plan_workouts WHERE id = $1 AND plan_id = $2 AND user_id = $3', [ref.workoutId, planId, userId]);
    if (!workout) throw workoutNotFound();
    const row = await db.maybeOne<{ exercise_id: string }>('SELECT exercise_id FROM plan_exercises WHERE id = $1 AND workout_id = $2 AND user_id = $3', [
      ref.planExerciseId,
      ref.workoutId,
      userId,
    ]);
    if (!row) throw planExerciseNotFound();
    baseId ??= row.exercise_id;
  }
  if (!baseId) throw badRequest('validation_error', 'exerciseId is required');
  const catalog = await getAllExercises();
  const base = catalog.find((e) => e.id === baseId);
  if (!base) throw badRequest('unknown_exercise', 'Unknown exercise id', { exerciseIds: [baseId] });
  const profile = await getProfile(db, userId);
  return computeAlternatives(base, catalog, profile.equipment, profile.injuries);
}

// ---------------------------------------------------------------- Progression

function validTargets(t: PrescriptionTargets): boolean {
  const intIn = (v: number | null, lo: number, hi: number) => v == null || (Number.isInteger(v) && v >= lo && v <= hi);
  if (!intIn(t.repMin, LIMITS.repsMin, LIMITS.repsMax) || !intIn(t.repMax, LIMITS.repsMin, LIMITS.repsMax)) return false;
  if (!intIn(t.targetSeconds, 5, 7200)) return false;
  if (t.targetWeightKg != null && !(Number.isFinite(t.targetWeightKg) && t.targetWeightKg >= 0 && t.targetWeightKg <= LIMITS.setWeightKgMax)) return false;
  if (t.repMin != null && t.repMax != null && t.repMin > t.repMax) return false;
  return t.repMin != null || t.targetSeconds != null;
}

const sameTargets = (a: PrescriptionTargets, b: PrescriptionTargets) =>
  a.repMin === b.repMin && a.repMax === b.repMax && a.targetSeconds === b.targetSeconds && (a.targetWeightKg ?? null) === (b.targetWeightKg ?? null);

/** Applies progression suggestions (from recorded sessions only) to every exercise of the plan. */
export async function applyProgression(userId: string, planId: string): Promise<ApplyProgressionResponse> {
  return db.tx(async (tx) => {
    await lockPlan(tx, userId, planId);
    const rows = await tx.many<PlanExerciseRow>(
      `SELECT pe.id, pe.workout_id, pe.exercise_id, pe.position, pe.sets, pe.rep_min, pe.rep_max, pe.target_seconds,
              pe.rest_seconds, pe.target_rpe, pe.target_weight_kg, pe.notes
         FROM plan_exercises pe JOIN plan_workouts w ON w.id = pe.workout_id
        WHERE w.plan_id = $1 AND pe.user_id = $2
        ORDER BY w.position, pe.position`,
      [planId, userId],
    );
    const before: PrescriptionTargets[] = rows.map((r) => ({
      targetWeightKg: r.target_weight_kg != null ? Number(r.target_weight_kg) : null,
      repMin: r.rep_min,
      repMax: r.rep_max,
      targetSeconds: r.target_seconds,
    }));
    const suggestions = rows.length
      ? await suggestProgressions(
          tx,
          userId,
          rows.map((r, i) => ({ exerciseId: r.exercise_id, ...before[i]! })),
        )
      : [];
    const changes: ProgressionChangeDTO[] = [];
    for (const [i, r] of rows.entries()) {
      const s = suggestions[i];
      if (!s || s.exerciseId !== r.exercise_id) continue;
      const after: PrescriptionTargets = {
        targetWeightKg: s.targetWeightKg != null ? Math.round(s.targetWeightKg * 100) / 100 : null,
        repMin: s.repMin,
        repMax: s.repMax,
        targetSeconds: s.targetSeconds,
      };
      if (!validTargets(after) || sameTargets(before[i]!, after)) continue;
      await tx.exec('UPDATE plan_exercises SET target_weight_kg = $2, rep_min = $3, rep_max = $4, target_seconds = $5 WHERE id = $1', [
        r.id,
        after.targetWeightKg,
        after.repMin,
        after.repMax,
        after.targetSeconds,
      ]);
      changes.push({ planExerciseId: r.id, exerciseId: r.exercise_id, action: s.action, before: before[i]!, after });
    }
    await touchPlan(tx, planId);
    return { plan: await getPlanDTO(tx, userId, planId), changes };
  });
}

