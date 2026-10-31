import { describe, expect, it } from "vitest";
import { gradeAnswer, revealSolution } from "@/lib/game/challenges/grade";
import { msg } from "@/lib/game/challenges/messages";
import {
  ANGLE_RANGE, LEVER_SLIDER_MIN, leverBalanceDistance, leverSolvable, leverTorque, projectilePath, projectileRange, projectileSolution, projectileSolvable,
  type LeverSim, type ProjectileSim,
} from "@/lib/game/challenges/simulations";
import { simulationChallenge, type SimulationChallenge } from "@/lib/game/spec/schema";
import { mulberry32 } from "@/lib/game/util/prng";

/** The two physics puzzles: pure formulas shared by the grader, the validator (solvability) and the drawing. */

const wrap = (sim: Record<string, unknown>): SimulationChallenge =>
  simulationChallenge.parse({ id: "c-sim", type: "simulation", title: "Puzzle", prompt: "Solve it.", concept: "physics", level: 2, explanation: "Physics.", sim });
const proj = (o: Partial<ProjectileSim> = {}): ProjectileSim => ({ kind: "projectile", gravity: 10, targetDistance: 40, tolerance: 2, maxSpeed: 30, ...o });
const lev = (o: Partial<LeverSim> = {}): LeverSim => ({ kind: "lever", leftWeight: 6, leftDistance: 4, rightWeight: 8, maxDistance: 10, tolerance: 0.25, ...o });
const gradeSim = (ch: SimulationChallenge, params: Record<string, number>, lang: "en" | "he" = "en") => gradeAnswer(ch, { type: "simulation", params }, lang);

describe("projectile range", () => {
  it("is v squared over g at 45 degrees, the longest shot for a speed", () => {
    expect(projectileRange(20, 45, 10)).toBeCloseTo(40, 10);
    expect(projectileRange(20, 45, 9.8)).toBeCloseTo(400 / 9.8, 10);
    for (const a of [5, 15, 30, 40, 44, 46, 60, 85]) expect(projectileRange(20, a, 10)).toBeLessThan(projectileRange(20, 45, 10));
  });

  it("two angles that add up to 90 degrees land in the same place", () => {
    for (const a of [10, 20, 30, 40]) expect(projectileRange(25, a, 9.8)).toBeCloseTo(projectileRange(25, 90 - a, 9.8), 9);
  });

  it("grows with the square of the speed and shrinks with gravity", () => {
    expect(projectileRange(20, 30, 10)).toBeCloseTo(4 * projectileRange(10, 30, 10), 9);
    expect(projectileRange(20, 30, 20)).toBeCloseTo(projectileRange(20, 30, 10) / 2, 9);
  });

  it("is 0 straight up and flat on the ground (the angle range of the slider stays clear of both)", () => {
    expect(projectileRange(20, 0, 10)).toBeCloseTo(0, 10);
    expect(projectileRange(20, 90, 10)).toBeCloseTo(0, 10);
    expect(ANGLE_RANGE).toEqual({ min: 5, max: 85 });
  });
});

describe("projectile path (the arc that is drawn)", () => {
  it("starts at the launch point and ends on the ground exactly where the range formula says", () => {
    const path = projectilePath(20, 45, 10);
    expect(path).toHaveLength(41);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    const end = path[path.length - 1]!;
    expect(end.x).toBeCloseTo(projectileRange(20, 45, 10), 9);
    expect(end.y).toBeCloseTo(0, 9);
  });

  it("rises to the textbook height, never dips under the ground, and moves forward steadily", () => {
    const v = 25, a = 60, g = 9.8;
    const path = projectilePath(v, a, g, 100);
    expect(path).toHaveLength(101);
    const apex = Math.max(...path.map((p) => p.y));
    const expected = (v * Math.sin((a * Math.PI) / 180)) ** 2 / (2 * g);
    expect(apex).toBeCloseTo(expected, 1);
    for (const p of path) expect(p.y).toBeGreaterThan(-1e-9);
    for (let i = 1; i < path.length; i++) expect(path[i]!.x).toBeGreaterThan(path[i - 1]!.x);
  });

  it("takes the number of samples asked for", () => {
    expect(projectilePath(20, 45, 10, 4)).toHaveLength(5);
    expect(projectilePath(20, 45, 10, 1)).toHaveLength(2);
  });
});

