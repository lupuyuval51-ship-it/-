/** /api/claude/replace-exercise – picks one of the client's candidates (or a short custom drill); first candidate as fallback. */
import type { z } from "zod";
import type { Locale, WorkoutExercise } from "@/lib/types";
import { L } from "@/lib/types";
import { newId } from "@/lib/ids";
import type { ReplaceExerciseResponse } from "@/lib/serverTypes";
import { cacheKey, getCached, setCached } from "../cache";
import { claudeMaxTokens } from "../claude";
import { renderContext } from "../context";
import { inferMetricKey, metricTypeFor } from "../convert";
import { replaceFallback } from "../fallbacks";
import { callClaudeStructured, wrapUserMessage } from "../index";
import type { AiHandler, AiMeta, AiOutcome } from "../pipeline";
import { languageLine, renderCandidates } from "../prompts";
import { claudeReplaceOutputSchema, replaceExerciseRequestSchema } from "../schemas";
import { SYSTEM_PROMPT, TASK_PROMPTS } from "../systemPrompt";

type Input = z.infer<typeof replaceExerciseRequestSchema>;
type CustomOutput = NonNullable<z.infer<typeof claudeReplaceOutputSchema>["custom"]>;

function clampInt(n: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

function list(items: string[], max: number, maxChars = 400) {
  return items.map((s) => s.trim().slice(0, maxChars)).filter(Boolean).slice(0, max).map((s) => L(s));
}

function replaceKey(input: Input, locale: Locale): string {
  return cacheKey("replace-exercise", {
    exercise: input.exercise.exerciseId ?? input.exercise.name.he ?? input.exercise.name.en,
    reason: input.reason.trim().toLowerCase(),
    candidates: input.candidates.map((c) => c.id).sort(),
    participants: input.context.profile?.participants ?? input.exercise.participants,
    equipment: [...(input.context.profile?.equipment ?? [])].sort(),
    locale,
  });
}

/** Builds a WorkoutExercise from Claude's custom drill, keeping the original slot's duration and skills. */
export function customFromClaude(custom: CustomOutput, original: WorkoutExercise, participants: WorkoutExercise["participants"]): WorkoutExercise | null {
  const name = custom.name.trim().slice(0, 120);
  const instructions = list(custom.instructions, 12, 600);
  if (!name || instructions.length === 0) return null;
  const metricText = custom.successMetric.trim().slice(0, 200);
  const key = inferMetricKey(metricText, "role", name);
  const type = metricTypeFor(key);
  return {
    id: newId("ex"),
    name: L(name),
    durationMinutes: original.durationMinutes,
    sets: clampInt(custom.sets, 1, 30, original.sets),
    reps: clampInt(custom.reps, 1, 500, original.reps),
    restSeconds: clampInt(custom.restSeconds, 0, 900, original.restSeconds),
    instructions,
    cues: list(custom.cues, 8),
    commonMistakes: list(custom.commonMistakes, 8),
    successMetric: { type, key, label: L(metricText || name), ...(type === "ratio" ? { attempts: original.successMetric.attempts ?? 10 } : {}) },
    easierAlternative: custom.easierAlternative.trim() ? L(custom.easierAlternative.trim().slice(0, 500)) : original.easierAlternative,
    harderAlternative: custom.harderAlternative.trim() ? L(custom.harderAlternative.trim().slice(0, 500)) : original.harderAlternative,
    soloAlternative: custom.soloAlternative.trim() ? L(custom.soloAlternative.trim().slice(0, 500)) : original.soloAlternative,
    safetyNotes: list(custom.safetyNotes, 6),
    skills: original.skills,
    equipment: [],
    participants,
  };
}

async function quick(input: Input, meta: AiMeta): Promise<AiOutcome<ReplaceExerciseResponse> | null> {
  const cached = await getCached<ReplaceExerciseResponse>(replaceKey(input, meta.locale));
  if (!cached) return null;
  const custom = cached.custom ? { ...cached.custom, id: newId("ex") } : undefined;
  return { body: { ...cached, ...(custom ? { custom } : {}), source: "cache" }, status: "cached", cacheHit: true };
}

async function run(input: Input, meta: AiMeta): Promise<AiOutcome<ReplaceExerciseResponse>> {
  const fallback = (errorCode: string, extra: Partial<AiOutcome<ReplaceExerciseResponse>> = {}): AiOutcome<ReplaceExerciseResponse> => ({
    body: { ok: true, ...replaceFallback(input.candidates, meta.locale) },
    status: "fallback",
    errorCode,
    ...extra,
  });
  if (!meta.claudeAvailable) return fallback(meta.maintenance ? "maintenance" : "no_key");

  const ex = input.exercise;
  const participants = input.context.profile?.participants ? [input.context.profile.participants] : ex.participants;
  const userTurn = [
    TASK_PROMPTS.replaceExercise,
    languageLine(meta.locale),
    `current_exercise: ${ex.name.he || ex.name.en} | ${ex.durationMinutes} min | sets=${ex.sets} reps=${ex.reps} rest=${ex.restSeconds}s | skills: ${ex.skills.join(", ")} | equipment: ${ex.equipment.join(", ") || "none"}`,
    `instructions: ${ex.instructions.slice(0, 3).map((i) => i.he || i.en).join(" / ")}`,
    `participants: ${participants.join(", ") || "any"}`,
    wrapUserMessage(`reason: ${input.reason}`),
    renderCandidates(input.candidates),
    'answer rules: choiceId must be one of the candidate ids (or "" when proposing custom); custom may be null.',
  ].join("\n");
  const result = await callClaudeStructured(claudeReplaceOutputSchema, {
    system: SYSTEM_PROMPT,
    context: renderContext(input.context),
    messages: [{ role: "user", content: userTurn }],
    maxTokens: Math.min(1500, claudeMaxTokens()),
  });
  if (!result.ok) {
    return fallback(result.code, { model: result.model, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens, jsonValid: result.code === "invalid_json" ? false : null });
  }
  const usage = { model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens };
  const choiceId = input.candidates.some((c) => c.id === result.value.choiceId) ? result.value.choiceId : undefined;
  const custom = !choiceId && result.value.custom ? customFromClaude(result.value.custom, ex, participants) : null;
  if (!choiceId && !custom) return fallback("no_choice", { ...usage, jsonValid: true });
  const rationale = result.value.rationale.trim().slice(0, 300) || (meta.locale === "he" ? "התרגיל החלופי שומר על אותה מטרה." : "The alternative keeps the same goal.");
  const body: ReplaceExerciseResponse = { ok: true, ...(choiceId ? { choiceId } : {}), ...(custom ? { custom } : {}), rationale, source: "claude" };
  await setCached(replaceKey(input, meta.locale), "replace-exercise", body);
  return { body, status: "ok", ...usage, jsonValid: true };
}

export const replaceExerciseHandler: AiHandler<Input, ReplaceExerciseResponse> = { action: "replace-exercise", schema: replaceExerciseRequestSchema, maxBytes: 100_000, quick, run };
