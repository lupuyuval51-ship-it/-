import { describe, expect, it } from "vitest";
import { MAX_CARDS, createBackup, importBackup, serializeBackup } from "@/lib/offline/backup";
import { newCard, type DeckCard } from "@/lib/offline/deck";
import { generateOffline } from "@/lib/offline/generate";
import { normalizeGame } from "@/lib/offline/records";
import { memoryKV } from "@/lib/offline/store";
import { MAX_SPEC_BYTES, MAX_STATE_BYTES, forgetPullCursor, readSyncState, resetSyncState, syncOnce, type CloudApi, type CloudRows, type PushBatch } from "@/lib/offline/sync";
import { request } from "./helpers";
import { FakeCloud, phone, populated, PREFIX } from "./offline-helpers";

/**
 * What the sync and backup suites leave open: the card limit of a backup file, the per-game pull, how a round counts what the server refused, byte (not character) limits, and the sync marks.
 */

const SYNC_KEY = `${PREFIX}sync`;
const cloudAt = (ms: number) => { const c = new FakeCloud(); c.tick = ms; return c; };
const addGame = (p: ReturnType<typeof phone>, subject = "Fractions") => p.store.addGame(generateOffline(request({ subject })).spec);

describe("createBackup keeps the cards that matter when there are more than a file can hold", () => {
  it("drops mastered cards first, then the least recently changed", () => {
    const card = (i: number, over: Partial<DeckCard> = {}): DeckCard => ({ ...newCard("g", `c${i}`, i), updatedAt: i, ...over });
    const cards = [
      ...Array.from({ length: MAX_CARDS }, (_, i) => card(i)),
      card(MAX_CARDS, { mastered: true, updatedAt: 9_999_999 }), // mastered but newest: still goes first
      card(MAX_CARDS + 1, { updatedAt: 0 }), // live but oldest: goes next
    ];
    const store = { exportData: () => ({ games: [], sessions: [], cards }) };
    const file = createBackup(store as never, 5);
    expect(file.deck).toHaveLength(MAX_CARDS);
    expect(file.deck.some((c) => c.mastered)).toBe(false);
    expect(file.deck.some((c) => c.challengeId === `c${MAX_CARDS + 1}`)).toBe(false);
    expect(file.deck.filter((c) => c.challengeId === "c0")).toHaveLength(1); // updatedAt 0 as well, but one slot was left
  });

  it("below the limit nothing is dropped, mastered cards included (another phone must not get them back)", () => {
    const cards = [newCard("g", "a", 1), { ...newCard("g", "b", 2), mastered: true }];
    const file = createBackup({ exportData: () => ({ games: [], sessions: [], cards }) } as never, 7);
    expect(file.deck).toEqual(cards);
    expect(file.exportedAt).toBe(7);
  });

  it("a file the app wrote with the most cards it allows is read back by the app", () => {
    // (the games and runs are empty: only the card limit is under test; each card has to belong to a game, so they are dropped on import)
    const cards = Array.from({ length: MAX_CARDS }, (_, i) => newCard("g", `c${i}`, i));
    const text = serializeBackup(createBackup({ exportData: () => ({ games: [], sessions: [], cards }) } as never, 1));
    const store = phone(1_000).store;
    expect(importBackup(store, text)).toMatchObject({ droppedCards: MAX_CARDS, cardsImported: 0 });
  });
});

describe("the per-game pull after a restore", () => {
  class SpyCloud extends FakeCloud {
    gameDataCalls: string[][] = [];
    async pullGameData(ids: string[]) { this.gameDataCalls.push([...ids]); return super.pullGameData(ids); }
  }

  it("the very first round already read everything, so it asks for no game's older runs; a later round asks once, for the new games only", async () => {
    const cloud = new SpyCloud();
    const a = populated(1_000_000);
    await a.sync(cloud);
    const b = phone(5_000_000);
    await b.sync(cloud); // first round: cursor is null, the pull was complete
    expect(cloud.gameDataCalls).toEqual([]);
    expect(b.store.listGames()).toHaveLength(1);

    const second = addGame(a, "Decimals");
    await a.sync(cloud);
    await b.sync(cloud); // a game arrives in a later round: its older runs and cards are asked for by game
    expect(cloud.gameDataCalls).toEqual([[second.id]]);
    await b.sync(cloud);
    expect(cloud.gameDataCalls).toHaveLength(1); // nothing new: no more questions
  });

  it("a cloud without the optional per-game call still syncs (the plain pull is all it has)", async () => {
    const plain: CloudApi = (() => {
      const inner = new FakeCloud();
      return { pull: (s) => inner.pull(s), push: (b) => inner.push(b) };
    })();
    const a = populated(1_000_000);
    await a.sync(plain);
    const b = phone(5_000_000);
    await b.sync(plain);
    addGame(a, "Decimals");
    await a.sync(plain);
    await expect(b.sync(plain)).resolves.toMatchObject({ pulled: 1 });
  });
});

