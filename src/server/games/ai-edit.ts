import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { EDIT_LIMITS } from "@/lib/game/spec/edit";
import { maxTier } from "@/lib/game/spec/tier";
import type { GameSpec } from "@/lib/game/spec/schema";
import { ProviderError } from "../ai/errors";
import { getBackend } from "../ai/registry";
import { db, isUniqueViolation } from "../db";
import { getEnv } from "../env";
import { ApiError, Errors } from "../http/errors";
import { runEdit } from "../generation/edit";
import { PipelineError } from "../generation/pipeline";
import { getCapabilities, type Capabilities } from "./capabilities";
import { featureTierForPlan } from "./feature-tier";
import { pruneRevisions } from "./versions";

const SAFE_FAILURE = "Something went wrong while editing your game. Nothing was changed and this did not count against your plan — please try again.";

function describeFailure(err: unknown): { code: string; message: string } {
  if (err instanceof ProviderError) { console.warn(`[ai-edit] provider error: ${err.message}`); return { code: err.code, message: err.userMessage }; }
  if (err instanceof PipelineError) return { code: err.code, message: err.userMessage };
  if (err instanceof ApiError) return { code: err.code, message: err.message };
  console.error("[ai-edit] unexpected failure:", err);
  return { code: "INTERNAL_ERROR", message: SAFE_FAILURE };
}

/** Fail edits whose deadline passed (a crashed worker must not hold a quota slot forever). */
async function reapExpiredEdits(userId: string, now: Date): Promise<void> {
  await db.aiEdit.updateMany({
    where: { userId, status: "PENDING", deadlineAt: { lt: now } },
    data: { status: "FAILED", errorCode: "TIMEOUT", errorMessage: "The edit took too long and was cancelled. It did not count against your plan.", finishedAt: now },
  });
}

export interface EditArgs {
  userId: string;
  gameId: string;
  instruction: string;
  idempotencyKey: string;
  /** Optimistic concurrency: the revision the client is looking at. */
  expectedRevision?: number;
}

export interface EditResult {
  editId: string;
  status: "SUCCEEDED";
  revision: number;
  summary: string;
  warnings: string[];
  capabilities: Capabilities;
}

/**
 * Edit a saved game from a natural-language instruction (the plan's "personal AI robot").
 *
 * Enforced on the server, in this order: the plan has a robot → the game is the caller's and is AI-made → a quota
 * slot is reserved atomically (PENDING row; one in flight per user, enforced by a partial unique index) → the model
 * edit runs and is validated → the new revision and the quota commit happen in ONE transaction. Any failure
 * releases the slot, so a failed edit never costs anything and never changes the game.
 */
