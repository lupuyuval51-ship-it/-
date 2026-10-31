/** Runs the bots over the corpus and flags outliers. Pure; the CLI (`scripts/balance-report.ts`) only prints it. */
import { playGame, SKILLS, type PlayResult } from "./bot";
import { demoCorpus, engineCorpus, extendedCorpus, fuzzCorpus, phoneCorpus, type CorpusItem } from "./corpus";

export interface Row {
  item: CorpusItem;
  runs: PlayResult[];
}

export const SEEDS = ["a", "b", "c", "d", "e"] as const;

export function simulate(items: CorpusItem[], seeds: readonly string[] = SEEDS): Row[] {
  return items.map((item) => ({ item, runs: SKILLS.flatMap((s) => seeds.map((seed) => playGame(item.spec, s, `${item.id}|${seed}`))) }));
}

export const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[Math.floor((s.length - 1) / 2)]! + s[Math.ceil((s.length - 1) / 2)]!) / 2 : 0;
};

export interface Outlier {
  id: string;
  problem: string;
}

/** Targets: a FAST game is a coffee break, a FULL game stays under half an hour. */
export const TARGETS = {
  fastMinutes: { min: 2, max: 10 },
  /** A FULL game built from thin notes may be small (one area, few questions) but is never a one-minute toy. */
  fullMinutes: { min: 3, max: 30 },
  /** A player who answers everything right must be able to earn 3 stars. */
  perfectMinStars: 3,
  /** Even a 40% player who finishes should earn at least one star (finishing is never worth zero). */
  finishMinStars: 1,
  /** Slowest bot may take at most this many times the fastest. */
  maxPaceRatio: 3,
  /** Declared estimate vs simulated average learner. */
  estimateRatio: { min: 0.5, max: 2 },
} as const;

export function findOutliers(rows: Row[]): Outlier[] {
  const out: Outlier[] = [];
  for (const { item, runs } of rows) {
    const by = (id: string) => runs.filter((r) => r.skill === id);
    const stuck = runs.filter((r) => r.stuck);
    if (stuck.length) out.push({ id: item.id, problem: `stuck (${stuck[0]!.skill}): ${stuck[0]!.stuckReason}` });
    const perfect = by("perfect");
    const worst = perfect.filter((r) => r.finished && r.stars < TARGETS.perfectMinStars).sort((a, b) => a.stars - b.stars || a.percent - b.percent)[0];
    if (worst) out.push({ id: item.id, problem: `perfect play earns only ${worst.stars} star(s), ${Math.round(worst.percent * 1000) / 10}% of max` });
    // a right first answer is never graded wrong, so a flawless player never sees a solution revealed
    const revealed = perfect.reduce((n, r) => n + r.revealed, 0);
    if (revealed > 0) out.push({ id: item.id, problem: `perfect play had ${revealed} answer(s) revealed: a right answer was graded wrong` });
    // impossible at any moment, finished or not
    if (runs.some((r) => r.score > r.maxScore)) out.push({ id: item.id, problem: "score above maxScore (impossible percentage)" });
    if (runs.some((r) => r.rejected > 0)) out.push({ id: item.id, problem: `${runs.reduce((n, r) => n + r.rejected, 0)} rejected event(s): the bot only sends legal moves` });
    const p40 = by("p40");
    if (p40.some((r) => r.finished && r.stars < TARGETS.finishMinStars)) out.push({ id: item.id, problem: "a finished 40% player gets 0 stars" });
    const avg = median(by("p70").map((r) => r.minutes));
    const range = item.mode === "FAST" ? TARGETS.fastMinutes : TARGETS.fullMinutes;
    if (avg > range.max) out.push({ id: item.id, problem: `too long: ${avg} min for a ${item.mode} game (max ${range.max})` });
    if (avg < range.min) out.push({ id: item.id, problem: `too short: ${avg} min for a ${item.mode} game (min ${range.min})` });
    const est = item.spec.meta.estimatedMinutes;
    const ratio = avg / est;
    if (ratio < TARGETS.estimateRatio.min || ratio > TARGETS.estimateRatio.max) out.push({ id: item.id, problem: `estimatedMinutes ${est} vs simulated ${avg}` });
    const slow = median(by("p40").map((r) => r.minutes));
    const fast = median(perfect.map((r) => r.minutes));
    if (fast > 0 && slow / fast > TARGETS.maxPaceRatio) out.push({ id: item.id, problem: `weak player takes ${(slow / fast).toFixed(1)}x the strong player's time` });
  }
  return out;
}

/** The whole corpus (needs the test samples registered: `tests/support/register-samples.ts`). */
export function allRows(): Row[] {
  return simulate([...engineCorpus(), ...phoneCorpus(), ...demoCorpus(), ...extendedCorpus(), ...fuzzCorpus(80)]);
}
