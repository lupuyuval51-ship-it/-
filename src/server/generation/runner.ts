import "server-only";
import type { GenerationJob, Prisma } from "@/generated/prisma/client";
import { generationRequestSchema, type GenerationRequest } from "@/lib/schemas/generation";
import { fitForDevice } from "@/lib/game/spec/device";
import { clampToFeatureTier, maxTier } from "@/lib/game/spec/tier";
import type { GameSpec } from "@/lib/game/spec/schema";
import { ProviderError } from "../ai/errors";
import { getBackend } from "../ai/registry";
import { TOPIC_MODEL, TOPIC_PROVIDER } from "@/lib/game/topics/build";
import type { GenerationBackend } from "../ai/types";
import { db, type Tx } from "../db";
import { getEnv } from "../env";
import { failJob, markJobRunning, succeedJob, updateJobProgress } from "./jobs";
import { PipelineError, runPipeline, type PipelineOutput } from "./pipeline";

const INTERNAL_MESSAGE = "Something went wrong while creating your game. You were not charged — please try again.";

interface BaseGame {
  id: string;
  revision: number;
  spec: GameSpec;
}

function specWithGenerator(out: PipelineOutput, backend: GenerationBackend, mode: GenerationRequest["mode"], base: BaseGame | null): GameSpec {
  const spec = out.spec;
  // Extending keeps the original provenance (backend-kind compatibility is enforced before the job starts).
  if (mode === "EXTEND" && base?.spec.meta.generator) {
    spec.meta.generator = base.spec.meta.generator;
    return spec;
  }
  spec.meta.generator = {
    kind: out.catalog ? "catalog" : out.engine ? "engine" : out.sample ? "demo" : backend.info.kind === "none" ? "engine" : backend.info.kind,
    provider: out.catalog ? TOPIC_PROVIDER : out.engine ? "study-engine" : out.sample ? "demo" : backend.info.id,
    model: out.model.slice(0, 80),
    templateId: out.templateId,
    mode,
    generatedAt: new Date().toISOString(),
  };
  return spec;
}

async function deliver(tx: Tx, job: GenerationJob, spec: GameSpec, request: GenerationRequest, base: BaseGame | null): Promise<{ gameId: string }> {
  const gen = spec.meta.generator!;
  const json = spec as unknown as Prisma.InputJsonValue;
  if (request.mode !== "EXTEND") {
    const game = await tx.game.create({
      data: {
        ownerId: job.userId, title: spec.meta.title, subject: spec.meta.subject, gameType: spec.meta.gameType, difficulty: spec.meta.difficulty,
        language: spec.meta.language, createdVia: request.mode, generatorKind: gen.kind, generatorProvider: gen.provider, generatorModel: gen.model,
        spec: json, revisions: { create: { revision: 1, reason: "create", spec: json } },
      },
    });
    return { gameId: game.id };
  }
  if (!base) throw new PipelineError("EXTEND_CONFLICT", "The game to extend could not be loaded.");
  // Lock the row so two extensions (or an edit) cannot interleave, then make sure nobody changed the game meanwhile.
  const rows = await tx.$queryRaw<{ revision: number; deletedAt: Date | null; ownerId: string }[]>`
    SELECT "revision", "deletedAt", "ownerId" FROM "Game" WHERE "id" = ${base.id} FOR UPDATE`;
  const row = rows[0];
  if (!row || row.deletedAt || row.ownerId !== job.userId) throw new PipelineError("EXTEND_CONFLICT", "The game was deleted while it was being extended. You were not charged.");
  if (row.revision !== base.revision) throw new PipelineError("EXTEND_CONFLICT", "The game was changed while it was being extended. You were not charged — please try again.");
  const next = base.revision + 1;
  await tx.game.update({ where: { id: base.id }, data: { spec: json, revision: next, title: spec.meta.title } });
  await tx.gameRevision.create({ data: { gameId: base.id, revision: next, reason: "extend", spec: json } });
  return { gameId: base.id };
}

function describeFailure(err: unknown): { code: string; message: string } {
  // The owner must be able to see WHY the provider failed (out of credit, bad key, ...). `message` is "<code>: <short detail>" and never holds a provider response body.
  if (err instanceof ProviderError) { console.warn(`[generation] provider error: ${err.message}`); return { code: err.code, message: err.userMessage }; }
  if (err instanceof PipelineError) return { code: err.code, message: err.userMessage };
  console.error("[generation] unexpected failure:", err);
  return { code: "INTERNAL_ERROR", message: INTERNAL_MESSAGE };
}

