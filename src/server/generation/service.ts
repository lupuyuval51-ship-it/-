import "server-only";
import type { CreateGenerationBody } from "@/lib/schemas/generation";
import type { GameSpec } from "@/lib/game/spec/schema";
import { planUnlocking, type FeatureTier } from "@/config/plans";
import { gameTypeFeature, gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { describeBackend, getBackend } from "../ai/registry";
import { resolveEntitlement } from "../allowance/entitlement";
import { featureTierForPlan } from "../games/feature-tier";
import { db } from "../db";
import { getEnv } from "../env";
import { ApiError, Errors } from "../http/errors";
import { runInBackground } from "../http/background";
import { startGenerationJob } from "./jobs";
import { runGenerationJob } from "./runner";

/**
 * Validate preconditions BEFORE a credit is reserved, create the job (reserving one credit atomically) and
 * start the work in the background. A duplicate submission (same idempotency key) returns the same job.
 */
export async function createGeneration(userId: string, body: CreateGenerationBody, opts: { schedule?: boolean } = {}) {
  const backend = getBackend();
  if (backend.type === "unavailable") {
    throw Errors.unavailable("AI_UNAVAILABLE", `AI generation is not available: ${backend.reason}. Ask the administrator to configure a provider or use demo mode.`);
  }

  // What the plan allows is decided here, from persisted state, before anything is reserved or generated.
  const tier = featureTierForPlan((await resolveEntitlement(userId)).plan);
  assertRequestAllowed(tier, body.request);

  let request = body.request;
  if (request.mode === "EXTEND") {
    const game = await db.game.findFirst({ where: { id: request.targetGameId!, ownerId: userId, deletedAt: null } });
    if (!game) throw Errors.notFound("Game not found.");
    // Games built from the learner's own material are extended by the same study engine, which runs when no AI provider is configured.
    const compatible = game.generatorKind === backend.info.kind || (game.generatorKind === "engine" && backend.info.kind === "demo");
    if (!compatible) {
      throw Errors.conflict(
        "EXTEND_BACKEND_MISMATCH",
        game.generatorKind === "demo"
          ? "This game was created from demo templates. It can only be extended while the server is in demo mode."
          : game.generatorKind === "engine"
            ? "This game was built from your own study material. It can only be extended with more material while no AI provider is configured."
            : "This game was AI-generated. It cannot be extended with demo templates — configure the AI provider first.",
      );
    }
    // The extended game's identity is authoritative; the client may not change its subject, level or language.
    const spec = game.spec as unknown as GameSpec;
    request = { ...request, subject: game.subject, difficulty: spec.meta.difficulty, gameType: spec.meta.gameType, contentLanguage: spec.meta.language };
  }

  const { job, created } = await startGenerationJob({
    userId, idempotencyKey: body.idempotencyKey, request, deadlineMs: getEnv().AI_JOB_DEADLINE_MS,
  });
  if (created && opts.schedule !== false) runInBackground(() => runGenerationJob(job.id));
  return { jobId: job.id, created, status: job.status, backend: describeBackend() };
}

/** A request for something the plan's tier does not have is refused with the plan that unlocks it (nothing is reserved). */
export function assertRequestAllowed(tier: FeatureTier, request: { mode: "FAST" | "FULL" | "EXTEND"; gameType: Parameters<typeof gameTypeAllowed>[1] }): void {
  if (!modeAllowed(tier, request.mode)) {
    throw new ApiError(403, "FEATURE_TIER_LOCKED", request.mode === "EXTEND" ? "Extending a game with new areas is available from the Plus plan." : "Full adventures with several areas are available from the Plus plan.", {
      feature: "system:multi_area", requiredPlan: planUnlocking("system:multi_area"), tier,
    });
  }
  if (!gameTypeAllowed(tier, request.gameType)) {
    const feature = gameTypeFeature(request.gameType);
    throw new ApiError(403, "FEATURE_TIER_LOCKED", `The "${request.gameType}" game type is not part of your plan's game features.`, { feature, requiredPlan: planUnlocking(feature), tier });
  }
}
