import { afterEach, describe, expect, it, vi } from "vitest";
import { createBackup, importBackup } from "@/lib/offline/backup";
import { hasExistingData } from "@/lib/offline/first-run";
import { WELCOME_KEY } from "@/lib/offline/onboarding";
import { memoryKV } from "@/lib/offline/store";
import { readSyncState } from "@/lib/offline/sync";
import { findArea, findChallenge } from "@/lib/game/state/progress";
import { generateOffline } from "@/lib/offline/generate";
import { loadLibrary, type LibrarySource } from "../../mobile/src/library-model";
import { correctAnswer, deckSeedOf, request } from "./helpers";
import { FakeCloud, phone, populated } from "./offline-helpers";

/**
 * Records taken from the cloud are stored with a flattened stamp (0 on a phone's first sync, see `OfflineStore.mergeRemote`). These
 * suites check that nothing which reads such a record mistakes the flat stamp for "old": the backup import, the library order, and
 * (a related first-run rule) an upgraded install that never saved a settings key.
 */

const T0 = 1_700_000_000_000;
/** A cloud whose clock is close to the phones' (like real life): server and phone stamps can be compared. */
const cloudAt = (ms: number) => { const c = new FakeCloud(); c.tick = ms; return c; };
type Phone = ReturnType<typeof phone>;
/** Any move that changes the run. */
const talk = (p: Phone, gameId: string, sessionId: string) => {
  const g = p.store.getGame(gameId)!;
  const s = p.store.getSession(sessionId)!;
  p.store.applyEvent(sessionId, { type: "talk", npcId: findArea(g.spec, s.state.areaId)!.npcs[0]!.id });
};
/** Reviews the only card of the deck correctly (box 1 -> 2). */
const reviewCard = (p: Phone, gameId: string): string => {
  const card = Object.values(p.store.syncDeck())[0]!;
  const ch = findChallenge(p.store.getGame(gameId)!.spec, card.challengeId)!;
  p.store.deckPractice({ action: "answer", challengeId: card.key, answer: correctAnswer(ch, deckSeedOf(p.store, card.key)), attempt: 1 });
  return card.key;
};
const backupText = (p: Phone, at: number) => JSON.stringify(createBackup(p.store, at));

describe("backup import on a phone that restored from the cloud", () => {
  it("an older backup does not replace the newer run and review card that came from the cloud", async () => {
    const a = populated(T0);
    const old = backupText(a, T0 + 1); // the file the learner kept
    a.t.now = T0 + 120_000;
    talk(a, a.game.id, a.sessionId); // played on after the backup ...
    const key = reviewCard(a, a.game.id); // ... and reviewed the card
    const cloud = cloudAt(T0 + 130_000);
    await a.sync(cloud);

    // a new phone signs in: its first sync stores what it pulled with the flat stamp 0
    const b = phone(T0 + 200_000);
    await b.sync(cloud);
    const run = b.store.getSession(a.sessionId)!;
    expect(run.updatedAt).toBe(0);
    expect(b.store.syncDeck()[key]!.updatedAt).toBe(0);
    expect(b.store.syncDeck()[key]!.box).toBe(2);

    const r = importBackup(b.store, old);
    expect(r).toMatchObject({ sessionsImported: 0, sessionsKept: 1, cardsImported: 0, cardsKept: 1 });
    expect(b.store.getSession(a.sessionId)!.state.updatedAt).toBe(run.state.updatedAt);
    expect(b.store.getSession(a.sessionId)!.state.updatedAt).toBeGreaterThan(JSON.parse(old).sessions[0].state.updatedAt);
    expect(b.store.syncDeck()[key]!.box).toBe(2);
    // the old copies were not stamped "changed now", so the next round does not push them over the cloud's
    const since = readSyncState(b.kv).lastPushMs;
    expect(b.store.changesSince(since)).toMatchObject({ sessions: [], cards: [] });
    const cloudMoves = cloud.sessions.get(a.sessionId)!.state.updatedAt;
    await b.sync(cloud);
    expect(cloud.cards.get(key)!.box).toBe(2);
    expect(cloud.sessions.get(a.sessionId)!.state.updatedAt).toBe(cloudMoves);
  });

  it("a backup that is really newer than the cloud copy is still taken", async () => {
    const a = populated(T0);
    const cloud = cloudAt(T0 + 5_000);
    await a.sync(cloud);
    const b = phone(T0 + 10_000);
    await b.sync(cloud);
    // A plays on and reviews the card, and makes a backup before it ever syncs again
    a.t.now = T0 + 120_000;
    talk(a, a.game.id, a.sessionId);
    const key = reviewCard(a, a.game.id);
    const fresh = backupText(a, a.t.now);

    const r = importBackup(b.store, fresh);
    expect(r).toMatchObject({ sessionsImported: 1, cardsImported: 1 });
    expect(b.store.getSession(a.sessionId)!.state.updatedAt).toBe(a.store.getSession(a.sessionId)!.state.updatedAt);
    expect(b.store.syncDeck()[key]!.box).toBe(2);
  });

  it("two copies of the same run with the same last move are not imported again", () => {
    const a = populated(T0);
    const text = backupText(a, T0 + 1);
    const b = phone(T0 + 50_000);
    importBackup(b.store, text);
    expect(importBackup(b.store, text)).toMatchObject({ sessionsImported: 0, sessionsKept: 1, cardsImported: 0, cardsKept: 1 });
  });

  it("a run whose moves lie in the future (clock set ahead, then corrected) cannot block a newer backup for ever", () => {
    const a = populated(T0);
    const text = backupText(a, T0 + 1);
    const b = phone(T0 + 50_000);
    importBackup(b.store, text);
    // the local run's last move is far in the future of this phone's clock
    const local = b.store.getSession(a.sessionId)!;
    const future = local.state.updatedAt + 10 * 24 * 3_600_000;
    const raw = JSON.parse(b.kv.get("levelup.offline.session." + a.sessionId)!);
    raw.state.updatedAt = future;
    raw.updatedAt = T0 + 1_000;
    b.kv.set("levelup.offline.session." + a.sessionId, JSON.stringify(raw));
    // the backup's copy was saved after the local one (its stamp is later than the local stamp, its moves are in the past)
    const newer = JSON.parse(text) as { sessions: { updatedAt: number }[] };
    newer.sessions[0]!.updatedAt = b.t.now + 1_000_000;
    expect(importBackup(b.store, JSON.stringify(newer)).sessionsImported).toBe(1);
  });
});

