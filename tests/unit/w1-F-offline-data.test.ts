import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { createBackup, importBackup } from "@/lib/offline/backup";
import { MAX_SPEC_BYTES } from "@/lib/offline/sync";
import { findArea, stationActive } from "@/lib/game/state/progress";
import type { Challenge } from "@/lib/game/spec/schema";
import { correctAnswer, request, wrongAnswer } from "./helpers";
import { editStored, FakeCloud, NOTES, phone } from "./offline-helpers";

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;
type Phone = ReturnType<typeof phone>;
/** A cloud whose clock is close to the phones' (like real life). */
const cloudAt = (ms: number) => { const c = new FakeCloud(); c.tick = ms; return c; };
/** The shuffle/opaque-id seed the store uses for a review card (see `deckSeed` in store.ts). */
const seedOf = (key: string, reviews: number) => `deck:${key}:${reviews}`;

/**
 * Misses (then solves) one question whose answer carries opaque ids (a choice, sequence or match), so that the review deck
 * holds a card whose public answer depends on the seed. Returns the game, the run and the challenge.
 */
function missOneWithIds(p: Phone) {
  const game = p.store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
  const s = p.store.startSession(game.id, false);
  const area = findArea(game.spec, s.client.areaId)!;
  const byId = (id: string | undefined) => game.spec.challenges.find((c) => c.id === id);
  const st = area.stations.find((x) => x.kind === "challenge" && stationActive(game.spec, s.client, x) && ["choice", "sequence", "match"].includes(byId(x.challengeId)?.type ?? ""))!;
  expect(st).toBeDefined();
  const opened = p.store.applyEvent(s.session.id, { type: "open", stationId: st.id });
  const ch = byId((opened.data as { challenge: { id: string } }).challenge.id)!;
  p.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
  p.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });
  const key = Object.keys(p.store.syncDeck())[0]!;
  return { game, sessionId: s.session.id, ch, key };
}

/** Answers the deck's card correctly on the first try, with the seed of the card as it is stored now. */
function reviewRight(p: Phone, key: string, ch: Challenge) {
  const card = p.store.syncDeck()[key]!;
  const r = p.store.deckPractice({ action: "answer", challengeId: key, answer: correctAnswer(ch, seedOf(key, card.reviews)), attempt: 1 }) as { result: { correct: boolean } };
  expect(r.result.correct).toBe(true);
}

describe("a review card that arrives from the cloud keeps this phone's shuffle seed", () => {
  it("a card merged while the review screen is open still accepts the answer the screen was given", async () => {
    const cloud = cloudAt(T0);
    const a = phone(T0);
    const { game, ch, key } = missOneWithIds(a);
    await a.sync(cloud);
    const b = phone(T0 + 10_000);
    await b.sync(cloud);
    expect(b.store.syncDeck()[key]).toMatchObject({ reviews: 0, box: 1 });

    // b reviews the card once (its seed counter moves to 1) and sends that to the cloud
    b.t.now = T0 + 60_000;
    cloud.tick = b.t.now;
    reviewRight(b, key, ch);
    expect(b.store.syncDeck()[key]).toMatchObject({ reviews: 1, box: 2 });
    await b.sync(cloud);

    // a takes b's review, reviews the card again two days later and sends that: the cloud copy is now newer than b's
    a.t.now = T0 + 2 * DAY;
    cloud.tick = a.t.now;
    await a.sync(cloud);
    expect(a.store.syncDeck()[key]!.box).toBe(2);
    reviewRight(a, key, ch);
    await a.sync(cloud);
    expect(cloud.cards.get(key)!.box).toBe(3);

    // b opens the review screen: the card is due, the question is built with b's seed (reviews = 1) ...
    b.t.now = T0 + 2 * DAY + 60_000;
    cloud.tick = b.t.now;
    const started = b.store.deckPractice({ action: "start" }) as { items: { id: string }[] };
    expect(started.items.map((i) => i.id)).toEqual([key]);
    const answer = correctAnswer(ch, seedOf(key, 1));
    // ... and a sync round runs in the background (the app came to the foreground): the cloud's newer copy replaces b's card
    await b.sync(cloud);
    expect(b.store.syncDeck()[key]!.box).toBe(3);
    // the answer the screen holds is graded with the seed it was built with (used to be "invalid answer": the merge reset the counter)
    const r = b.store.deckPractice({ action: "answer", challengeId: key, answer, attempt: 1 }) as { result: { correct: boolean; resolved: boolean } };
    expect(r.result).toMatchObject({ correct: true, resolved: true });
    expect(b.store.syncDeck()[key]).toMatchObject({ reviews: 2, box: 4 }); // the seed counter never goes backwards on this phone
    expect(game.id).toBe(b.store.listGames()[0]!.id);
  });

  it("a backup import does not move the seed counter backwards either", () => {
    const a = phone(T0);
    const { ch, key } = missOneWithIds(a);
    const old = JSON.stringify(createBackup(a.store, T0 + 1)); // the card with reviews = 0
    a.t.now = T0 + 60_000;
    reviewRight(a, key, ch);
    a.t.now = T0 + DAY + 120_000;
    reviewRight(a, key, ch);
    expect(a.store.syncDeck()[key]).toMatchObject({ reviews: 2, box: 3 });
    // a copy of the card that claims to be newer than the local one but has a lower counter (another phone's count)
    const newer = JSON.parse(old) as { deck: { updatedAt: number; added: number; box: number; reviews: number }[] };
    newer.deck[0]!.updatedAt = a.t.now + DAY;
    newer.deck[0]!.added = a.t.now + DAY;
    newer.deck[0]!.box = 1;
    expect(importBackup(a.store, JSON.stringify(newer)).cardsImported).toBe(1);
    expect(a.store.syncDeck()[key]).toMatchObject({ reviews: 2, box: 1 });
  });
});