describe("projectile solvability and the reference shot", () => {
  it("is solvable when the longest shot, with the margin, reaches the target (the edge counts)", () => {
    // at 30 m/s and g = 10 the longest shot is 90 m
    expect(projectileSolvable(proj({ targetDistance: 90, tolerance: 0.5 }))).toBe(true);
    expect(projectileSolvable(proj({ targetDistance: 92, tolerance: 2 }))).toBe(true); // 90 + 2 >= 92
    expect(projectileSolvable(proj({ targetDistance: 92.01, tolerance: 2 }))).toBe(false);
    expect(projectileSolvable(proj({ targetDistance: 200 }))).toBe(false);
  });

  it("the reference shot is at 45 degrees, with the speed that lands on the target, to two decimals", () => {
    expect(projectileSolution(proj({ targetDistance: 40, gravity: 10 }))).toEqual({ angle: 45, speed: 20 });
    expect(projectileSolution(proj({ targetDistance: 25, gravity: 9.8 }))).toEqual({ angle: 45, speed: 15.65 });
  });

  it("a target that is only inside the margin of the longest shot is hit at full speed, never above it", () => {
    const sim = proj({ targetDistance: 92, tolerance: 2 });
    expect(projectileSolution(sim)).toEqual({ angle: 45, speed: 30 });
  });
});

describe("grading a projectile", () => {
  const ch = wrap(proj({ targetDistance: 40, tolerance: 2 }));

  it("a hit inside the margin is right, with the distance in the message; a miss tells which way and by how much", () => {
    const hit = gradeSim(ch, { angle: 45, speed: 20 });
    expect(hit.correct).toBe(true);
    expect(hit.feedback).toBe(msg("en", "simProjHit", { r: 40 }));
    expect(hit.detail).toEqual({ range: expect.closeTo(40, 9) });

    const short = gradeSim(ch, { angle: 45, speed: 15 }); // 22.5 m
    expect(short.correct).toBe(false);
    expect(short.feedback).toBe(msg("en", "simProjShort", { d: 17.5, r: 22.5 }));

    const long = gradeSim(ch, { angle: 45, speed: 25 }); // 62.5 m
    expect(long.correct).toBe(false);
    expect(long.feedback).toBe(msg("en", "simProjLong", { d: 22.5, r: 62.5 }));
    expect(gradeSim(ch, { angle: 45, speed: 25 }, "he").feedback).toBe(msg("he", "simProjLong", { d: 22.5, r: 62.5 }));
  });

  it("another angle with the same range is right too (the flat and the high shot)", () => {
    expect(gradeSim(ch, { angle: 30, speed: Math.sqrt(400 / Math.sin(Math.PI / 3)) }).correct).toBe(true);
    expect(gradeSim(ch, { angle: 60, speed: Math.sqrt(400 / Math.sin(Math.PI / 3)) }).correct).toBe(true);
  });

  it("the margin is inclusive, even when floating point puts the range a hair over it", () => {
    // 38 m and 42 m are exactly 2 m from the target: 38 = v^2 / 10 at 45 degrees
    expect(gradeSim(ch, { angle: 45, speed: Math.sqrt(380) }).correct).toBe(true);
    expect(gradeSim(ch, { angle: 45, speed: Math.sqrt(420) }).correct).toBe(true);
    expect(gradeSim(ch, { angle: 45, speed: Math.sqrt(379) }).correct).toBe(false);
    expect(gradeSim(ch, { angle: 45, speed: Math.sqrt(421) }).correct).toBe(false);
  });

  it("a shot the sliders cannot make is an unreadable answer, not a wrong one", () => {
    const invalid = { correct: false, feedback: msg("en", "invalidAnswer") };
    expect(gradeSim(ch, { angle: 45 })).toEqual(invalid); // no speed
    expect(gradeSim(ch, { speed: 20 })).toEqual(invalid); // no angle
    expect(gradeSim(ch, {})).toEqual(invalid);
    expect(gradeSim(ch, { angle: 4.99, speed: 20 })).toEqual(invalid);
    expect(gradeSim(ch, { angle: 85.01, speed: 20 })).toEqual(invalid);
    expect(gradeSim(ch, { angle: 45, speed: 0 })).toEqual(invalid);
    expect(gradeSim(ch, { angle: 45, speed: -5 })).toEqual(invalid);
    expect(gradeSim(ch, { angle: 45, speed: 30.01 })).toEqual(invalid); // above the puzzle's own maxSpeed
    expect(gradeSim(ch, { distance: 3 })).toEqual(invalid); // a lever answer to a projectile puzzle
  });

  it("the ends of the allowed ranges are allowed: 5 and 85 degrees, and exactly maxSpeed", () => {
    expect(gradeSim(ch, { angle: 5, speed: 30 }).feedback).not.toBe(msg("en", "invalidAnswer"));
    expect(gradeSim(ch, { angle: 85, speed: 30 }).feedback).not.toBe(msg("en", "invalidAnswer"));
    expect(gradeSim(ch, { angle: 45, speed: 30 }).feedback).not.toBe(msg("en", "invalidAnswer"));
  });

  it("extra numbers in the answer are ignored", () => {
    expect(gradeSim(ch, { angle: 45, speed: 20, distance: 99 }).correct).toBe(true);
  });
});

