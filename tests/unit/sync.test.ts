import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import { MAX_SPEC_BYTES, readSyncState, syncOnce, type CloudApi, type CloudCard, type CloudGame, type CloudRows, type CloudSession, type PushBatch } from "@/lib/offline/sync";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer } from "./helpers";

/** The cloud, in memory: the server stamps updatedAt with its own monotonic clock (like the database trigger does). */
class FakeCloud implements CloudApi {
  games = new Map<string, CloudGame>();
  sessions = new Map<string, CloudSession>();
  cards = new Map<string, CloudCard>();
  tick = Date.parse("2030-01-01T00:00:00Z");
  fail = false;
  pushes = 0;
  private stamp() { this.tick += 1000; return new Date(this.tick).toISOString(); }
  async pull(since: string | null): Promise<CloudRows> {
    if (this.fail) throw new Error("offline");
    const after = <T extends { updatedAt: string }>(m: Map<string, T>) => [...m.values()].filter((r) => since === null || r.updatedAt > since).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    return structuredClone({ games: after(this.games), sessions: after(this.sessions), cards: after(this.cards) });
  }
  async push(b: PushBatch): Promise<void> {
    if (this.fail) throw new Error("offline");
    this.pushes++;
    for (const g of b.games) this.games.set(g.localId, { ...structuredClone(g), updatedAt: this.stamp(), deletedAt: null });
    for (const s of b.sessions) {
      if (!this.games.has(s.gameId)) throw new Error("foreign key");
      this.sessions.set(s.localId, { ...structuredClone(s), updatedAt: this.stamp() });
    }
    for (const c of b.cards) this.cards.set(c.cardKey, { ...structuredClone(c), updatedAt: this.stamp() });
    for (const id of b.deletedGames) { const g = this.games.get(id); if (g) this.games.set(id, { ...g, deletedAt: this.stamp(), updatedAt: this.stamp() }); }
  }
}

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

function phone(startMs: number) {
  const t = { now: startMs };
  const kv = memoryKV();
  const store = new OfflineStore(kv, () => (t.now += 10));
  return { t, kv, store, sync: (cloud: CloudApi, user = "u1") => syncOnce(store, kv, cloud, user, () => t.now) };
}

function missAndSolveOne(p: ReturnType<typeof phone>, gameId: string) {
  const g = p.store.getGame(gameId)!;
  const s = p.store.startSession(gameId, false);
  const area = findArea(g.spec, s.client.areaId)!;
  const st = area.stations.find((x) => x.kind === "challenge" && stationActive(g.spec, s.client, x))!;
  const opened = p.store.applyEvent(s.session.id, { type: "open", stationId: st.id });
  const ch = g.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
  p.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch) });
  p.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch) });
  return { sessionId: s.session.id, ch };
}

