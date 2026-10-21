import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { MASTERED_AFTER_BOX, MAX_PER_SESSION, RETRY_DELAY_MS, deckBodySchema, dueCards, newCard, review, type DeckCard } from "@/lib/offline/deck";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineError, OfflineStore, type StoredGame } from "@/lib/offline/store";
import { collectibleIds, findArea, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, deckSeedOf, request, wrongAnswer } from "./helpers";
import { NOTES, PREFIX } from "./offline-helpers";

/**
 * What the existing suites leave open in the device's rules engine: a run that is no longer active, the whole review-round
 * state machine (attempts, reveal, first-try, mastery, the round size), and what is (not) sent to the cloud afterwards.
 */

const DAY = 86_400_000;
const code = (fn: () => unknown): string | undefined => {
  try { fn(); } catch (e) { return (e as OfflineError).code; }
  return undefined;
};
const status = (fn: () => unknown): number | undefined => {
  try { fn(); } catch (e) { return (e as OfflineError).status; }
  return undefined;
};

function fullGame(store: OfflineStore): StoredGame {
  return store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
}

describe("a run that is not active takes no moves", () => {
  function started() {
    let now = 5_000_000;
    const kv = memoryKV();
    const store = new OfflineStore(kv, () => (now += 10));
    const game = fullGame(store);
    const s = store.startSession(game.id, false);
    return { kv, store, game, s, tick: (ms: number) => { now += ms; } };
  }

  it("an abandoned run answers SESSION_ENDED (409) to every move, finish included, and stays exactly as it was", () => {
    const { store, game, s } = started();
    store.startSession(game.id, true); // restart: the first run is abandoned
    const before = JSON.stringify(store.getSession(s.session.id));
    expect(store.getSession(s.session.id)?.status).toBe("ABANDONED");
    for (const move of [{ type: "finish" }, { type: "talk", npcId: "x" }, { type: "save", position: { x: 0, y: 0, z: 0, yaw: 0 } }]) {
      expect(code(() => store.applyEvent(s.session.id, move)), JSON.stringify(move)).toBe("SESSION_ENDED");
      expect(status(() => store.applyEvent(s.session.id, move))).toBe(409);
    }
    expect(JSON.stringify(store.getSession(s.session.id))).toBe(before);
  });

  it("a finished run answers SESSION_COMPLETED (409) to a move, but 'finish' again just returns the summary without touching the run", () => {
    const { kv, store, game, s } = started();
    // finish the run the quickest legal way: let the stored run say it is finished, then ask once
    const run = JSON.parse(kv.get(`${PREFIX}session.${s.session.id}`)!);
    run.status = "COMPLETED";
    run.finishedAt = 6_000_000;
    run.state.finished = true;
    kv.set(`${PREFIX}session.${s.session.id}`, JSON.stringify(run));
    const before = JSON.stringify(store.getSession(s.session.id));
    const again = store.applyEvent(s.session.id, { type: "finish" });
    expect(again.completed).toBe(true);
    expect(again.summary).toBeTruthy();
    expect(again.newAchievements).toEqual([]);
    expect(again.newlyCompletedMissions).toEqual([]);
    expect(code(() => store.applyEvent(s.session.id, { type: "talk", npcId: "x" }))).toBe("SESSION_COMPLETED");
    expect(status(() => store.applyEvent(s.session.id, { type: "talk", npcId: "x" }))).toBe(409);
    expect(JSON.stringify(store.getSession(s.session.id))).toBe(before); // not even the change stamp moved: nothing is pushed again
    // and the library says the run is done, not in progress
    expect(store.gameSummary(game.id)).toMatchObject({ inProgress: false, completed: true });
  });

  it("an unknown run, and a run whose game is gone, answer 404 NOT_FOUND", () => {
    const { kv, store, game, s } = started();
    expect(code(() => store.applyEvent("no-such-run", { type: "finish" }))).toBe("NOT_FOUND");
    kv.remove(`${PREFIX}game.${game.id}`); // the game record is lost, the run record remains
    expect(code(() => store.applyEvent(s.session.id, { type: "finish" }))).toBe("NOT_FOUND");
    expect(code(() => store.startSession(game.id, false))).toBe("NOT_FOUND");
  });

  it("a validation error is checked before the run's state, so a bad request to a finished run is still a 400", () => {
    const { store, game } = started();
    const s2 = store.startSession(game.id, true);
    store.startSession(game.id, true); // s2 is abandoned now
    expect(code(() => store.applyEvent(s2.session.id, { type: "hack" }))).toBe("VALIDATION_ERROR");
  });
});

