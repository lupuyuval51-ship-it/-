import { describe, expect, it } from "vitest";
import { generateOffline, OfflineGenerationError } from "@/lib/offline/generate";
import { memoryKV, OfflineError, OfflineStore } from "@/lib/offline/store";
import type { GameSpec } from "@/lib/game/spec/schema";
import { collectibleIds, findArea, stationActive, type ClientState } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer, deckSeedOf } from "./helpers";

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

type Res = ReturnType<OfflineStore["applyEvent"]>;
function playThrough(store: OfflineStore, spec: GameSpec, sessionId: string, first: ClientState, opts: { missFirst?: boolean } = {}): Res | null {
  let state = first;
  let missed = !opts.missFirst;
  const box: { last: Res | null } = { last: null };
  const send = (e: Record<string, unknown>): Res => { const r = store.applyEvent(sessionId, e); box.last = r; state = r.state; return r; };
  for (let guard = 0; guard < 30; guard++) {
    const area = findArea(spec, state.areaId)!;
    for (const n of area.npcs) if (send({ type: "talk", npcId: n.id }).completed) return box.last;
    for (const id of collectibleIds(area)) { if (!state.collected.includes(id) && send({ type: "collect", itemId: id }).completed) return box.last; }
    for (const s of area.stations) {
      if (!stationActive(spec, state, s) || state.resolvedStations[s.id] || state.visited.includes(s.id)) continue;
      if (s.kind === "lore") { if (send({ type: "visit", stationId: s.id }).completed) return box.last; continue; }
      const opened = send({ type: "open", stationId: s.id });
      const ch = spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
      if (!missed && ch.type !== "program" && ch.type !== "simulation") { send({ type: "answer", stationId: s.id, answer: wrongAnswer(ch, sessionId) }); missed = true; }
      if (send({ type: "answer", stationId: s.id, answer: correctAnswer(ch, sessionId) }).completed) return box.last;
    }
    if (area.portal) { try { send({ type: "enter_area", areaId: area.portal.toAreaId }); } catch { /* locked */ } }
  }
  return box.last;
}

describe("offline generation (no server, no AI)", () => {
  it("builds a validated study-engine game from notes, labelled as engine", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    expect(spec.meta.generator).toMatchObject({ kind: "engine", provider: "study-engine" });
    expect(spec.challenges.length).toBeGreaterThan(3);
  });
  it("builds a labelled demo game without notes", () => {
    const { spec } = generateOffline(request({ contentLanguage: "he" }));
    expect(spec.meta.generator).toMatchObject({ kind: "demo" });
    expect(spec.meta.language).toBe("he");
  });
  it("rejects bad requests and unusable notes with a clear code", () => {
    expect(() => generateOffline({ mode: "FAST" })).toThrow(OfflineGenerationError);
    try { generateOffline(request({ material: "too short to be a lesson but long enough to pass the box" })); expect.unreachable(); }
    catch (e) { expect((e as OfflineGenerationError).code).toBe("MATERIAL_UNUSABLE"); }
  });
});

