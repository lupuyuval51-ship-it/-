import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { cardKeyAction } from "@/components/game/hud/Overlays";
import { pathAfterRemove, type Path } from "@/components/game/hud/ProgramBuilder";
import { isDescribeKey } from "@/components/game/hud/SceneAnnouncer";
import { SimulationPanel, inCalmHost, leverBalanced, simStart, speedSliderMin } from "@/components/game/hud/SimulationPanel";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { LEVER_SLIDER_MIN, leverBalanceDistance, projectileRange, projectileSolution, type LeverSim, type ProjectileSim } from "@/lib/game/challenges/simulations";
import type { Challenge } from "@/lib/game/spec/schema";
import { DICTIONARIES, type Locale } from "@/lib/i18n";

/**
 * The simulation preview (lever "balanced" = the grader's rule, start values that are not already the answer and sit on the
 * slider grid, a speed slider that reaches the top speed, the game's own reduce-motion switch), the program builder's
 * insertion point after a removal, and held keys on the in-game cards and the scene description.
 */

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const panel = (sim: LeverSim | ProjectileSim, locale: Locale = "en") =>
  render(h(SimulationPanel, { challenge: { id: "x", title: "t", prompt: "p", concept: "c", level: 1, hasHint: false, type: "simulation", sim } as never, disabled: false, onChange: () => undefined }), locale);
const lever = (o: Partial<LeverSim>): LeverSim => ({ kind: "lever", leftWeight: 6, leftDistance: 4, rightWeight: 3, maxDistance: 10, tolerance: 0.25, ...o });
const projectile = (o: Partial<ProjectileSim>): ProjectileSim => ({ kind: "projectile", gravity: 9.8, targetDistance: 20, tolerance: 2, maxSpeed: 30, ...o });
const leverChallenge = (sim: LeverSim) => ({ id: "c", title: "t", prompt: "p", concept: "c", level: 1, explanation: "e", type: "simulation", sim }) as unknown as Challenge;
const graded = (sim: LeverSim, distance: number) => gradeAnswer(leverChallenge(sim), { type: "simulation", params: { distance } }, "en").correct;
const onGrid = (v: number, min: number, step: number) => Math.abs((v - min) / step - Math.round((v - min) / step)) < 1e-6;
const rangeValues = (html: string) => [...html.matchAll(/<input type="range"[^>]*?value="([^"]+)"/g)].map((m) => Number(m[1]));

describe("the lever preview says 'balanced' exactly when the grader accepts the answer", () => {
  const sims = [
    lever({}),
    lever({ leftWeight: 1, leftDistance: 5.2, rightWeight: 1, tolerance: 0.05 }), // light right weight: the old torque test said "balanced" up to 0.35 m off
    lever({ leftWeight: 100, leftDistance: 3.33, rightWeight: 100, tolerance: 0.25 }), // heavy right weight: the old test almost never said "balanced"
    lever({ leftWeight: 7, leftDistance: 2.5, rightWeight: 4, maxDistance: 6, tolerance: 2 }),
  ];
  it("agrees with gradeAnswer on every slider position", () => {
    for (const sim of sims) {
      for (let k = 0; LEVER_SLIDER_MIN + k * 0.05 <= sim.maxDistance + 1e-9; k++) {
        const d = Math.round((LEVER_SLIDER_MIN + k * 0.05) * 100) / 100;
        expect(leverBalanced(sim, d), `${JSON.stringify(sim)} at ${d}`).toBe(graded(sim, d));
      }
    }
  });

  it("does not call a wrong answer balanced (light right weight, tight tolerance)", () => {
    const sim = sims[1]!;
    const html = panel(sim);
    expect(rangeValues(html)).toEqual([5]); // 0.2 m short of the balance point at 5.2 m: the grader says wrong
    expect(graded(sim, 5)).toBe(false);
    expect(html).toContain(DICTIONARIES.en["sim.lever.leftHeavy"]);
    expect(html).not.toContain(DICTIONARIES.en["sim.lever.balanced"]);
  });

  it("calls a right answer balanced, with a level beam (heavy right weight)", () => {
    const sim = sims[2]!;
    expect(graded(sim, 3.35)).toBe(true);
    expect(leverBalanced(sim, 3.35)).toBe(true);
    expect(leverBalanced(sim, 3.65)).toBe(false);
  });
});

