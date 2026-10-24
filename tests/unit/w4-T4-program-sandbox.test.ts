import { describe, expect, it } from "vitest";
import { MAX_ACTIONS, MAX_DEPTH, countBlocks, goalReachable, runProgram } from "@/lib/game/challenges/program";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { msg } from "@/lib/game/challenges/messages";
import { programChallenge, type Block, type BlockKind, type ProgramChallenge } from "@/lib/game/spec/schema";

/**
 * The robot sandbox runs on the server for every "program" answer (and on the phone offline): no player or model code is evaluated,
 * so these tests pin down the rules of the little grid world and every way a run can end.
 */

type Dir = "N" | "E" | "S" | "W";
type Cell = { x: number; y: number };
const ALL: BlockKind[] = ["move", "turnLeft", "turnRight", "repeat", "ifPathClear"];

const world = (o: { width?: number; height?: number; start?: Cell & { dir: Dir }; goal?: Cell; walls?: Cell[]; allowed?: BlockKind[]; maxBlocks?: number } = {}) => ({
  grid: { width: o.width ?? 5, height: o.height ?? 5, start: o.start ?? { x: 0, y: 0, dir: "E" as Dir }, goal: o.goal ?? { x: 4, y: 0 }, walls: o.walls ?? [] },
  allowed: o.allowed ?? ALL,
  maxBlocks: o.maxBlocks ?? 14,
});

const move: Block = { t: "move" };
const left: Block = { t: "left" };
const right: Block = { t: "right" };
const repeat = (n: number, ...body: Block[]): Block => ({ t: "repeat", n, body });
const ifClear = (body: Block[], els: Block[] = []): Block => ({ t: "if", body, else: els });

describe("countBlocks", () => {
  it("counts every block, the ones inside a loop and both branches of an if", () => {
    expect(countBlocks([])).toBe(0);
    expect(countBlocks([move, left, right])).toBe(3);
    expect(countBlocks([repeat(3, move, left)])).toBe(3); // the loop itself and its two blocks
    expect(countBlocks([ifClear([move], [left, right])])).toBe(4); // the if, one block, two blocks
    expect(countBlocks([repeat(2, ifClear([move], [repeat(2, left)]))])).toBe(5);
  });
});

describe("moving on the grid", () => {
  it("a move steps one cell the way the robot faces, and the trail starts at the start cell", () => {
    const r = runProgram(world(), [move, move]);
    expect(r.final).toEqual({ x: 2, y: 0, dir: "E" });
    expect(r.trail).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    expect(r.actions).toBe(2);
    expect(r.bumps).toBe(0);
  });

  it("an empty program is a run that goes nowhere: the start cell is the whole trail", () => {
    const r = runProgram(world(), []);
    expect(r).toMatchObject({ success: false, reason: "not_at_goal", final: { x: 0, y: 0, dir: "E" }, actions: 0, bumps: 0, blocksUsed: 0 });
    expect(r.trail).toEqual([{ x: 0, y: 0 }]);
  });

  it("y grows downwards: north is up (y - 1), south is down (y + 1)", () => {
    const south = runProgram(world({ start: { x: 2, y: 2, dir: "S" } }), [move]);
    expect(south.final).toMatchObject({ x: 2, y: 3 });
    const north = runProgram(world({ start: { x: 2, y: 2, dir: "N" } }), [move]);
    expect(north.final).toMatchObject({ x: 2, y: 1 });
    const west = runProgram(world({ start: { x: 2, y: 2, dir: "W" } }), [move]);
    expect(west.final).toMatchObject({ x: 1, y: 2 });
  });

  it("turning left and right goes round the compass in the right direction", () => {
    const turn = (from: Dir, ...program: Block[]) => runProgram(world({ start: { x: 2, y: 2, dir: from } }), program).final.dir;
    expect(turn("N", right)).toBe("E");
    expect(turn("E", right)).toBe("S");
    expect(turn("S", right)).toBe("W");
    expect(turn("W", right)).toBe("N");
    expect(turn("N", left)).toBe("W");
    expect(turn("W", left)).toBe("S");
    expect(turn("S", left)).toBe("E");
    expect(turn("E", left)).toBe("N");
    expect(turn("N", right, right, right, right)).toBe("N");
    expect(turn("E", left, right)).toBe("E");
  });

  it("the edge of the grid and a wall stop the robot in place and count as a bump, the trail does not grow", () => {
    const edge = runProgram(world({ start: { x: 0, y: 0, dir: "N" } }), [move, move]);
    expect(edge.final).toMatchObject({ x: 0, y: 0 });
    expect(edge.bumps).toBe(2);
    expect(edge.trail).toHaveLength(1);
    const rightEdge = runProgram(world({ width: 3, height: 3, goal: { x: 2, y: 2 }, start: { x: 2, y: 0, dir: "E" } }), [move]);
    expect(rightEdge.final).toMatchObject({ x: 2, y: 0 });
    expect(rightEdge.bumps).toBe(1);
    const bottomEdge = runProgram(world({ width: 3, height: 3, start: { x: 0, y: 2, dir: "S" } }), [move]);
    expect(bottomEdge.final).toMatchObject({ x: 0, y: 2 });
    expect(bottomEdge.bumps).toBe(1);

    const wall = runProgram(world({ walls: [{ x: 2, y: 0 }] }), [move, move, move]);
    expect(wall.final).toMatchObject({ x: 1, y: 0 });
    expect(wall.bumps).toBe(2);
    expect(wall.trail).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
  });

  it("a bump is not a failure by itself: a program that bumps and still ends on the goal succeeds", () => {
    const r = runProgram(world(), [repeat(9, move)]);
    expect(r.success).toBe(true);
    expect(r.reason).toBe("goal");
    expect(r.final).toMatchObject({ x: 4, y: 0 });
    expect(r.bumps).toBe(5);
  });

  it("only where the robot STOPS counts: passing over the goal and walking on is not reaching it", () => {
    const r = runProgram(world({ goal: { x: 2, y: 0 } }), [repeat(3, move)]);
    expect(r.trail.some((c) => c.x === 2 && c.y === 0)).toBe(true);
    expect(r.final).toMatchObject({ x: 3, y: 0 });
    expect(r.success).toBe(false);
    expect(r.reason).toBe("not_at_goal");
  });

  it("starting on the goal needs no block at all", () => {
    expect(runProgram(world({ goal: { x: 0, y: 0 } }), []).success).toBe(true);
  });
});

