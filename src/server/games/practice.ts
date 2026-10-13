import "server-only";
import type { GameSpec } from "@/lib/game/spec/schema";
import { PracticeNotFound, respondPractice, type PracticeBody } from "@/lib/game/state/practice";
import type { PlayState } from "@/lib/game/state/progress";
import { db } from "../db";
import { answerSeed } from "./answer-seed";
import { Errors } from "../http/errors";

export { practiceBodySchema, type PracticeBody } from "@/lib/game/state/practice";

/** Server side of "Practise only these": the logic is shared with the offline app (`@/lib/game/state/practice`). */
export async function handlePractice(userId: string, sessionId: string, body: PracticeBody) {
  const session = await db.playSession.findFirst({ where: { id: sessionId, userId }, include: { game: true } });
  if (!session || session.game.deletedAt) throw Errors.notFound("Session not found.");
  try {
    return respondPractice(session.game.spec as unknown as GameSpec, session.state as unknown as PlayState, answerSeed(sessionId), body);
  } catch (e) {
    if (e instanceof PracticeNotFound) throw Errors.notFound(e.message);
    throw e;
  }
}