describe("where the simulation sliders start", () => {
  it("a lever that balances at 5 m does not start solved", () => {
    const sim = lever({ leftWeight: 30, leftDistance: 5, rightWeight: 30 }); // two equal weights: a very likely level-1 lever
    expect(leverBalanceDistance(sim)).toBe(5);
    const start = simStart(sim);
    expect(graded(sim, start.distance)).toBe(false);
    expect(start.distance).toBeGreaterThanOrEqual(LEVER_SLIDER_MIN);
    expect(start.distance).toBeLessThanOrEqual(sim.maxDistance);
    const html = panel(sim, "he");
    expect(rangeValues(html)).toEqual([start.distance]);
    expect(html).not.toContain(DICTIONARIES.he["sim.lever.balanced"]);
  });

  it("an ordinary lever still starts at 5 m, and a short one at its end, on the slider's 0.05 m grid", () => {
    expect(simStart(lever({})).distance).toBe(5);
    const short = lever({ leftWeight: 10, leftDistance: 1, rightWeight: 10, maxDistance: 3.33 });
    const d = simStart(short).distance;
    expect(d).toBe(3.3); // was 3.33: off the grid, so the thumb sat at 3.3 while 3.33 was shown and sent
    expect(onGrid(d, LEVER_SLIDER_MIN, 0.05)).toBe(true);
  });

  it("a range too short to start unbalanced keeps the old start", () => {
    const sim = lever({ leftWeight: 1, leftDistance: 1, rightWeight: 1, maxDistance: 1.5, tolerance: 2 });
    expect(simStart(sim).distance).toBe(1.5);
  });

  it("a projectile target that the half-speed 45° shot already hits starts at another speed", () => {
    const sim = projectile({ targetDistance: 23, tolerance: 2, maxSpeed: 30 }); // 15 m/s at 45° lands at 22.96 m
    expect(Math.abs(projectileRange(15, 45, sim.gravity) - 23)).toBeLessThanOrEqual(2);
    const start = simStart(sim);
    expect(start.angle).toBe(45);
    expect(start.speed).not.toBe(15);
    expect(Math.abs(projectileRange(start.speed, 45, sim.gravity) - sim.targetDistance)).toBeGreaterThan(sim.tolerance);
    expect(rangeValues(panel(sim))).toEqual([45, start.speed]);
  });

  it("an ordinary projectile still starts at 45° and half the top speed", () => {
    expect(simStart(projectile({}))).toMatchObject({ angle: 45, speed: 15 });
    expect(simStart(projectile({ maxSpeed: 25 }))).toMatchObject({ angle: 45, speed: 13 });
  });
});

describe("the speed slider reaches the top speed", () => {
  it("whole and half top speeds keep the slider from 1", () => {
    for (const maxSpeed of [5, 25, 30, 60, 22.5]) expect(speedSliderMin({ maxSpeed })).toBe(1);
  });

  it("an odd top speed lays the grid from the top, so the full-speed shot can be chosen", () => {
    const sim = projectile({ maxSpeed: 22.3, targetDistance: 52, tolerance: 2 }); // only reachable near full speed
    const min = speedSliderMin(sim);
    expect(min).toBe(1.3);
    expect(onGrid(sim.maxSpeed, min, 0.5)).toBe(true);
    // with the slider from 1 the fastest shot was 22 m/s: 49.4 m, out of the target's tolerance
    expect(Math.abs(projectileRange(22, 45, sim.gravity) - sim.targetDistance)).toBeGreaterThan(sim.tolerance);
    expect(Math.abs(projectileRange(sim.maxSpeed, 45, sim.gravity) - sim.targetDistance)).toBeLessThanOrEqual(sim.tolerance);
    expect(projectileSolution(sim).speed).toBe(sim.maxSpeed);
    const start = simStart(sim);
    expect(onGrid(start.speed, min, 0.5)).toBe(true);
    expect(panel(sim)).toContain(`min="${min}"`);
  });
});

