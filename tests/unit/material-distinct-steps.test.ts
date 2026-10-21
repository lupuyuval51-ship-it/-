import { describe, expect, it } from "vitest";
import { buildMaterialSpec } from "@/lib/game/material/build";
import { request } from "./helpers";

/** A sequence whose items read the same cannot be put in order: the player could only guess which copy goes where. */
function sequences(material: string) {
  const spec = buildMaterialSpec(request({ material, subject: "Steps", contentLanguage: "en", mode: "FULL" } as never) as never).raw as { challenges: { type: string }[] };
  return spec.challenges.filter((c) => c.type === "sequence") as unknown as { items: { text: string }[] }[];
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

describe("study engine: ordering questions only from distinct steps", () => {
  it("a repetitive list of steps gives no ordering question with copies in it", () => {
    const notes = `How to bake bread:\n1. Mix the flour and water\n2. Mix the flour and water\n3. Knead the dough\n4. Knead the dough\n\nYeast makes the dough rise because it releases carbon dioxide.\nBread is baked at about 220 degrees for 30 minutes.\nFlour is ground wheat and it holds the gluten that traps the gas.`;
    let built: ReturnType<typeof sequences> = [];
    try { built = sequences(notes); } catch { /* refusing the material is fine too */ }
    for (const s of built) expect(new Set(s.items.map((i) => norm(i.text))).size).toBe(s.items.length);
  });

  it("repeats are dropped but a list with three different steps still becomes a question", () => {
    const notes = `How a seed grows:\n1. The seed takes in water\n2. The seed takes in water\n3. A root grows down\n4. A shoot grows up toward the light\n\nPlants make food by photosynthesis in their leaves.\nA seed needs water, air and warmth to germinate.\nRoots hold the plant in the soil and take in minerals.`;
    const seqs = sequences(notes);
    const steps = seqs.find((s) => s.items.some((i) => /root grows down/i.test(i.text)));
    expect(steps).toBeDefined();
    expect(steps!.items.map((i) => norm(i.text))).toEqual(["the seed takes in water", "a root grows down", "a shoot grows up toward the light"]);
  });

  it("signs still count: steps that differ only by a symbol are different steps", () => {
    const notes = `Solve the inequality:\n1. Write x + 2 > 6\n2. Write x + 2 < 6\n3. Subtract 2 from both sides\n\nAn inequality compares two amounts.\nThe sign stays the same when you subtract a number from both sides.\nMultiplying by a negative number flips the sign.`;
    const steps = sequences(notes).find((s) => s.items.some((i) => /subtract 2/i.test(i.text)));
    expect(steps?.items).toHaveLength(3);
  });
});