describe("what the server refused", () => {
  it("is counted as left out of the cloud, the round succeeds, and the same rows are not sent again next time", async () => {
    let refuse = 2;
    const inner = new FakeCloud();
    const cloud: CloudApi & { pushes: number } = {
      pushes: 0,
      pull: (s) => inner.pull(s),
      async push(b: PushBatch) { this.pushes++; await inner.push(b); return { refused: refuse }; },
    };
    const a = phone(1_000_000);
    addGame(a);
    const r = await a.sync(cloud);
    expect(r).toMatchObject({ pushed: 1, skipped: 2 });
    expect(readSyncState(a.kv).lastPushMs).toBeGreaterThan(0); // the round counts as done
    refuse = 0;
    expect(await a.sync(cloud)).toMatchObject({ pushed: 0, skipped: 0 });
    expect(cloud.pushes).toBe(1); // an empty batch is never sent
  });
});

describe("limits are counted in bytes, the way the cloud counts them", () => {
  const padded = (extra: string) => {
    const spec = generateOffline(request()).spec;
    return { ...spec, learning: { ...spec.learning, conclusion: extra } } as typeof spec;
  };
  const size = (spec: unknown) => new TextEncoder().encode(JSON.stringify(spec)).length;
  const read = (spec: ReturnType<typeof padded>) => normalizeGame({ id: "x", spec, createdAt: 0 })!.spec; // what a push reads back from the device

  it("a game at exactly the limit is sent; one byte more stays on the phone", async () => {
    const base = size(read(padded("")));
    const exact = padded("x".repeat(MAX_SPEC_BYTES - base));
    expect(size(read(exact))).toBe(MAX_SPEC_BYTES);
    const over = padded("x".repeat(MAX_SPEC_BYTES - base + 1));
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    const ok = a.store.addGame(exact);
    const big = a.store.addGame(over);
    const r = await a.sync(cloud);
    expect(r).toMatchObject({ pushed: 1, skipped: 1 });
    expect([...cloud.games.keys()]).toEqual([ok.id]);
    expect(cloud.games.has(big.id)).toBe(false);
  });

  it("Hebrew counts two bytes a letter: a game that is under the limit in characters but over it in bytes stays on the phone", async () => {
    const base = size(read(padded("")));
    const letters = Math.ceil((MAX_SPEC_BYTES - base) / 2) + 50; // about half the limit in characters, over it in bytes
    const heb = padded("א".repeat(letters));
    expect(JSON.stringify(read(heb)).length).toBeLessThan(MAX_SPEC_BYTES);
    expect(size(read(heb))).toBeGreaterThan(MAX_SPEC_BYTES);
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    a.store.addGame(heb);
    const r = await a.sync(cloud);
    expect(r).toMatchObject({ pushed: 0, skipped: 1 });
    expect(cloud.games.size).toBe(0);
  });

  it("a run bigger than the state limit stays on the phone, but its game and the other runs are sent", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    const game = addGame(a);
    const run = a.store.startSession(game.id, false).session.id;
    const other = a.store.startSession(game.id, true).session.id; // the first run is now abandoned and small
    // make the abandoned run huge (a damaged or tampered save): the cloud would refuse it, and so every round if it were sent
    const key = `${PREFIX}session.${run}`;
    const stored = JSON.parse(a.kv.get(key)!);
    stored.state.served = Object.fromEntries(Array.from({ length: 5000 }, (_, i) => [`s${i}`, "x".repeat(60)]));
    stored.updatedAt = a.t.now + 1;
    expect(size(stored.state)).toBeGreaterThan(MAX_STATE_BYTES);
    a.kv.set(key, JSON.stringify(stored));
    const r = await a.sync(cloud);
    expect(r.skipped).toBe(1);
    expect(cloud.games.has(game.id)).toBe(true);
    expect(cloud.sessions.has(run)).toBe(false);
    expect(cloud.sessions.has(other)).toBe(true);
  });
});

