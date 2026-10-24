import { describe, expect, it } from "vitest";
import { parseMaterial } from "@/lib/game/material/parse";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

const EN = "| Planet | Moons |\n|---|---|\n| Earth | 1 |\n| Mars | 2 |\n| Jupiter | 95 |\n| Saturn | 146 |\n| Neptune | 16 |";
const HE = "| כוכב לכת | ירחים |\n|---|---|\n| כדור הארץ | 1 |\n| מאדים | 2 |\n| צדק | 95 |\n| שבתאי | 146 |";

describe("a table of numbers is material for number questions", () => {
  it("each row becomes a fact in the learner's own words", () => {
    expect(parseMaterial(EN).facts.map((f) => f.source)).toEqual(["Earth – Moons: 1", "Mars – Moons: 2", "Jupiter – Moons: 95", "Saturn – Moons: 146", "Neptune – Moons: 16"]);
  });

  for (const [name, notes, lang] of [["English", EN, "en"], ["Hebrew", HE, "he"]] as const) {
    it(`${name}: a game is built, and its number questions ask the table's own numbers`, () => {
      const { spec } = generateOffline(request({ material: notes, subject: "Planets", mode: "FAST", contentLanguage: lang }));
      expect(spec.challenges.length).toBeGreaterThanOrEqual(3);
      const numeric = spec.challenges.filter((c) => c.type === "numeric");
      expect(numeric.length).toBeGreaterThan(0);
      for (const c of numeric) if (c.type === "numeric") expect([1, 2, 95, 146, 16]).toContain(c.answer);
      // Hebrew counts one digit in the singular
      for (const c of spec.challenges) expect(c.hint ?? "", c.id).not.toMatch(/\b1 ספרות/);
    });
  }

  it("a table whose second column is words is left to the term questions", () => {
    expect(parseMaterial("| Word | Meaning |\n|---|---|\n| hola | hello |\n| gato | cat |\n| casa | house |").facts).toEqual([]);
  });
});
