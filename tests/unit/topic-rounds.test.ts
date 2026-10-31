import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { topicRound } from "@/lib/game/topics/build";
import { TOPICS } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { GenerationRequest } from "@/lib/schemas/generation";

// A level holds 8 or more items, a game shows a few: every game of a topic at a level used to show the same ones.
const req = (topicId: string, over: Partial<GenerationRequest> = {}): GenerationRequest => ({
  mode: "FULL", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", topicId, ...over,
});
const prompts = (spec: { challenges: { id: string; prompt: string }[] }) => spec.challenges.filter((c) => /^c-\d+$/.test(c.id)).map((c) => c.prompt);

describe("the next game of a topic at the same level", () => {
  it("starts with the questions the previous game did not show, and every round is a valid game", async () => {
    let changed = 0, measured = 0;
    for (const entry of TOPICS.filter((_, i) => i % 23 === 0)) {
      const content = (await loadTopicContent(entry.id))!;
      for (const difficulty of ["beginner", "advanced"] as const) for (const mode of ["FULL", "FAST"] as const) {
        const rounds = [0, 1, 2, 3].map((round) => generateOffline(req(entry.id, { difficulty, mode }), new Date(), "A", content, round).spec);
        const [first, second] = [prompts(rounds[0]!), prompts(rounds[1]!)];
        measured++;
        if (second.some((p) => !first.includes(p))) changed++;
        // the same round is the same game
        expect(prompts(generateOffline(req(entry.id, { difficulty, mode }), new Date(), "A", content, 1).spec)).toEqual(second);
      }
    }
    expect(measured).toBeGreaterThan(30);
    expect(changed / measured).toBeGreaterThan(0.9);
  });

  it("every topic and level builds a valid game in the next rounds too", async () => {
    for (const entry of TOPICS) {
      const content = (await loadTopicContent(entry.id))!;
      for (const difficulty of ["beginner", "intermediate", "advanced"] as const) for (const round of [1, 2]) {
        expect(() => generateOffline(req(entry.id, { difficulty, contentLanguage: round === 1 ? "he" : "en" }), new Date(), "A", content, round), `${entry.id} ${difficulty} ${round}`).not.toThrow();
      }
    }
  }, 240_000);

  it("is counted per topic and level from the games already kept", () => {
    const games = [{ templateId: "a", difficulty: "beginner" }, { templateId: "a", difficulty: "beginner" }, { templateId: "a", difficulty: "advanced" }, { templateId: "b", difficulty: "beginner" }, {}];
    expect(topicRound(games, "a", "beginner")).toBe(2);
    expect(topicRound(games, "a", "advanced")).toBe(1);
    expect(topicRound(games, "c", "beginner")).toBe(0);
  });
});
