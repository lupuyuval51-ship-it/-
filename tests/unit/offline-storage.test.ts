import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { normalizeGame, normalizeSession, normalizeState } from "@/lib/offline/records";
import { getOfflineTier } from "@/lib/offline/entitlement";
import { isStorageError, MAX_ABANDONED_RUNS_PER_GAME, memoryKV, OfflineError, OfflineStore, storageErrorCode } from "@/lib/offline/store";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer } from "./helpers";
import { editStored, flakyKV, NOTES, phone, populated, PREFIX } from "./offline-helpers";

const newGame = (store: OfflineStore, subject = "Fractions") => store.addGame(generateOffline(request({ subject })).spec);
const codeOf = (fn: () => unknown): string => { try { fn(); } catch (e) { return e instanceof OfflineError ? e.code : `OTHER:${String(e)}`; } return "NONE"; };

describe("a full or blocked phone gives a clear error and never half-saves", () => {
  it("adding a game on a full phone throws STORAGE_FULL and leaves the library as it was", () => {
    const { kv, inner, ctl } = flakyKV();
    const { store } = phone(1_000_000, kv);
    const first = newGame(store);
    ctl.mode = "full";
    expect(codeOf(() => newGame(store, "Decimals"))).toBe("STORAGE_FULL");
    expect(store.listGames().map((g) => g.id)).toEqual([first.id]);
    expect(inner.keys!().filter((k) => k.startsWith(`${PREFIX}game.`))).toEqual([`${PREFIX}game.${first.id}`]);
  });

  it("if only the list cannot be written, the game record is removed again (nothing is stored but unlisted)", () => {
    const { kv, inner, ctl } = flakyKV();
    const { store } = phone(1_000_000, kv);
    ctl.mode = "full";
    ctl.failOn = (k) => k === `${PREFIX}games`;
    expect(codeOf(() => newGame(store))).toBe("STORAGE_FULL");
    expect(inner.keys!().filter((k) => k.startsWith(`${PREFIX}game.`))).toEqual([]);
  });

  it("addGame is atomic: a storage stub that throws on the second write leaves no dangling record, at any write position", () => {
    for (const failingWrite of [1, 2]) {
      const inner = memoryKV();
      let writes = 0;
      const kv = { ...inner, set: (k: string, v: string) => { if (++writes === failingWrite) throw new DOMException("quota", "QuotaExceededError"); inner.set(k, v); } };
      const store = new OfflineStore(kv, () => 1_000_000);
      expect(codeOf(() => newGame(store))).toBe("STORAGE_FULL");
      expect(inner.keys!(), `write #${failingWrite} failed`).toEqual([]);
      expect(store.listGames()).toEqual([]);
      expect(store.integrity()).toEqual({ games: 0, damagedGames: [], damagedSessions: [] });
      // the same call works once there is room (writes 3 and 4 succeed)
      const g = newGame(store);
      expect(store.listGames().map((x) => x.id)).toEqual([g.id]);
    }
  });

  it("a screen can recognise the failure from the store's error or from the transport's copy of it", () => {
    expect(storageErrorCode(new OfflineError(507, "STORAGE_FULL", "x"))).toBe("STORAGE_FULL");
    expect(storageErrorCode({ status: 503, code: "STORAGE_UNAVAILABLE", message: "x" })).toBe("STORAGE_UNAVAILABLE"); // an ApiFailure
    for (const other of [new OfflineError(404, "NOT_FOUND", "x"), new Error("boom"), null, undefined, "STORAGE_FULL", { code: 5 }]) expect(storageErrorCode(other)).toBeNull();
  });

  it("blocked storage (private mode, policy) is reported differently from a full phone", () => {
    const { kv, ctl } = flakyKV();
    const { store } = phone(1_000_000, kv);
    ctl.mode = "blocked";
    expect(codeOf(() => newGame(store))).toBe("STORAGE_UNAVAILABLE");
    expect(store.checkWritable()).toBe("unavailable");
    ctl.mode = "full";
    expect(store.checkWritable()).toBe("full");
    ctl.mode = "ok";
    expect(store.checkWritable()).toBe("ok");
    expect(kv.get(`${PREFIX}probe`)).toBeNull();
  });

  it("a move that cannot be saved is refused, and the saved progress stays as it was", () => {
    const ctx = populated();
    const before = JSON.stringify(ctx.store.getSession(ctx.sessionId));
    const { kv, ctl } = flakyKV(ctx.kv);
    const store = new OfflineStore(kv, () => 9_000_000);
    ctl.mode = "full";
    const area = findArea(ctx.game.spec, ctx.store.getSession(ctx.sessionId)!.state.areaId)!;
    let err: unknown;
    try { store.applyEvent(ctx.sessionId, { type: "talk", npcId: area.npcs[0]!.id }); } catch (e) { err = e; }
    expect(isStorageError(err)).toBe(true);
    expect(JSON.stringify(store.getSession(ctx.sessionId))).toBe(before);
  });

  it("starting a run on a full phone leaves no orphan run behind", () => {
    const { kv, inner, ctl } = flakyKV();
    const { store } = phone(1_000_000, kv);
    const game = newGame(store);
    ctl.mode = "full";
    ctl.failOn = (k) => k.startsWith(`${PREFIX}sessions.`);
    expect(codeOf(() => store.startSession(game.id, false))).toBe("STORAGE_FULL");
    expect(inner.keys!().filter((k) => k.startsWith(`${PREFIX}session.`))).toEqual([]);
    ctl.mode = "ok";
    expect(store.startSession(game.id, false).resumed).toBe(false);
  });

  it("deleting a game frees space even when the phone is full", () => {
    const { kv, ctl } = flakyKV();
    const { store } = phone(1_000_000, kv);
    const game = newGame(store);
    store.startSession(game.id, false);
    ctl.mode = "full";
    ctl.failOn = (k) => k.includes(".tombstones") || k.endsWith("tombstones");
    // the game itself is gone; only remembering the deletion for the cloud failed, and that is reported
    expect(codeOf(() => store.deleteGame(game.id))).toBe("STORAGE_FULL");
    expect(store.listGames()).toEqual([]);
    expect(store.getGame(game.id)).toBeNull();
  });

  it("reports how much of the practical limit is used", () => {
    const { store, kv } = phone(1_000_000);
    const empty = store.storageUsage();
    newGame(store);
    const used = store.storageUsage();
    expect(used.chars).toBeGreaterThan(empty.chars);
    expect(used.chars).toBe([...kv.keys!()].reduce((n, k) => n + k.length + kv.get(k)!.length, 0));
    expect(used.limit).toBeGreaterThan(used.chars);
  });
});

