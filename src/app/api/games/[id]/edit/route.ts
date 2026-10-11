import { z } from "zod";
import { RATE_LIMITS } from "@/config/limits";
import { EDIT_LIMITS } from "@/lib/game/spec/edit";
import { apiRoute } from "@/server/http/route";
import { editGameWithAi } from "@/server/games/ai-edit";

const bodySchema = z.object({
  instruction: z.string().trim().min(3).max(EDIT_LIMITS.instructionChars),
  idempotencyKey: z.string().trim().min(8).max(80),
  expectedRevision: z.number().int().min(1).optional(),
});

/** Edit a saved game from a natural-language instruction (Plus and Pro). Quota and plan are enforced here. */
export const maxDuration = 300;
export const POST = apiRoute<z.infer<typeof bodySchema>, { id: string }>(
  { body: bodySchema, rateLimit: [{ name: "generation", rule: RATE_LIMITS.generate, by: "user" }] },
  async ({ user, params, body }) => editGameWithAi({ userId: user.id, gameId: params.id, instruction: body.instruction, idempotencyKey: body.idempotencyKey, expectedRevision: body.expectedRevision }),
);