describe("offline store: the same rules as the server, on the device", () => {
  it("plays a whole game: completes, saves best score, results and review, then replays fresh", () => {
    let now = 1_000_000;
    const store = new OfflineStore(memoryKV(), () => (now += 1000));
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    const game = store.addGame(spec);
    const s = store.startSession(game.id, false);
    expect(s.resumed).toBe(false);
    expect((s.spec as { challenges: unknown[] }).challenges).toEqual([]); // public spec only
    const done = playThrough(store, spec, s.session.id, s.client, { missFirst: true });
    expect(done?.completed).toBe(true);
    expect(done?.summary?.completed).toBe(true);
    const row = store.listGames()[0]!;
    expect(row).toMatchObject({ id: game.id, inProgress: false, generatorKind: "engine" });
    expect(row.bestScore).toBe(done!.summary!.score);
    const r = store.results(s.session.id)!;
    expect(r.review.length).toBe(1);
    // practice: only the missed question, unscored
    const items = store.practice(s.session.id, { action: "start" }) as { items: { id: string }[] };
    expect(items.items.map((i) => i.id)).toEqual([r.review[0]!.challengeId]);
    expect(() => store.practice(s.session.id, { action: "hint", challengeId: "nope" })).toThrow(OfflineError);
    // finished sessions take no more events
    expect(() => store.applyEvent(s.session.id, { type: "talk", npcId: "x" })).toThrow(/finished/);
    const again = store.startSession(game.id, false);
    expect(again.session.id).not.toBe(s.session.id);
    expect(again.client.score).toBe(0);
  });

  it("resumes an unfinished session, restart abandons it, delete removes everything", () => {
    const kv = memoryKV();
    const store = new OfflineStore(kv);
    const game = store.addGame(generateOffline(request()).spec);
    const a = store.startSession(game.id, false);
    const area = findArea(game.spec, a.client.areaId)!;
    const item = collectibleIds(area)[0]!;
    store.applyEvent(a.session.id, { type: "collect", itemId: item });
    const b = new OfflineStore(kv).startSession(game.id, false); // survives a "restart" of the app
    expect(b.resumed).toBe(true);
    expect(b.client.collected).toContain(item);
    const c = store.startSession(game.id, true);
    expect(c.session.id).not.toBe(a.session.id);
    expect(store.getSession(a.session.id)?.status).toBe("ABANDONED");
    expect(() => store.applyEvent(a.session.id, { type: "collect", itemId: item })).toThrow(OfflineError);
    store.deleteGame(game.id);
    expect(store.listGames()).toEqual([]);
    expect(store.getSession(c.session.id)).toBeNull();
  });

  it("rejects malformed events the same way the API does", () => {
    const store = new OfflineStore(memoryKV());
    const game = store.addGame(generateOffline(request()).spec);
    const s = store.startSession(game.id, false);
    try { store.applyEvent(s.session.id, { type: "hack", score: 1e9 }); expect.unreachable(); }
    catch (e) { expect((e as OfflineError).code).toBe("VALIDATION_ERROR"); }
  });
});

describe("review deck: spaced repetition across games", () => {
  it("collects missed questions from every game, schedules 1/3/7/16 days, resets on a miss, and graduates", async () => {
    const { review, newCard, dueCards, BOX_INTERVAL_DAYS } = await import("@/lib/offline/deck");
    const DAY = 86_400_000;
    let c = newCard("g", "c", 0)!;
    expect(dueCards([c], 0)).toHaveLength(1);
    for (const days of BOX_INTERVAL_DAYS) {
      const next = review(c, true, c.due)!;
      expect(next.due - c.due).toBe(days * DAY);
      c = next;
    }
    expect(review(c, true, c.due)).toBeNull(); // mastered
    const missed = review({ ...c, box: 3 }, false, 1000)!;
    expect(missed.box).toBe(1);
    expect(missed.due).toBeGreaterThan(1000);
  });

  it("serves due questions from all games through the store, grades them, and moves them through the boxes", () => {
    let now = 1_000_000;
    const store = new OfflineStore(memoryKV(), () => now);
    const a = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
    const s = store.startSession(a.id, false);
    // miss one question, then solve it
    const area = findArea(a.spec, s.client.areaId)!;
    const st = area.stations.find((x) => x.kind === "challenge" && stationActive(a.spec, s.client, x))!;
    const opened = store.applyEvent(s.session.id, { type: "open", stationId: st.id });
    const ch = a.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
    store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
    store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });

    expect(store.deckSummary()).toMatchObject({ total: 1, due: 1 });
    const started = store.deckPractice({ action: "start" }) as { items: { id: string }[] };
    expect(started.items).toHaveLength(1);
    const key = started.items[0]!.id;
    const res = store.deckPractice({ action: "answer", challengeId: key, answer: correctAnswer(ch, deckSeedOf(store, key)), attempt: 1 }) as { result: { correct: boolean; resolved: boolean } };
    expect(res.result).toMatchObject({ correct: true, resolved: true });
    expect(store.deckSummary()).toMatchObject({ total: 1, due: 0 });
    now += 86_400_000 + 1;
    expect(store.deckSummary().due).toBe(1);
    // a miss resets the card to box 1 and brings it back soon
    store.deckPractice({ action: "answer", challengeId: key, answer: wrongAnswer(ch, deckSeedOf(store, key)), attempt: 3 });
    expect(store.deckSummary().due).toBe(0);
    now += 11 * 60 * 1000;
    expect(store.deckSummary().due).toBe(1);
    expect(() => store.deckPractice({ action: "hint", challengeId: "nope" })).toThrow(OfflineError);
    // deleting the game removes its cards
    store.deleteGame(a.id);
    expect(store.deckSummary().total).toBe(0);
  });
});