describe("library order uses the store's own time of the last move", () => {
  it("a game played on another phone keeps its place on a new phone (the run's stamp is 0 after the first sync)", async () => {
    const a = phone(T0);
    const idle = a.store.addGame(generateOffline(request({ subject: "Decimals" })).spec); // created first, never played
    a.t.now += 60_000;
    const played = a.store.addGame(generateOffline(request({ subject: "Fractions" })).spec);
    a.t.now += 60_000;
    const run = a.store.startSession(played.id, false).session.id;
    a.t.now += 60_000;
    talk(a, played.id, run);
    const cloud = cloudAt(T0 + 500_000);
    await a.sync(cloud);

    const b = phone(T0 + 1_000_000);
    await b.sync(cloud);
    expect(b.store.getSession(run)!.updatedAt).toBe(0);
    const row = b.store.listGames().find((g) => g.id === played.id)!;
    expect(row.lastPlayedAt).toBeGreaterThan(idle.createdAt);

    const lib = loadLibrary(b.store);
    if (!lib.ok) throw new Error("load failed");
    expect(lib.games.map((g) => g.id)).toEqual([played.id, idle.id]);
    expect(lib.games[0]!.lastPlayedAt).toBe(row.lastPlayedAt);
  });

  it("opening a game still counts as playing it (the run's stamp can be newer than its last move)", () => {
    const row = { id: "g", title: "G", subject: "S", createdAt: 1000, generatorKind: "engine", environment: "meadow", bestScore: 0, bestStars: 0, maxScore: 100, inProgress: true, percent: 0, lastSessionId: "s", lastPlayedAt: 5000 };
    const src: LibrarySource = { listGames: () => [row], getSession: () => ({ updatedAt: 9000 }), deckSummary: () => ({ total: 0, due: 0, nextDue: null }) };
    const lib = loadLibrary(src);
    expect(lib.ok && lib.games[0]?.lastPlayedAt).toBe(9000);
    const flat = loadLibrary({ ...src, getSession: () => ({ updatedAt: 0 }) });
    expect(flat.ok && flat.games[0]?.lastPlayedAt).toBe(5000);
  });
});

describe("an upgraded install is never sent through the first-run questionnaire", () => {
  it("hasExistingData: games on the phone, or a welcome already seen, mean an existing install", () => {
    expect(hasExistingData(memoryKV())).toBe(false);
    const withList = memoryKV();
    withList.set("levelup.offline.games", JSON.stringify(["g1"]));
    expect(hasExistingData(withList)).toBe(true);
    const emptyList = memoryKV();
    emptyList.set("levelup.offline.games", "[]");
    expect(hasExistingData(emptyList)).toBe(false);
    const unlisted = memoryKV(); // a game record whose list was damaged
    unlisted.set("levelup.offline.game.g1", "{}");
    expect(hasExistingData(unlisted)).toBe(true);
    const welcomed = memoryKV();
    welcomed.set(WELCOME_KEY, "1");
    expect(hasExistingData(welcomed)).toBe(true);
    const damaged = memoryKV();
    damaged.set("levelup.offline.games", "{not json");
    expect(hasExistingData(damaged)).toBe(false);
    expect(hasExistingData({ get: () => { throw new Error("blocked"); } })).toBe(false);
  });

  describe("the app's settings", () => {
    const mem = new Map<string, string>();
    const fakeStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
    const loadSettings = async () => {
      vi.resetModules();
      vi.stubGlobal("localStorage", fakeStorage);
      vi.stubGlobal("window", { location: { hash: "" }, localStorage: fakeStorage, addEventListener: () => {}, removeEventListener: () => {} });
      vi.stubGlobal("document", { documentElement: { removeAttribute: () => {}, setAttribute: () => {} } });
      return (await import("../../mobile/src/app-state")).getSettings();
    };
    afterEach(() => { mem.clear(); vi.unstubAllGlobals(); });

    it("a fresh phone starts the questionnaire", async () => {
      expect((await loadSettings()).setupDone).toBe(false);
    });
    it("a phone with games but no saved settings key (a learner who never opened Settings) skips it", async () => {
      mem.set("levelup.offline.games", JSON.stringify(["g1"]));
      expect((await loadSettings()).setupDone).toBe(true);
    });
    it("a saved settings key decides, whatever else is on the phone (the learner can answer the questions again)", async () => {
      mem.set("levelup.offline.games", JSON.stringify(["g1"]));
      mem.set("levelup.mobile.settings", JSON.stringify({ locale: "en", setupDone: false }));
      expect((await loadSettings()).setupDone).toBe(false);
    });
  });
});
