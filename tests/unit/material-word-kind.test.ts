import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

const NOTES = `World War II timeline
In 1939 Germany invaded Poland.
In 1941 Japan attacked Pearl Harbor.
In 1944 the Allies landed in Normandy.
In 1945 the war in Europe ended.
A democracy is a system in which citizens choose their leaders.
An alliance is an agreement between countries to help each other.
The United Nations was founded after the war to keep peace.`;

describe("wrong words are of the right word's kind (English)", () => {
  const { spec } = generateOffline(request({ material: NOTES, subject: "WWII", mode: "FULL" }));
  const choices = spec.challenges.filter((c) => c.type === "choice");

  it("a noun's gap is not offered among past-tense verbs", () => {
    for (const c of choices) {
      if (c.type !== "choice" || !c.prompt.startsWith("Which word completes")) continue;
      const right = c.options.find((o) => o.id === c.correctOptionId)!.text;
      const wrongVerbs = c.options.filter((o) => o.id !== c.correctOptionId && /ed$/.test(o.text));
      if (!/ed$/.test(right)) expect(wrongVerbs.length, `${c.id}: ${c.options.map((o) => o.text).join(", ")}`).toBeLessThan(2);
    }
  });

  it("a swapped statement does not put a verb where the noun was ('A keep is a system…')", () => {
    for (const c of choices) if (c.type === "choice") for (const o of c.options) expect(o.text, c.id).not.toMatch(/^An? (?:keep|help|choose) /);
  });
});