describe("lever balance", () => {
  it("balances where weight times distance is equal on both sides", () => {
    expect(leverBalanceDistance(lev())).toBe(3); // 6 * 4 / 8
    expect(leverBalanceDistance(lev({ leftWeight: 10, leftDistance: 2, rightWeight: 10 }))).toBe(2);
    expect(leverTorque(lev(), 3)).toBe(0);
  });

  it("the torque is positive while the left side is heavier (the seesaw tips left) and negative once the right is", () => {
    expect(leverTorque(lev(), 2)).toBe(24 - 16);
    expect(leverTorque(lev(), 5)).toBe(24 - 40);
    expect(leverTorque(lev(), 2)).toBeGreaterThan(0);
    expect(leverTorque(lev(), 5)).toBeLessThan(0);
  });

  it("is solvable when the balance point is on the lever, within reach of the slider", () => {
    expect(LEVER_SLIDER_MIN).toBe(0.5);
    expect(leverSolvable(lev())).toBe(true);
    expect(leverSolvable(lev({ maxDistance: 3 }))).toBe(true); // the end of the lever counts
    expect(leverSolvable(lev({ maxDistance: 2.99 }))).toBe(false);
    // too close to the pivot to place a weight there
    expect(leverSolvable(lev({ leftWeight: 1, leftDistance: 0.5, rightWeight: 4 }))).toBe(false); // 0.125 m
    // a balance point below the slider's start (0.5 m) is reachable only when the margin covers the gap: 0.25 m is 0.25 m short of it
    expect(leverSolvable(lev({ leftWeight: 1, leftDistance: 1, rightWeight: 4, tolerance: 0.25 }))).toBe(true);
    expect(leverSolvable(lev({ leftWeight: 1, leftDistance: 1, rightWeight: 4, tolerance: 0.2 }))).toBe(false);
    expect(leverSolvable(lev({ leftWeight: 1, leftDistance: 1, rightWeight: 2, tolerance: 0.05 }))).toBe(true); // 0.5 m: exactly where the slider starts
  });

  it("the margin is inclusive, as in a numeric answer", () => {
    // balance 2.1: the slider steps by 0.05, so 2.0 and 2.2 are on the edge of a 0.1 margin
    const ch = wrap(lev({ leftWeight: 7, leftDistance: 3, rightWeight: 10, tolerance: 0.1 }));
    expect(gradeSim(ch, { distance: 2.0 }).correct).toBe(true);
    expect(gradeSim(ch, { distance: 2.2 }).correct).toBe(true);
    expect(gradeSim(ch, { distance: 1.95 }).correct).toBe(false);
  });
});

