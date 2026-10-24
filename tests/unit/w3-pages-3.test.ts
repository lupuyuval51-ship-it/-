import { createElement as h, type ComponentType, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { browserKV, OfflineStore } from "@/lib/offline/store";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { generateOffline } from "@/lib/offline/generate";
import { correctAnswer, request, wrongAnswer } from "./helpers";
import { NOTES } from "./offline-helpers";

/**
 * "Review my mistakes" (mobile/src/pages/Deck.tsx): the "all caught up" screen must not stay frozen at the moment it was opened.
 * It counts again when the next card falls due and when the app comes back to the front; a round on screen is never replaced.
 */

vi.mock("../../mobile/src/cloud/account", () => ({ useAccount: () => ({ session: null, status: "idle", lastSyncAt: null, error: null }) }));

const mem = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

type DeckModule = typeof import("../../mobile/src/pages/Deck");
let deck: DeckModule;
let DeckPage: ComponentType;

beforeAll(async () => {
  vi.stubGlobal("localStorage", fakeStorage);
  vi.stubGlobal("window", { location: { hash: "" }, localStorage: fakeStorage, addEventListener: () => {}, removeEventListener: () => {} });
  vi.stubGlobal("document", { documentElement: { removeAttribute: () => {}, setAttribute: () => {} } });
  fakeStorage.setItem("levelup.mobile.settings", JSON.stringify({ setupDone: true }));
  deck = await import("../../mobile/src/pages/Deck");
  DeckPage = deck.DeckPage;
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => mem.clear());
afterEach(() => vi.useRealTimers());

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));

/** A stand-in for `document` whose visibility the test switches. */
function fakeDoc() {
  const handlers = new Set<() => void>();
  const doc = {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener: (type: string, fn: () => void) => { if (type === "visibilitychange") handlers.add(fn); },
    removeEventListener: (type: string, fn: () => void) => { if (type === "visibilitychange") handlers.delete(fn); },
    show(state: DocumentVisibilityState) { doc.visibilityState = state; handlers.forEach((fn) => fn()); },
    handlers,
  };
  return doc;
}
const asDoc = (d: ReturnType<typeof fakeDoc>) => d as unknown as Document;

/** A phone whose clock the test moves: one question missed in a run, then reviewed right on the first try (back in a day). */
function reviewedOnce() {
  let clock = Date.now();
  const store = new OfflineStore(browserKV(), () => clock);
  const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
  const game = store.addGame(spec);
  const run = store.startSession(game.id, false);
  const station = findArea(spec, run.client.areaId)!.stations.find((x) => x.kind === "challenge" && stationActive(spec, run.client, x))!;
  const opened = store.applyEvent(run.session.id, { type: "open", stationId: station.id });
  const challenge = spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
  store.applyEvent(run.session.id, { type: "answer", stationId: station.id, answer: wrongAnswer(challenge, run.session.id) });
  store.applyEvent(run.session.id, { type: "answer", stationId: station.id, answer: correctAnswer(challenge, run.session.id) });
  expect(store.deckSummary()).toMatchObject({ total: 1, due: 1 }); // the premise: the missed question is due now
  const { items } = store.deckPractice({ action: "start" }) as { items: { id: string }[] };
  const key = items[0]!.id;
  store.deckPractice({ action: "answer", challengeId: key, answer: correctAnswer(challenge, `deck:${key}:0`), attempt: 1 });
  return { store, advance: (ms: number) => { clock += ms; }, now: () => clock };
}

describe("waitingForCards: only the 'nothing to review yet' screen can still turn into a round", () => {
  it("is true for a counted deck with nothing due, false for a round or a deck that could not be counted", () => {
    expect(deck.waitingForCards({ summary: { total: 0, due: 0, nextDue: null }, now: 1 })).toBe(true);
    expect(deck.waitingForCards({ summary: { total: 2, due: 0, nextDue: 5 }, now: 1 })).toBe(true);
    expect(deck.waitingForCards({ summary: { total: 2, due: 1, nextDue: null }, now: 1 })).toBe(false);
    expect(deck.waitingForCards({ summary: null, now: 1 })).toBe(false);
  });
});