export async function editGameWithAi(args: EditArgs, opts: { now?: Date } = {}): Promise<EditResult> {
  const now = opts.now ?? new Date();
  const backend = getBackend();
  await reapExpiredEdits(args.userId, now);

  // Idempotent retry: the same key returns the same outcome instead of spending a second edit.
  const existing = await db.aiEdit.findUnique({ where: { userId_idempotencyKey: { userId: args.userId, idempotencyKey: args.idempotencyKey } } });
  if (existing) {
    if (existing.status === "SUCCEEDED") {
      const { caps } = await getCapabilities(args.userId, now);
      return { editId: existing.id, status: "SUCCEEDED", revision: existing.resultRevision!, summary: existing.summary ?? "", warnings: [], capabilities: caps };
    }
    if (existing.status === "PENDING") throw Errors.conflict("EDIT_IN_PROGRESS", "This edit is already being processed.", { editId: existing.id });
    throw new ApiError(422, existing.errorCode ?? "EDIT_FAILED", existing.errorMessage ?? SAFE_FAILURE);
  }

  const { ent, features } = await getCapabilities(args.userId, now);
  if (features.robot === "none" || features.aiEditsPerPeriod <= 0) {
    throw new ApiError(403, "FEATURE_LOCKED", "Editing games with the AI robot is available on Plus and Pro.", { feature: "robot", requiredPlan: "PLUS" });
  }
  // Permission first (what the plan includes), then whether this server can run a model at all.
  if (backend.type !== "llm") {
    throw Errors.unavailable("AI_UNAVAILABLE", "The AI robot needs an AI provider, which is not configured on this server.");
  }
  const level = features.robot;

  const game = await db.game.findFirst({ where: { id: args.gameId, ownerId: args.userId, deletedAt: null } });
  if (!game) throw Errors.notFound("Game not found.");
  if (game.generatorKind !== "ai" || backend.info.kind !== "ai") {
    throw Errors.conflict("EDIT_NOT_SUPPORTED", "Only games created by the AI can be edited with the AI robot.");
  }
  if (args.expectedRevision !== undefined && args.expectedRevision !== game.revision) {
    throw Errors.conflict("EDIT_CONFLICT", "The game changed since you opened it. Reload and try again.", { revision: game.revision });
  }
  const baseSpec = game.spec as unknown as GameSpec;

  // Reserve one quota slot atomically. The advisory lock serialises concurrent starters of the same user for the
  // few milliseconds of check-and-insert; the partial unique index guarantees one edit in flight.
  let editId: string;
  try {
    editId = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`aiedit:${args.userId}`}))::text`;
      const used = await tx.aiEdit.count({ where: { userId: args.userId, periodStart: ent.periodStart, status: { in: ["PENDING", "SUCCEEDED"] } } });
      if (used >= features.aiEditsPerPeriod) {
        throw new ApiError(402, "EDIT_QUOTA_EXHAUSTED", "You have used all your AI edits for this period.", { plan: ent.plan, limit: features.aiEditsPerPeriod, resetsAt: ent.periodEnd.toISOString() });
      }
      const created = await tx.aiEdit.create({
        data: {
          userId: args.userId, gameId: game.id, instruction: args.instruction.trim().slice(0, EDIT_LIMITS.instructionChars), idempotencyKey: args.idempotencyKey,
          plan: ent.plan, periodStart: ent.periodStart, baseRevision: game.revision, deadlineAt: new Date(now.getTime() + getEnv().AI_JOB_DEADLINE_MS),
        },
      });
      return created.id;
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      const same = await db.aiEdit.findUnique({ where: { userId_idempotencyKey: { userId: args.userId, idempotencyKey: args.idempotencyKey } } });
      if (same) throw Errors.conflict("EDIT_IN_PROGRESS", "This edit is already being processed.", { editId: same.id });
      throw Errors.conflict("EDIT_IN_PROGRESS", "Another edit is already running for your account. Wait for it to finish.");
    }
    throw err;
  }

  const fail = async (err: unknown): Promise<never> => {
    const { code, message } = describeFailure(err);
    await db.aiEdit.updateMany({ where: { id: editId, status: "PENDING" }, data: { status: "FAILED", errorCode: code, errorMessage: message.slice(0, 300), finishedAt: new Date() } }).catch((e) => console.error("[ai-edit] could not settle failed edit", e));
    if (err instanceof ApiError) throw err;
    throw new ApiError(code === "EDIT_CONFLICT" ? 409 : 422, code, message);
  };

  try {
    const env = getEnv();
    const out = await runEdit({
      backend, spec: baseSpec, instruction: args.instruction, level,
      tier: maxTier(featureTierForPlan(ent.plan), baseSpec.meta.featureTier ?? "A"), deadline: now.getTime() + env.AI_JOB_DEADLINE_MS, callTimeoutMs: env.AI_CALL_TIMEOUT_MS,
      onStage: async () => { /* progress is not streamed for edits; the request returns when the edit is done */ },
    });
    const spec = out.spec;
    if (baseSpec.meta.generator) spec.meta.generator = baseSpec.meta.generator;
    const json = spec as unknown as Prisma.InputJsonValue;

    const revision = await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ revision: number; deletedAt: Date | null; ownerId: string }[]>`SELECT "revision", "deletedAt", "ownerId" FROM "Game" WHERE "id" = ${game.id} FOR UPDATE`;
      const row = rows[0];
      if (!row || row.deletedAt || row.ownerId !== args.userId) throw new PipelineError("EXTEND_CONFLICT", "The game was deleted while it was being edited. Nothing was changed.");
      if (row.revision !== game.revision) throw new ApiError(409, "EDIT_CONFLICT", "The game changed while it was being edited. Nothing was changed — please try again.");
      const next = game.revision + 1;
      const { count } = await tx.aiEdit.updateMany({ where: { id: editId, status: "PENDING" }, data: { status: "SUCCEEDED", resultRevision: next, summary: out.summary, model: out.model.slice(0, 80), attempts: out.attempts, finishedAt: new Date() } });
      if (count === 0) throw new ApiError(409, "EDIT_EXPIRED", "The edit took too long and was cancelled. Nothing was changed.");
      await tx.game.update({ where: { id: game.id }, data: { spec: json, revision: next, title: spec.meta.title } });
      await tx.gameRevision.create({ data: { gameId: game.id, revision: next, reason: "edit", note: args.instruction.trim().slice(0, EDIT_LIMITS.instructionChars), spec: json } });
      await pruneRevisions(tx, game.id, next, features.versionsKept);
      return next;
    });

    const { caps } = await getCapabilities(args.userId);
    return { editId, status: "SUCCEEDED", revision, summary: out.summary, warnings: out.warnings.slice(0, 10), capabilities: caps };
  } catch (err) {
    return fail(err);
  }
}
