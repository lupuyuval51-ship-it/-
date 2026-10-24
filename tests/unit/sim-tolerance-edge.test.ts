import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { leverBalanceDistance } from "@/lib/game/challenges/simulations";

/** A lever whose balance point is 2.1 m (7 kg at 3 m against 10 kg); tolerance 0.1. The slider steps by 0.05. */
const lever = { type: "simulation", id: "c-l", title: "t", prompt: "p", concept: "levers", level: 2, objectiveId: "o1", explanation: "e", sim: { kind: "lever", leftWeight: 7, leftDistance: 3, rightWeight: 10, maxDistance: 6, tolerance: 0.1 } } as const;
const grade = (distance: number) => gradeAnswer(lever as never, { type: "simulation", params: { distance } } as never, "en").correct;

describe("simulation grading on the tolerance edge", () => {
  it("a slider exactly on the edge counts, like a numeric answer exactly on its tolerance", () => {
    expect(leverBalanceDistance(lever.sim as never)).toBeCloseTo(2.1, 12);
    expect(Math.abs(2.0 - 2.1)).toBeGreaterThan(0.1); // 0.10000000000000009: the floating-point trap the margin is for
    expect(grade(2.0)).toBe(true);
    expect(grade(2.2)).toBe(true);
    expect(grade(1.95)).toBe(false);
    expect(grade(2.25)).toBe(false);
  });
});

describe("the lever drawing", () => {
  it("keeps 24 px a metre up to 10 m and shrinks a longer lever so the weight stays on the beam", async () => {
    const { leverScale } = await import("@/components/game/hud/SimulationPanel");
    expect(leverScale({ maxDistance: 10, leftDistance: 2 })).toBe(24);
    expect(leverScale({ maxDistance: 6, leftDistance: 3 })).toBe(24);
    for (const maxDistance of [12, 15, 20]) {
      const px = leverScale({ maxDistance, leftDistance: 2 });
      expect(300 + maxDistance * px + 24).toBeLessThanOrEqual(564); // the box's far edge at most where it is at 10 m today
    }
    expect(300 - 18 * leverScale({ maxDistance: 10, leftDistance: 18 }) - 24).toBeGreaterThanOrEqual(36);
  });
});