describe("damage to one record never takes the library down", () => {
  it("a game with unparsable JSON is hidden on its own; the others and their runs are untouched", () => {
    const ctx = populated();
    const other = newGame(ctx.store, "Decimals");
    ctx.kv.set(`${PREFIX}game.${ctx.game.id}`, "{not json");
    expect(ctx.store.listGames().map((g) => g.id)).toEqual([other.id]);
    expect(ctx.store.getGame(ctx.game.id)).toBeNull();
    expect(ctx.store.integrity()).toMatchObject({ games: 1, damagedGames: [ctx.game.id] });
    expect(ctx.store.exportData().games.map((g) => g.id)).toEqual([other.id]);
  });

  it("a game that parses but lacks the structure the app reads is treated as damaged, not crashed on", () => {
    const { store, kv } = phone(1_000_000);
    const ok = newGame(store);
    const broken = newGame(store, "Decimals");
    for (const edit of [
      (v: Record<string, unknown>) => { v.spec = null; },
      (v: Record<string, unknown>) => { (v.spec as { areas: unknown }).areas = []; },
      (v: Record<string, unknown>) => { delete (v.spec as { theme?: unknown }).theme; },
      (v: Record<string, unknown>) => { (v.spec as { missions: unknown }).missions = "x"; },
    ]) {
      const snapshot = kv.get(`${PREFIX}game.${broken.id}`)!;
      editStored(kv, `game.${broken.id}`, edit);
      expect(() => store.listGames()).not.toThrow();
      expect(store.listGames().map((g) => g.id)).toEqual([ok.id]);
      kv.set(`${PREFIX}game.${broken.id}`, snapshot);
    }
    kv.set(`${PREFIX}game.${broken.id}`, "null");
    expect(store.listGames().map((g) => g.id)).toEqual([ok.id]);
  });

  it("a damaged run keeps its game: the game opens with a fresh run", () => {
    const ctx = populated();
    ctx.kv.set(`${PREFIX}session.${ctx.sessionId}`, "[[[");
    expect(ctx.store.listGames().map((g) => g.id)).toEqual([ctx.game.id]);
    expect(ctx.store.listGames()[0]!.inProgress).toBe(false);
    const fresh = ctx.store.startSession(ctx.game.id, false);
    expect(fresh.resumed).toBe(false);
    expect(fresh.session.id).not.toBe(ctx.sessionId);
  });

  it("a run that points at an area the game does not have is closed instead of crashing the resume", () => {
    const ctx = populated();
    editStored(ctx.kv, `session.${ctx.sessionId}`, (v) => { (v.state as { areaId: string }).areaId = "no-such-area"; });
    const s = ctx.store.startSession(ctx.game.id, false);
    expect(s.resumed).toBe(false);
    expect(ctx.store.getSession(ctx.sessionId)?.status).toBe("ABANDONED");
  });

  it("a run whose state breaks the rules engine on resume is abandoned, not thrown", () => {
    const ctx = populated();
    // the game was edited elsewhere (revision differs) and the run's state is garbage the engine cannot recompute
    editStored(ctx.kv, `game.${ctx.game.id}`, (v) => { v.revision = 2; });
    editStored(ctx.kv, `session.${ctx.sessionId}`, (v) => { (v.state as { records: unknown }).records = { x: { stationId: 5 } }; });
    expect(() => ctx.store.startSession(ctx.game.id, false)).not.toThrow();
  });

  it("damaged review cards are dropped on their own", () => {
    const ctx = populated();
    expect(ctx.store.deckSummary().total).toBe(1);
    const deck = JSON.parse(ctx.kv.get(`${PREFIX}deck`)!) as Record<string, unknown>;
    deck["junk"] = "x";
    deck["junk2"] = null;
    ctx.kv.set(`${PREFIX}deck`, JSON.stringify(deck));
    expect(ctx.store.deckSummary().total).toBe(1);
    ctx.kv.set(`${PREFIX}deck`, "42");
    expect(() => ctx.store.deckSummary()).not.toThrow();
  });

  it("'delete all games' also removes damaged and unlisted games, their runs and the deck, and remembers the deletions for the cloud", () => {
    const ctx = populated();
    const second = newGame(ctx.store, "Decimals");
    const third = newGame(ctx.store, "Percent");
    ctx.store.startSession(second.id, false);
    ctx.kv.set(`${PREFIX}game.${second.id}`, "{broken"); // damaged: hidden from the library, so the Settings loop would never delete it
    ctx.kv.set(`${PREFIX}games`, JSON.stringify([ctx.game.id, second.id])); // `third` is stored but not listed
    expect(ctx.store.listGames().map((g) => g.id)).toEqual([ctx.game.id]);
    for (const g of ctx.store.listGames()) ctx.store.deleteGame(g.id); // what the screen did before: leaves the rest behind
    expect(ctx.kv.get(`${PREFIX}game.${second.id}`)).not.toBeNull();

    expect(ctx.store.deleteAll()).toBe(2); // the damaged one and the unlisted one (the first was already deleted by the loop above)
    expect(ctx.store.listGames()).toEqual([]);
    expect(ctx.kv.keys!().filter((k) => /\.(game|session|sessions)\./.test(k) || k.endsWith(".games"))).toEqual([`${PREFIX}games`]);
    expect(JSON.parse(ctx.kv.get(`${PREFIX}games`)!)).toEqual([]);
    expect(ctx.store.deckSummary().total).toBe(0);
    expect(Object.keys(ctx.store.changesSince(0).deletedGames.reduce((o, d) => ({ ...o, [d.id]: 1 }), {}))).toEqual(expect.arrayContaining([ctx.game.id, second.id, third.id]));
    expect(ctx.store.integrity()).toEqual({ games: 0, damagedGames: [], damagedSessions: [] });
    // and it works on an empty phone and again
    expect(ctx.store.deleteAll()).toBe(0);
  });

  it("'delete all games' on a full phone still empties the library", () => {
    const { kv, ctl } = flakyKV();
    const { store } = phone(1_000_000, kv);
    newGame(store);
    newGame(store, "Decimals");
    ctl.mode = "full";
    ctl.failOn = (k) => k === `${PREFIX}tombstones`;
    expect(codeOf(() => store.deleteAll())).toBe("STORAGE_FULL"); // the cloud cannot be told, but the games are gone
    expect(store.listGames()).toEqual([]);
  });

  it("each listed game says when it was last played", () => {
    const ctx = populated();
    const never = newGame(ctx.store, "Decimals");
    const rows = Object.fromEntries(ctx.store.listGames().map((g) => [g.id, g]));
    expect(rows[never.id]!.lastPlayedAt).toBeNull();
    const state = ctx.store.getSession(ctx.sessionId)!.state;
    expect(rows[ctx.game.id]!.lastPlayedAt).toBe(state.updatedAt);
    const area = findArea(ctx.game.spec, state.areaId)!;
    ctx.store.applyEvent(ctx.sessionId, { type: "talk", npcId: area.npcs[0]!.id });
    expect(ctx.store.listGames().find((g) => g.id === ctx.game.id)!.lastPlayedAt).toBeGreaterThan(state.updatedAt);
  });

  it("purgeDamaged removes exactly what integrity reports, nothing else", () => {
    const ctx = populated();
    const other = newGame(ctx.store, "Decimals");
    const otherRun = ctx.store.startSession(other.id, false).session.id;
    ctx.kv.set(`${PREFIX}game.${ctx.game.id}`, "garbage");
    ctx.kv.set(`${PREFIX}session.${otherRun}`, "garbage");
    const report = ctx.store.integrity();
    expect(report).toMatchObject({ games: 1, damagedGames: [ctx.game.id], damagedSessions: [otherRun] });
    expect(ctx.store.purgeDamaged()).toBe(2);
    expect(ctx.store.integrity()).toEqual({ games: 1, damagedGames: [], damagedSessions: [] });
    expect(ctx.store.listGames().map((g) => g.id)).toEqual([other.id]);
    expect(ctx.kv.get(`${PREFIX}game.${ctx.game.id}`)).toBeNull();
    expect(ctx.kv.get(`${PREFIX}session.${ctx.sessionId}`)).toBeNull(); // the damaged game's runs go with it
    expect(ctx.kv.get(`${PREFIX}session.${otherRun}`)).toBeNull();
    expect(ctx.kv.get(`${PREFIX}game.${other.id}`)).not.toBeNull();
  });
});