/**
 * Execute one generation job end to end. Safe to call more than once for the same job: only the caller that
 * moves it PENDING → RUNNING proceeds. Every exit path either commits the held game (one of the job's level) together
 * with the saved game or releases it.
 */
export async function runGenerationJob(jobId: string, opts: { backend?: GenerationBackend } = {}): Promise<void> {
  const job = await db.generationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "PENDING") return;
  if (!(await markJobRunning(jobId))) return;

  const env = getEnv();
  const backend = opts.backend ?? getBackend();
  try {
    const request = generationRequestSchema.parse(job.request);
    // The topic library needs no AI backend at all (it never calls a model).
    const catalog = Boolean(request.topicId);
    if (backend.type === "unavailable" && !catalog) {
      await failJob(jobId, "AI_UNAVAILABLE", "AI generation is not configured on this server. You were not charged.");
      return;
    }
    let base: BaseGame | null = null;
    if (request.mode === "EXTEND") {
      const game = await db.game.findFirst({ where: { id: job.targetGameId ?? "", ownerId: job.userId, deletedAt: null } });
      if (!game) throw new PipelineError("EXTEND_CONFLICT", "The game to extend could not be found. You were not charged.");
      base = { id: game.id, revision: game.revision, spec: game.spec as unknown as GameSpec };
    }
    // Without an AI provider, learner material (or extending a material game) is handled by the rule-based study engine.
    const engine = backend.type === "none" && (request.mode === "EXTEND" ? base?.spec.meta.generator?.kind === "engine" : Boolean(request.material));
    await updateJobProgress(jobId, catalog
      ? { providerId: TOPIC_PROVIDER, model: TOPIC_MODEL, stage: "starting" }
      : engine ? { providerId: "study-engine", model: "rule-based", stage: "starting" } : { providerId: backend.type === "none" ? "demo" : backend.info.id, model: backend.type === "none" ? "sample" : backend.info.model, stage: "starting" }); // "none" reaches here only for a registered test sample

    // Games saved before tiers existed count as tier A (they keep everything they have).
    const tier = request.mode === "EXTEND" && base ? maxTier(job.featureTier, base.spec.meta.featureTier ?? "A") : job.featureTier;
    const out = await runPipeline({
      // (an unavailable backend only gets this far for a topic-library request, which never touches it)
      backend: backend as Exclude<GenerationBackend, { type: "unavailable" }>, request, tier, base: base?.spec ?? null, deadline: job.deadlineAt.getTime(), callTimeoutMs: env.AI_CALL_TIMEOUT_MS,
      onStage: (stage) => updateJobProgress(jobId, { stage }),
    });

    await updateJobProgress(jobId, { stage: "save", attempts: out.attempts, warnings: out.warnings.slice(0, 20) });
    const built = specWithGenerator(out, backend, request.mode, base);
    // The plan's feature tier is enforced on the saved game itself. Extending keeps what the game already had (it was
    // built at its own tier); only a lower plan's NEW content would be a problem, and a lower plan cannot extend at all.
    const clamped = clampToFeatureTier(built, tier);
    if (!clamped.ok) throw new PipelineError("TIER_BUILD_FAILED", "We could not build this game within your plan's features. You were not charged — try a different topic or game type.", clamped.errors.join(" | ").slice(0, 600));
    // An extension the level clamp emptied (the game already had all the areas its level allows) is not saved or charged.
    if (base && clamped.spec.areas.length <= base.spec.areas.length) {
      throw new PipelineError("TIER_BUILD_FAILED", "This game already has the most areas its level allows, so nothing could be added. You were not charged.", `extension dropped by the level ${tier} clamp: ${base.spec.areas.length} areas before, ${clamped.spec.areas.length} after`);
    }
    // A game made on a phone is fitted to a touch screen (never for an extension: the original areas stay as they were).
    const fitted = request.mode !== "EXTEND" && request.device === "phone" ? fitForDevice(clamped.spec, "phone") : { spec: clamped.spec, notes: [] as string[] };
    const spec = fitted.spec;
    const notes = [...clamped.notes, ...fitted.notes];
    if (notes.length) await updateJobProgress(jobId, { warnings: [...out.warnings, ...notes].slice(0, 20) });
    const delivered = await succeedJob(jobId, (tx, j) => deliver(tx, j, spec, request, base));
    if (!delivered) console.warn(`[generation] job ${jobId} was already settled (timed out?); result discarded, no charge`);
  } catch (err) {
    const { code, message } = describeFailure(err);
    await failJob(jobId, code, message).catch((e) => console.error("[generation] could not settle failed job", e));
  }
}
