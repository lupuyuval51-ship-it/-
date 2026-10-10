import { z } from "zod";
import { RATE_LIMITS } from "@/config/limits";
import { apiRoute } from "@/server/http/route";
import { startPlaySession } from "@/server/games/play";

const bodySchema = z.object({ restart: z.boolean().optional() });

/** Start or resume a play session. The response carries the render profile the SERVER granted for the user's plan. */
export const POST = apiRoute<z.infer<typeof bodySchema>, { id: string }>(
  { body: bodySchema, rateLimit: [{ name: "gameEvents", rule: RATE_LIMITS.gameEvents, by: "user" }] },
  async ({ user, params, body }) => startPlaySession(user.id, params.id, { restart: body.restart }),
);
