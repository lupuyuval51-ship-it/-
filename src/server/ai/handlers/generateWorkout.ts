/**
 * /api/claude/generate-workout – Claude authors a structured workout from the eligible catalog and the exact
 * phase template; the result is converted, repaired (≤ 10 % drift) and validated. Anything else → local engine
 * with the Hebrew/English notice. Claude-authored workouts are cached and stored for account users.
 */
import type { z } from "zod";
import type { CoachContext, Workout, WorkoutRequest } from "@/lib/types";
import type { GenerateWorkoutResponse } from "@/lib/serverTypes";
import { newId } from "@/lib/ids";
import { generateWorkout, validateWorkout } from "@/engine/workoutEngine";
import { getDb, schema } from "../../db/client";
import { getCatalogOverrides, getEffectiveCatalog } from "../../catalog";
import { cacheKey, getCached, setCached } from "../cache";
import { claudeMaxTokens } from "../claude";
import { renderContext } from "../context";
import { convertClaudeWorkout } from "../convert";
import { FALLBACK_NOTICE } from "../fallbacks";
import { callClaudeStructured } from "../index";
import type { AiHandler, AiMeta, AiOutcome } from "../pipeline";
import { languageLine, renderCatalogForPrompt, renderPhaseTemplate, renderWorkoutRequest } from "../prompts";
import { claudeWorkoutOutputSchema, generateWorkoutRequestSchema } from "../schemas";
import { SYSTEM_PROMPT, TASK_PROMPTS } from "../systemPrompt";

type Input = z.infer<typeof generateWorkoutRequestSchema>;

/** Context fields that change the workout (everything personal/volatile is left out). */
export function contextEssentials(ctx: CoachContext): Record<string, unknown> {
  const p = ctx.profile;
  return {
    locale: ctx.locale,
    level: p?.level ?? ctx.roleHint?.level,
    ageGroup: p?.ageGroup,
    primaryRole: p?.primaryRole ?? ctx.roleHint?.primaryRole,
    secondaryRole: p?.secondaryRole ?? ctx.roleHint?.secondaryRole,
    goals: p?.goals,
    weakSkills: ctx.stats?.weakSkills,
    strongSkills: ctx.stats?.strongSkills,
  };
}

export function workoutCacheKey(request: WorkoutRequest, ctx: CoachContext): string {
  const { seed: _seed, recentExerciseIds: _recent, ...rest } = request;
  return cacheKey("generate-workout", { request: rest, context: contextEssentials(ctx) });
}

function restamp(workout: Workout): Workout {
  const now = new Date().toISOString();
  return { ...workout, id: newId("wk_claude"), createdAt: now, updatedAt: now };
}

async function quick(input: Input): Promise<AiOutcome<GenerateWorkoutResponse> | null> {
  const cached = await getCached<GenerateWorkoutResponse>(workoutCacheKey(input.request, input.context));
  if (!cached?.workout) return null;
  return { body: { ok: true, workout: restamp(cached.workout), source: "cache" }, status: "cached", cacheHit: true };
}

async function run(input: Input, meta: AiMeta): Promise<AiOutcome<GenerateWorkoutResponse>> {
  const { request, context } = input;
  const locale = meta.locale;
  const catalog = await getEffectiveCatalog();
  const engineOpts = catalog.length ? { catalog } : {};

  const fallback = (errorCode: string, extra: Partial<AiOutcome<GenerateWorkoutResponse>> = {}): AiOutcome<GenerateWorkoutResponse> => {
    const workout = generateWorkout(request, engineOpts);
    return { body: { ok: true, workout, source: "engine", notice: FALLBACK_NOTICE[locale] }, status: "fallback", errorCode, ...extra };
  };

  if (!meta.claudeAvailable) return fallback(meta.maintenance ? "maintenance" : "no_key");

  const overrides = await getCatalogOverrides();
  const userTurn = [
    TASK_PROMPTS.generateWorkout,
    languageLine(locale),
    "request:",
    renderWorkoutRequest(request),
    renderPhaseTemplate(request),
    "eligible catalog (id | name | phases | skills | needs):",
    renderCatalogForPrompt(request, locale, overrides.enabled, overrides.disabledIds),
    "rules: every phase (including checkin) needs at least one exercise; exercise minutes inside a phase must add up to the phase minutes; use an exerciseId from the list when it fits, otherwise \"\" and describe the drill fully; never a pair/group drill for a solo athlete; integers only for minutes.",
  ].join("\n");

  const result = await callClaudeStructured(claudeWorkoutOutputSchema, {
    system: SYSTEM_PROMPT,
    context: renderContext(context),
    messages: [{ role: "user", content: userTurn }],
    maxTokens: claudeMaxTokens(),
  });
  if (!result.ok) {
    return fallback(result.code, { model: result.model, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens, jsonValid: result.code === "invalid_json" ? false : null });
  }

  const converted = convertClaudeWorkout(result.value, { request, catalog, id: newId("wk_claude") });
  const validation = validateWorkout(converted.workout, {
    participants: request.participants,
    equipment: request.equipment,
    level: request.level,
    ageGroup: request.ageGroup,
    expectedDuration: request.durationMinutes,
    ...(catalog.length ? { catalog } : {}),
  });
  const usage = { model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens };
  if (!validation.ok) {
    if (process.env.NODE_ENV !== "test") console.warn("[ai:generate-workout] Claude workout rejected:", validation.errors.slice(0, 5).join("; "));
    return fallback("validation", { ...usage, jsonValid: true });
  }
  const workout = validation.workout ?? converted.workout;
  const body: GenerateWorkoutResponse = { ok: true, workout, source: "claude" };
  const key = workoutCacheKey(request, context);
  await setCached(key, "generate-workout", body);
  if (meta.user) {
    try {
      const db = await getDb();
      await db.insert(schema.aiGeneratedWorkouts).values({ id: newId("aiw"), userId: meta.user.id, requestHash: key, data: workout as unknown as object, createdAt: new Date() });
    } catch {
      /* best effort */
    }
  }
  return { body, status: "ok", ...usage, jsonValid: true };
}

export const generateWorkoutHandler: AiHandler<Input, GenerateWorkoutResponse> = { action: "generate-workout", schema: generateWorkoutRequestSchema, maxBytes: 120_000, quick, run };
