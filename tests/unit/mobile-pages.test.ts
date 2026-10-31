import { createElement as h, type ComponentType, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { browserKV, OfflineStore } from "@/lib/offline/store";
import { markWelcomeSeen } from "@/lib/offline/onboarding";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { generateOffline } from "@/lib/offline/generate";
import { correctAnswer, request, validDemoSpec, wrongAnswer } from "./helpers";
import { NOTES } from "./offline-helpers";

/**
 * The real phone pages rendered on the server with a fake in-memory localStorage: this checks how the screens compose
 * for each state (first run, returning player, many games, unreadable data) without a browser or a device.
 */

// `useSettings` has no server snapshot (it never runs on a server in the app); read the same value directly here.
vi.mock("../../mobile/src/app-state", async (importOriginal) => {
  const m = await importOriginal<typeof import("../../mobile/src/app-state")>();
  return { ...m, useSettings: () => m.getSettings() };
});

// The account and backup panels are other screens' concern (and use client-only hooks): stand-ins keep this about Settings.
vi.mock("../../mobile/src/pages/AccountPanel", () => ({ AccountPanel: () => null }));
vi.mock("../../mobile/src/pages/BackupPanel", () => ({ BackupPanel: () => null }));

let account: { session: { user: { email: string } } | null; status: string; lastSyncAt: number | null; error: null } = { session: null, status: "idle", lastSyncAt: null, error: null };
vi.mock("../../mobile/src/cloud/account", () => ({ useAccount: () => account }));

const mem = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};
const win = { location: { hash: "" }, localStorage: fakeStorage, addEventListener: () => {}, removeEventListener: () => {} };

let LibraryPage: ComponentType;
let SettingsPage: ComponentType;
let DeckPage: ComponentType;
let ResultsPage: ComponentType<{ gameId: string; sessionId: string }>;