describe("watchDeck: the waiting screen counts again when a card falls due or the app returns", () => {
  it("counts again a little after the next card is due, not before", () => {
    vi.useFakeTimers();
    const onRecount = vi.fn();
    const now = Date.now();
    const stop = deck.watchDeck(now + 10 * 60_000, now, onRecount, asDoc(fakeDoc()));
    vi.advanceTimersByTime(10 * 60_000);
    expect(onRecount).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onRecount).toHaveBeenCalledTimes(1);
    stop();
  });

  it("never spins: a card already due is counted again after a second, not at once", () => {
    vi.useFakeTimers();
    const onRecount = vi.fn();
    const now = Date.now();
    const stop = deck.watchDeck(now - 60_000, now, onRecount, asDoc(fakeDoc()));
    vi.advanceTimersByTime(999);
    expect(onRecount).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onRecount).toHaveBeenCalledTimes(1);
    stop();
  });

  it("a card weeks away waits as long as a timer can (a longer delay would overflow and fire at once)", () => {
    vi.useFakeTimers();
    const onRecount = vi.fn();
    const now = Date.now();
    const stop = deck.watchDeck(now + 40 * 86_400_000, now, onRecount, asDoc(fakeDoc()));
    vi.advanceTimersByTime(86_400_000);
    expect(onRecount).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2_147_483_647 - 86_400_000);
    expect(onRecount).toHaveBeenCalledTimes(1);
    stop();
  });

  it("counts again when the app comes back to the front (not when it goes away), and the cleanup stops both", () => {
    vi.useFakeTimers();
    const onRecount = vi.fn();
    const doc = fakeDoc();
    const now = Date.now();
    const stop = deck.watchDeck(now + 60_000, now, onRecount, asDoc(doc));
    doc.show("hidden");
    expect(onRecount).not.toHaveBeenCalled();
    doc.show("visible");
    expect(onRecount).toHaveBeenCalledTimes(1);
    stop();
    expect(doc.handlers.size).toBe(0);
    doc.show("visible");
    vi.advanceTimersByTime(120_000);
    expect(onRecount).toHaveBeenCalledTimes(1);
  });

  it("with no card waiting there is no timer, but the return to the front still counts", () => {
    vi.useFakeTimers();
    const onRecount = vi.fn();
    const doc = fakeDoc();
    const stop = deck.watchDeck(null, Date.now(), onRecount, asDoc(doc));
    expect(vi.getTimerCount()).toBe(0);
    doc.show("visible");
    expect(onRecount).toHaveBeenCalledTimes(1);
    stop();
  });

  it("with a real deck: the card reviewed today is due when the timer fires", () => {
    const phone = reviewedOnce();
    const summary = phone.store.deckSummary();
    expect(summary).toMatchObject({ total: 1, due: 0 });
    expect(summary.nextDue).toBe(phone.now() + 86_400_000); // right on the first try: back in a day
    vi.useFakeTimers();
    let dueWhenCounted: number | null = null;
    const start = phone.now();
    const stop = deck.watchDeck(summary.nextDue, start, () => { dueWhenCounted = phone.store.deckSummary().due; }, asDoc(fakeDoc()));
    // the phone's clock moves with the timers
    phone.advance(86_400_000 + 500);
    vi.advanceTimersByTime(86_400_000 + 500);
    expect(dueWhenCounted).toBe(1);
    stop();
  });
});

describe("the waiting screen in every interface language", () => {
  for (const locale of ["he", "en", "es"] as const) {
    it(`${locale}: a reviewed card says when it comes back, with one h1 and the way back`, () => {
      reviewedOnce();
      const html = render(h(DeckPage), locale);
      expect(html).toContain('data-testid="deck-empty"');
      expect(html).not.toContain('data-testid="deck"');
      expect(html).toContain(DICTIONARIES[locale]["mob.deck.done.title"].replace("!", ""));
      expect(html).toContain(DICTIONARIES[locale]["mob.deck.next"].split("{when}")[0]!.trim());
      expect(html.split("<h1").length - 1).toBe(1);
      expect(html).toContain('href="#/"');
    });
  }
});