describe("a refused move changes nothing and tells nobody", () => {
  it("every refusal has the right status (state errors 409, bad references 400); the stored run keeps its stamp and no listener fires", () => {
    let now = 7_000_000;
    const store = new OfflineStore(memoryKV(), () => (now += 10));
    const game = fullGame(store);
    const s = store.startSession(game.id, false);
    const sid = s.session.id;
    const area1 = findArea(game.spec, s.client.areaId)!;
    const area2 = game.spec.areas.find((a) => a.id !== area1.id)!;
    const farStation = area2.stations.find((x) => x.kind === "challenge")!;
    const lockedHere = area1.stations.find((x) => x.kind === "challenge" && !stationActive(game.spec, s.client, x));
    const usable = area1.stations.filter((x) => x.kind === "challenge" && stationActive(game.spec, s.client, x));
    const unopened = usable[1]!;
    const opened = usable[0]!;
    const challengeOf = (r: { data: unknown }) => game.spec.challenges.find((c) => c.id === (r.data as { challenge: { id: string } }).challenge.id)!;
    const ch = challengeOf(store.applyEvent(sid, { type: "open", stationId: opened.id }));

    const refusals: [string, Record<string, unknown>, string, number][] = [
      ["a station of another area", { type: "open", stationId: farStation.id }, "WRONG_AREA", 409],
      ["a station that does not exist", { type: "open", stationId: "does-not-exist" }, "UNKNOWN_STATION", 400],
      ["answering a station that was never opened", { type: "answer", stationId: unopened.id, answer: { type: "numeric", value: 1 } }, "NOT_OPENED", 409],
      ["a hint for a station that was never opened", { type: "hint", stationId: unopened.id }, "NOT_OPENED", 409],
      ["an answer of another kind than the question", { type: "answer", stationId: opened.id, answer: ch.type === "numeric" ? { type: "choice", optionId: "a" } : { type: "numeric", value: 1 } }, "BAD_ANSWER", 400],
      ["a portal that does not exist", { type: "enter_area", areaId: "nowhere" }, "NO_PORTAL", 409],
      ["the real portal before its missions are done", { type: "enter_area", areaId: area1.portal!.toAreaId }, "PORTAL_LOCKED", 409],
      ["finishing before everything is done (the device decides, not the screen)", { type: "finish" }, "NOT_COMPLETE", 409],
      ["a person who is not here", { type: "talk", npcId: "nobody" }, "UNKNOWN_NPC", 400],
      ["an item that is not here", { type: "collect", itemId: "no-such-item" }, "UNKNOWN_ITEM", 400],
      ["an information point that is a question", { type: "visit", stationId: opened.id }, "NOT_LORE", 400],
      ...(lockedHere ? [["a question that is still locked", { type: "open", stationId: lockedHere.id }, "STATION_LOCKED", 409] as [string, Record<string, unknown>, string, number]] : []),
    ];
    let notified = 0;
    store.subscribe(() => { notified++; });
    const before = JSON.stringify(store.getSession(sid));
    for (const [what, event, wantCode, wantStatus] of refusals) {
      let err: OfflineError | null = null;
      try { store.applyEvent(sid, event); } catch (e) { err = e as OfflineError; }
      expect(err, what).toBeInstanceOf(OfflineError);
      expect([err!.code, err!.status], what).toEqual([wantCode, wantStatus]);
    }
    expect(JSON.stringify(store.getSession(sid))).toBe(before); // not an attempt, not a stamp, nothing to push
    expect(notified).toBe(0);
  });

  it("a finished question and a collected item cannot be taken twice (409), and the second try costs nothing", () => {
    let now = 8_000_000;
    const store = new OfflineStore(memoryKV(), () => (now += 10));
    const game = fullGame(store);
    const s = store.startSession(game.id, false);
    const sid = s.session.id;
    const area = findArea(game.spec, s.client.areaId)!;
    const st = area.stations.find((x) => x.kind === "challenge" && stationActive(game.spec, s.client, x))!;
    const opened = store.applyEvent(sid, { type: "open", stationId: st.id });
    const ch = game.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
    store.applyEvent(sid, { type: "answer", stationId: st.id, answer: correctAnswer(ch, sid) });
    const item = collectibleIds(area)[0];
    if (item) store.applyEvent(sid, { type: "collect", itemId: item });
    const before = JSON.stringify(store.getSession(sid));
    const again = (e: Record<string, unknown>) => { try { store.applyEvent(sid, e); return null; } catch (err) { return err as OfflineError; } };
    const second = again({ type: "open", stationId: st.id });
    expect([second?.code, second?.status]).toEqual(["ALREADY_RESOLVED", 409]);
    expect(again({ type: "answer", stationId: st.id, answer: correctAnswer(ch, sid) })?.code).toBe("ALREADY_RESOLVED");
    if (item) {
      const twice = again({ type: "collect", itemId: item });
      expect([twice?.code, twice?.status]).toEqual(["ALREADY_COLLECTED", 409]);
    }
    expect(JSON.stringify(store.getSession(sid))).toBe(before);
  });
});