beforeAll(async () => {
  vi.stubGlobal("localStorage", fakeStorage);
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { documentElement: { removeAttribute: () => {}, setAttribute: () => {} } });
  // the app reads its settings once, at import: start as an install that has done the first-run setup (FirstSetup has its own spec)
  fakeStorage.setItem("levelup.mobile.settings", JSON.stringify({ setupDone: true }));
  ({ LibraryPage } = await import("../../mobile/src/pages/Library"));
  ({ SettingsPage } = await import("../../mobile/src/pages/Settings"));
  ({ DeckPage } = await import("../../mobile/src/pages/Deck"));
  ({ ResultsPage } = await import("../../mobile/src/pages/Results"));
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => { mem.clear(); win.location.hash = ""; account = { session: null, status: "idle", lastSyncAt: null, error: null }; });

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));
const seed = () => {
  let now = 1_000;
  return new OfflineStore(browserKV(), () => (now += 1_000));
};
const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("library page states", () => {
  it("first run: the welcome explains everything, the empty state is one quiet line, no continue card", () => {
    const html = render(h(LibraryPage));
    expect(html).toContain('data-testid="welcome"');
    expect(html).toContain('data-testid="mobile-empty"');
    expect(html).not.toContain("empty-example"); // the welcome already has the example button
    expect(html).not.toContain("continue-card");
    expect(html).toContain('data-testid="mobile-new"');
    expect(count(html, "<h1")).toBe(1);
    expect(html).toContain('id="library-title"');
  });

  it("after the welcome was dismissed the empty library offers the example and own-notes actions", () => {
    markWelcomeSeen(browserKV());
    const html = render(h(LibraryPage));
    expect(html).not.toContain('data-testid="welcome"');
    expect(html).toContain('data-testid="empty-example"');
    expect(html).toContain('data-testid="empty-create"');
  });

  it("the empty library has one big way in: no second 'New game' button above it, and the example is a 56px primary action", () => {
    markWelcomeSeen(browserKV());
    const html = render(h(LibraryPage));
    expect(html).not.toContain('data-testid="mobile-new"'); // the hero's own buttons (and the tab bar) lead to the create screen
    expect(html).toMatch(/data-testid="empty-example"[^>]*>|<a[^>]*data-testid="empty-example"/);
    expect(html).toMatch(/class="[^"]*min-h-14[^"]*bg-neon[^"]*"[^>]*|class="[^"]*bg-neon[^"]*min-h-14[^"]*"/);
    expect(html).not.toContain("empty-suggest"); // no interest chosen: nothing to suggest
    expect(count(html, "<h1")).toBe(1);
    expect(html).toContain('id="library-title"');
  });

  it("a returning player with several games gets 'continue' for the latest unfinished one, and New game steps back to a secondary style", () => {
    const store = seed();
    const a = store.addGame(validDemoSpec());
    const b = store.addGame(validDemoSpec());
    store.addGame(validDemoSpec());
    store.startSession(a.id, false);
    store.startSession(b.id, false);
    const html = render(h(LibraryPage));
    expect(html).not.toContain('data-testid="welcome"');
    expect(html).toContain('data-testid="continue-card"');
    expect(html).toContain(`data-game="${b.id}"`);
    expect(html).toContain(`href="#/play/${b.id}"`);
    expect(count(html, 'data-testid="mobile-game"')).toBe(3);
    expect(html).toMatch(/data-testid="mobile-new"[^>]*>/);
    expect(html).toMatch(/class="[^"]*border-neon[^"]*"[^>]*data-testid="mobile-new"|data-testid="mobile-new"[^>]*class="[^"]*border-neon/);
    expect(html).not.toContain("library-filters"); // three games: no chips yet
  });

  it("with one or two games the list itself leads with the game to resume (no repeated card)", () => {
    const store = seed();
    const a = store.addGame(validDemoSpec());
    store.addGame(validDemoSpec());
    store.startSession(a.id, false);
    const html = render(h(LibraryPage));
    expect(html).not.toContain("continue-card");
    const first = html.indexOf('data-testid="mobile-play"');
    expect(html.slice(first - 80, first + 120)).toContain(`#/play/${a.id}`);
    expect(html).toMatch(/class="[^"]*bg-neon[^"]*"[^>]*data-testid="mobile-new"|data-testid="mobile-new"[^>]*class="[^"]*bg-neon/);
  });

  it("no unfinished game: no continue card and New game stays the primary action", () => {
    const store = seed();
    store.addGame(validDemoSpec());
    const html = render(h(LibraryPage));
    expect(html).not.toContain("continue-card");
    expect(html).toMatch(/class="[^"]*bg-neon[^"]*"[^>]*data-testid="mobile-new"|data-testid="mobile-new"[^>]*class="[^"]*bg-neon/);
  });

  it("four or more games get filter chips with counts and a screen-reader summary", () => {
    const store = seed();
    const ids = [1, 2, 3, 4].map(() => store.addGame(validDemoSpec()).id);
    store.startSession(ids[0]!, false);
    const html = render(h(LibraryPage));
    expect(html).toContain('data-testid="library-filters"');
    expect(html).toContain("Showing 4 of 4 games");
    expect(count(html, 'data-testid="mobile-game"')).toBe(4);
    expect(html).toContain('aria-labelledby="library-title"');
  });

  it("one damaged game is skipped: the other games still show, with no error screen", () => {
    const store = seed();
    const good = store.addGame(validDemoSpec());
    mem.set("levelup.offline.games", JSON.stringify(["broken", good.id]));
    mem.set("levelup.offline.game.broken", JSON.stringify({ id: "broken", title: "x", createdAt: 1 }));
    const html = render(h(LibraryPage));
    expect(html).not.toContain('data-testid="mobile-load-error"');
    expect(count(html, 'data-testid="mobile-game"')).toBe(1);
    expect(html).toContain(`#/play/${good.id}`);
  });

  // The error screen itself (a store that cannot list anything) is covered at the model level: loadLibrary → { ok: false }.

  it("signed in, the footer says how the backup is doing instead of 'offline'", () => {
    seed().addGame(validDemoSpec());
    account = { session: { user: { email: "a@b.co" } }, status: "syncing", lastSyncAt: null, error: null };
    expect(render(h(LibraryPage))).toMatch(/data-testid="library-footer">Syncing/);
    account = { session: { user: { email: "a@b.co" } }, status: "ok", lastSyncAt: new Date(2026, 9, 11, 14, 30).getTime(), error: null };
    expect(render(h(LibraryPage))).toMatch(/data-testid="library-footer">Last sync: 11\/10\/2026, 14:30/);
    account = { session: { user: { email: "a@b.co" } }, status: "error", lastSyncAt: null, error: null };
    expect(render(h(LibraryPage))).toContain("Could not sync");
    expect(render(h(LibraryPage))).not.toContain("Offline · on this device");
  });

  it("signed out, the footer keeps the offline promise", () => {
    expect(render(h(LibraryPage))).toMatch(/data-testid="library-footer">Offline · on this device/);
  });

  it("renders in Hebrew without losing any of the structure", () => {
    const store = seed();
    store.addGame(validDemoSpec());
    const he = render(h(LibraryPage), "he");
    expect(he).toContain(DICTIONARIES.he["lib.title"]);
    expect(he).toContain('data-testid="mobile-game"');
  });

  it("the welcome can be reopened from Settings (?welcome=1) even with games", () => {
    seed().addGame(validDemoSpec());
    win.location.hash = "#/?welcome=1";
    const html = render(h(LibraryPage));
    expect(html).toContain('data-testid="welcome"');
    expect(html).not.toContain("continue-card"); // the intro comes first; no competing call to action
  });
});

