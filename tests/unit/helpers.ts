import { revealSolution, type Answer } from "@/lib/game/challenges/grade";
import { GAME_TYPES, type GameType } from "@/lib/game/spec/constants";
import type { Challenge, GameSpec } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { buildDemoSpec } from "@/lib/game/demo";
import type { GenerationRequest } from "@/lib/schemas/generation";

export function request(over: Partial<GenerationRequest> = {}): GenerationRequest {
  return { mode: "FULL", subject: "Python loops", learningGoal: "Understand variables, conditions and loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", ...over };
}

export function validDemoSpec(over: Partial<GenerationRequest> = {}): GameSpec {
  const req = request(over);
  const { raw } = buildDemoSpec(req);
  const res = validateGameSpec(raw, { alignGameType: req.gameType });
  if (!res.ok) throw new Error(`demo spec invalid: ${res.errors.join("; ")}`);
  return res.spec;
}

/** The correct answer for any challenge, derived from the server's own reveal logic. */
export function correctAnswer(ch: Challenge): Answer {
  const r = revealSolution(ch) as Record<string, unknown>;
  switch (ch.type) {
    case "choice": return { type: "choice", optionId: r.optionId as string };
    case "numeric": return { type: "numeric", value: r.value as number };
    case "sequence": return { type: "sequence", order: r.order as string[] };
    case "match": return { type: "match", pairs: r.pairs as { leftId: string; rightId: string }[] };
    case "program": return { type: "program", program: r.program as never };
    case "simulation": return { type: "simulation", params: r.params as Record<string, number> };
  }
}

export function wrongAnswer(ch: Challenge): Answer {
  switch (ch.type) {
    case "choice": return { type: "choice", optionId: ch.options.find((o) => o.id !== ch.correctOptionId)!.id };
    case "numeric": return { type: "numeric", value: ch.answer + ch.tolerance + 12345 };
    case "sequence": return { type: "sequence", order: [...ch.items.map((i) => i.id)].reverse() };
    case "match": return { type: "match", pairs: ch.pairs.map((p, i) => ({ leftId: p.id, rightId: ch.pairs[(i + 1) % ch.pairs.length]!.id })) };
    case "program": return { type: "program", program: [{ t: "left" }] };
    case "simulation": return { type: "simulation", params: ch.sim.kind === "projectile" ? { angle: 10, speed: 1 } : { distance: 0.5 } };
  }
}

/** A subject that selects each demo template by keyword. */
export const PACK_SUBJECT: Record<string, string> = {
  programming: "python loops",
  math: "fractions and equations",
  science: "physics and energy",
  history: "ancient Egypt",
  language: "Spanish greetings",
};

export const ALL_GAME_TYPES: readonly GameType[] = GAME_TYPES;
