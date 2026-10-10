import { z } from "zod";
import { RATE_LIMITS } from "@/config/limits";
import { apiRoute } from "@/server/http/route";
import { deleteGame, editGame, getGameDetails } from "@/server/games/library";

const editSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  timeOfDay: z.enum(["day", "dusk", "night"]).optional(),
  mechanics: z.object({ adaptive_difficulty: z.boolean(), timed_bonus: z.boolean(), hazards: z.boolean(), checkpoints: z.boolean() }).partial().optional(),
});

export const GET = apiRoute<undefined, { id: string }>({}, async ({ user, params }) => getGameDetails(user.id, params.id));

export const PATCH = apiRoute<z.infer<typeof editSchema>, { id: string }>(
  { body: editSchema, rateLimit: [{ name: "account", rule: RATE_LIMITS.account, by: "user" }] },
  async ({ user, params, body }) => editGame(user.id, params.id, body),
);

export const DELETE = apiRoute<undefined, { id: string }>({}, async ({ user, params }) => {
  await deleteGame(user.id, params.id);
  return { ok: true };
});
