import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { createBackup, importBackup } from "@/lib/offline/backup";
import { FUTURE_TOLERANCE_MS, MAX_SPEC_BYTES, readSyncState } from "@/lib/offline/sync";
import { findArea } from "@/lib/game/state/progress";
import { request } from "./helpers";
import { FakeCloud, flakyKV, phone, PREFIX } from "./offline-helpers";

const SYNC_KEY = "levelup.offline.sync";
const addGame = (p: ReturnType<typeof phone>, subject = "Fractions") => p.store.addGame(generateOffline(request({ subject })).spec);
/** A cloud whose clock is close to the phones' (like real life): server and phone stamps can be compared. */
const cloudAt = (ms: number) => { const c = new FakeCloud(); c.tick = ms; return c; };
/** Any move that changes the run (and so its updatedAt). */
const talk = (p: ReturnType<typeof phone>, gameId: string, sessionId: string) => {
  const g = p.store.getGame(gameId)!;
  const s = p.store.getSession(sessionId)!;
  p.store.applyEvent(sessionId, { type: "talk", npcId: findArea(g.spec, s.state.areaId)!.npcs[0]!.id });
};

describe("cloud rows are untrusted like a backup file", () => {
  it("a damaged game, run or card from the cloud is skipped and counted; the good rows still arrive", async () => {
    const cloud = cloudAt(2_000_000);
    const a = phone(1_000_000);
    const good = addGame(a, "Fractions");
    const bad = addGame(a, "Decimals");
    const run = a.store.startSession(good.id, false).session.id;
    await a.sync(cloud);
    // the cloud copy of one game was damaged (or comes from a newer app version this one cannot read)
    cloud.games.get(bad.id)!.spec = { ...cloud.games.get(bad.id)!.spec, challenges: [] };
    cloud.games.get(bad.id)!.updatedAt = new Date(cloud.tick += 1000).toISOString();
    cloud.sessions.get(run)!.state = { ...cloud.sessions.get(run)!.state, streak: -4 };
    cloud.sessions.get(run)!.updatedAt = new Date(cloud.tick += 1000).toISOString();
    cloud.cards.set("k", { cardKey: "k", gameId: good.id, challengeId: "c", box: 99, due: new Date(1).toISOString(), mastered: false, updatedAt: new Date(cloud.tick += 1000).toISOString() });

    const b = phone(5_000_000);
    const r = await b.sync(cloud);
    expect(r.rejected).toBe(3);
    expect(b.store.listGames().map((g) => g.id)).toEqual([good.id]);
    expect(b.store.getGame(bad.id)).toBeNull();
    expect(b.store.getSession(run)).toBeNull();
    expect(b.store.integrity()).toMatchObject({ damagedGames: [], damagedSessions: [] });
    expect((await b.sync(cloud)).rejected).toBeLessThanOrEqual(3); // later rounds never crash on the same rows
  });

  it("a row with an unreadable timestamp does not break the round", async () => {
    const cloud = cloudAt(2_000_000);
    const a = phone(1_000_000);
    const g = addGame(a);
    await a.sync(cloud);
    cloud.games.get(g.id)!.createdAt = "not a date";
    cloud.games.get(g.id)!.updatedAt = new Date(cloud.tick += 1000).toISOString();
    const b = phone(5_000_000);
    const r = await b.sync(cloud);
    expect(r.rejected).toBe(1);
    expect(b.store.listGames()).toEqual([]);
  });

  it("a pulled game that claims a feature tier or generator keeps the honest ones and loses the AI claim", async () => {
    const cloud = cloudAt(2_000_000);
    const a = phone(1_000_000);
    const g = addGame(a);
    await a.sync(cloud);
    (cloud.games.get(g.id)!.spec.meta as { generator?: unknown }).generator = { kind: "ai", provider: "x", model: "y", mode: "FAST", generatedAt: "2030-01-01T00:00:00Z" };
    cloud.games.get(g.id)!.updatedAt = new Date(cloud.tick += 1000).toISOString();
    const b = phone(5_000_000);
    await b.sync(cloud);
    expect(b.store.getGame(g.id)!.spec.meta.generator).toBeUndefined();
    expect(b.store.getGame(g.id)!.spec.meta.featureTier).toBe("A");
  });
});