// ───────────────────────────── the review round ─────────────────────────────

/** A device with one game whose first `n` challenges are all in the review deck, written straight into storage. */
function deckWith(n: number, due: (i: number) => number, tweak: (c: DeckCard, i: number) => DeckCard = (c) => c) {
  let now = 20_000_000;
  const kv = memoryKV();
  const store = new OfflineStore(kv, () => now);
  const game = fullGame(store);
  const chosen = game.spec.challenges.slice(0, n);
  const deck: Record<string, DeckCard> = {};
  chosen.forEach((ch, i) => {
    const card = tweak({ ...newCard(game.id, ch.id, 1000 + i), due: due(i) }, i);
    deck[card.key] = card;
  });
  kv.set(`${PREFIX}deck`, JSON.stringify(deck));
  return { kv, store, game, chosen, set: (t: number) => { now = t; }, now: () => now };
}
type Round = { items: { id: string }[] };
type Answered = { result: { correct: boolean; resolved: boolean; revealed: boolean; attemptsLeft: number; pointsAwarded: number; explanation?: string; reveal?: unknown } };

describe("review round: size, order and what is asked", () => {
  it("asks at most one session's worth, the longest-waiting first; later ones wait for the next round", () => {
    const t = deckWith(12, (i) => 5_000 - i * 10); // card 11 has waited longest
    const items = (t.store.deckPractice({ action: "start" }) as Round).items;
    expect(items).toHaveLength(MAX_PER_SESSION);
    expect(items.map((i) => i.id)).toEqual(t.chosen.slice(2).reverse().map((c) => `${t.game.id}.${c.id}`));
    // the badge counts everything that is due, the round only asks ten
    expect(t.store.deckSummary()).toMatchObject({ total: 12, due: 12 });
  });

  it("never asks a mastered card, a card that is not due yet, or a question its game no longer has; the badge agrees", () => {
    const t = deckWith(4, () => 1000, (c, i) => (i === 0 ? { ...c, mastered: true } : i === 1 ? { ...c, due: 99_000_000 } : c));
    // a card for a challenge that is not in the game any more
    const deck = JSON.parse(t.kv.get(`${PREFIX}deck`)!) as Record<string, DeckCard>;
    const ghost = newCard(t.game.id, "removed-challenge", 1000);
    deck[ghost.key] = ghost;
    t.kv.set(`${PREFIX}deck`, JSON.stringify(deck));
    const ids = (t.store.deckPractice({ action: "start" }) as Round).items.map((i) => i.id);
    expect(ids.sort()).toEqual([t.chosen[2]!, t.chosen[3]!].map((c) => `${t.game.id}.${c.id}`).sort());
    expect(t.store.deckSummary()).toEqual({ total: 3, due: 2, nextDue: 99_000_000 });
  });

  it("a round never carries the answer: no explanation text and no solution field in what the screen gets", () => {
    const t = deckWith(3, () => 1000);
    const text = JSON.stringify(t.store.deckPractice({ action: "start" }));
    for (const ch of t.chosen) {
      expect(text).not.toContain(ch.explanation);
    }
    expect(text).not.toMatch(/"(explanation|correctOptionId|solution)"/);
  });
});