describe("a damaged game that is purged comes back from the cloud", () => {
  it("the next round reads the cloud again, so the healthy copy and its run return; nothing else changes", async () => {
    const cloud = cloudAt(T0);
    const a = phone(T0);
    const { game, sessionId, key } = missOneWithIds(a);
    const other = a.store.addGame(generateOffline(request({ subject: "Fractions" })).spec);
    await a.sync(cloud);
    await a.sync(cloud); // (the cursor is set by the first pull that returns rows)
    expect((await a.sync(cloud)).pulled).toBe(0); // the cursor is past everything
    // the game's stored data is damaged (a nested part is gone); the learner removes it from Settings
    editStored(a.kv, `game.${game.id}`, (v) => { (v.spec as { areas: unknown[] }).areas = []; });
    expect(a.store.integrity().damagedGames).toEqual([game.id]);
    expect(a.store.purgeDamaged()).toBe(1);
    expect(a.store.listGames().map((g) => g.id)).toEqual([other.id]);
    expect(a.store.deckSummary().total).toBe(0);

    a.t.now = T0 + 60_000;
    cloud.tick = a.t.now;
    const r = await a.sync(cloud);
    expect(r.pushed).toBe(0); // (a purge is not a deletion: the other phones keep the game)
    expect(a.store.listGames().map((g) => g.id).sort()).toEqual([game.id, other.id].sort());
    expect(a.store.getGame(game.id)!.spec.areas.length).toBeGreaterThan(0);
    expect(a.store.getSession(sessionId)?.status).toBe("ACTIVE");
    expect(a.store.syncDeck()[key]).toBeDefined();
    expect(cloud.games.get(game.id)!.deletedAt).toBeNull();
    expect((await a.sync(cloud)).pulled).toBe(0); // and the cursor is back in place
  });
});

describe("what stays on the phone is counted", () => {
  it("a game too large for the cloud is counted with its run and its review card", async () => {
    const cloud = cloudAt(T0);
    const a = phone(T0);
    const spec = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec;
    const big = a.store.addGame({ ...spec, learning: { ...spec.learning, conclusion: "x".repeat(MAX_SPEC_BYTES + 10) } } as typeof spec);
    const s = a.store.startSession(big.id, false);
    const area = findArea(big.spec, s.client.areaId)!;
    const st = area.stations.find((x) => x.kind === "challenge" && stationActive(big.spec, s.client, x))!;
    const opened = a.store.applyEvent(s.session.id, { type: "open", stationId: st.id });
    const ch = big.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
    a.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
    a.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });
    expect(a.store.deckSummary().total).toBe(1);
    const r = await a.sync(cloud);
    expect(r).toMatchObject({ pushed: 0, skipped: 3 }); // the game, its run and its card
    expect(cloud.games.size).toBe(0);
    expect(cloud.cards.size).toBe(0);
  });
});
