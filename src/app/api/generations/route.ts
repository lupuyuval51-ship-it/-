import { RATE_LIMITS } from "@/config/limits";
import { createGenerationBodySchema } from "@/lib/schemas/generation";
import { apiRoute, json } from "@/server/http/route";
import { createGeneration } from "@/server/generation/service";

export const POST = apiRoute(
  { body: createGenerationBodySchema, rateLimit: [{ name: "generate", rule: RATE_LIMITS.generate, by: "user" }] },
  async ({ user, body }) => {
    const result = await createGeneration(user.id, body);
    return json(result, result.created ? 202 : 200);
  },
);