describe("grading a lever", () => {
  const ch = wrap(lev({ leftWeight: 6, leftDistance: 4, rightWeight: 8, maxDistance: 10, tolerance: 0.25 }));

  it("the balance point is right, and so is anything inside the margin", () => {
    expect(gradeSim(ch, { distance: 3 })).toEqual({ correct: true, feedback: msg("en", "simLevBalanced"), detail: { torque: 0 } });
    expect(gradeSim(ch, { distance: 3.25 }).correct).toBe(true);
    expect(gradeSim(ch, { distance: 2.75 }).correct).toBe(true);
    expect(gradeSim(ch, { distance: 3.3 }).correct).toBe(false);
  });

  it("a miss says which side is too heavy, and the torque in the detail has the sign the seesaw needs", () => {
    const near = gradeSim(ch, { distance: 2 }); // right weight too close: left still heavier
    expect(near.correct).toBe(false);
    expect(near.feedback).toBe(msg("en", "simLevHeavyLeft"));
    expect((near.detail as { torque: number }).torque).toBeGreaterThan(0);
    const far = gradeSim(ch, { distance: 5 });
    expect(far.feedback).toBe(msg("en", "simLevHeavyRight"));
    expect((far.detail as { torque: number }).torque).toBeLessThan(0);
    expect(gradeSim(ch, { distance: 5 }, "he").feedback).toBe(msg("he", "simLevHeavyRight"));
  });

  it("a distance off the lever is an unreadable answer", () => {
    const invalid = { correct: false, feedback: msg("en", "invalidAnswer") };
    expect(gradeSim(ch, {})).toEqual(invalid);
    expect(gradeSim(ch, { distance: 0 })).toEqual(invalid);
    expect(gradeSim(ch, { distance: -1 })).toEqual(invalid);
    expect(gradeSim(ch, { distance: 10.01 })).toEqual(invalid);
    expect(gradeSim(ch, { angle: 45, speed: 20 })).toEqual(invalid);
    // the far end of the lever is a place a weight can hang
    expect(gradeSim(ch, { distance: 10 }).feedback).toBe(msg("en", "simLevHeavyRight"));
  });
});

describe("the reference solution of a physics puzzle is accepted by the grader (random puzzles)", () => {
  it("every solvable lever: the balance point to two decimals is right", () => {
    const rnd = mulberry32(2024);
    const pick = (lo: number, hi: number, step: number) => Math.min(hi, Math.round((lo + Math.floor(rnd() * Math.floor((hi - lo) / step + 1)) * step) * 1000) / 1000);
    let solvable = 0;
    for (let i = 0; i < 2000; i++) {
      const sim = lev({ leftWeight: pick(1, 100, 1), leftDistance: pick(0.5, 10, 0.5), rightWeight: pick(1, 100, 1), maxDistance: pick(1, 20, 1), tolerance: pick(0.05, 2, 0.05) });
      if (!leverSolvable(sim)) continue;
      solvable++;
      const ch = wrap(sim);
      const reveal = revealSolution(ch) as { params: Record<string, number> };
      expect(gradeSim(ch, reveal.params).correct, JSON.stringify(sim)).toBe(true);
    }
    expect(solvable).toBeGreaterThan(500);
  });

  it("every solvable projectile: the reference shot, at most maxSpeed, hits", () => {
    const rnd = mulberry32(99);
    const pick = (lo: number, hi: number, step: number) => Math.min(hi, Math.round((lo + Math.floor(rnd() * Math.floor((hi - lo) / step + 1)) * step) * 1000) / 1000);
    let solvable = 0;
    for (let i = 0; i < 2000; i++) {
      const sim = proj({ gravity: pick(1, 25, 0.1), targetDistance: pick(5, 200, 0.5), tolerance: pick(0.5, 15, 0.5), maxSpeed: pick(5, 60, 1) });
      if (!projectileSolvable(sim)) continue;
      solvable++;
      const ch = wrap(sim);
      const reveal = revealSolution(ch) as { params: { angle: number; speed: number } };
      expect(reveal.params.speed, JSON.stringify(sim)).toBeLessThanOrEqual(sim.maxSpeed);
      expect(gradeSim(ch, reveal.params).correct, JSON.stringify(sim)).toBe(true);
    }
    expect(solvable).toBeGreaterThan(500);
  });

  it("an unsolvable puzzle is never accepted at any slider setting: the validator and the grader agree", () => {
    const sim = proj({ targetDistance: 120, maxSpeed: 30, gravity: 10, tolerance: 2 }); // the longest shot is 90 m
    expect(projectileSolvable(sim)).toBe(false);
    const ch = wrap(sim);
    for (let angle = 5; angle <= 85; angle += 5) for (let speed = 1; speed <= 30; speed += 1) expect(gradeSim(ch, { angle, speed }).correct).toBe(false);
  });
});
