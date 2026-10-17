import { RATE_LIMITS } from "@/config/limits";
import { apiRoute } from "@/server/http/route";
import { handlePractice, practiceBodySchema, type PracticeBody } from "@/server/games/practice";

export const POST = apiRoute<PracticeBody, { sessionId: string }>(
  { body: practiceBodySchema, rateLimit: [{ name: "gameEvents", rule: RATE_LIMITS.gameEvents, by: "user" }] },
  async ({ user, params, body }) => handlePractice(user.id, params.sessionId, body),
);