describe("the phone's clock", () => {
  it("a clock that was set ahead and then corrected does not stop new progress from being saved", async () => {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000);
    const g = addGame(a);
    const run = a.store.startSession(g.id, false).session.id;
    await a.sync(cloud);
    // the clock jumps a day ahead, something is played and synced
    a.t.now = 1_000_000 + 86_400_000;
    talk(a, g.id, run);
    await a.sync(cloud);
    expect(readSyncState(a.kv).lastPushMs).toBeGreaterThan(86_400_000);
    // the clock is corrected; more is played
    a.t.now = 2_000_000;
    cloud.tick = 2_000_000;
    const before = cloud.sessions.get(run)!.updatedAt;
    talk(a, g.id, run);
    const r = await a.sync(cloud);
    expect(r.pushed).toBeGreaterThan(0);
    expect(cloud.sessions.get(run)!.updatedAt).not.toBe(before);
    expect(readSyncState(a.kv).lastPushMs).toBeLessThan(86_400_000);
  });

  it("records stamped in the future are re-stamped, so they stop winning conflicts and stop being pushed every round", async () => {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000);
    const g = addGame(a);
    const run = a.store.startSession(g.id, false).session.id;
    a.t.now = 1_000_000 + 86_400_000;
    talk(a, g.id, run); // stamped a day ahead
    a.t.now = 2_000_000; // clock corrected before the first sync
    const first = await a.sync(cloud);
    expect(first.pushed).toBeGreaterThan(0);
    expect(a.store.getSession(run)!.updatedAt).toBeLessThanOrEqual(2_000_100);
    expect((await a.sync(cloud)).pushed).toBe(0);
    expect(a.store.clampFutureStamps(2_000_000 + FUTURE_TOLERANCE_MS)).toBe(0);
  });

  it("two phones with ordinary clocks: the later change wins, the earlier one does not come back", async () => {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000), b = phone(1_000_000);
    const g = addGame(a);
    const run = a.store.startSession(g.id, false).session.id;
    await a.sync(cloud);
    await b.sync(cloud);
    a.t.now = 1_100_000;
    cloud.tick = 1_100_000;
    talk(a, g.id, run);
    await a.sync(cloud);
    await b.sync(cloud);
    expect(b.store.getSession(run)!.state.talked).toEqual(a.store.getSession(run)!.state.talked);
    // after that, an older copy on a phone that was offline must not overwrite the newer cloud copy when it has no change of its own
    const c = phone(1_050_000);
    await c.sync(cloud);
    expect(c.store.getSession(run)!.state.talked).toEqual(a.store.getSession(run)!.state.talked);
  });

  it("garbage in the saved sync marks means 'never synced', not a crash", async () => {
    const a = phone(1_000_000);
    for (const junk of ["{", "null", "[]", '"x"', '{"lastPushMs":"abc","cursor":5,"userId":7,"lastSyncAt":-1}', '{"cursor":"nonsense","lastPushMs":-5}']) {
      a.kv.set(SYNC_KEY, junk);
      expect(readSyncState(a.kv)).toEqual({ userId: null, cursor: null, lastPushMs: 0, lastSyncAt: null });
    }
    a.kv.set(SYNC_KEY, '{"userId":"u","cursor":"2030-01-01T00:00:00Z","lastPushMs":5,"lastSyncAt":6}');
    expect(readSyncState(a.kv)).toEqual({ userId: "u", cursor: "2030-01-01T00:00:00Z", lastPushMs: 5, lastSyncAt: 6 });
    addGame(a);
    expect((await a.sync(cloudAt(1_000_000))).pushed).toBe(1);
  });

  it("a phone too full to save the sync marks still finishes the round, and the next round repeats it harmlessly", async () => {
    const { kv, ctl } = flakyKV();
    const a = phone(1_000_000, kv);
    const cloud = cloudAt(1_000_000);
    addGame(a);
    ctl.mode = "full";
    ctl.failOn = (k) => k === SYNC_KEY;
    expect((await a.sync(cloud)).pushed).toBe(1);
    expect(ctl.failedWrites).toBeGreaterThan(0);
    await a.sync(cloud); // the marks were not saved: the round repeats from the start, harmlessly
    expect(a.store.listGames()).toHaveLength(1);
    expect(cloud.games.size).toBe(1);
    ctl.mode = "ok";
    await a.sync(cloud);
    expect((await a.sync(cloud)).pushed).toBe(0);
    expect(readSyncState(a.kv).lastPushMs).toBeGreaterThan(0);
    expect(cloud.games.size).toBe(1);
  });
});