describe("restarting a game does not fill the phone with abandoned runs", () => {
  it("keeps the newest ten abandoned runs, never touches finished or unfinished ones, and keeps missed questions in the deck", () => {
    const { store, kv } = phone(1_000_000);
    const game = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
    const first = store.startSession(game.id, false);
    const area = findArea(game.spec, first.client.areaId)!;
    const st = area.stations.find((x) => x.kind === "challenge" && stationActive(game.spec, first.client, x))!;
    const opened = store.applyEvent(first.session.id, { type: "open", stationId: st.id });
    const ch = game.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
    store.applyEvent(first.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch) });
    store.applyEvent(first.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch) });
    // (the review deck is not built yet: the only record of the miss is inside the first run)

    const runs: string[] = [first.session.id];
    for (let i = 0; i < 12; i++) runs.push(store.startSession(game.id, true).session.id);
    const list = JSON.parse(kv.get(`${PREFIX}sessions.${game.id}`)!) as string[];
    expect(list).toHaveLength(MAX_ABANDONED_RUNS_PER_GAME + 1);
    expect(list[0]).toBe(runs[12]); // the live run
    expect(list).not.toContain(runs[0]);
    expect(list).not.toContain(runs[1]);
    expect(kv.get(`${PREFIX}session.${runs[0]}`)).toBeNull();
    expect(store.getSession(runs[12]!)!.status).toBe("ACTIVE");
    expect(store.deckSummary().total).toBe(1);

    // a finished run in the middle of the list is never pruned, however many restarts follow
    const keeper = runs[6]!;
    editStored(kv, `session.${keeper}`, (v) => { v.status = "COMPLETED"; });
    for (let i = 0; i < 15; i++) store.startSession(game.id, true);
    expect(store.getSession(keeper)?.status).toBe("COMPLETED");
    const after = JSON.parse(kv.get(`${PREFIX}sessions.${game.id}`)!) as string[];
    expect(after.filter((id) => store.getSession(id)?.status === "ABANDONED")).toHaveLength(MAX_ABANDONED_RUNS_PER_GAME);
    expect(after).toContain(keeper);
    expect(store.listGames()[0]!.inProgress).toBe(true);
  });

  it("a failure while tidying up never stops a game from starting and removes nothing", () => {
    const ctx = populated(); // a run with a missed question: the deck has to be written before pruning
    const { game } = ctx;
    const { kv, ctl } = flakyKV(ctx.kv);
    let now = 9_000_000;
    const store = new OfflineStore(kv, () => (now += 1000));
    for (let i = 0; i < 10; i++) store.startSession(game.id, true); // ten abandoned runs: the next restart would prune the oldest
    const listBefore = kv.get(`${PREFIX}sessions.${game.id}`);
    // the deck is empty in storage again, so the next restart must write it first; that write fails
    kv.remove(`${PREFIX}deck`);
    ctl.mode = "full";
    ctl.failOn = (k) => k === `${PREFIX}deck`;
    const run = store.startSession(game.id, true);
    expect(run.resumed).toBe(false);
    const listAfter = JSON.parse(kv.get(`${PREFIX}sessions.${game.id}`)!) as string[];
    expect(listAfter).toEqual([run.session.id, ...(JSON.parse(listBefore!) as string[])]);
    expect(ctl.failedWrites).toBeGreaterThan(0);
    expect(store.getSession(ctx.sessionId)).not.toBeNull(); // the run whose missed question could not be saved to the deck is still there
  });
});