describe("repeat and if", () => {
  it("a repeat runs its body n times, in order", () => {
    const r = runProgram(world({ goal: { x: 3, y: 2 } }), [repeat(3, move), right, repeat(2, move)]);
    expect(r.final).toMatchObject({ x: 3, y: 2, dir: "S" });
    expect(r.success).toBe(true);
    expect(r.actions).toBe(1 + 3 + 1 + 1 + 2); // the loop blocks themselves are actions too
  });

  it("nested loops multiply", () => {
    const r = runProgram(world({ width: 7, height: 7, goal: { x: 6, y: 0 } }), [repeat(2, repeat(3, move))]);
    expect(r.final).toMatchObject({ x: 6, y: 0 });
    expect(r.success).toBe(true);
  });

  it("an if takes its first branch when the cell ahead is free and the else branch when it is a wall or the edge", () => {
    const free = runProgram(world({ start: { x: 0, y: 0, dir: "E" } }), [ifClear([move], [left])]);
    expect(free.final).toMatchObject({ x: 1, y: 0, dir: "E" });
    const wall = runProgram(world({ walls: [{ x: 1, y: 0 }] }), [ifClear([move], [left])]);
    expect(wall.final).toMatchObject({ x: 0, y: 0, dir: "N" });
    const edge = runProgram(world({ start: { x: 0, y: 0, dir: "N" } }), [ifClear([move], [right])]);
    expect(edge.final).toMatchObject({ x: 0, y: 0, dir: "E" });
    expect(edge.bumps).toBe(0); // the if looked, it did not bump
  });

  it("an if with an empty branch does nothing in that case (a half-built answer is a wrong answer, not an error)", () => {
    expect(() => runProgram(world({ walls: [{ x: 1, y: 0 }] }), [ifClear([move])])).not.toThrow();
    expect(() => runProgram(world(), [repeat(2)])).not.toThrow();
    const r = runProgram(world(), [repeat(9, repeat(9, repeat(9)))]);
    expect(r.reason).toBe("not_at_goal");
    expect(r.final).toMatchObject({ x: 0, y: 0 });
  });

  it("an if inside a loop is looked at again on every pass: it walks to a wall, turns, and goes on", () => {
    const w = world({ width: 4, height: 4, goal: { x: 1, y: 2 }, walls: [{ x: 2, y: 0 }] });
    const r = runProgram(w, [repeat(4, ifClear([move], [right]))]);
    expect(r.trail).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]);
    expect(r.final).toEqual({ x: 1, y: 2, dir: "S" });
    expect(r.bumps).toBe(0);
    expect(r.success).toBe(true);
  });
});

