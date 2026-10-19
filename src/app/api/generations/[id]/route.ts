import { getAllowanceSummary } from "@/server/allowance/summary";
import { Errors } from "@/server/http/errors";
import { apiRoute } from "@/server/http/route";
import { getUserJob } from "@/server/generation/jobs";

export const GET = apiRoute<undefined, { id: string }>({}, async ({ user, params }) => {
  const job = await getUserJob(user.id, params.id);
  if (!job) throw Errors.notFound("Generation not found.");
  const done = job.status === "SUCCEEDED" || job.status === "FAILED";
  return {
    id: job.id,
    mode: job.mode,
    /** The game's level (feature tier): the job holds one game of this level's quota. */
    level: job.featureTier,
    status: job.status,
    stage: job.stage,
    gameId: job.gameId,
    attempts: job.attempts,
    /** "demo" is only a legacy/test label for a ready-made template game, never AI. */
    source: job.providerId === "topic-library" ? "catalog" : job.providerId === "study-engine" ? "engine" : job.providerId === "demo" ? "demo" : job.providerId ? "ai" : null,
    provider: job.providerId,
    warnings: (job.warnings as string[] | null) ?? [],
    error: job.status === "FAILED" ? { code: job.errorCode, message: job.errorMessage } : null,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    deadlineAt: job.deadlineAt,
    allowance: done ? await getAllowanceSummary(user.id) : undefined,
  };
});