describe("the sync marks", () => {
  it("forgetPullCursor forgets only where the pull stopped: the account and the push mark stay; with no cursor it writes nothing", async () => {
    const cloud = cloudAt(2_000_000);
    const a = phone(1_000_000);
    addGame(a);
    await a.sync(cloud, "u1");
    await a.sync(cloud, "u1"); // the first round pulled before it had pushed anything: the second one sees its own row and sets the cursor
    const before = readSyncState(a.kv);
    expect(before.cursor).not.toBeNull();
    forgetPullCursor(a.kv);
    expect(readSyncState(a.kv)).toEqual({ ...before, cursor: null });
    const raw = a.kv.get(SYNC_KEY);
    forgetPullCursor(a.kv);
    expect(a.kv.get(SYNC_KEY)).toBe(raw);
    // a device that never synced is not given a marks record by it
    const fresh = memoryKV();
    forgetPullCursor(fresh);
    expect(fresh.get(SYNC_KEY)).toBeNull();
  });

  it("resetSyncState sends the next round back to the start: it reads every cloud row again and merges it onto what is here, with no copy", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    addGame(a);
    await a.sync(cloud);
    await a.sync(cloud); // (its own row comes back once)
    expect(await a.sync(cloud)).toMatchObject({ pushed: 0, pulled: 0 });
    resetSyncState(a.kv);
    expect(readSyncState(a.kv)).toEqual({ userId: null, cursor: null, lastPushMs: 0, lastSyncAt: null });
    const again = await a.sync(cloud);
    expect(again.pulled).toBe(1); // the row that the ordinary rounds no longer return
    expect(a.store.listGames()).toHaveLength(1);
    expect(cloud.games.size).toBe(1);
    expect(readSyncState(a.kv).cursor).not.toBeNull();
  });

  it("a round writes the account, a cursor that is the newest cloud stamp it saw, the push mark and the finish time", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    addGame(a);
    await a.sync(cloud, "someone");
    const s = readSyncState(a.kv);
    expect(s.userId).toBe("someone");
    const newest = [...cloud.games.values()].map((g) => g.updatedAt).sort().at(-1)!;
    // the round pulled before it pushed, so the cursor is where the pull stopped: nothing yet; the next round moves it to the pushed row
    expect(s.cursor === null || s.cursor <= newest).toBe(true);
    expect(s.lastPushMs).toBeGreaterThan(1_000_000);
    expect(s.lastSyncAt).toBeGreaterThanOrEqual(s.lastPushMs);
    await a.sync(cloud, "someone");
    expect(readSyncState(a.kv).cursor).toBe(newest);
  });

  it("a round that fails before it pulls leaves the marks exactly as they were", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    addGame(a);
    await a.sync(cloud);
    const raw = a.kv.get(SYNC_KEY);
    addGame(a, "Decimals");
    cloud.fail = true;
    await expect(a.sync(cloud)).rejects.toThrow("offline");
    expect(a.kv.get(SYNC_KEY)).toBe(raw);
    cloud.fail = false;
    expect(await a.sync(cloud)).toMatchObject({ pushed: 1 }); // the change that missed the failed round goes out now
  });

  it("an empty CloudRows pull leaves the cursor where it was (no cursor moves backwards or to null)", async () => {
    const rows: CloudRows = { games: [], sessions: [], cards: [] };
    const quiet: CloudApi = { pull: async () => rows, push: async () => undefined };
    const a = phone(1_000_000);
    a.kv.set(SYNC_KEY, JSON.stringify({ userId: "u1", cursor: "2030-01-01T00:00:00.000Z", lastPushMs: 10, lastSyncAt: 11 }));
    await syncOnce(a.store, a.kv, quiet, "u1", () => a.t.now);
    expect(readSyncState(a.kv).cursor).toBe("2030-01-01T00:00:00.000Z");
  });
});