describe("how a run can end", () => {
  it("too many blocks: counted with the blocks inside loops and branches, before anything runs", () => {
    const r = runProgram(world({ maxBlocks: 3 }), [repeat(2, move, move), move]);
    expect(r).toMatchObject({ success: false, reason: "too_many_blocks", blocksUsed: 4, actions: 0, bumps: 0 });
    expect(r.final).toMatchObject({ x: 0, y: 0 });
    expect(r.trail).toEqual([{ x: 0, y: 0 }]);
    // exactly the limit is fine
    expect(runProgram(world({ maxBlocks: 4 }), [repeat(2, move, move), move]).reason).not.toBe("too_many_blocks");
  });

  it("a block kind the puzzle does not offer is refused, also when it is hidden inside a loop or an else branch", () => {
    const noTurns = world({ allowed: ["move", "repeat", "ifPathClear"] });
    expect(runProgram(noTurns, [move, left]).reason).toBe("disallowed_block");
    expect(runProgram(noTurns, [move, right]).reason).toBe("disallowed_block");
    expect(runProgram(noTurns, [repeat(2, move, left)]).reason).toBe("disallowed_block");
    expect(runProgram(noTurns, [ifClear([move], [right])]).reason).toBe("disallowed_block");
    expect(runProgram(world({ allowed: ["move"] }), [repeat(2, move)]).reason).toBe("disallowed_block");
    expect(runProgram(world({ allowed: ["move", "repeat"] }), [ifClear([move])]).reason).toBe("disallowed_block");
    // nothing ran
    expect(runProgram(noTurns, [move, left]).final).toMatchObject({ x: 0, y: 0 });
    // …and the same program with the block allowed runs
    expect(runProgram(world(), [move, left]).reason).toBe("not_at_goal");
  });

  it("nesting deeper than MAX_DEPTH is refused; exactly MAX_DEPTH levels is fine", () => {
    expect(MAX_DEPTH).toBe(3);
    const ok = runProgram(world(), [repeat(2, repeat(2, repeat(2, move)))]);
    expect(ok.reason).not.toBe("too_deep");
    const deep = runProgram(world(), [repeat(2, repeat(2, repeat(2, repeat(2, move))))]);
    expect(deep).toMatchObject({ success: false, reason: "too_deep", actions: 0 });
    // an if counts as a level, on either branch
    expect(runProgram(world(), [repeat(2, repeat(2, ifClear([], [repeat(2, move)])))]).reason).toBe("too_deep");
    expect(runProgram(world(), [repeat(2, repeat(2, ifClear([repeat(2, move)])))]).reason).toBe("too_deep");
  });

  it("a run longer than MAX_ACTIONS stops, and standing on the goal at that moment does not count", () => {
    expect(MAX_ACTIONS).toBe(400);
    const r = runProgram(world(), [repeat(9, repeat(9, repeat(9, move)))]);
    expect(r.final).toMatchObject({ x: 4, y: 0 }); // it is on the goal…
    expect(r.success).toBe(false); // …but it ran too long to be a program a person could read
    expect(r.reason).toBe("step_limit");
    expect(r.actions).toBe(MAX_ACTIONS);
  });

  it("a run of exactly MAX_ACTIONS blocks is allowed; one more is not", () => {
    // facing the top edge, a move is a bump that costs one action and changes nothing: a way to spend an exact number of actions
    const bumps = (n: number) => Array.from({ length: n }, () => move);
    const filler: Block[] = [
      repeat(9, repeat(9, repeat(2, move))), // 1 + 9 * (1 + 9 * (1 + 2)) = 253
      repeat(9, repeat(9, move)), // 1 + 9 * (1 + 9) = 91
      repeat(9, repeat(4, move)), // 1 + 9 * (1 + 4) = 46
      ...bumps(4),
    ];
    const toGoal: Block[] = [right, repeat(4, move)]; // 1 + (1 + 4) actions
    const w = { ...world({ start: { x: 0, y: 0, dir: "N" }, goal: { x: 4, y: 0 } }), maxBlocks: 40 };
    const exact = runProgram(w, [...filler, ...toGoal]);
    expect(exact.actions).toBe(MAX_ACTIONS);
    expect(exact.reason).toBe("goal");
    expect(exact.success).toBe(true);
    const over = runProgram(w, [...bumps(1), ...filler, ...toGoal]);
    expect(over.reason).toBe("step_limit");
    expect(over.success).toBe(false);
    expect(over.actions).toBe(MAX_ACTIONS);
    expect(over.final.x).toBe(3); // the 401st block, the last step, never ran
  });

  it("success needs the goal and a run inside every limit", () => {
    expect(runProgram(world(), [repeat(4, move)]).success).toBe(true);
    expect(runProgram(world(), [repeat(3, move)]).success).toBe(false);
  });
});

