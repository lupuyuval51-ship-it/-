/**
 * "Practise only these": the questions a player missed in a session, asked again without any scoring.
 * Pure: shared by the server route and the offline app. Only challenges the player already resolved with a miss are
 * accepted, so this never releases an answer that the review screen would not already show.
 */
import { z } from "zod";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { answerSchema, gradeAnswer, revealSolution, toPublicChallenge } from "../challenges/grade";
import type { GameSpec } from "../spec/schema";
import { findChallenge, type PlayState } from "./progress";

export const practiceBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("answer"), challengeId: z.string().max(40), answer: answerSchema, attempt: z.number().int().min(1).max(MAX_ATTEMPTS_PER_CHALLENGE) }),
  z.object({ action: z.literal("hint"), challengeId: z.string().max(40) }),
]);
export type PracticeBody = z.infer<typeof practiceBodySchema>;

export class PracticeNotFound extends Error {}

export function practiceIds(state: PlayState): string[] {
  return Object.entries(state.records).filter(([, r]) => r.resolved && (r.wrong > 0 || r.revealed)).map(([id]) => id);
}

export function respondPractice(spec: GameSpec, state: PlayState, sessionId: string, body: PracticeBody) {
  const ids = practiceIds(state);
  if (body.action === "start") {
    const items = ids.flatMap((id) => {
      const ch = findChallenge(spec, id);
      return ch ? [toPublicChallenge(ch, `${sessionId}:practice`)] : [];
    });
    return { items };
  }
  if (!ids.includes(body.challengeId)) throw new PracticeNotFound("That question is not part of your review.");
  const ch = findChallenge(spec, body.challengeId)!;
  if (body.action === "hint") return { hint: ch.hint ?? null };
  const graded = gradeAnswer(ch, body.answer, spec.meta.language);
  const resolved = graded.correct || body.attempt >= MAX_ATTEMPTS_PER_CHALLENGE;
  const revealed = !graded.correct && resolved;
  return {
    result: {
      correct: graded.correct, feedback: graded.feedback, detail: graded.detail, resolved, revealed, pointsAwarded: 0,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS_PER_CHALLENGE - body.attempt),
      explanation: resolved ? ch.explanation : undefined,
      reveal: revealed ? revealSolution(ch) : undefined,
    },
  };
}
