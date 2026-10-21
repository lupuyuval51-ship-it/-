import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

// "Julius Caesar was assassinated in 44 BC" was offered with "0" (there is no year 0) and "476 AD" with 952 as a "close" year
const NOTES = `The Roman Empire
Julius Caesar was assassinated in 44 BC.
Aqueduct: a channel that carried water into Roman cities.
Legion: a unit of about 5,000 Roman soldiers.
Latin was the language of the Roman Empire.
The Western Roman Empire fell in 476 AD.
Senate: the council of rich and powerful Romans that advised the rulers.`;

describe("a year written with its era (BC, AD)", () => {
  it("gets other years near it as wrong options: never 0, never twice the year", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "Rome", learningGoal: "Rome", mode: "FULL" }));
    const years = spec.challenges.filter((c) => c.type === "choice" && /___ (?:BC|AD)\./.test(c.prompt));
    expect(years.length).toBeGreaterThan(0);
    for (const c of years) {
      if (c.type !== "choice") continue;
      const right = Number(c.options.find((o) => o.id === c.correctOptionId)!.text);
      for (const o of c.options) {
        const n = Number(o.text);
        expect(n, `${c.prompt}: ${o.text}`).toBeGreaterThan(0);
        // a near miss is within 20 years, unless it is the year of another fact of the notes
        if (/^Close/.test(o.feedback)) expect(Math.abs(n - right), `${c.prompt}: ${o.text}`).toBeLessThanOrEqual(20);
      }
      expect(c.hint ?? "").not.toMatch(/digit/);
    }
  });
});