describe("recover(): lists that were damaged or never written", () => {
  it("a damaged games list does not make the library look empty after recover()", () => {
    const ctx = populated();
    const other = newGame(ctx.store, "Decimals");
    ctx.kv.set(`${PREFIX}games`, "{oops");
    expect(ctx.store.listGames()).toEqual([]);
    expect(ctx.store.recover()).toMatchObject({ gamesRelinked: 2 });
    expect(ctx.store.listGames().map((g) => g.id).sort()).toEqual([ctx.game.id, other.id].sort());
    expect(ctx.store.listGames().find((g) => g.id === ctx.game.id)!.lastSessionId).toBe(ctx.sessionId);
  });

  it("a game list that is the wrong type is treated as empty and then rebuilt", () => {
    const ctx = populated();
    ctx.kv.set(`${PREFIX}games`, JSON.stringify({ not: "a list" }));
    ctx.store.recover();
    expect(ctx.store.listGames()).toHaveLength(1);
  });

  it("a damaged per-game run list is rebuilt from the stored runs, newest first", () => {
    const ctx = populated();
    ctx.store.startSession(ctx.game.id, true); // second run
    const ids = JSON.parse(ctx.kv.get(`${PREFIX}sessions.${ctx.game.id}`)!) as string[];
    expect(ids).toHaveLength(2);
    ctx.kv.set(`${PREFIX}sessions.${ctx.game.id}`, "nope");
    expect(ctx.store.recover()).toMatchObject({ sessionsRelinked: 2 });
    expect(JSON.parse(ctx.kv.get(`${PREFIX}sessions.${ctx.game.id}`)!)).toEqual(ids);
  });

  it("does nothing to a healthy library and never lists a game deleted here", () => {
    const ctx = populated();
    expect(ctx.store.recover()).toEqual({ gamesRelinked: 0, sessionsRelinked: 0 });
    const other = newGame(ctx.store, "Decimals");
    // a crash between "remove the game" and "forget it": records still stored, game is tombstoned, but not in the list
    ctx.kv.set(`${PREFIX}tombstones`, JSON.stringify({ [other.id]: 5 }));
    ctx.kv.set(`${PREFIX}games`, JSON.stringify([ctx.game.id]));
    ctx.store.recover();
    expect(ctx.store.listGames().map((g) => g.id)).toEqual([ctx.game.id]);
    expect(ctx.kv.get(`${PREFIX}game.${other.id}`)).toBeNull();
  });

  it("a deletion is remembered before the game is removed, and an interrupted one is finished at the next start", () => {
    const inner = memoryKV();
    const order: string[] = [];
    const kv = { ...inner, set: (k: string, v: string) => { order.push(`set ${k.slice(PREFIX.length)}`); inner.set(k, v); }, remove: (k: string) => { order.push(`remove ${k.slice(PREFIX.length)}`); inner.remove(k); } };
    const { store } = phone(1_000_000, kv);
    const g = newGame(store);
    order.length = 0;
    store.deleteGame(g.id);
    expect(order[0]).toBe("set tombstones");
    expect(order.indexOf(`remove game.${g.id}`)).toBeGreaterThan(0);

    // the app was killed right after the tombstone was written: the game is still there
    const kept = newGame(store, "Decimals");
    const other = newGame(store, "Percent");
    inner.set(`${PREFIX}tombstones`, JSON.stringify({ [kept.id]: store.getGame(kept.id)!.updatedAt + 5, [other.id]: store.getGame(other.id)!.updatedAt - 5 }));
    expect(store.listGames()).toHaveLength(2);
    store.recover();
    // `kept` is finished off; `other` was changed (restored from a backup) after the deletion, so it stays
    expect(store.listGames().map((x) => x.id)).toEqual([other.id]);
  });

  it("cannot make a duplicate entry when a game is added back under an id that is already listed", () => {
    const ctx = populated();
    ctx.store.recover();
    ctx.store.recover();
    expect(ctx.store.listGames()).toHaveLength(1);
  });
});

