import "server-only";
import type { CreateGenerationBody } from "@/lib/schemas/generation";
import type { GameSpec } from "@/lib/game/spec/schema";
import { defaultLevel, levelUnlocking, planUnlocking, planUnlockingLevel, type FeatureTier, type PlanId } from "@/config/plans";
import { gameTypeFeature, gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { describeBackend, getBackend } from "../ai/registry";
import { resolveEntitlement } from "../allowance/entitlement";
import { findPeriod } from "../allowance/periods";
import { levelCost, levelsForPlan } from "../games/feature-tier";
import { db } from "../db";
import { getEnv } from "../env";
import { ApiError, Errors } from "../http/errors";
import { premiumTopicsPlan, topicOpenFor } from "@/lib/game/topics/premium";
import { runInBackground } from "../http/background";
import { startGenerationJob } from "./jobs";
import { runGenerationJob } from "./runner";

/**
 * Validate preconditions BEFORE anything is reserved, decide the game's LEVEL, create the job (reserving the level's
 * price in points atomically) and start the work in the background. A duplicate submission (same idempotency key)
 * returns the same job, whatever has been spent since.
 *
 * The level: the player's wish (`request.level`) when the plan offers it, else the highest level the remaining points
 * pay for. Extending a game always uses the game's own level, priced on the current plan; a plan that cannot make
 * that level cannot extend the game. Level C games have a single area and cannot be extended.
 */
export async function createGeneration(userId: string, body: CreateGenerationBody, opts: { schedule?: boolean } = {}) {
  const backend = getBackend();
  // A game from the topic library is built without any model, so it does not need an AI backend.
  if (backend.type === "unavailable" && !body.request.topicId) {
    throw Errors.unavailable("AI_UNAVAILABLE", `AI generation is not available: ${backend.reason}. Ask the administrator to configure a provider or use demo mode.`);
  }

  const existing = await db.generationJob.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: body.idempotencyKey } } });
  if (existing) return { jobId: existing.id, created: false, status: existing.status, backend: describeBackend() };

  // What the plan allows is decided here, from persisted state, before anything is reserved or generated.
  const ent = await resolveEntitlement(userId);
  // A premium topic of the library (about a third of each category) is played only on a plan that opens premium topics.
  if (body.request.topicId && !topicOpenFor(ent.plan, body.request.topicId)) {
    throw new ApiError(403, "TOPIC_LOCKED", "This topic is part of Plus and Pro.", { topicId: body.request.topicId, requiredPlan: premiumTopicsPlan() });
  }
  const period = await findPeriod(userId, ent);
  const remaining = Math.max(0, ent.limit - (period?.used ?? 0) - (period?.reserved ?? 0));

  let request = body.request;
  let level: FeatureTier;
  if (request.mode === "EXTEND") {
    const game = await db.game.findFirst({ where: { id: request.targetGameId!, ownerId: userId, deletedAt: null } });
    if (!game) throw Errors.notFound("Game not found.");
    // Games built from the learner's own material are extended by the same study engine, which runs when no AI provider is configured.
    const compatible = game.generatorKind === backend.info.kind || (game.generatorKind === "engine" && backend.info.kind === "demo");
    if (!compatible) {
      throw Errors.conflict(
        "EXTEND_BACKEND_MISMATCH",
        game.generatorKind === "catalog"
          ? "This game comes from the topic library and cannot be extended. Create a new game from the library instead — for example at the next level."
          : game.generatorKind === "demo"
          ? "This game was created from demo templates. It can only be extended while the server is in demo mode."
          : game.generatorKind === "engine"
            ? "This game was built from your own study material. It can only be extended with more material while no AI provider is configured."
            : "This game was AI-generated. It cannot be extended with demo templates — configure the AI provider first.",
      );
    }
    // The extended game's identity is authoritative; the client may not change its subject, level or language.
    const spec = game.spec as unknown as GameSpec;
    request = { ...request, subject: game.subject, difficulty: spec.meta.difficulty, gameType: spec.meta.gameType, contentLanguage: spec.meta.language };
    // Games saved before levels existed count as level A (they keep everything they have).
    level = spec.meta.featureTier ?? "A";
    if (levelCost(ent.plan, level) === null) {
      throw new ApiError(403, "FEATURE_TIER_LOCKED", `Extending a level ${level} game is not part of your plan.`, {
        level, requiredLevel: level, requiredPlan: planUnlockingLevel(level),
      });
    }
    assertRequestAllowed(level, request);
  } else {
    level = chooseLevel(ent.plan, remaining, request);
    assertRequestAllowed(level, request, ent.plan);
  }
  request = { ...request, level };

  const { job, created } = await startGenerationJob({
    userId, idempotencyKey: body.idempotencyKey, request, level, deadlineMs: getEnv().AI_JOB_DEADLINE_MS,
  });
  if (created && opts.schedule !== false) runInBackground(() => runGenerationJob(job.id));
  return { jobId: job.id, created, status: job.status, backend: describeBackend() };
}

type LevelRequest = { level?: FeatureTier; mode: "FAST" | "FULL" | "EXTEND"; gameType: Parameters<typeof gameTypeAllowed>[1] };

/** Can a game at this level hold the request (mode and game type)? */
const levelFits = (level: FeatureTier, request: LevelRequest): boolean => modeAllowed(level, request.mode) && gameTypeAllowed(level, request.gameType);

/**
 * The level of a new game. The player's wish is checked against the plan (403 FEATURE_TIER_LOCKED with the cheapest
 * plan that offers it); whether the points suffice is checked atomically when the job reserves them (402).
 */
export function chooseLevel(plan: PlanId, remaining: number, request: LevelRequest): FeatureTier {
  const levels = levelsForPlan(plan);
  if (request.level) {
    if (!levels.includes(request.level)) {
      throw new ApiError(403, "FEATURE_TIER_LOCKED", `Level ${request.level} games are not part of your plan.`, {
        level: request.level, requiredLevel: request.level, requiredPlan: planUnlockingLevel(request.level),
      });
    }
    return request.level;
  }
  if (levels.length === 1) return levels[0]!;
  return defaultLevel(plan, remaining, (l) => levelFits(l, request));
}

/**
 * A request for something the game's level does not have is refused with the level and the cheapest plan that unlock
 * it (nothing is reserved). When `plan` is given and already offers that level, the answer names the plan itself.
 */
export function assertRequestAllowed(tier: FeatureTier, request: LevelRequest, plan?: PlanId): void {
  const refuse = (feature: Parameters<typeof planUnlocking>[0], message: string): never => {
    const requiredLevel = levelUnlocking(feature);
    const onPlan = plan !== undefined && levelsForPlan(plan).includes(requiredLevel);
    throw new ApiError(403, "FEATURE_TIER_LOCKED", onPlan ? `${message} Choose level ${requiredLevel}.` : message, {
      feature, requiredLevel, requiredPlan: onPlan ? plan : planUnlocking(feature), tier,
    });
  };
  if (!modeAllowed(tier, request.mode)) {
    refuse("system:multi_area", request.mode === "EXTEND"
      ? `Extending a game with new areas needs a level ${levelUnlocking("system:multi_area")} game.`
      : `Full adventures with several areas need level ${levelUnlocking("system:multi_area")}.`);
  }
  if (!gameTypeAllowed(tier, request.gameType)) {
    refuse(gameTypeFeature(request.gameType), `The "${request.gameType}" game type is not part of level ${tier} games.`);
  }
}
