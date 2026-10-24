import { describe, expect, it } from "vitest";
import { gradeAnswer, revealSolution } from "@/lib/game/challenges/grade";
import { projectileRange, projectileSolution, projectileSolvable } from "@/lib/game/challenges/simulations";
import { parseMaterial } from "@/lib/game/material/parse";
import { MATERIAL_MAX_CHARS, clip, sanitizeMaterial } from "@/lib/game/material/text";
import { simulationChallenge, type Challenge } from "@/lib/game/spec/schema";

const LONE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

const projectile = (sim: { gravity: number; targetDistance: number; tolerance: number; maxSpeed: number }): Challenge =>
  simulationChallenge.parse({
    id: "c-sim", type: "simulation", title: "Hit the target", prompt: "Aim and fire.", concept: "projectile motion", level: 2,
    explanation: "Range grows with the square of the speed.", sim: { kind: "projectile", ...sim },
  });

describe("projectile reference solution", () => {
  // At maxSpeed and 45° the shot reaches 30² / 9.8 = 91.8 m: a 95 m target is within the 5 m tolerance, so the spec is
  // valid, but the speed that lands exactly on it (30.52 m/s) is more than the puzzle allows.
  const sim = { gravity: 9.8, targetDistance: 95, tolerance: 5, maxSpeed: 30 };

  it("never exceeds the puzzle's own maxSpeed, so the grader accepts it", () => {
    expect(projectileSolvable({ kind: "projectile", ...sim })).toBe(true);
    const sol = projectileSolution({ kind: "projectile", ...sim });
    expect(sol.speed).toBeLessThanOrEqual(sim.maxSpeed);
    expect(Math.abs(projectileRange(sol.speed, sol.angle, sim.gravity) - sim.targetDistance)).toBeLessThanOrEqual(sim.tolerance);
    const ch = projectile(sim);
    const reveal = revealSolution(ch) as { params: Record<string, number> };
    expect(gradeAnswer(ch, { type: "simulation", params: reveal.params }, "en").correct).toBe(true);
    expect(gradeAnswer(ch, { type: "simulation", params: reveal.params }, "he").correct).toBe(true);
  });

  it("still lands exactly on a target that is well within reach", () => {
    const easy = { gravity: 9.8, targetDistance: 40, tolerance: 2, maxSpeed: 30 };
    const sol = projectileSolution({ kind: "projectile", ...easy });
    expect(sol).toEqual({ angle: 45, speed: 19.8 });
    expect(gradeAnswer(projectile(easy), { type: "simulation", params: sol }, "en").correct).toBe(true);
  });
});

describe("numbered steps: a long list keeps every step", () => {
  const list = (n: number, lead = "How to bake bread:") => `${lead}\n${Array.from({ length: n }, (_, i) => `${i + 1}. Step number ${i + 1} of the recipe`).join("\n")}`;

  it("seven steps make two ordering questions of 4 + 3, not 6 + a lost step", () => {
    const k = parseMaterial(list(7));
    expect(k.steps.map((s) => s.length)).toEqual([4, 3]);
    expect(k.steps.flat()).toEqual(Array.from({ length: 7 }, (_, i) => `Step number ${i + 1} of the recipe`));
    expect(k.stepTitles).toEqual(["How to bake bread", "How to bake bread (2)"]);
  });

  it("splits evenly and every part keeps at least three steps", () => {
    expect(parseMaterial(list(6)).steps.map((s) => s.length)).toEqual([6]);
    expect(parseMaterial(list(8)).steps.map((s) => s.length)).toEqual([4, 4]);
    expect(parseMaterial(list(13)).steps.map((s) => s.length)).toEqual([5, 4, 4]);
    expect(parseMaterial(list(14)).stepTitles).toEqual(["How to bake bread", "How to bake bread (2)", "How to bake bread (3)"]);
    for (const n of [3, 4, 5, 7, 9, 11, 12, 15, 20]) {
      const k = parseMaterial(list(n, "Steps:"));
      expect(k.steps.flat(), `${n} steps`).toHaveLength(n);
      expect(k.steps.every((s) => s.length >= 3 && s.length <= 6), `${n} steps`).toBe(true);
    }
  });
});

describe("sanitised material is always well-formed text", () => {
  it("drops a pictograph that has no variation selector, and a keycap digit becomes a list marker", () => {
    expect(sanitizeMaterial("🌤 Weather: the sky is clear 🗺 and warm")).toBe("Weather: the sky is clear and warm");
    expect(sanitizeMaterial("© 2020 Acme ™")).toBe("© 2020 Acme ™");
    const k = parseMaterial("How to boil an egg:\n1️⃣ Fill a pot with water\n2️⃣ Bring the water to the boil\n3️⃣ Lower the egg in for seven minutes");
    expect(k.steps).toEqual([["Fill a pot with water", "Bring the water to the boil", "Lower the egg in for seven minutes"]]);
  });

  it("removes a lone surrogate from the input and never cuts a character in two at the length cap", () => {
    expect(sanitizeMaterial("Water is wet\uD83D and so is rain \uDE00too")).toBe("Water is wet and so is rain too");
    const long = `${"a".repeat(MATERIAL_MAX_CHARS - 1)}𝑥 and more text after the cap`;
    const out = sanitizeMaterial(long);
    expect(out.length).toBeLessThanOrEqual(MATERIAL_MAX_CHARS);
    expect(LONE.test(out)).toBe(false);
    expect(out).toBe("a".repeat(MATERIAL_MAX_CHARS - 1));
  });

  it("clip never leaves half of a two-unit character before the ellipsis", () => {
    const out = clip("abc𝑥defgh", 5);
    expect(LONE.test(out)).toBe(false);
    expect(out).toBe("abc…");
    expect(clip("𓀀𓀁𓀂𓀃𓀄𓀅", 7)).toBe("𓀀𓀁𓀂…");
    expect(clip("short", 10)).toBe("short");
  });
});
