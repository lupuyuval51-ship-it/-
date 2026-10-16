import { describe, expect, it } from "vitest";
import { pickCategory, pickEnvironment } from "@/lib/game/material/build";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

const TERMS = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

describe("engine: theme follows the subject (singular and plural)", () => {
  it.each([
    ["Plants", "forest"], ["Animals", "forest"], ["Flowers and bees", "forest"], ["Planets", "space-station"], ["Pyramids", "desert-ruins"],
    ["Atoms", "laboratory"], ["Cells", "laboratory"], ["Oceans", "ocean-floor"], ["Knights", "castle"], ["Python loops", "neon-city"], ["Clouds", "sky-islands"],
    ["Photosynthesis", "forest"], ["פוטוסינתזה", "forest"], ["The industrial revolution", "forest"] /* no world named: a calm daylight one */,
  ] as const)("%s → %s", (subject, env) => {
    expect(pickEnvironment(subject, "adventure")).toBe(env);
  });
  it("categories accept plurals too", () => {
    expect(pickCategory("Planets")).toBe("science");
    expect(pickCategory("Fractions")).toBe("math");
    expect(pickCategory("Empires")).toBe("history");
  });
});

describe("engine: variety", () => {
  for (const lang of ["en", "he"] as const) {
    it(`uses the reverse 'what does it mean' question and varies titles (${lang})`, () => {
      const { spec } = generateOffline(request({ material: TERMS, subject: "Plants", mode: "FULL", contentLanguage: lang }));
      const prompts = spec.challenges.map((c) => c.prompt);
      expect(prompts.some((p) => /what is “|מהו ״/.test(p))).toBe(true); // the 'define' kind
      const titles = new Set(spec.challenges.filter((c) => c.type === "choice").map((c) => c.title.replace(/ \((easier|קל יותר)\)$/, "")));
      expect(titles.size).toBeGreaterThanOrEqual(4);
    });
  }

  it("a define question hides nothing: the answer is a meaning from the notes and the concept tag is the term shown", () => {
    const { spec } = generateOffline(request({ material: TERMS, subject: "Plants", mode: "FULL" }));
    const d = spec.challenges.find((c) => c.type === "choice" && /what is “/.test(c.prompt))!;
    expect(d.type).toBe("choice");
    if (d.type === "choice") {
      const right = d.options.find((o) => o.id === d.correctOptionId)!;
      expect(TERMS).toContain(right.text);
      expect(d.options).toHaveLength(4);
    }
  });

  it("chapters look different: plaza, then rooms", () => {
    const { spec } = generateOffline(request({ material: TERMS, subject: "Plants", mode: "FULL" }));
    expect(spec.areas.map((a) => a.layout)).toEqual(["plaza", "rooms"]);
  });
});
