/**
 * Full Adventure generation is two-stage: first a BLUEPRINT (world structure, missions, and a plan of which
 * challenges exist), validated cheaply before any expensive content is written; then the challenge CONTENT.
 */
import { z } from "zod";
import { CHALLENGE_TYPES, SPEC_LIMITS } from "./constants";
import { challengeSchema, gameSpecSchema, idSchema, type Challenge, type GameSpec } from "./schema";
import { crossCheck, normalizeRawSpec } from "./validate";

export const challengePlanSchema = z.object({
  id: idSchema,
  type: z.enum(CHALLENGE_TYPES),
  concept: z.string().trim().min(1).max(60),
  level: z.number().int().min(1).max(3).default(1),
  objectiveId: idSchema,
  easierId: idSchema.optional(),
  harderId: idSchema.optional(),
});
export type ChallengePlan = z.infer<typeof challengePlanSchema>;

export const blueprintSchema = gameSpecSchema.omit({ challenges: true }).extend({
  challengePlan: z.array(challengePlanSchema).min(1).max(SPEC_LIMITS.challenges),
});
export type Blueprint = z.infer<typeof blueprintSchema>;

/** A well-formed stand-in challenge so the structural cross-checks can run before real content exists. */
function placeholder(plan: ChallengePlan): Challenge {
  return {
    type: "choice", id: plan.id, title: "placeholder", prompt: "placeholder", concept: plan.concept, level: plan.level, objectiveId: plan.objectiveId,
    easierId: plan.easierId, harderId: plan.harderId, explanation: "placeholder",
    options: [{ id: "a", text: "a", feedback: "a" }, { id: "b", text: "b", feedback: "b" }], correctOptionId: "a",
  };
}

export type BlueprintResult = { ok: true; blueprint: Blueprint; warnings: string[] } | { ok: false; errors: string[] };

export function validateBlueprint(raw: unknown): BlueprintResult {
  const { value, notes } = normalizeRawSpec(raw);
  const parsed = blueprintSchema.safeParse(value);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.slice(0, 25).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  const bp = parsed.data;
  const plan = bp.challengePlan;
  const ids = plan.map((p) => p.id);
  const errors: string[] = [];
  if (new Set(ids).size !== ids.length) errors.push("challengePlan contains duplicate ids");
  const synthetic: GameSpec = { ...bp, challenges: plan.map(placeholder) };
  errors.push(...crossCheck(synthetic).errors);
  return errors.length ? { ok: false, errors: errors.slice(0, 25) } : { ok: true, blueprint: bp, warnings: notes };
}

export const challengesPayloadSchema = z.object({ challenges: z.array(challengeSchema).min(1).max(SPEC_LIMITS.challenges) });

/** Check that the content stage delivered exactly the planned challenges (same ids and types). */
export function checkAgainstPlan(plan: ChallengePlan[], challenges: Challenge[]): string[] {
  const errors: string[] = [];
  const byId = new Map(challenges.map((c) => [c.id, c]));
  for (const p of plan) {
    const c = byId.get(p.id);
    if (!c) errors.push(`missing challenge "${p.id}" from the plan`);
    else if (c.type !== p.type) errors.push(`challenge "${p.id}" must have type "${p.type}" as planned, got "${c.type}"`);
  }
  for (const c of challenges) if (!plan.some((p) => p.id === c.id)) errors.push(`challenge "${c.id}" is not in the plan: remove it`);
  return errors;
}
