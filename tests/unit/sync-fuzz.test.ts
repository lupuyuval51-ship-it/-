import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { OfflineError } from "@/lib/offline/store";
import type { GameSpec } from "@/lib/game/spec/schema";
import { findArea } from "@/lib/game/state/progress";
import { request } from "./helpers";
import { FakeCloud, phone } from "./offline-helpers";

/** Small deterministic random generator so a failing run can be reproduced from its seed. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOL: GameSpec[] = [
  generateOffline(request({ subject: "Fractions" })).spec,
  generateOffline(request({ subject: "Decimals", mode: "FAST" })).spec,
  generateOffline(request({ subject: "Percent", mode: "FAST", contentLanguage: "he" })).spec,
];

type Phone = ReturnType<typeof phone>;
/** More seeds and longer runs for a deeper hunt: `FUZZ_SEEDS=300 FUZZ_STEPS=80 npx vitest run --project unit tests/unit/sync-fuzz.test.ts`. */
const SEEDS = Number(process.env.FUZZ_SEEDS ?? 25);
const STEPS = Number(process.env.FUZZ_STEPS ?? 40);
const BASE = 1_700_000_000_000;

/** What a learner could do with two phones on one account, in a random order, with clocks that are off and a network that fails. */
async function scenario(seed: number, clockOffMs: number, steps: number, log: string[]) {
  const rand = rng(seed);
  const roll = (n: number) => Math.floor(rand() * n);
  const pick = <T,>(xs: T[]): T => xs[roll(xs.length)]!;
  const cloud = new FakeCloud();
  let real = BASE;
  cloud.tick = real;
  const skew = [0, Math.round((rand() - 0.5) * 2 * clockOffMs)];
  const phones: Phone[] = [phone(BASE + skew[0]!), phone(BASE + skew[1]!)];
  const at = (i: number) => { phones[i]!.t.now = real + skew[i]!; cloud.tick = Math.max(cloud.tick, real); };

  for (let step = 0; step < steps; step++) {
    real += 1000 + roll(60_000);
    const i = roll(2);
    const p = phones[i]!;
    at(i);
    const games = p.store.listGames();
    const op = roll(10);
    try {
      if (op === 0 || games.length === 0) {
        p.store.addGame(pick(POOL));
        log.push(`${i}:add`);
      } else if (op === 1) {
        p.store.startSession(pick(games).id, rand() < 0.5);
        log.push(`${i}:start`);
      } else if (op <= 4) {
        const g = pick(games);
        const s = p.store.startSession(g.id, false); // resumes the run in progress (or begins one)
        const area = findArea(p.store.getGame(g.id)!.spec, s.client.areaId)!;
        const state = p.store.getSession(s.session.id)!.state;
        const free = Array.from({ length: area.collectibles.count }, (_, k) => `${area.id}:c${k}`).filter((id) => !state.collected.includes(id));
        if (rand() < 0.5 && free.length > 0) p.store.applyEvent(s.session.id, { type: "collect", itemId: free[0] });
        else if (area.npcs.length > 0) p.store.applyEvent(s.session.id, { type: "talk", npcId: pick(area.npcs).id });
        log.push(`${i}:move`);
      } else if (op === 5 && rand() < 0.5) {
        p.store.deleteGame(pick(games).id);
        log.push(`${i}:delete`);
      } else if (op === 6 && clockOffMs > 0 && rand() < 0.4) {
        // the learner (or the network) changes this phone's clock, forwards or backwards
        skew[i] = skew[i]! + Math.round((rand() - 0.5) * 2 * clockOffMs * 6);
        at(i);
        log.push(`${i}:clock`);
      } else {
        cloud.fail = rand() < 0.15;
        log.push(`${i}:sync${cloud.fail ? "(fails)" : ""}`);
        try { await p.sync(cloud); } catch (e) { if (!cloud.fail) throw e; }
        cloud.fail = false;
      }
    } catch (e) {
      if (!(e instanceof OfflineError)) throw e; // a refused move (wrong place, already done) is normal
    }
  }

  // the network comes back and nobody plays any more: a few rounds in turn
  cloud.fail = false;
  for (let round = 0; round < 3; round++) {
    for (const i of [0, 1]) {
      real += 120_000;
      at(i);
      await phones[i]!.sync(cloud);
    }
  }
  return { cloud, phones };
}

/** Everything that should be the same on both phones once they have synced. */
function snapshot(p: Phone) {
  const games = p.store.listGames().map((g) => g.id).sort();
  const runs = games.flatMap((id) => p.store.exportData().sessions.filter((s) => s.gameId === id).map((s) => ({ id: s.id, status: s.status, state: s.state })));
  runs.sort((a, b) => a.id.localeCompare(b.id));
  return { games, runs };
}

describe("fuzz: two phones, one account, random play, a flaky network", () => {
  for (const clockOff of [0, 4_000, 600_000]) {
    it(`both phones end up with the same games and runs, and no damage (clocks up to ${clockOff / 1000} s apart)`, async () => {
      let totalGames = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const log: string[] = [];
        const why = () => `seed ${seed + clockOff} (${log.join(" ")})`;
        let outcome: Awaited<ReturnType<typeof scenario>>;
        try { outcome = await scenario(seed + clockOff, clockOff, STEPS, log); } catch (e) { throw new Error(`${why()}: ${e instanceof Error ? e.message : String(e)}`); }
        const { phones, cloud } = outcome;
        const [a, b] = [snapshot(phones[0]!), snapshot(phones[1]!)];
        expect(a.games, why()).toEqual(b.games);
        expect(a.runs, why()).toEqual(b.runs);
        const live = [...cloud.games.values()].filter((g) => g.deletedAt === null).map((g) => g.localId).sort();
        expect(a.games, `${why()}: cloud`).toEqual(live);
        for (const p of phones) {
          expect(p.store.integrity(), why()).toMatchObject({ damagedGames: [], damagedSessions: [] });
          // a settled phone has nothing left to send
          expect((await p.sync(cloud)).pushed, why()).toBe(0);
        }
        totalGames += a.games.length;
      }
      expect(totalGames).toBeGreaterThan(10);
    });
  }
});
