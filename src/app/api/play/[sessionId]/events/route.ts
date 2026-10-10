import { RATE_LIMITS } from "@/config/limits";
import { gameEventSchema, type GameEvent } from "@/lib/game/state/events";
import { apiRoute } from "@/server/http/route";
import { applyPlayEvent } from "@/server/games/play";

/** Players report what they did; the server validates it against the spec and its own state and returns the truth. */
export const POST = apiRoute<GameEvent, { sessionId: string }>(
  { body: gameEventSchema, rateLimit: [{ name: "gameEvents", rule: RATE_LIMITS.gameEvents, by: "user" }] },
  async ({ user, params, body }) => applyPlayEvent(user.id, params.sessionId, body),
);