describe("saves from earlier app versions load and play", () => {
  it("a run saved before boss battles, without updatedAt, openedAt, recent... resumes and plays on", () => {
    const ctx = populated();
    editStored(ctx.kv, `session.${ctx.sessionId}`, (v) => {
      const st = v.state as Record<string, unknown>;
      for (const k of ["bossesDefeated", "updatedAt", "openedAt", "recent", "hintsUsed", "achievements"]) delete st[k];
      delete v.updatedAt;
      delete v.revision;
    });
    const s = ctx.store.startSession(ctx.game.id, false);
    expect(s.resumed).toBe(true);
    expect(s.client.bossesDefeated).toEqual([]);
    const area = findArea(ctx.game.spec, s.client.areaId)!;
    const r = ctx.store.applyEvent(s.session.id, { type: "talk", npcId: area.npcs[0]!.id });
    expect(r.state.talked).toContain(area.npcs[0]!.id);
    expect(ctx.store.getSession(s.session.id)!.state.bossesDefeated).toEqual([]);
  });

  it("a game saved without bosses, updatedAt or revision opens, lists and starts", () => {
    const ctx = populated();
    editStored(ctx.kv, `game.${ctx.game.id}`, (v) => {
      delete v.updatedAt;
      delete v.revision;
      delete (v.spec as { bosses?: unknown }).bosses;
      delete (v.spec as { mechanics?: unknown }).mechanics;
      delete (v.spec as { meta: { featureTier?: unknown } }).meta.featureTier;
    });
    const g = ctx.store.getGame(ctx.game.id)!;
    expect(g.spec.bosses).toEqual([]);
    expect(g.updatedAt).toBe(g.createdAt);
    expect(g.revision).toBe(1);
    expect(ctx.store.listGames()).toHaveLength(1);
    expect(ctx.store.startSession(ctx.game.id, false).resumed).toBe(true);
  });

  it("records without updatedAt count as changed at creation/start time for sync", () => {
    const ctx = populated();
    editStored(ctx.kv, `game.${ctx.game.id}`, (v) => { delete v.updatedAt; });
    editStored(ctx.kv, `session.${ctx.sessionId}`, (v) => { delete v.updatedAt; });
    const since = ctx.store.getGame(ctx.game.id)!.createdAt - 1;
    const changes = ctx.store.changesSince(since);
    expect(changes.games).toHaveLength(1);
    expect(changes.sessions).toHaveLength(1);
    expect(ctx.store.changesSince(1e15).games).toHaveLength(0);
  });

  it("normalising a current record changes nothing (so healthy data is never rewritten)", () => {
    const ctx = populated();
    const rawGame = JSON.parse(ctx.kv.get(`${PREFIX}game.${ctx.game.id}`)!) as unknown;
    const rawSession = JSON.parse(ctx.kv.get(`${PREFIX}session.${ctx.sessionId}`)!) as unknown;
    expect(normalizeGame(structuredClone(rawGame))).toEqual(rawGame);
    expect(normalizeSession(structuredClone(rawSession))).toEqual(rawSession);
  });

  it("normalizeState returns null only when there is no area to resume in, and drops unsafe keys", () => {
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState({})).toBeNull();
    expect(normalizeState({ areaId: 5 })).toBeNull();
    const s = normalizeState(JSON.parse('{"areaId":"a","served":{"__proto__":"x","ok":"y","bad":5},"resolvedStations":{"s":"correct","t":"maybe"},"records":{"constructor":{},"r":{"attempts":2}}}'))!;
    expect(s.served).toEqual({ ok: "y" });
    expect(s.resolvedStations).toEqual({ s: "correct" });
    expect(Object.keys(s.records)).toEqual(["r"]);
    expect(s.records.r).toMatchObject({ attempts: 2, wrong: 0, resolved: false, timeMs: null });
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
  });

  it("normalizeSession rejects an unknown status or a missing id instead of guessing", () => {
    const ctx = populated();
    const raw = JSON.parse(ctx.kv.get(`${PREFIX}session.${ctx.sessionId}`)!) as Record<string, unknown>;
    expect(normalizeSession({ ...raw, status: "WEIRD" })).toBeNull();
    expect(normalizeSession({ ...raw, id: 5 })).toBeNull();
    expect(normalizeSession({ ...raw, gameId: undefined })).toBeNull();
    expect(normalizeSession({ ...raw, state: "x" })).toBeNull();
    expect(normalizeSession({ ...raw, finishedAt: "soon" })?.finishedAt).toBeNull();
  });
});

describe("the offline tier stays the full tier (Play Billing does not exist yet)", () => {
  it("getOfflineTier is A and a stored game is not re-tiered by reading it", () => {
    const ctx = populated();
    expect(getOfflineTier()).toBe("A");
    expect(ctx.store.getGame(ctx.game.id)!.spec.meta.featureTier).toBe("A");
    // reading through memoryKV twice gives the same bytes: nothing is rewritten by a read
    const before = ctx.kv.get(`${PREFIX}game.${ctx.game.id}`);
    ctx.store.getGame(ctx.game.id);
    ctx.store.listGames();
    expect(ctx.kv.get(`${PREFIX}game.${ctx.game.id}`)).toBe(before);
  });

  it("memoryKV and a fresh store start empty", () => {
    expect(new OfflineStore(memoryKV()).listGames()).toEqual([]);
  });
});