describe("deletions and restores across phones", () => {
  async function twoPhonesWithOneGame() {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000), c = phone(1_000_000);
    const g = addGame(a);
    a.store.startSession(g.id, false);
    await a.sync(cloud);
    await c.sync(cloud);
    return { cloud, a, c, g };
  }

  it("a deletion that is still waiting to be pushed is not undone by the cloud's older live copy", async () => {
    const { cloud, a, g } = await twoPhonesWithOneGame();
    a.t.now += 10_000;
    a.store.deleteGame(g.id);
    await a.sync(cloud);
    expect(a.store.listGames()).toEqual([]);
    expect(cloud.games.get(g.id)!.deletedAt).not.toBeNull();
  });

  it("a game restored from a backup on another phone after the deletion comes back everywhere, including where it was deleted", async () => {
    const { cloud, a, c, g } = await twoPhonesWithOneGame();
    const backupText = JSON.stringify(createBackup(a.store, 1));
    c.t.now += 10_000;
    cloud.tick = c.t.now;
    c.store.deleteGame(g.id);
    await c.sync(cloud); // the deletion is in the cloud and c remembers it
    await a.sync(cloud); // a drops the game
    expect(a.store.listGames()).toEqual([]);

    a.t.now += 100_000;
    cloud.tick = a.t.now;
    expect(importBackup(a.store, backupText)).toMatchObject({ gamesAdded: 1 });
    await a.sync(cloud); // pushes the restored game: live again in the cloud
    expect(cloud.games.get(g.id)!.deletedAt).toBeNull();

    await c.sync(cloud);
    expect(c.store.listGames().map((x) => x.id)).toEqual([g.id]);
    expect(JSON.parse(c.kv.get(`${PREFIX}tombstones`) ?? "{}")).toEqual({});
    await c.sync(cloud);
    await a.sync(cloud);
    expect(a.store.listGames().map((x) => x.id)).toEqual([g.id]);
    expect(c.store.listGames().map((x) => x.id)).toEqual([g.id]);
  });

  it("a restore here that is newer than the deletion in the cloud survives the next sync and is pushed back", async () => {
    const { cloud, a, c, g } = await twoPhonesWithOneGame();
    // a copy of the game with a later stamp (a backup made on another phone after the last edit)
    const backup = JSON.parse(JSON.stringify(createBackup(a.store, 1))) as { games: { updatedAt: number }[] };
    backup.games[0]!.updatedAt = 1_400_000;
    c.t.now += 10_000;
    cloud.tick = c.t.now;
    c.store.deleteGame(g.id);
    await c.sync(cloud); // the deletion is in the cloud
    a.t.now = 1_500_000; // a has not synced since: it still has the game and now restores the newer copy
    cloud.tick = 1_500_000;
    expect(importBackup(a.store, JSON.stringify(backup))).toMatchObject({ gamesUpdated: 1 });
    await a.sync(cloud);
    expect(a.store.listGames().map((x) => x.id)).toEqual([g.id]);
    expect(cloud.games.get(g.id)!.deletedAt).toBeNull();
    await c.sync(cloud);
    expect(c.store.listGames().map((x) => x.id)).toEqual([g.id]);
  });

  it("a deletion made on one phone is never undone by a run that another phone still sends", async () => {
    const { cloud, a, c, g } = await twoPhonesWithOneGame();
    const run = c.store.startSession(g.id, false).session.id;
    c.t.now += 5000;
    talk(c, g.id, run);
    a.t.now += 10_000;
    cloud.tick = a.t.now;
    a.store.deleteGame(g.id);
    await a.sync(cloud);
    await c.sync(cloud); // c's change to a run of a deleted game cannot resurrect it
    expect(c.store.listGames()).toEqual([]);
    expect(cloud.games.get(g.id)!.deletedAt).not.toBeNull();
    await a.sync(cloud);
    expect(a.store.listGames()).toEqual([]);
  });
});