describe("the game's own reduce-motion switch stops the flying ball", () => {
  it("is read from the play screen around the panel", () => {
    expect(inCalmHost({ closest: (s: string) => (s === ".reduce-motion" ? ({} as Element) : null) })).toBe(true);
    expect(inCalmHost({ closest: () => null })).toBe(false);
    expect(inCalmHost(null)).toBe(false);
  });

  it("without it the ball still flies", () => {
    expect(panel(projectile({}))).toContain("<animateMotion");
  });
});

describe("the program builder's insertion point after a block is removed", () => {
  it("follows its loop when an earlier block goes", () => {
    // [repeat, move, repeat*] with * the insertion point: removing the first block moves the loop to index 1
    expect(pathAfterRemove([2, "body"], [], 0)).toEqual([1, "body"]);
    expect(pathAfterRemove([2, "else", 0, "body"], [], 1)).toEqual([1, "else", 0, "body"]);
    expect(pathAfterRemove([0, "body", 3, "body"], [0, "body"], 1)).toEqual([0, "body", 2, "body"]);
  });

  it("moves up to the container that held a removed loop (or a removed parent)", () => {
    expect(pathAfterRemove([1, "body"], [], 1)).toEqual([]);
    expect(pathAfterRemove([1, "body", 0, "else"], [], 1)).toEqual([]);
    expect(pathAfterRemove([0, "body", 2, "body"], [0, "body"], 2)).toEqual([0, "body"]);
  });

  it("stays put for a later block, another container, or the top level", () => {
    const keep: [Path, Path, number][] = [
      [[0, "body"], [], 1],
      [[0, "body"], [1, "body"], 0],
      [[0, "body"], [0, "else"], 0],
      [[], [], 0],
      [[0, "body"], [0, "body"], 0],
    ];
    for (const [path, at, idx] of keep) expect(pathAfterRemove(path, at, idx)).toEqual(path);
  });
});

describe("a held key on an in-game card", () => {
  it("the first press acts, its auto-repeat only swallows the key", () => {
    for (const code of ["Enter", "Space", "KeyE"]) {
      expect(cardKeyAction(code, false, true)).toBe("next");
      expect(cardKeyAction(code, false, false)).toBe("close");
      expect(cardKeyAction(code, true, true)).toBe("hold");
      expect(cardKeyAction(code, true, false)).toBe("hold");
    }
  });

  it("Escape always closes, other keys are left alone", () => {
    expect(cardKeyAction("Escape", false, true)).toBe("close");
    expect(cardKeyAction("Escape", true, false)).toBe("close");
    expect(cardKeyAction("KeyW", false, true)).toBeNull();
    expect(cardKeyAction("Tab", true, false)).toBeNull();
  });
});

describe("the H key reads the surroundings once per press", () => {
  const key = (o: Partial<KeyboardEvent>) => ({ code: "KeyH", repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: null, ...o }) as KeyboardEvent;
  it("a press describes, its auto-repeat does not", () => {
    expect(isDescribeKey(key({}))).toBe(true);
    expect(isDescribeKey(key({ repeat: true }))).toBe(false);
  });

  it("modifiers, other keys and typing in a field are left alone", () => {
    expect(isDescribeKey(key({ ctrlKey: true }))).toBe(false);
    expect(isDescribeKey(key({ metaKey: true }))).toBe(false);
    expect(isDescribeKey(key({ altKey: true }))).toBe(false);
    expect(isDescribeKey(key({ code: "KeyJ" }))).toBe(false);
    const field = { closest: (s: string) => (s.includes("input") ? {} : null) } as unknown as EventTarget;
    expect(isDescribeKey(key({ target: field }))).toBe(false);
    const canvas = { closest: () => null } as unknown as EventTarget;
    expect(isDescribeKey(key({ target: canvas }))).toBe(true);
  });
});