describe("review round: answering", () => {
  const first = () => {
    const t = deckWith(1, () => 1000);
    const ch = t.chosen[0]!;
    const key = `${t.game.id}.${ch.id}`;
    t.set(30_000_000);
    const answer = (a: "right" | "wrong", attempt: number) => {
      const seed = deckSeedOf(t.store, key);
      return t.store.deckPractice({ action: "answer", challengeId: key, answer: a === "right" ? correctAnswer(ch, seed) : wrongAnswer(ch, seed), attempt }) as Answered;
    };
    const card = () => t.store.syncDeck()[key]!;
    return { ...t, ch, key, answer, card };
  };

  it("a wrong answer before the last attempt is not a result: the card, its due date and the cloud see nothing", () => {
    const t = first();
    const before = JSON.stringify(t.card());
    for (let attempt = 1; attempt < MAX_ATTEMPTS_PER_CHALLENGE; attempt++) {
      const r = t.answer("wrong", attempt).result;
      expect(r).toMatchObject({ correct: false, resolved: false, revealed: false, attemptsLeft: MAX_ATTEMPTS_PER_CHALLENGE - attempt, pointsAwarded: 0 });
      expect(r.explanation).toBeUndefined();
      expect(r.reveal).toBeUndefined();
    }
    expect(JSON.stringify(t.card())).toBe(before);
    expect(t.store.changesSince(t.now()).cards).toEqual([]);
  });

  it("the last wrong attempt reveals the solution with its explanation, and the card starts again in box 1, ten minutes from now", () => {
    const t = first();
    const r = t.answer("wrong", MAX_ATTEMPTS_PER_CHALLENGE).result;
    expect(r).toMatchObject({ correct: false, resolved: true, revealed: true, attemptsLeft: 0, explanation: t.ch.explanation });
    expect(r.reveal).toBeTruthy();
    expect(t.card()).toMatchObject({ box: 1, due: t.now() + RETRY_DELAY_MS, reviews: 1, mastered: false });
    expect(t.store.changesSince(0).cards.map((c) => c.key)).toContain(t.key);
  });

  it("a right answer on the first try moves the card up and out by that box's days; the next question gets a new shuffle", () => {
    const t = first();
    const seedBefore = deckSeedOf(t.store, t.key);
    const r = t.answer("right", 1).result;
    expect(r).toMatchObject({ correct: true, resolved: true, revealed: false, pointsAwarded: 0 });
    expect(t.card()).toMatchObject({ box: 2, due: t.now() + DAY, reviews: 1 });
    expect(deckSeedOf(t.store, t.key)).not.toBe(seedBefore);
  });

  it("a right answer on a later attempt resolves the question but counts as a miss: back to box 1", () => {
    const t = first();
    // lift the card first so a reset is visible
    t.answer("right", 1);
    t.set(t.now() + 2 * DAY);
    const second = t.answer("right", 2).result;
    expect(second).toMatchObject({ correct: true, resolved: true, revealed: false });
    expect(t.card()).toMatchObject({ box: 1, due: t.now() + RETRY_DELAY_MS });
  });

  it("the last box graduates the card: it is kept as mastered (so another phone does not bring it back) and never asked again", () => {
    const t = deckWith(1, () => 1000, (c) => ({ ...c, box: MASTERED_AFTER_BOX }));
    const ch = t.chosen[0]!;
    const key = `${t.game.id}.${ch.id}`;
    const r = t.store.deckPractice({ action: "answer", challengeId: key, answer: correctAnswer(ch, deckSeedOf(t.store, key)), attempt: 1 }) as Answered;
    expect(r.result).toMatchObject({ correct: true, resolved: true });
    expect(t.store.syncDeck()[key]).toMatchObject({ mastered: true });
    expect((t.store.deckPractice({ action: "start" }) as Round).items).toEqual([]);
    expect(t.store.deckSummary()).toEqual({ total: 0, due: 0, nextDue: null });
    expect(t.store.changesSince(0).cards.find((c) => c.key === key)?.mastered).toBe(true); // the cloud is told
    // a missed question that was graduated is not re-added by the next scan of the runs
    t.store.syncDeck();
    expect(t.store.syncDeck()[key]?.mastered).toBe(true);
  });

  it("a hint is free and changes nothing; a question that is not in the deck has no hint", () => {
    const t = first();
    const before = JSON.stringify(t.card());
    expect(t.store.deckPractice({ action: "hint", challengeId: t.key })).toEqual({ hint: t.ch.hint ?? null });
    expect(JSON.stringify(t.card())).toBe(before);
    expect(code(() => t.store.deckPractice({ action: "hint", challengeId: "other.thing" }))).toBe("NOT_FOUND");
  });

  it("answering a card whose game or challenge is gone is a 404, not a crash or a result", () => {
    const t = first();
    const deck = JSON.parse(t.kv.get(`${PREFIX}deck`)!) as Record<string, DeckCard>;
    const ghost = newCard(t.game.id, "removed-challenge", 1000);
    deck[ghost.key] = ghost;
    t.kv.set(`${PREFIX}deck`, JSON.stringify(deck));
    expect(code(() => t.store.deckPractice({ action: "answer", challengeId: ghost.key, answer: { type: "numeric", value: 1 }, attempt: 1 }))).toBe("NOT_FOUND");
    expect(code(() => t.store.deckPractice({ action: "hint", challengeId: ghost.key }))).toBe("NOT_FOUND");
  });

  it("a malformed request is a 400 and never grades anything", () => {
    const t = first();
    const before = JSON.stringify(t.card());
    const ok = { action: "answer", challengeId: t.key, answer: { type: "numeric", value: 1 }, attempt: 1 };
    for (const bad of [
      { ...ok, attempt: 0 }, { ...ok, attempt: MAX_ATTEMPTS_PER_CHALLENGE + 1 }, { ...ok, attempt: 1.5 }, { ...ok, challengeId: "x".repeat(121) },
      { ...ok, answer: { type: "numeric", value: Number.NaN } }, { ...ok, answer: { type: "numeric", value: Infinity } }, { action: "reset" }, null, "start", 7,
    ]) expect(code(() => t.store.deckPractice(bad)), JSON.stringify(bad)).toBe("VALIDATION_ERROR");
    expect(JSON.stringify(t.card())).toBe(before);
  });
});

