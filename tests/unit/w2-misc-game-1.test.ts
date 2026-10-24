import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { wrongAnswerFor } from "@/lib/game/sim-balance/bot";
import { toPublicSpec, type PublicSpec } from "@/lib/game/spec/public";
import type { Challenge } from "@/lib/game/spec/schema";
import { directScene } from "@/lib/game/unity/director";
import { mulberry32 } from "@/lib/game/util/prng";
import { stableStringify } from "@/lib/game/util/stable";
import { buildWorld } from "@/lib/game/world/build";
import { validDemoSpec } from "./helpers";

/** The demo game with the first area's texts replaced, so only these words can pick the scenery. */
function themed(texts: { subject: string; area: string; description: string; labels?: string[] }, language: "he" | "en" = "he"): PublicSpec {
  const pub = structuredClone(toPublicSpec(validDemoSpec()));
  pub.meta.subject = texts.subject;
  pub.meta.language = language;
  (pub.meta as { subjectCategory?: string }).subjectCategory = "other";
  const area = pub.areas[0]!;
  area.name = texts.area;
  area.description = texts.description;
  area.stations.forEach((s, i) => {
    s.label = texts.labels?.[i % texts.labels.length] ?? `${i + 1}`;
    if (s.kind === "lore") s.loreTitle = "";
  });
  return pub;
}
const motifsOf = (spec: PublicSpec) => directScene(spec, buildWorld(spec, spec.areas[0]!.id)).motifs;

describe("scene director: keywords match words, not letters inside words", () => {
  it("a Hebrew lesson full of plural words is not dressed as water (every masculine plural ends in ים)", () => {
    const spec = themed({ subject: "לולאות בפייתון", area: "כיכר התרגילים", description: "תרגילים קצרים עם משתנים ותנאים", labels: ["לולאות", "תנאים", "משתנים"] });
    const motifs = motifsOf(spec);
    expect(motifs).toContain("circuits");
    expect(motifs).not.toContain("bubbles");
  });

  it("a lesson about the cell gets the cell scenery; 'suitable' (מתאים) and 'date' (תאריך) are not cells", () => {
    expect(motifsOf(themed({ subject: "התא החי", area: "אולם הגילויים", description: "תאים, גרעין וקרום" }))).toContain("cells");
    expect(motifsOf(themed({ subject: "בחרו את המתאים", area: "אולם הגילויים", description: "תאריך ושעה" }))).not.toContain("cells");
  });

  it("whole-word stems still match with Hebrew prefixes and plurals", () => {
    expect(motifsOf(themed({ subject: "חיים בים", area: "חוף הים", description: "דגים ושוניות" }))).toContain("bubbles");
    expect(motifsOf(themed({ subject: "הלב והדם", area: "אולם הגוף", description: "" }))).toContain("cells");
  });

  it("English: 'start', 'making' and 'label' are not stars, kings or labs; 'stars' and 'kingdom' are", () => {
    const off = motifsOf(themed({ subject: "Getting started", area: "Making things", description: "Label each part before you start.", labels: ["Start"] }, "en"));
    expect(off).not.toContain("planets");
    expect(off).not.toContain("monuments");
    expect(off).not.toContain("glassware");
    expect(motifsOf(themed({ subject: "Stars and orbits", area: "Night sky", description: "" }, "en"))).toContain("planets");
    expect(motifsOf(themed({ subject: "The kingdom of Egypt", area: "Old court", description: "" }, "en"))).toContain("monuments");
  });

  it("'before' (קודם) and 'point' (נקודה) are not code", () => {
    expect(motifsOf(themed({ subject: "נקודה על הישר", area: "קודם כול", description: "", labels: ["נקודה"] }))).not.toContain("circuits");
    expect(motifsOf(themed({ subject: "קוד ותכנות", area: "כיכר הקוד", description: "" }))).toContain("circuits");
  });

  it("a station sign is cut at 40 characters without splitting an emoji", () => {
    const spec = themed({ subject: "x", area: "x", description: "", labels: [`${"a".repeat(39)}🧪 tail`] }, "en");
    const signs = directScene(spec, buildWorld(spec, spec.areas[0]!.id)).signs;
    for (const s of signs) {
      expect(s.text).toBe(`${"a".repeat(39)}🧪`);
      expect(s.text).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/);
    }
  });
});

describe("balance bot: a wrong simulation answer is graded wrong", () => {
  const lever = (sim: Record<string, number>) => ({ id: "c", type: "simulation", sim: { kind: "lever", maxDistance: 10, tolerance: 0.25, ...sim } }) as unknown as Challenge;
  const projectile = (sim: Record<string, number>) => ({ id: "c", type: "simulation", sim: { kind: "projectile", gravity: 9.8, tolerance: 2, maxSpeed: 30, ...sim } }) as unknown as Challenge;
  const graded = (ch: Challenge) => gradeAnswer(ch, wrongAnswerFor(ch, mulberry32(1)), "en");

  it("a lever that balances at 0.5 m is not 'missed' by putting the weight at 0.5 m", () => {
    const ch = lever({ leftWeight: 1, leftDistance: 1, rightWeight: 2 });
    expect(graded(ch).correct).toBe(false);
    // balance 0.75 on a 1 m lever: both 0.5 m and the far end are within the tolerance
    expect(graded(lever({ leftWeight: 3, leftDistance: 0.5, rightWeight: 2, maxDistance: 1 })).correct).toBe(false);
  });

  it("a close target with a wide tolerance is not 'missed' by a feeble lob", () => {
    expect(graded(projectile({ targetDistance: 5, tolerance: 15 })).correct).toBe(false);
  });

  it("ordinary simulations keep the usual wrong guess (the balance numbers do not move)", () => {
    expect(wrongAnswerFor(lever({ leftWeight: 4, leftDistance: 3, rightWeight: 2 }), mulberry32(1))).toEqual({ type: "simulation", params: { distance: 0.5 } });
    expect(wrongAnswerFor(projectile({ targetDistance: 40 }), mulberry32(1))).toEqual({ type: "simulation", params: { angle: 10, speed: 1 } });
  });
});

describe("stableStringify follows JSON (what jsonb stores)", () => {
  it("leaves out undefined keys, so a value equals its stored copy", () => {
    const value = { b: 1, a: undefined, c: { d: undefined, e: [1, undefined] } };
    const stored = JSON.parse(JSON.stringify(value)) as unknown;
    expect(stableStringify(value)).toBe(stableStringify(stored));
    expect(JSON.parse(stableStringify(value))).toEqual(stored);
  });

  it("honours toJSON: different dates differ, equal dates are equal", () => {
    expect(stableStringify({ at: new Date(0) })).not.toBe(stableStringify({ at: new Date(1000) }));
    expect(stableStringify({ at: new Date(0) })).toBe(stableStringify({ at: new Date(0).toISOString() }));
  });

  it("still sorts keys at every depth", () => {
    expect(stableStringify({ b: { y: 1, x: 2 }, a: [{ d: 1, c: 2 }] })).toBe('{"a":[{"c":2,"d":1}],"b":{"x":2,"y":1}}');
  });
});