describe("a clock that goes backwards never hides a change from the cloud", () => {
  it("a game added after the clock went back a little is still sent, even though the clock later passes the old mark", async () => {
    const cloud = cloudAt(10_000_000);
    const a = phone(10_000_000);
    addGame(a);
    await a.sync(cloud);
    const mark = readSyncState(a.kv).lastPushMs;
    a.t.now = mark - 50_000; // the network corrects the clock by 50 s
    const g2 = addGame(a, "Decimals");
    expect(a.store.getGame(g2.id)!.updatedAt).toBeGreaterThan(mark); // stamped after the last push, whatever the clock says
    a.t.now = mark + 100_000;
    cloud.tick = a.t.now;
    await a.sync(cloud);
    expect([...cloud.games.keys()]).toContain(g2.id);
  });

  it("progress made while the clock was set back is sent and is not replaced by the older cloud copy", async () => {
    const cloud = cloudAt(10_000_000);
    const a = phone(10_000_000);
    const g = addGame(a);
    const run = a.store.startSession(g.id, false).session.id;
    await a.sync(cloud);
    const mark = readSyncState(a.kv).lastPushMs;
    a.t.now = mark - 3_600_000; // the learner sets the clock back an hour and plays
    talk(a, g.id, run);
    const played = JSON.stringify(a.store.getSession(run)!.state.talked);
    a.t.now = mark + 7_200_000; // ... and later fixes it; by the time of the next sync the clock is past the old mark
    cloud.tick = a.t.now;
    await a.sync(cloud);
    expect(JSON.stringify(a.store.getSession(run)!.state.talked)).toBe(played);
    expect(JSON.stringify(cloud.sessions.get(run)!.state.talked)).toBe(played);
  });
});

describe("a run that refers to a game the cloud does not have", () => {
  it("heals itself: the round sends everything once instead of failing forever", async () => {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000);
    const g = addGame(a);
    const run = a.store.startSession(g.id, false).session.id;
    await a.sync(cloud);
    cloud.games.clear(); // the cloud lost the game (a restore, a manual clean-up)
    cloud.sessions.clear();
    a.t.now += 10_000;
    cloud.tick = a.t.now;
    talk(a, g.id, run);
    await a.sync(cloud); // a plain round would fail with "foreign key"
    expect([...cloud.games.keys()]).toEqual([g.id]);
    expect([...cloud.sessions.keys()]).toEqual([run]);
    expect((await a.sync(cloud)).pushed).toBe(0);
  });

  it("an error that is not about a missing game is still raised, and nothing is marked as sent", async () => {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000);
    addGame(a);
    cloud.fail = true;
    await expect(a.sync(cloud)).rejects.toThrow("offline");
    expect(readSyncState(a.kv).lastPushMs).toBe(0);
  });

  it("a game too large for the cloud keeps its runs on the phone in every later round too", async () => {
    const cloud = cloudAt(1_000_000);
    const a = phone(1_000_000);
    const spec = generateOffline(request()).spec;
    const big = a.store.addGame({ ...spec, learning: { ...spec.learning, conclusion: "x".repeat(MAX_SPEC_BYTES + 10) } } as typeof spec);
    addGame(a, "Decimals");
    const run = a.store.startSession(big.id, false).session.id;
    await a.sync(cloud); // the game and its run are held back
    a.t.now += 10_000;
    cloud.tick = a.t.now;
    talk(a, big.id, run); // the game is no longer "changed", but its run is
    const r = await a.sync(cloud); // used to fail with a foreign key error every round from here on
    expect(r.skipped).toBeGreaterThanOrEqual(1);
    expect(cloud.sessions.has(run)).toBe(false);
    expect(cloud.games.size).toBe(1);
  });
});

