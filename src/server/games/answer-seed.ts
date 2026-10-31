import "server-only";
import { createHmac } from "node:crypto";
import { getEnv } from "../env";

/**
 * The seed behind a session's shuffles and opaque answer ids (`toPublicChallenge`). The session id is known to the
 * player, so the seed is an HMAC of it under a server-side secret: without it, nobody can recompute which opaque id
 * stands for which option. `ANSWER_SEED_SECRET` is preferred; without it the secret is derived from DATABASE_URL, which
 * is stable across server instances and never leaves the server.
 */
export function answerSeed(sessionId: string): string {
  const env = getEnv();
  const key = env.ANSWER_SEED_SECRET ?? `answer-seed:${env.DATABASE_URL}`;
  return createHmac("sha256", key).update(`play:${sessionId}`).digest("hex").slice(0, 32);
}
