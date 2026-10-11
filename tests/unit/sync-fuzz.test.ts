import { describe, expect, it } from "vitest";
import { createBackup, importBackup, serializeBackup } from "@/lib/offline/backup";
import { FakeCloud, phone } from "./offline-helpers";
import { randomAction, rng } from "./random-play";

type Phone = ReturnType<typeof phone>;
/** More seeds and longer runs for a deeper hunt: `FUZZ_SEEDS=300 FUZZ_STEPS=80 npx vitest run --project unit tests/unit/sync-fuzz.test.ts`. */
const SEEDS = Number(process.env.FUZZ_SEEDS ?? 25);
const STEPS = Number(process.env.FUZZ_STEPS ?? 40);
const BASE = 1_700_000_000_000;

/** What a learner could do with two phones on one account, in a random order, with clocks that are off and a network that fails. */
async function scenario(seed: number, clockOffMs: number, steps: number, log: string[]) {
  const rand = rng(seed);
  const roll = (n: number) => Math.floor(rand() * n);
  const cloud = new FakeCloud();
  let real = BASE;
  cloud.tick = real;
  const skew = [0, Math.round((rand() - 0.5) * 2 * clockOffMs)];
  const phones: Phone[] = [phone(BASE + skew[0]!), phone(BASE + skew[1]!)];
  const saved: (string | null)[] = [null, null]; // each phone's latest backup file
  const at = (i: number) => { phones[i]!.t.now = real + skew[i]!; cloud.tick = Math.max(cloud.tick, real); };

  for (let step = 0; step < steps; step++) {
    real += 1000 + roll(60_000);
    const i = roll(2);
    const p = phones[i]!;
    at(i);
    const op = roll(12);
    if (op === 10) {
      saved[i] = serializeBackup(createBackup(p.store, real));
      log.push(`${i}:backup`);
    } else if (op === 11 && saved[i] !== null) {
      importBackup(p.store, saved[i]!); // restoring an older file: it may bring back what was deleted since, never overwrite newer data
      log.push(`${i}:restore`);
    } else if (op === 6 && clockOffMs > 0 && rand() < 0.4) {
      // the learner (or the network) changes this phone's clock, forwards or backwards
      skew[i] = skew[i]! + Math.round((rand() - 0.5) * 2 * clockOffMs * 6);
      at(i);
      log.push(`${i}:clock`);
    } else if (op >= 6) {
      cloud.fail = rand() < 0.15;
      log.push(`${i}:sync${cloud.fail ? "(fails)" : ""}`);
      try { await p.sync(cloud); } catch (e) { if (!cloud.fail) throw e; }
      cloud.fail = false;
    } else {
      log.push(`${i}:${randomAction(p.store, rand)}`);
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
  const cards = p.store.exportData().cards.map((c) => ({ key: c.key, box: c.box, due: c.due, mastered: c.mastered })).sort((x, y) => x.key.localeCompare(y.key));
  return { games, runs, cards };
}

describe("fuzz: two phones, one account, random play, a flaky network", () => {
  for (const clockOff of [0, 4_000, 600_000]) {
    it(`both phones end up with the same games and runs, and no damage (clocks up to ${clockOff / 1000} s apart)`, async () => {
      let totalGames = 0;
      let totalCards = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const log: string[] = [];
        const why = () => `seed ${seed + clockOff} (${log.join(" ")})`;
        let outcome: Awaited<ReturnType<typeof scenario>>;
        try { outcome = await scenario(seed + clockOff, clockOff, STEPS, log); } catch (e) { throw new Error(`${why()}: ${e instanceof Error ? e.message : String(e)}`); }
        const { phones, cloud } = outcome;
        const [a, b] = [snapshot(phones[0]!), snapshot(phones[1]!)];
        expect(a.games, why()).toEqual(b.games);
        expect(a.runs, why()).toEqual(b.runs);
        expect(a.cards, why()).toEqual(b.cards);
        const live = [...cloud.games.values()].filter((g) => g.deletedAt === null).map((g) => g.localId).sort();
        expect(a.games, `${why()}: cloud`).toEqual(live);
        for (const p of phones) {
          expect(p.store.integrity(), why()).toMatchObject({ damagedGames: [], damagedSessions: [] });
          // a settled phone has nothing left to send
          expect((await p.sync(cloud)).pushed, why()).toBe(0);
        }
        totalGames += a.games.length;
        totalCards += a.cards.length;
      }
      expect(totalGames).toBeGreaterThan(10);
      expect(totalCards).toBeGreaterThan(0); // the review deck takes part in the comparison
    });
  }
});