describe("settings page", () => {
  it("groups settings under real headings; every select and toggle is a 44px target; the privacy text is not misleading", () => {
    const html = render(h(SettingsPage));
    for (const id of ["set-look", "set-feel", "set-data", "set-about", "set-erase"]) expect(html).toContain(`id="${id}"`);
    expect(count(html, "<h1")).toBe(1);
    // the data section only names its region: the account/backup panels bring their own headings, so no h2 nests in an h2
    expect(html).toContain('<p id="set-data"');
    expect(count(html, "<h2")).toBe(4); // look, feel, about and "erase data" (the delete-all button has its own titled section)
    expect(html).toMatch(/<h2 id="set-erase"[^>]*>Erase data<\/h2>/);
    // every group is a bordered card under its heading
    expect(count(html, "rounded-2xl border p-4")).toBe(4);
    for (const m of html.matchAll(/<select\b[^>]*>/g)) expect(m[0]).toMatch(/min-h-11/);
    for (const m of html.matchAll(/<label\b[^>]*class="[^"]*flex[^"]*"[^>]*>/g)) expect(m[0]).toMatch(/min-h-1[124]/);
    expect(count(html, 'type="checkbox"')).toBe(3);
    expect(html).toContain('data-testid="clear-all"');
    expect(html).toContain('aria-describedby="clear-hint"');
    // the English/Hebrew options are announced in their own language
    expect(html).toContain('lang="he"');
    expect(html).not.toMatch(/No account, no tracking, no internet/);
    expect(html).toMatch(/cloud backup/);
  });
});

describe("deck and results pages", () => {
  it("nothing to review: an explained empty state with a 44px way back", () => {
    const html = render(h(DeckPage));
    expect(html).toContain('data-testid="deck-empty"');
    expect(html).toMatch(/<a href="#\/"[^>]*class="[^"]*min-h-11/);
    expect(count(html, "<h1")).toBe(1); // the screen is named like every other one; the state card's title is an h2
    expect(html).toMatch(/<h1[^>]*>Review my mistakes<\/h1>/);
  });

  it("a full phone still opens the review screen instead of ending in the crash screen", () => {
    // one missed question that is not in the deck yet: counting the deck has to write its card, and the phone has no room left
    const store = seed();
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    const game = store.addGame(spec);
    const run = store.startSession(game.id, false);
    const station = findArea(spec, run.client.areaId)!.stations.find((x) => x.kind === "challenge" && stationActive(spec, run.client, x))!;
    const opened = store.applyEvent(run.session.id, { type: "open", stationId: station.id });
    const challenge = spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
    store.applyEvent(run.session.id, { type: "answer", stationId: station.id, answer: wrongAnswer(challenge, run.session.id) });
    store.applyEvent(run.session.id, { type: "answer", stationId: station.id, answer: correctAnswer(challenge, run.session.id) });
    const setItem = fakeStorage.setItem;
    fakeStorage.setItem = () => { throw Object.assign(new Error("full"), { name: "QuotaExceededError" }); };
    try {
      expect(() => store.deckSummary()).toThrow(); // the premise: the count itself fails on a full phone
      const html = render(h(DeckPage));
      expect(html).toContain('data-testid="deck"');
      expect(html).not.toContain('data-testid="deck-empty"');
    } finally {
      fakeStorage.setItem = setItem;
    }
  });

  it("a results link to a deleted game says so and offers the library", () => {
    const html = render(h(ResultsPage, { gameId: "gone", sessionId: "gone" }));
    expect(html).toContain('data-testid="results-missing"');
    expect(html).toContain(DICTIONARIES.en["mob.notfound"]);
    expect(html).toContain('href="#/"');
    expect(html).toMatch(/min-h-11/);
  });
});
