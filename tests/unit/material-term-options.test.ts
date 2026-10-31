import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

const NOTES = `The water cycle
Evaporation: water turns into vapour when the sun heats it.
Condensation: vapour cools and forms clouds.
Precipitation: water falls from clouds as rain, snow or hail.
About 97 percent of Earth's water is in the oceans.
Rivers carry water back to the sea.
In 1931 the Yangtze river flood affected millions of people.`;

describe("'which term matches' questions with three terms in the notes", () => {
  it("offer the three real terms, not a loose word of the notes as a fourth", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "The water cycle", mode: "FULL" }));
    const terms = new Set(["Evaporation", "Condensation", "Precipitation"]);
    const termQuestions = spec.challenges.filter((c) => c.type === "choice" && c.prompt.startsWith("Which term matches"));
    expect(termQuestions.length).toBeGreaterThan(0);
    for (const c of termQuestions) {
      if (c.type !== "choice") continue;
      for (const o of c.options) expect(terms.has(o.text), `${c.id}: ${o.text}`).toBe(true);
    }
  });
});
