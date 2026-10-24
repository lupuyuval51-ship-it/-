import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { fitForDevice } from "@/lib/game/spec/device";
import type { GameSpec } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";
import { buildWorld } from "@/lib/game/world/build";
import { fastPrompt } from "@/server/ai/prompts";
import { generationRequestSchema } from "@/lib/schemas/generation";

/** The corpus as shipped, plus a "hard on a phone" variant of each game (large areas, high hazards, moving platforms, short timers, many collectibles). */
function variants(): { id: string; spec: GameSpec }[] {
  const out: { id: string; spec: GameSpec }[] = [];
  for (const c of [...demoCorpus(), ...engineCorpus()]) {
    const base = addFinalBoss(c.spec).spec;
    out.push({ id: c.id, spec: base });
    const hard = structuredClone(base);
    hard.mechanics = [...new Set([...hard.mechanics, "moving_platforms" as const, "hazards" as const])];
    hard.areas.forEach((a, i) => {
      a.size = "large";
      a.hazardLevel = "high";
      a.collectibles.count = 12;
      if (i === 0) a.layout = "terraces";
    });
    hard.challenges.forEach((ch, i) => { if (i % 2 === 0) ch.timeLimitSec = 20; });
    const checked = validateGameSpec(hard);
    if (checked.ok) out.push({ id: `${c.id}+hard`, spec: checked.spec });
  }
  return out;
}

const content = (s: GameSpec) => JSON.stringify({
  challenges: s.challenges.map(({ timeLimitSec: _t, ...rest }) => rest),
  missions: s.missions.map((m) => ({ id: m.id, objectives: m.objectives })),
  bosses: s.bosses,
});

describe("fitForDevice", () => {
  const all = variants();

  it("leaves a desktop game untouched", () => {
    for (const v of all.slice(0, 10)) expect(fitForDevice(v.spec, "desktop")).toEqual({ spec: v.spec, changed: false, notes: [] });
  });

  it("phone games are valid, finishable and buildable, and keep every challenge, answer, mission and boss", () => {
    expect(all.length).toBeGreaterThan(40);
    let changed = 0;
    for (const v of all) {
      const fit = fitForDevice(v.spec, "phone");
      if (fit.changed) changed += 1;
      expect(validateGameSpec(fit.spec, { alignGameType: v.spec.meta.gameType }).ok, v.id).toBe(true);
      expect(content(fit.spec), v.id).toBe(content(v.spec));
      expect(fit.spec.meta.generator, v.id).toEqual(v.spec.meta.generator);
      for (const a of fit.spec.areas) expect(() => buildWorld(fit.spec, a.id), `${v.id}/${a.id}`).not.toThrow();
    }
    expect(changed).toBeGreaterThan(all.length / 3);
  });

  it("removes what is hard with a thumb and never makes anything harder", () => {
    const sizes = { small: 0, medium: 1, large: 2 } as const;
    const hazards = { none: 0, low: 1, high: 2 } as const;
    for (const v of all.filter((x) => x.id.endsWith("+hard"))) {
      const fit = fitForDevice(v.spec, "phone").spec;
      expect(fit.mechanics, v.id).not.toContain("moving_platforms");
      fit.areas.forEach((a, i) => {
        const before = v.spec.areas[i]!;
        expect(a.hazardLevel).not.toBe("high");
        expect(sizes[a.size]).toBeLessThanOrEqual(sizes[before.size]);
        expect(hazards[a.hazardLevel]).toBeLessThanOrEqual(hazards[before.hazardLevel]);
        expect(a.collectibles.count).toBeLessThanOrEqual(Math.max(8, before.collectibles.count === 0 ? 0 : 8));
        if (a.layout === "terraces") expect(a.size).toBe("small");
      });
      fit.challenges.forEach((c, i) => {
        const before = v.spec.challenges[i]!;
        if (before.timeLimitSec) expect(c.timeLimitSec!).toBeGreaterThanOrEqual(Math.max(30, before.timeLimitSec));
      });
    }
  });

  it("keeps enough collectibles for every collect objective", () => {
    for (const v of all) {
      const fit = fitForDevice(v.spec, "phone").spec;
      for (const m of fit.missions) for (const o of m.objectives) {
        if (o.type === "collect") expect(fit.areas.find((a) => a.id === m.areaId)!.collectibles.count, v.id).toBeGreaterThanOrEqual(o.count);
      }
    }
  });
});

describe("the AI is told when the game is for a phone", () => {
  const base = { mode: "FAST", subject: "Fractions", learningGoal: "Fractions", difficulty: "beginner", gameType: "puzzle", contentLanguage: "en" } as const;
  it("adds the phone rules only for a phone request", () => {
    expect(fastPrompt(generationRequestSchema.parse({ ...base, device: "phone" }))).toContain("Device: a PHONE");
    expect(fastPrompt(generationRequestSchema.parse({ ...base, device: "desktop" }))).not.toContain("Device: a PHONE");
    expect(fastPrompt(generationRequestSchema.parse(base))).not.toContain("Device: a PHONE");
  });
  it("rejects an unknown device value", () => {
    expect(generationRequestSchema.safeParse({ ...base, device: "fridge" }).success).toBe(false);
  });
});
