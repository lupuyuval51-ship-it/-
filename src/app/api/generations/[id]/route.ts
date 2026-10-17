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
    status: job.status,
    stage: job.stage,
    gameId: job.gameId,
    attempts: job.attempts,
    /** "demo" means the game came from predefined templates, not from an AI model. */
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
