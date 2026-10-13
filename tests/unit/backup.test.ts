import { describe, expect, it } from "vitest";
import { backupFileName, BACKUP_FORMAT, BackupError, createBackup, importBackup, parseBackup } from "@/lib/offline/backup";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer } from "./helpers";

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

function setup(startClock = 1_000_000) {
  const box = { now: startClock };
  const store = new OfflineStore(memoryKV(), () => (box.now += 1000));
  return { store, box };
}

/** A game with one run in which one question was missed, so the review deck has a card. */
function populated() {
  const ctx = setup();
  const game = ctx.store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
  const s = ctx.store.startSession(game.id, false);
  const area = findArea(game.spec, s.client.areaId)!;
  const st = area.stations.find((x) => x.kind === "challenge" && stationActive(game.spec, s.client, x))!;
  const opened = ctx.store.applyEvent(s.session.id, { type: "open", stationId: st.id });
  const ch = game.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
  ctx.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
  ctx.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });
  ctx.store.syncDeck();
  return { ...ctx, game, sessionId: s.session.id };
}

const file = (store: OfflineStore) => JSON.stringify(createBackup(store, 5_000_000));
const code = (fn: () => unknown): string => { try { fn(); } catch (e) { return e instanceof BackupError ? e.code : "OTHER"; } return "NONE"; };

describe("backup export", () => {
  it("contains games, sessions and the review deck with a format marker and version", () => {
    const { store, game, sessionId } = populated();
    const b = createBackup(store, 5_000_000);
    expect(b).toMatchObject({ format: BACKUP_FORMAT, version: 1, exportedAt: 5_000_000 });
    expect(b.games.map((g) => g.id)).toEqual([game.id]);
    expect(b.sessions.map((s) => s.id)).toEqual([sessionId]);
    expect(b.deck).toHaveLength(1);
    expect(backupFileName(Date.parse("2030-03-04T10:00:00Z"))).toBe("levelup-backup-2030-03-04.json");
  });

  it("does not write anything to the store", () => {
    const { store } = populated();
    let calls = 0;
    store.subscribe(() => calls++);
    createBackup(store);
    expect(calls).toBe(0);
  });

  it("an empty store exports an empty but valid file", () => {
    const { store } = setup();
    const r = importBackup(setup().store, file(store));
    expect(r).toMatchObject({ gamesAdded: 0, rejectedGames: [] });
  });
});