describe("deck.ts rules on their own", () => {
  const card = (key: string, due: number, added: number, over: Partial<DeckCard> = {}): DeckCard => ({ ...newCard("g", key, added), due, ...over });

  it("dueCards: due ones only, longest wait first, equal waits by the older card, capped, and the input is left alone", () => {
    const cards = [card("c", 100, 5), card("b", 100, 1), card("a", 50, 9), card("future", 1001, 0), card("done", 10, 0, { mastered: true })];
    const snapshot = JSON.stringify(cards);
    expect(dueCards(cards, 1000).map((c) => c.challengeId)).toEqual(["a", "b", "c"]);
    expect(dueCards(cards, 1000, 2).map((c) => c.challengeId)).toEqual(["a", "b"]);
    expect(dueCards(cards, 1001).map((c) => c.challengeId)).toContain("future"); // due exactly now counts
    expect(dueCards(cards, 99)).toEqual([card("a", 50, 9)]);
    expect(dueCards([], 1000)).toEqual([]);
    expect(JSON.stringify(cards)).toBe(snapshot);
  });

  it("review: a miss never lowers `reviews`, a pass in the last box returns null, and the input card is not changed", () => {
    const c = card("x", 0, 0, { box: 3, reviews: 4 });
    const missed = review(c, false, 1000)!;
    expect(missed).toMatchObject({ box: 1, due: 1000 + RETRY_DELAY_MS, reviews: 5, updatedAt: 1000 });
    const passed = review(c, true, 1000)!;
    expect(passed).toMatchObject({ box: 4, due: 1000 + 7 * DAY, reviews: 5, updatedAt: 1000 });
    expect(review({ ...c, box: MASTERED_AFTER_BOX }, true, 1000)).toBeNull();
    expect(review({ ...c, box: MASTERED_AFTER_BOX }, false, 1000)).toMatchObject({ box: 1 }); // a miss even at the end starts over
    expect(c).toMatchObject({ box: 3, reviews: 4, due: 0 });
  });

  it("the round request: three actions, attempts 1..max, ids of a sane length", () => {
    expect(deckBodySchema.safeParse({ action: "start" }).success).toBe(true);
    expect(deckBodySchema.safeParse({ action: "hint", challengeId: "g.c" }).success).toBe(true);
    expect(deckBodySchema.safeParse({ action: "hint" }).success).toBe(false);
    for (const attempt of [1, MAX_ATTEMPTS_PER_CHALLENGE]) expect(deckBodySchema.safeParse({ action: "answer", challengeId: "g.c", answer: { type: "choice", optionId: "a" }, attempt }).success).toBe(true);
    for (const attempt of [0, -1, MAX_ATTEMPTS_PER_CHALLENGE + 1, 2.5, "1"]) expect(deckBodySchema.safeParse({ action: "answer", challengeId: "g.c", answer: { type: "choice", optionId: "a" }, attempt }).success).toBe(false);
  });
});