describe("two phones that both played offline converge on the later move, whoever syncs first", () => {
  for (const order of ["a-first", "b-first"] as const) {
    it(`order ${order}`, async () => {
      const cloud = cloudAt(10_000_000);
      const a = phone(10_000_000), b = phone(10_000_000);
      const g = addGame(a);
      const run = a.store.startSession(g.id, false).session.id;
      await a.sync(cloud);
      await b.sync(cloud);
      // both go offline and play: a first, b later
      a.t.now = 10_060_000;
      talk(a, g.id, run);
      b.t.now = 10_120_000;
      const area = findArea(b.store.getGame(g.id)!.spec, b.store.getSession(run)!.state.areaId)!;
      b.store.applyEvent(run, { type: "collect", itemId: `${area.id}:c0` });
      const bMove = JSON.stringify(b.store.getSession(run)!.state);
      cloud.tick = 10_200_000;
      for (const p of order === "a-first" ? [a, b, a, b] : [b, a, b, a]) {
        p.t.now = Math.max(p.t.now, 10_200_000) + 1000;
        cloud.tick += 1000;
        await p.sync(cloud);
      }
      expect(JSON.stringify(a.store.getSession(run)!.state)).toBe(bMove);
      expect(JSON.stringify(b.store.getSession(run)!.state)).toBe(bMove);
      expect(JSON.stringify(cloud.sessions.get(run)!.state)).toBe(bMove);
    });
  }
});

describe("clock skew between the phone and the server", () => {
  /** One more `talk` or `collect`, so each call adds to the run. */
  function progress(p: ReturnType<typeof phone>, gameId: string, sessionId: string) {
    const g = p.store.getGame(gameId)!;
    const s = p.store.getSession(sessionId)!;
    const area = findArea(g.spec, s.state.areaId)!;
    const npc = area.npcs.find((n) => !s.state.talked.includes(n.id));
    if (npc) { p.store.applyEvent(sessionId, { type: "talk", npcId: npc.id }); return; }
    const item = Array.from({ length: area.collectibles.count }, (_, i) => `${area.id}:c${i}`).find((id) => !s.state.collected.includes(id));
    if (item) p.store.applyEvent(sessionId, { type: "collect", itemId: item });
    else p.store.applyEvent(sessionId, { type: "talk", npcId: area.npcs[0]!.id }); // nothing new left: still a saved move
  }

  for (const skew of [-3_600_000, -300_000, -20_000, 20_000, 300_000, 3_600_000]) {
    it(`a phone ${skew < 0 ? "behind" : "ahead of"} the server by ${Math.abs(skew / 1000)} s never loses its own newer progress to its own older copy`, async () => {
      const server0 = 10_000_000;
      const cloud = cloudAt(server0);
      const a = phone(server0 + skew);
      const g = addGame(a);
      const run = a.store.startSession(g.id, false).session.id;
      progress(a, g.id, run);
      cloud.tick = a.t.now - skew; // the server's clock is a fixed distance from the phone's
      await a.sync(cloud);
      for (let round = 0; round < 4; round++) {
        a.t.now += 15_000;
        cloud.tick = a.t.now - skew;
        progress(a, g.id, run);
        const expected = JSON.stringify(a.store.getSession(run)!.state);
        a.t.now += 1000;
        cloud.tick = a.t.now - skew;
        await a.sync(cloud);
        expect(JSON.stringify(a.store.getSession(run)!.state), `round ${round}`).toBe(expected);
        expect(JSON.stringify(cloud.sessions.get(run)!.state), `round ${round} cloud`).toBe(expected);
      }
    });
  }
});
