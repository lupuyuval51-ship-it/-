import { RATE_LIMITS } from "@/config/limits";
import { createGenerationBodySchema } from "@/lib/schemas/generation";
import { apiRoute, json } from "@/server/http/route";
import { createGeneration } from "@/server/generation/service";

/**
 * Generation runs after the response (Next.js `after`), so on serverless platforms the function must be allowed to
 * live as long as the job: keep this ≥ AI_JOB_DEADLINE_MS / 1000 where the platform allows it. If the platform
 * stops the function earlier the job simply passes its deadline, is marked TIMEOUT and its held game is released.
 */
export const maxDuration = 800;

export const POST = apiRoute(
  { body: createGenerationBodySchema, rateLimit: [{ name: "generate", rule: RATE_LIMITS.generate, by: "user" }] },
  async ({ user, body }) => {
    const result = await createGeneration(user.id, body);
    return json(result, result.created ? 202 : 200);
  },
);
