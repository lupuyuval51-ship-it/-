import { notFound } from "next/navigation";
import { GenerationProgress } from "@/components/create/GenerationProgress";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { requireUser } from "@/server/auth/current";
import { getUserJob } from "@/server/generation/jobs";

export const metadata = { title: "Creating your game" };
export const dynamic = "force-dynamic";

export default async function GeneratePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireUser(`/generate/${jobId}`);
  const job = await getUserJob(user.id, jobId);
  if (!job) notFound();
  const done = job.status === "SUCCEEDED" || job.status === "FAILED";
  const allowance = done ? await getAllowanceSummary(user.id) : undefined;
  return (
    <GenerationProgress
      initial={{
        id: job.id,
        mode: job.mode,
        status: job.status,
        stage: job.stage,
        gameId: job.gameId,
        attempts: job.attempts,
        source: job.providerId === "demo" ? "demo" : job.providerId ? "ai" : null,
        warnings: (job.warnings as string[] | null) ?? [],
        error: job.status === "FAILED" ? { code: job.errorCode, message: job.errorMessage } : null,
        allowance: allowance ? { remaining: allowance.remaining, limit: allowance.limit } : undefined,
      }}
    />
  );
}
