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
