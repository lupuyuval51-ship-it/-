/**
 * "Review your mistakes": for every challenge the player resolved after at least one wrong attempt (or with the answer
 * revealed), the question, the right answer and the explanation. Only resolved challenges are included, so nothing is
 * released that the play flow would not have shown already.
 */
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import type { Block, Challenge, GameSpec } from "../spec/schema";
import { findChallenge, type PlayState } from "./progress";

export interface ReviewItem {
  challengeId: string;
  title: string;
  concept: string;
  prompt: string;
  /** The correct answer as readable text (null for programs and simulations, whose explanation says it all). */
  answer: string | null;
  explanation: string;
  wrong: number;
  hints: number;
  revealed: boolean;
}

const blockLines = (b: Block, depth = 0): string[] => {
  const pad = "  ".repeat(depth);
  if (b.t === "repeat") return [`${pad}repeat ×${b.n}`, ...b.body.flatMap((x) => blockLines(x, depth + 1))];
  if (b.t === "if") return [`${pad}if path clear`, ...b.body.flatMap((x) => blockLines(x, depth + 1)), ...(b.else.length ? [`${pad}else`, ...b.else.flatMap((x) => blockLines(x, depth + 1))] : [])];
  return [`${pad}${b.t === "move" ? "move" : b.t === "left" ? "turn left" : "turn right"}`];
};

export function answerText(ch: Challenge): string | null {
  switch (ch.type) {
    case "choice": return ch.options.find((o) => o.id === ch.correctOptionId)?.text ?? null;
    case "numeric": return `${ch.answer}${ch.unit ? ` ${ch.unit}` : ""}`;
    case "sequence": return ch.items.map((i, n) => `${n + 1}. ${i.text}`).join("\n");
    case "match": return ch.pairs.map((p) => `${p.left} → ${p.right}`).join("\n");
    case "program": return ch.solution.flatMap((b) => blockLines(b)).join("\n");
    case "simulation": return null;
  }
}

export function buildReview(spec: GameSpec, state: PlayState): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const [cid, rec] of Object.entries(state.records)) {
    if (!rec.resolved || (rec.wrong === 0 && !rec.revealed)) continue;
    const ch = findChallenge(spec, cid);
    if (!ch) continue;
    out.push({ challengeId: cid, title: ch.title, concept: ch.concept, prompt: ch.prompt, answer: answerText(ch), explanation: ch.explanation, wrong: rec.wrong, hints: rec.hints, revealed: rec.revealed });
  }
  // the ones that needed the answer revealed come first, then by number of misses
  return out.sort((a, b) => Number(b.revealed) - Number(a.revealed) || b.wrong - a.wrong);
}

export const MAX_ATTEMPTS = MAX_ATTEMPTS_PER_CHALLENGE;
