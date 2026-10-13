import { createElement as h, type ComponentType, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import type { GameSpec } from "@/lib/game/spec/schema";
import { collectibleIds, findArea, stationActive, type ClientState } from "@/lib/game/state/progress";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { generateOffline } from "@/lib/offline/generate";
import { browserKV, OfflineStore } from "@/lib/offline/store";
import { bestNote, quickNext } from "../../mobile/src/results-model";
import { correctAnswer, request, wrongAnswer } from "./helpers";

// `useSettings` has no server snapshot; the results page does not use the account, so only the settings hook needs help.
vi.mock("../../mobile/src/app-state", async (importOriginal) => {
  const m = await importOriginal<typeof import("../../mobile/src/app-state")>();
  return { ...m, useSettings: () => m.getSettings() };
});
// The website's `next/link` becomes a hash link in the phone bundle (see mobile/vite.config.mts); do the same here.
vi.mock("next/link", async () => import("../../mobile/src/shims/next-link"));

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

const mem = new Map<string, string>();
const fakeStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
let ResultsPage: ComponentType<{ gameId: string; sessionId: string }>;
beforeAll(async () => {
  vi.stubGlobal("localStorage", fakeStorage);
  vi.stubGlobal("window", { location: { hash: "" }, localStorage: fakeStorage, addEventListener: () => {}, removeEventListener: () => {} });
  vi.stubGlobal("document", { documentElement: { removeAttribute: () => {}, setAttribute: () => {} } });
  ({ ResultsPage } = await import("../../mobile/src/pages/Results"));
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => mem.clear());

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));

type Res = ReturnType<OfflineStore["applyEvent"]>;
/** Plays a game to the end; `missFirst` answers the first question wrong once so there is something to review. */
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

describe("results model", () => {
  it("offers the same step as the full 'what next' card: mistakes, then another try, then something new", () => {
    expect(quickNext("g", "s", { completed: true, stars: 3 }, 2)).toEqual({ id: "review", href: "/games/g/results/s/review", labelKey: "res.review.open" });
    expect(quickNext("g", "s", { completed: false, stars: 0 }, 0)).toEqual({ id: "replay", href: "/play/g", labelKey: "res.replay" });
    expect(quickNext("g", "s", { completed: true, stars: 2 }, 0).id).toBe("replay");
    expect(quickNext("g", "s", { completed: true, stars: 3 }, 0)).toEqual({ id: "new", href: "/create", labelKey: "res.new" });
  });
  it("compares a run with the player's own record", () => {
    expect(bestNote({ completed: true, score: 80, maxScore: 100 }, 80)).toEqual({ kind: "best" });
    expect(bestNote({ completed: true, score: 80, maxScore: 100 }, 60)).toEqual({ kind: "best" });
    expect(bestNote({ completed: true, score: 50, maxScore: 100 }, 80)).toEqual({ kind: "other", best: 80, max: 100 });
    expect(bestNote({ completed: false, score: 50, maxScore: 100 }, 80)).toEqual({ kind: "other", best: 80, max: 100 });
    expect(bestNote({ completed: false, score: 50, maxScore: 100 }, 0)).toBeNull();
    expect(bestNote({ completed: true, score: 0, maxScore: 100 }, 0)).toBeNull();
  });
});

describe("results page on the phone", () => {
  it("a finished run with a missed question: a top bar with 'best' and the review step, then the full results", () => {
    let now = 1_000_000;
    const store = new OfflineStore(browserKV(), () => (now += 1000));
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    const game = store.addGame(spec);
    const s = store.startSession(game.id, false);
    const done = playThrough(store, spec, s.session.id, s.client, { missFirst: true });
    expect(done?.completed).toBe(true);
    const html = render(h(ResultsPage, { gameId: game.id, sessionId: s.session.id }));
    expect(html).toContain('data-testid="results-quick"');
    expect(html).toContain('data-next="review"');
    expect(html).toContain(`href="#/games/${game.id}/results/${s.session.id}/review"`);
    expect(html).toContain('data-kind="best"');
    expect(html.indexOf('data-testid="results-quick"')).toBeLessThan(html.indexOf('data-testid="results"'));
    // the website's own results markup is still all there (the e2e flow relies on it)
    for (const id of ["results-score", "results-review", "results-next", "next-review"]) expect(html).toContain(`data-testid="${id}"`);
    // the top button and the website's own "what next" card point at the same place (two copies of one rule must not drift)
    const quick = /<a href="([^"]+)" data-testid="results-quick-next"/.exec(html)?.[1];
    const card = /<a href="([^"]+)" data-testid="next-review"/.exec(html)?.[1];
    expect(quick).toBeTruthy();
    expect(quick).toBe(card);
    expect(html).toMatch(/class="[^"]*min-h-11[^"]*"[^>]*data-testid="results-quick-next"|data-testid="results-quick-next"[^>]*class="[^"]*min-h-11/);
  });

  it("a weaker second run shows the record to beat instead of 'best'", () => {
    let now = 1_000_000;
    const store = new OfflineStore(browserKV(), () => (now += 1000));
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    const game = store.addGame(spec);
    const first = store.startSession(game.id, false);
    const a = playThrough(store, spec, first.session.id, first.client);
    expect(a?.completed).toBe(true);
    const second = store.startSession(game.id, false);
    const b = playThrough(store, spec, second.session.id, second.client, { missFirst: true });
    expect(b?.completed).toBe(true);
    const bestScore = a!.summary!.score;
    const html = render(h(ResultsPage, { gameId: game.id, sessionId: second.session.id }));
    expect(b!.summary!.score).toBeLessThan(bestScore); // a first-try miss costs points
    expect(html).toContain('data-kind="other"');
    expect(html).toContain(`${bestScore} of`);
  });

  it("an unfinished run recommends playing on and says nothing about records before the first finish", () => {
    const store = new OfflineStore(browserKV());
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    const game = store.addGame(spec);
    const s = store.startSession(game.id, false);
    const html = render(h(ResultsPage, { gameId: game.id, sessionId: s.session.id }));
    expect(html).toContain('data-next="replay"');
    expect(html).toContain(`href="#/play/${game.id}"`);
    expect(/<a href="([^"]+)" data-testid="results-quick-next"/.exec(html)?.[1]).toBe(/<a href="([^"]+)" data-testid="next-replay"/.exec(html)?.[1]);
    expect(html).not.toContain("results-best");
  });

  it("renders in Hebrew", () => {
    const store = new OfflineStore(browserKV());
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL", contentLanguage: "he" }));
    const game = store.addGame(spec);
    const s = store.startSession(game.id, false);
    const html = render(h(ResultsPage, { gameId: game.id, sessionId: s.session.id }), "he");
    expect(html).toContain(DICTIONARIES.he["res.replay"]);
  });
});