describe("cloud sync: two phones, one account", () => {
  it("a new phone receives games, progress and the review deck; a second sync moves nothing", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    const game = a.store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
    const { sessionId } = missAndSolveOne(a, game.id);
    a.store.deckSummary(); // builds the review deck from the missed question
    const first = await a.sync(cloud);
    expect(first.pushed).toBeGreaterThanOrEqual(3);
    expect((await a.sync(cloud)).pushed).toBe(0);

    const b = phone(5_000_000);
    const got = await b.sync(cloud);
    expect(got.pulled).toBeGreaterThanOrEqual(3);
    expect(b.store.getGame(game.id)?.title).toBe(game.title);
    expect(b.store.getSession(sessionId)?.state.score).toBe(a.store.getSession(sessionId)?.state.score);
    expect(b.store.deckSummary().total).toBe(1);
    // resuming on the second phone continues the same run
    expect(b.store.startSession(game.id, false)).toMatchObject({ resumed: true });
    expect((await b.sync(cloud)).pulled).toBe(0);
  });

  it("deleting a game on one phone removes it from the other; it does not come back", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000), b = phone(2_000_000);
    const game = a.store.addGame(generateOffline(request()).spec);
    await a.sync(cloud);
    await b.sync(cloud);
    expect(b.store.listGames()).toHaveLength(1);
    a.t.now += 1000;
    a.store.deleteGame(game.id);
    await a.sync(cloud);
    await b.sync(cloud);
    expect(b.store.listGames()).toEqual([]);
    await a.sync(cloud);
    await b.sync(cloud);
    expect(a.store.listGames()).toEqual([]);
    expect(b.store.listGames()).toEqual([]);
  });

  it("last write wins when both phones changed the same run; the newer change survives", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000), b = phone(1_000_000);
    const game = a.store.addGame(generateOffline(request()).spec);
    const { sessionId } = missAndSolveOne(a, game.id);
    await a.sync(cloud);
    await b.sync(cloud);
    // both change the run, b later than a
    a.t.now += 50_000;
    const sa = a.store.getSession(sessionId)!;
    const area = findArea(game.spec, sa.state.areaId)!;
    const item = area.collectibles.count > 0 ? `${area.id}:c0` : null;
    expect(item).not.toBeNull();
    a.store.applyEvent(sessionId, { type: "collect", itemId: item! });
    b.t.now += 90_000;
    b.store.applyEvent(sessionId, { type: "talk", npcId: area.npcs[0]!.id });
    await a.sync(cloud);
    await b.sync(cloud); // b is newer: its version is pushed
    await a.sync(cloud);
    expect(a.store.getSession(sessionId)?.state.talked).toEqual(b.store.getSession(sessionId)?.state.talked);
    expect(a.store.getSession(sessionId)?.updatedAt).toBeGreaterThan(0);
  });

  it("a failed round changes nothing and the next one retries", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    a.store.addGame(generateOffline(request()).spec);
    cloud.fail = true;
    await expect(a.sync(cloud)).rejects.toThrow("offline");
    expect(readSyncState(a.kv).lastPushMs).toBe(0);
    cloud.fail = false;
    expect((await a.sync(cloud)).pushed).toBe(1);
    expect(cloud.games.size).toBe(1);
  });

  it("a game too large for the cloud stays on the phone and does not break the sync", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    const spec = generateOffline(request()).spec;
    const big = a.store.addGame({ ...spec, learning: { ...spec.learning, conclusion: "x".repeat(MAX_SPEC_BYTES + 10) } } as typeof spec);
    a.store.addGame(generateOffline(request({ subject: "Fractions" })).spec);
    missAndSolveOne(a, big.id);
    const r = await a.sync(cloud);
    expect(r.skipped).toBeGreaterThanOrEqual(1);
    expect(cloud.games.size).toBe(1);
    expect(cloud.sessions.size).toBe(0);
  });

  it("another account on the same phone starts from a clean sync state", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000);
    a.store.addGame(generateOffline(request()).spec);
    await a.sync(cloud, "user-1");
    const other = new FakeCloud();
    const r = await a.sync(other, "user-2");
    expect(r.pushed).toBe(1);
    expect(readSyncState(a.kv).userId).toBe("user-2");
  });

  it("only one unfinished run per game after two phones each started one", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000), b = phone(1_000_000);
    const game = a.store.addGame(generateOffline(request()).spec);
    await a.sync(cloud);
    await b.sync(cloud);
    const sa = a.store.startSession(game.id, false).session.id;
    b.t.now += 5000;
    const sb = b.store.startSession(game.id, false).session.id;
    await a.sync(cloud);
    await b.sync(cloud);
    await a.sync(cloud);
    const kept = a.store.startSession(game.id, false);
    expect(kept.session.id).toBe(sb); // the newest run wins
    expect(a.store.getSession(sa)?.status).toBe("ABANDONED");
  });
});

describe("store change notifications", () => {
  it("fire for the user's own changes but not while merging cloud rows", async () => {
    const cloud = new FakeCloud();
    const a = phone(1_000_000), b = phone(2_000_000);
    a.store.addGame(generateOffline(request()).spec);
    await a.sync(cloud);
    let n = 0;
    b.store.subscribe(() => n++);
    await b.sync(cloud);
    expect(b.store.listGames()).toHaveLength(1);
    expect(n).toBe(0);
    b.store.addGame(generateOffline(request({ subject: "Fractions" })).spec);
    expect(n).toBeGreaterThan(0);
  });
});
