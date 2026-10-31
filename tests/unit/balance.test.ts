import { describe, expect, it } from "vitest";
import { playGame, SKILLS } from "@/lib/game/sim-balance/bot";
import { demoCorpus, engineCorpus, extendedCorpus, fuzzCorpus } from "@/lib/game/sim-balance/corpus";
import { findOutliers, median, simulate, TARGETS } from "@/lib/game/sim-balance/run";
import { estimateMinutes } from "@/lib/game/spec/estimate";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { maxScore, starsFor } from "@/lib/game/state/progress";
import { validDemoSpec } from "./helpers";

const skill = (id: string) => SKILLS.find((s) => s.id === id)!;

describe("balance bots", () => {
  it("are deterministic: same game, skill and seed give the same run", () => {
    const spec = validDemoSpec();
    expect(playGame(spec, skill("p70"), "x")).toEqual(playGame(spec, skill("p70"), "x"));
    expect(playGame(spec, skill("p40"), "x")).not.toEqual(playGame(spec, skill("p40"), "y"));
  });

  it("only send legal events (the reducer never rejects a bot)", () => {
    const spec = validDemoSpec();
    for (const s of SKILLS) expect(playGame(spec, s, "legal").rejected).toBe(0);
  });

  it("a perfect player finishes with three stars and never beats the maximum", () => {
    const r = playGame(validDemoSpec(), skill("perfect"), "p");
    expect(r.finished).toBe(true);
    expect(r.stars).toBe(3);
    expect(r.score).toBeLessThanOrEqual(r.maxScore);
    expect(r.revealed).toBe(0);
  });

  it("weaker players score less, take longer and reveal more answers", () => {
    const spec = validDemoSpec();
    const runs = ["perfect", "p70", "p40"].map((id) => median(["a", "b", "c", "d", "e"].map((seed) => playGame(spec, skill(id), seed).score)));
    expect(runs[0]!).toBeGreaterThan(runs[1]!);
    expect(runs[1]!).toBeGreaterThan(runs[2]!);
    const minutes = ["perfect", "p40"].map((id) => median(["a", "b", "c"].map((seed) => playGame(spec, skill(id), seed).minutes)));
    expect(minutes[1]!).toBeGreaterThan(minutes[0]!);
  });
});

describe("balance over the corpus", () => {
  const seeds = ["a", "b"];
  const groups = {
    engine: engineCorpus(),
    demo: demoCorpus(),
    extended: extendedCorpus(),
    fuzz: fuzzCorpus(25, "unit"),
  };
  for (const [name, items] of Object.entries(groups)) {
    it(`${name}: ${items.length} games have no stuck state, impossible stars, rejected moves or length outliers`, () => {
      expect(items.length).toBeGreaterThan(5);
      expect(findOutliers(simulate(items, seeds))).toEqual([]);
    });
  }

  it("covers both languages and both modes", () => {
    const all = [...groups.engine, ...groups.demo];
    for (const lang of ["he", "en"] as const) for (const mode of ["FAST", "FULL"] as const) expect(all.some((i) => i.lang === lang && i.mode === mode)).toBe(true);
  });

  it("stars discriminate skill: strong players mostly earn 3, weak players mostly 2 or fewer, finishing is never worth 0", () => {
    const rows = simulate([...groups.engine, ...groups.demo], seeds);
    const share = (id: string, stars: number) => {
      const runs = rows.flatMap((r) => r.runs.filter((x) => x.skill === id));
      return runs.filter((x) => x.stars === stars).length / runs.length;
    };
    expect(share("perfect", 3)).toBe(1);
    expect(share("p70", 3)).toBeGreaterThan(0.4);
    expect(share("p40", 3)).toBeLessThan(0.25);
    expect(share("p40", 0)).toBe(0);
    expect(TARGETS.perfectMinStars).toBe(3);
  });

  it("the declared length matches how long the game really takes an average learner (within 25% or 2 minutes)", () => {
    const rows = simulate([...groups.engine, ...groups.demo, ...groups.extended], ["a"]);
    for (const { item, runs } of rows) {
      const sim = median(runs.filter((r) => r.skill === "p70").map((r) => r.minutes));
      const est = item.spec.meta.estimatedMinutes;
      // whole minutes: a game of three or four minutes may be off by one rounding step
      expect(Math.abs(est - sim), `${item.id}: ${est} vs ${sim}`).toBeLessThanOrEqual(Math.max(2, 0.25 * sim));
    }
  });
});

describe("estimated minutes come from the content", () => {
  it("validateGameSpec replaces whatever the generator claimed", () => {
    const base = validDemoSpec();
    for (const claimed of [2, 18, 120]) {
      const raw = structuredClone(base);
      raw.meta.estimatedMinutes = claimed;
      const res = validateGameSpec(raw);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.spec.meta.estimatedMinutes).toBe(estimateMinutes(res.spec));
    }
  });

  it("a FAST game is shorter than a FULL game, and both are inside the schema range", () => {
    const fast = validDemoSpec({ mode: "FAST" });
    const full = validDemoSpec({ mode: "FULL" });
    expect(fast.meta.estimatedMinutes).toBeLessThan(full.meta.estimatedMinutes);
    expect(fast.meta.estimatedMinutes).toBeGreaterThanOrEqual(2);
    expect(full.meta.estimatedMinutes).toBeLessThanOrEqual(120);
  });
});

describe("one-way portals cannot strand a player", () => {
  const withOpenPortal = () => {
    const raw = structuredClone(validDemoSpec());
    const first = raw.areas.find((a) => a.portal)!;
    first.portal!.requiresMissionIds = [];
    return { raw, first };
  };

  it("a portal that opens at once is a trap for a player who walks through it (documented failure)", () => {
    const { raw } = withOpenPortal();
    const trapped = playGame(raw, skill("rusher"), "t");
    expect(trapped.stuck).toBe(true);
  });

  it("validation makes the portal wait for the area's final missions, so the same player finishes", () => {
    const { raw, first } = withOpenPortal();
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.warnings.some((w) => w.includes(`portal in area "${first.id}"`))).toBe(true);
    const sealed = res.spec.areas.find((a) => a.id === first.id)!.portal!;
    expect(sealed.requiresMissionIds.length).toBeGreaterThan(0);
    expect(playGame(res.spec, skill("rusher"), "t").finished).toBe(true);
  });

  it("a seal that would make the game unfinishable is rejected, not silently accepted", () => {
    const { raw, first } = withOpenPortal();
    // the first area's only final mission now depends on a mission that lives behind its own portal
    const here = raw.missions.filter((m) => m.areaId === first.id);
    const behind = raw.missions.find((m) => m.areaId !== first.id)!;
    for (const m of here) m.requires = [...m.requires, behind.id];
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(false);
  });
});

describe("score maximum", () => {
  it("counts the harder variant a streak unlocks, so 100% is reachable and a flawless run never exceeds it", () => {
    const spec = validDemoSpec();
    expect(spec.challenges.some((c) => c.harderId)).toBe(true);
    const run = playGame(spec, skill("perfect"), "m");
    expect(run.score).toBeLessThanOrEqual(maxScore(spec));
    expect(run.percent).toBeGreaterThan(0.9);
  });

  it("stars are never given for an unfinished game and thresholds are 60% / 85%", () => {
    expect(starsFor(1, false)).toBe(0);
    expect([starsFor(0.59, true), starsFor(0.6, true), starsFor(0.85, true)]).toEqual([1, 2, 3]);
  });
});