describe("goalReachable", () => {
  it("is true on an open grid and when a wall only forces a detour", () => {
    expect(goalReachable(world())).toBe(true);
    expect(goalReachable(world({ goal: { x: 4, y: 4 }, walls: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }] }))).toBe(true);
  });

  it("is false when the goal is walled in, or the goal cell itself is a wall", () => {
    const ring = [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 1 }];
    expect(goalReachable(world({ goal: { x: 4, y: 0 }, walls: ring }))).toBe(false);
    expect(goalReachable(world({ goal: { x: 2, y: 2 }, walls: [{ x: 2, y: 2 }] }))).toBe(false);
  });

  it("the start is the goal: nothing to reach", () => {
    expect(goalReachable(world({ goal: { x: 0, y: 0 }, walls: [{ x: 1, y: 0 }, { x: 0, y: 1 }] }))).toBe(true);
  });

  it("a wall line across the whole grid cuts it in two", () => {
    const line = [0, 1, 2, 3, 4].map((y) => ({ x: 2, y }));
    expect(goalReachable(world({ walls: line }))).toBe(false);
    expect(goalReachable(world({ walls: line.slice(1) }))).toBe(true);
  });

  it("agrees with the robot: a path the robot can walk exists on a grid it accepts", () => {
    const w = world({ width: 3, height: 3, goal: { x: 2, y: 2 }, walls: [{ x: 1, y: 0 }, { x: 1, y: 1 }] });
    expect(goalReachable(w)).toBe(true);
    // south twice, then east twice
    expect(runProgram(w, [right, move, move, left, move, move]).success).toBe(true);
  });
});

describe("a program answer through the grader", () => {
  const challenge: ProgramChallenge = programChallenge.parse({
    id: "c-robot", type: "program", title: "Robot", prompt: "Get to the flag.", concept: "loops", level: 1, explanation: "A loop repeats.",
    grid: { width: 5, height: 5, start: { x: 0, y: 0, dir: "E" }, goal: { x: 4, y: 0 }, walls: [] },
    allowed: ["move", "repeat"], maxBlocks: 3, solution: [repeat(4, move)],
  });
  const grade = (program: Block[], lang: "en" | "he" = "en") => gradeAnswer(challenge, { type: "program", program }, lang);

  it("the reference solution is right and says how many blocks it used, with the robot's trail", () => {
    const r = grade([repeat(4, move)]);
    expect(r.correct).toBe(true);
    expect(r.feedback).toBe(msg("en", "progGoal", { n: 2 }));
    expect(r.detail).toMatchObject({ blocksUsed: 2, final: { x: 4, y: 0, dir: "E" } });
    expect((r.detail as { trail: Cell[] }).trail).toHaveLength(5);
    expect(grade([repeat(4, move)], "he").feedback).toBe(msg("he", "progGoal", { n: 2 }));
  });

  it("each way to fail has its own message, and the position is told in columns and rows from 1", () => {
    expect(grade([move, move]).feedback).toBe(msg("en", "progMissed", { x: 3, y: 1, gx: 5, gy: 1 }));
    expect(grade([move, move]).feedback).toContain("column 3, row 1");
    expect(grade([move, move]).feedback).toContain("column 5, row 1");
    expect(grade([move, move], "he").feedback).toContain("בעמודה 3, שורה 1");
    expect(grade([move, move, move, move]).feedback).toBe(msg("en", "progTooMany", { n: 4, max: 3 }));
    expect(grade([left]).feedback).toBe(msg("en", "progDisallowed"));
    expect(grade([repeat(2, repeat(2, repeat(2, repeat(2, move))))]).feedback).toBe(msg("en", "progTooMany", { n: 5, max: 3 }));
    const wide = { ...challenge, maxBlocks: 14, allowed: ["move", "repeat"] as BlockKind[] };
    expect(gradeAnswer(wide, { type: "program", program: [repeat(2, repeat(2, repeat(2, repeat(2, move))))] }, "en").feedback).toBe(msg("en", "progDeep"));
    expect(gradeAnswer(wide, { type: "program", program: [repeat(9, repeat(9, repeat(9, move)))] }, "en").feedback).toBe(msg("en", "progStepLimit"));
  });

  it("an answer of another type is not a program", () => {
    expect(gradeAnswer(challenge, { type: "numeric", value: 4 }, "en")).toMatchObject({ correct: false, feedback: msg("en", "invalidAnswer") });
  });
});