describe("backup import", () => {
  it("round-trips into a fresh device: games, runs, deck and the generator label survive", () => {
    const src = populated();
    const dst = setup(9_000_000).store;
    const r = importBackup(dst, file(src.store));
    expect(r).toMatchObject({ gamesAdded: 1, sessionsImported: 1, cardsImported: 1, rejectedGames: [], droppedSessions: 0, droppedCards: 0 });
    const g = dst.getGame(src.game.id)!;
    expect(g.spec.meta.generator?.kind).toBe(src.game.spec.meta.generator?.kind);
    expect(dst.listGames()[0]).toMatchObject({ id: src.game.id, generatorKind: "engine" });
    expect(dst.getSession(src.sessionId)?.state.score).toBe(src.store.getSession(src.sessionId)!.state.score);
    expect(dst.deckSummary().total).toBe(1);
    // the imported run can be resumed
    expect(dst.startSession(src.game.id, false).resumed).toBe(true);
  });

  it("imported records are stamped as changed now, so cloud sync pushes them", () => {
    const src = populated();
    const dst = setup(9_000_000).store;
    importBackup(dst, file(src.store));
    const changes = dst.changesSince(8_000_000);
    expect(changes.games).toHaveLength(1);
    expect(changes.sessions).toHaveLength(1);
    expect(changes.cards).toHaveLength(1);
  });

  it("is idempotent: importing the same file twice changes nothing the second time", () => {
    const src = populated();
    const dst = setup(9_000_000).store;
    const text = file(src.store);
    importBackup(dst, text);
    const r = importBackup(dst, text);
    expect(r).toMatchObject({ gamesAdded: 0, gamesUpdated: 0, gamesKept: 1, sessionsImported: 0, sessionsKept: 1, cardsImported: 0, cardsKept: 1 });
    expect(dst.listGames()).toHaveLength(1);
  });

  it("keeps a newer local session and game; a newer backup replaces an older local one and bumps the revision", () => {
    const src = populated();
    const dst = setup(9_000_000);
    importBackup(dst.store, file(src.store));
    const localGame = dst.store.getGame(src.game.id)!;
    // local is now newer than the backup (the clock is far past the backup's timestamps)
    const keep = importBackup(dst.store, file(src.store));
    expect(keep.gamesKept).toBe(1);
    expect(dst.store.getGame(src.game.id)!.updatedAt).toBe(localGame.updatedAt);

    // a backup made later than the local copy wins
    const backup = JSON.parse(file(src.store)) as { games: { updatedAt: number; title: string; spec: { meta: { title: string } } }[] };
    backup.games[0]!.updatedAt = localGame.updatedAt + 1_000_000;
    backup.games[0]!.title = "Renamed";
    const r = importBackup(dst.store, JSON.stringify(backup));
    expect(r.gamesUpdated).toBe(1);
    const after = dst.store.getGame(src.game.id)!;
    expect(after.title).toBe("Renamed");
    expect(after.revision).toBeGreaterThan(localGame.revision);
    expect(dst.store.listGames()).toHaveLength(1);
  });

  it("does not bring back a game deleted on this device after the backup, but a newer backup copy may restore it", () => {
    const src = populated();
    const text = file(src.store);
    const dst = setup(9_000_000);
    importBackup(dst.store, text);
    dst.store.deleteGame(src.game.id);
    const r = importBackup(dst.store, text);
    expect(r).toMatchObject({ gamesAdded: 0, gamesKept: 1 });
    expect(dst.store.listGames()).toEqual([]);
    expect(r).toMatchObject({ sessionsImported: 0, sessionsKept: 1, cardsImported: 0, cardsKept: 1 }); // its runs and cards stay out with it
    const newer = JSON.parse(text) as { games: { updatedAt: number }[] };
    newer.games[0]!.updatedAt = 99_000_000;
    expect(importBackup(dst.store, JSON.stringify(newer)).gamesAdded).toBe(1);
    expect(dst.store.listGames()).toHaveLength(1);
    expect(dst.store.changesSince(0).deletedGames).toEqual([]);
  });

  it("re-validates every spec: an invalid or tampered game is skipped with a reason, the others still import", () => {
    const a = populated();
    const b = setup();
    const gameB = b.store.addGame(generateOffline(request()).spec);
    const text = JSON.stringify({
      ...createBackup(a.store, 1),
      games: [...createBackup(a.store, 1).games, ...createBackup(b.store, 1).games.map((g) => ({ ...g, spec: { ...g.spec, challenges: [] } }))],
    });
    const dst = setup(9_000_000).store;
    const r = importBackup(dst, text);
    expect(r.gamesAdded).toBe(1);
    expect(r.rejectedGames.map((g) => g.id)).toEqual([gameB.id]);
    expect(r.rejectedGames[0]!.reason.length).toBeGreaterThan(0);
    expect(dst.getGame(gameB.id)).toBeNull();
  });

  it("sanitises specs: control and bidi-override characters are stripped before storing", () => {
    const a = setup();
    const game = a.store.addGame(generateOffline(request()).spec);
    const backup = JSON.parse(file(a.store)) as { games: { spec: { meta: { title: string } } }[] };
    backup.games[0]!.spec.meta.title = "Fine\u0007 title‮";
    const dst = setup().store;
    importBackup(dst, JSON.stringify(backup));
    expect(dst.getGame(game.id)!.spec.meta.title).toBe("Fine title");
  });

  it("drops sessions and cards of rejected or unknown games, and malformed sessions, without failing the import", () => {
    const src = populated();
    const b = JSON.parse(file(src.store)) as { games: { spec: unknown }[]; sessions: { gameId: string; state: unknown; id: string }[]; deck: { gameId: string }[] };
    b.sessions.push({ ...b.sessions[0]!, id: "orphan", gameId: "ghost" });
    b.sessions.push({ ...b.sessions[0]!, id: "broken", state: { v: 1 } });
    b.deck.push({ ...b.deck[0]!, gameId: "ghost", key: "ghost.x" } as never);
    const dst = setup().store;
    const r = importBackup(dst, JSON.stringify(b));
    expect(r).toMatchObject({ gamesAdded: 1, sessionsImported: 1, droppedSessions: 2, cardsImported: 1, droppedCards: 1 });
    expect(dst.getSession("orphan")).toBeNull();
  });

  it("rejects ids that could collide with storage keys", () => {
    const a = setup();
    a.store.addGame(generateOffline(request()).spec);
    const b = JSON.parse(file(a.store)) as { games: { id: string }[] };
    b.games[0]!.id = "../../evil key";
    const dst = setup().store;
    const r = importBackup(dst, JSON.stringify(b));
    expect(r.gamesAdded).toBe(0);
    expect(r.rejectedGames).toHaveLength(1);
  });

  it("is not affected by the file's own claims about a deck card for a game it does not contain", () => {
    const src = populated();
    const dst = setup().store;
    const b = JSON.parse(file(src.store)) as { games: unknown[] };
    b.games = [];
    const r = importBackup(dst, JSON.stringify(b));
    expect(r).toMatchObject({ gamesAdded: 0, sessionsImported: 0, cardsImported: 0, droppedSessions: 1, droppedCards: 1 });
  });
});

describe("backup errors are clear and typed", () => {
  const { store } = setup();
  it("rejects non-JSON, other JSON, other formats and newer versions", () => {
    expect(code(() => parseBackup("not json {"))).toBe("NOT_JSON");
    expect(code(() => parseBackup("[1,2]"))).toBe("NOT_A_BACKUP");
    expect(code(() => parseBackup("null"))).toBe("NOT_A_BACKUP");
    expect(code(() => parseBackup(JSON.stringify({ format: "other", version: 1 })))).toBe("NOT_A_BACKUP");
    expect(code(() => parseBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 2, exportedAt: 1, games: [], sessions: [], deck: [] })))).toBe("NEWER_VERSION");
  });
  it("rejects a file with the right marker but a damaged structure", () => {
    expect(code(() => importBackup(store, JSON.stringify({ format: BACKUP_FORMAT, version: 1 })))).toBe("INVALID");
    expect(code(() => importBackup(store, JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: 1, games: "x", sessions: [], deck: [] })))).toBe("INVALID");
  });
  it("rejects an oversized file before parsing it", () => {
    expect(code(() => parseBackup("x".repeat(30_000_001)))).toBe("TOO_LARGE");
  });
  it("a failed import leaves the store untouched", () => {
    const s = setup().store;
    s.addGame(generateOffline(request()).spec);
    const before = JSON.stringify(createBackup(s, 1));
    expect(code(() => importBackup(s, "garbage"))).toBe("NOT_JSON");
    expect(JSON.stringify(createBackup(s, 1))).toBe(before);
  });
});
