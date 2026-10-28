import { describe, expect, it } from "vitest";
import { repeatsLabel } from "@/components/game/hud/result-text";
import { TOPICS } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { generateOffline } from "@/lib/offline/generate";

/** What a learner hit on 2026-10-28 (daily user check), each pinned so it stays fixed. */
describe("a right answer in the Spanish interface", () => {
  it("does not show the game's own 'Correct!' (English content) under '¡Correcto!'", () => {
    expect(repeatsLabel("Correct!", "¡Correcto!")).toBe(true);
    expect(repeatsLabel("נכון!", "¡Correcto!")).toBe(true);
    expect(repeatsLabel("Correct!", "Correct!")).toBe(true);
    // a real explanation, or a wrong answer's feedback, always stays
    expect(repeatsLabel("Correct — the numerator counts the parts.", "¡Correcto!")).toBe(false);
    expect(repeatsLabel("Not this one — think again.", "Casi")).toBe(false);
  });
});

const build = async (topicId: string, difficulty: "beginner" | "intermediate" | "advanced", lang: "he" | "en") => {
  const content = (await loadTopicContent(topicId))!;
  return generateOffline({ mode: "FULL", subject: "x", learningGoal: "x", difficulty, gameType: "adventure", contentLanguage: lang, topicId, device: "phone" }, new Date(0), "A", content).spec;
};

describe("the easier 'put in order' question", () => {
  it("explains only the steps it asks for", async () => {
    let seen = 0;
    for (const t of TOPICS.filter((x) => x.cat === "computing").slice(0, 12)) {
      for (const level of ["beginner", "intermediate", "advanced"] as const) {
        const spec = await build(t.id, level, "en");
        for (const c of spec.challenges) {
          if (c.type !== "sequence" || !c.id.endsWith("-easy")) continue;
          seen++;
          const steps = c.explanation.split(" → ");
          expect(steps.length, c.id).toBe(c.items.length);
          for (const s of steps) expect(c.items.map((i) => i.text), `${t.id}/${c.id}: ${s}`).toContain(s);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe("the hands-on task at the end of a learning-path chapter", () => {
  it("says on the card itself that it is a task", async () => {
    for (const [lang, word] of [["he", "משימה מעשית"], ["en", "Try it yourself"]] as const) {
      const spec = await build("course-fractions-1", "beginner", lang);
      const task = spec.areas.flatMap((a) => a.stations).find((s) => s.id.endsWith("-task"));
      expect(task, lang).toBeTruthy();
      expect(task!.loreTitle, lang).toMatch(new RegExp(`^${word}`, "u"));
    }
  });
});
