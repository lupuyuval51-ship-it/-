/**
 * Sandboxed interpreter for the "program" challenge. The player assembles blocks (move / turn / repeat / if)
 * and the SERVER runs them on a small grid — no JavaScript from players or models is ever evaluated, loops
 * are bounded, and execution stops after a fixed number of primitive actions.
 */
import type { Block, BlockKind, ProgramChallenge } from "../spec/schema";

export type Dir = "N" | "E" | "S" | "W";
const ORDER: Dir[] = ["N", "E", "S", "W"];
const DELTA: Record<Dir, { dx: number; dy: number }> = { N: { dx: 0, dy: -1 }, E: { dx: 1, dy: 0 }, S: { dx: 0, dy: 1 }, W: { dx: -1, dy: 0 } };

export const MAX_ACTIONS = 400;
export const MAX_DEPTH = 3;

export interface RunResult {
  success: boolean;
  reason: "goal" | "not_at_goal" | "too_many_blocks" | "disallowed_block" | "too_deep" | "step_limit";
  final: { x: number; y: number; dir: Dir };
  actions: number;
  bumps: number;
  blocksUsed: number;
  trail: { x: number; y: number }[];
}

export function countBlocks(program: Block[]): number {
  let n = 0;
  for (const b of program) {
    n += 1;
    if (b.t === "repeat") n += countBlocks(b.body);
    if (b.t === "if") n += countBlocks(b.body) + countBlocks(b.else);
  }
  return n;
}

const kindOf = (b: Block): BlockKind => (b.t === "move" ? "move" : b.t === "left" ? "turnLeft" : b.t === "right" ? "turnRight" : b.t === "repeat" ? "repeat" : "ifPathClear");

function depthOf(program: Block[]): number {
  let d = 0;
  for (const b of program) {
    if (b.t === "repeat") d = Math.max(d, 1 + depthOf(b.body));
    if (b.t === "if") d = Math.max(d, 1 + Math.max(depthOf(b.body), depthOf(b.else)));
  }
  return d;
}

function usedKinds(program: Block[], into = new Set<BlockKind>()): Set<BlockKind> {
  for (const b of program) {
    into.add(kindOf(b));
    if (b.t === "repeat") usedKinds(b.body, into);
    if (b.t === "if") {
      usedKinds(b.body, into);
      usedKinds(b.else, into);
    }
  }
  return into;
}

export function runProgram(ch: Pick<ProgramChallenge, "grid" | "allowed" | "maxBlocks">, program: Block[]): RunResult {
  const { grid } = ch;
  const walls = new Set(grid.walls.map((w) => `${w.x},${w.y}`));
  const pos = { x: grid.start.x, y: grid.start.y, dir: grid.start.dir as Dir };
  const result = (reason: RunResult["reason"], extra: Partial<RunResult> = {}): RunResult => ({
    success: false, reason, final: { ...pos }, actions: 0, bumps: 0, blocksUsed: countBlocks(program), trail: [{ x: pos.x, y: pos.y }], ...extra,
  });

  const blocksUsed = countBlocks(program);
  if (blocksUsed > ch.maxBlocks) return result("too_many_blocks");
  for (const k of usedKinds(program)) if (!ch.allowed.includes(k)) return result("disallowed_block");
  if (depthOf(program) > MAX_DEPTH) return result("too_deep");

  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < grid.width && y < grid.height && !walls.has(`${x},${y}`);
  let actions = 0;
  let bumps = 0;
  const trail: { x: number; y: number }[] = [{ x: pos.x, y: pos.y }];
  let limited = false;

  const exec = (blocks: Block[]): void => {
    for (const b of blocks) {
      if (limited) return;
      if (++actions > MAX_ACTIONS) {
        limited = true;
        return;
      }
      switch (b.t) {
        case "move": {
          const d = DELTA[pos.dir];
          if (free(pos.x + d.dx, pos.y + d.dy)) {
            pos.x += d.dx;
            pos.y += d.dy;
            trail.push({ x: pos.x, y: pos.y });
          } else bumps++;
          break;
        }
        case "left":
          pos.dir = ORDER[(ORDER.indexOf(pos.dir) + 3) % 4]!;
          break;
        case "right":
          pos.dir = ORDER[(ORDER.indexOf(pos.dir) + 1) % 4]!;
          break;
        case "repeat":
          for (let i = 0; i < b.n && !limited; i++) exec(b.body);
          break;
        case "if": {
          const d = DELTA[pos.dir];
          exec(free(pos.x + d.dx, pos.y + d.dy) ? b.body : b.else);
          break;
        }
      }
    }
  };
  exec(program);

  const atGoal = pos.x === grid.goal.x && pos.y === grid.goal.y;
  return {
    success: atGoal && !limited,
    reason: limited ? "step_limit" : atGoal ? "goal" : "not_at_goal",
    final: { ...pos },
    actions: Math.min(actions, MAX_ACTIONS),
    bumps,
    blocksUsed,
    trail,
  };
}

/** Breadth-first reachability on the grid (sanity check that the goal is not walled in). */
export function goalReachable(ch: Pick<ProgramChallenge, "grid">): boolean {
  const { grid } = ch;
  const walls = new Set(grid.walls.map((w) => `${w.x},${w.y}`));
  const seen = new Set<string>([`${grid.start.x},${grid.start.y}`]);
  const queue = [{ x: grid.start.x, y: grid.start.y }];
  while (queue.length) {
    const c = queue.shift()!;
    if (c.x === grid.goal.x && c.y === grid.goal.y) return true;
    for (const d of Object.values(DELTA)) {
      const nx = c.x + d.dx;
      const ny = c.y + d.dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height || walls.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}
