import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, makeT, type Locale } from "@/lib/i18n";
import { WELCOME_STEPS } from "@/lib/offline/onboarding";
import { memoryKV, OfflineStore, type GameSummaryRow } from "@/lib/offline/store";
import { ErrorBoundary, ErrorFallback } from "../../mobile/src/ErrorBoundary";
import { formatNextReview, formatWhen, syncLineKey } from "../../mobile/src/format";
import {
  CONTINUE_MIN_GAMES, continueGame, FILTER_MIN_GAMES, filterCounts, filterGames, isDone, loadLibrary, orderGames, showFilters,
  type LibraryGame, type LibrarySource,
} from "../../mobile/src/library-model";
import { ContinueCard, EmptyLibrary, FilterBar, GameCard } from "../../mobile/src/pages/library-parts";
import { TabBar } from "../../mobile/src/pages/TabBar";
import { CREATE_DRAFT_KEY, deleteAllGames } from "../../mobile/src/reset";
import { stripQuery } from "../../mobile/src/router";
import { Welcome } from "../../mobile/src/pages/Welcome";
import { validDemoSpec } from "./helpers";

const render = (el: ReactElement, locale: Locale = "en") => renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: el }));

const count = (html: string, needle: string) => html.split(needle).length - 1;
const row = (over: Partial<GameSummaryRow> = {}): GameSummaryRow => ({
  id: "g", title: "Game", subject: "Subject", createdAt: 1000, generatorKind: "engine", environment: "meadow", bestScore: 0, bestStars: 0, maxScore: 100,
  inProgress: false, percent: 0, lastSessionId: null, lastPlayedAt: null, ...over,
});
const lg = (over: Partial<LibraryGame> = {}): LibraryGame => ({ ...row(over), lastPlayedAt: over.lastPlayedAt ?? over.createdAt ?? 1000, ...over });

describe("library model: order, continue and filters", () => {
  it("lists the most recently played game first and resumes the latest unfinished one", () => {
    let now = 1_000;
    const store = new OfflineStore(memoryKV(), () => (now += 1_000));
    const a = store.addGame(validDemoSpec());
    const b = store.addGame(validDemoSpec());
    const c = store.addGame(validDemoSpec());
    // never played: newest created first, nothing to continue
    let lib = loadLibrary(store);
    if (!lib.ok) throw new Error("load failed");
    expect(lib.games.map((g) => g.id)).toEqual([c.id, b.id, a.id]);
    expect(continueGame(lib.games)).toBeNull();
    // playing A then B: B is the one to continue, A is next
    store.startSession(a.id, false);
    store.startSession(b.id, false);
    lib = loadLibrary(store);
    if (!lib.ok) throw new Error("load failed");
    expect(lib.games.map((g) => g.id)).toEqual([b.id, a.id, c.id]);
    expect(continueGame(lib.games)?.id).toBe(b.id);
    // coming back to A makes it the latest
    store.startSession(a.id, false);
    lib = loadLibrary(store);
    if (!lib.ok) throw new Error("load failed");
    expect(continueGame(lib.games)?.id).toBe(a.id);
    expect(lib.deck).toEqual({ total: 0, due: 0, nextDue: null });
  });

  it("reads each game's level from its spec for the card, and a game whose spec cannot be read still lists", () => {
    const store = new OfflineStore(memoryKV(), () => 5_000);
    const spec = validDemoSpec();
    const g = store.addGame({ ...spec, meta: { ...spec.meta, difficulty: "advanced" } });
    const lib = loadLibrary(store);
    if (!lib.ok) throw new Error("load failed");
    expect(lib.games.find((x) => x.id === g.id)?.difficulty).toBe("advanced");
    // a source without getGame (or one that throws) just leaves the level out
    const src: LibrarySource = { listGames: () => [row({ id: "x" })], getSession: () => null, deckSummary: () => ({ total: 0, due: 0, nextDue: null }), getGame: () => { throw new Error("damaged"); } };
    const bad = loadLibrary(src);
    expect(bad.ok && bad.games[0]?.difficulty).toBeUndefined();
    expect(bad.ok && bad.games).toHaveLength(1);
  });

  it("the extra continue card is only offered once the list is long enough to need it", () => {
    const many = Array.from({ length: CONTINUE_MIN_GAMES }, (_, i) => lg({ id: `g${i}`, inProgress: i === 1, lastPlayedAt: i }));
    expect(continueGame(many)?.id).toBe("g1");
    expect(continueGame(many.slice(0, CONTINUE_MIN_GAMES - 1))).toBeNull();
    expect(continueGame(many.map((g) => ({ ...g, inProgress: false })))).toBeNull();
  });

  it("keeps the store order for ties and never mutates its input", () => {
    const input = [lg({ id: "x", lastPlayedAt: 5 }), lg({ id: "y", lastPlayedAt: 5 }), lg({ id: "z", lastPlayedAt: 9 })];
    const copy = [...input];
    expect(orderGames(input).map((g) => g.id)).toEqual(["z", "x", "y"]);
    expect(input).toEqual(copy);
  });

  it("filters and counts: in progress, completed at least once, and a game can be both", () => {
    const games = [
      lg({ id: "a", inProgress: true }),
      lg({ id: "b", bestScore: 40, bestStars: 2 }),
      lg({ id: "c", inProgress: true, bestScore: 10, bestStars: 1 }),
      lg({ id: "d" }),
    ];
    expect(filterGames(games, "all").map((g) => g.id)).toEqual(["a", "b", "c", "d"]);
    expect(filterGames(games, "progress").map((g) => g.id)).toEqual(["a", "c"]);
    expect(filterGames(games, "done").map((g) => g.id)).toEqual(["b", "c"]);
    expect(filterCounts(games)).toEqual({ all: 4, progress: 2, done: 2 });
    expect(isDone(games[3]!)).toBe(false);
  });

  it("only shows the filter chips once the list is long enough to need them", () => {
    expect(showFilters(Array.from({ length: FILTER_MIN_GAMES - 1 }, () => lg()))).toBe(false);
    expect(showFilters(Array.from({ length: FILTER_MIN_GAMES }, () => lg()))).toBe(true);
  });

  it("an unreadable library is a result the screen can show, not an exception", () => {
    const ok: LibrarySource = { listGames: () => [], getSession: () => null, deckSummary: () => ({ total: 0, due: 0, nextDue: null }) };
    expect(loadLibrary(ok)).toEqual({ ok: true, games: [], deck: { total: 0, due: 0, nextDue: null } });
    expect(loadLibrary({ ...ok, listGames: () => { throw new Error("corrupt"); } })).toEqual({ ok: false });
    // the review-deck count is secondary: when it cannot be read (a full phone) the games are still shown
    expect(loadLibrary({ ...ok, listGames: () => [row({ id: "kept" })], deckSummary: () => { throw new Error("storage full"); } })).toMatchObject({ ok: true, games: [{ id: "kept" }], deck: { total: 0, due: 0, nextDue: null } });
    expect(loadLibrary({ ...ok, listGames: () => [row({ lastSessionId: "s" })], getSession: () => { throw new Error("corrupt"); } })).toEqual({ ok: false });
  });

  it("falls back to the creation time when the last session is gone", () => {
    const src: LibrarySource = { listGames: () => [row({ createdAt: 777, lastSessionId: "missing" })], getSession: () => null, deckSummary: () => ({ total: 0, due: 0, nextDue: null }) };
    const lib = loadLibrary(src);
    expect(lib.ok && lib.games[0]?.lastPlayedAt).toBe(777);
  });
});

describe("formatNextReview", () => {
  const at = (d: number, hh = 14, mm = 30) => new Date(2026, 9, 11 + d, hh, mm).getTime();
  const now = at(0, 9, 0);
  it("says today and tomorrow in words, with the time", () => {
    expect(formatNextReview(at(0), now, "en")).toBe("today, 14:30");
    expect(formatNextReview(at(1), now, "en")).toBe("tomorrow, 14:30");
    expect(formatNextReview(at(1), now, "he")).toContain("מחר");
  });
  it("uses a weekday only for the coming week, and a date beyond it (a bare weekday would be ambiguous)", () => {
    expect(formatNextReview(at(3), now, "en")).toMatch(/^[A-Z][a-z]+day, 14:30$/);
    expect(formatNextReview(at(6), now, "en")).toMatch(/day, 14:30$/);
    const far = formatNextReview(at(16), now, "en");
    expect(far).toMatch(/27 October/);
    expect(far).not.toMatch(/day,/);
    expect(formatNextReview(at(7), now, "en")).toMatch(/18 October/);
  });
  it("treats an overdue time as today", () => {
    expect(formatNextReview(at(-2), now, "en")).toMatch(/^today, /);
  });
});

describe("Settings → delete all games", () => {
  it("removes every game with its runs and the Create screen's saved draft", () => {
    const kv = memoryKV();
    const store = new OfflineStore(kv);
    const a = store.addGame(validDemoSpec());
    store.addGame(validDemoSpec());
    store.startSession(a.id, false);
    kv.set(CREATE_DRAFT_KEY, JSON.stringify({ subject: "unfinished notes" }));
    expect(CREATE_DRAFT_KEY).toBe("levelup.mobile.createDraft");
    deleteAllGames(store, kv);
    expect(store.listGames()).toEqual([]);
    expect(kv.get(CREATE_DRAFT_KEY)).toBeNull();
    expect(kv.get("levelup.offline.session." + a.id)).toBeNull(); // no run is left behind
  });

  it("also removes a damaged game that the library cannot list", () => {
    const kv = memoryKV();
    const store = new OfflineStore(kv);
    const g = store.addGame(validDemoSpec());
    kv.set("levelup.offline.game." + g.id, "{ not json");
    deleteAllGames(store, kv);
    expect(kv.keys?.().filter((k) => k.startsWith("levelup.offline.game.")) ?? []).toEqual([]);
  });

  it("works with nothing to delete, and with no draft", () => {
    const kv = memoryKV();
    expect(() => deleteAllGames(new OfflineStore(kv), kv)).not.toThrow();
  });

  it("a storage failure on the draft never stops the games from being deleted", () => {
    const kv = memoryKV();
    const store = new OfflineStore(kv);
    store.addGame(validDemoSpec());
    const failing = { ...kv, remove: (k: string) => { if (k === CREATE_DRAFT_KEY) throw new Error("blocked"); kv.remove(k); } };
    expect(() => deleteAllGames(store, failing)).not.toThrow();
    expect(store.listGames()).toEqual([]);
  });

  it("the draft is gone even when deleting a game fails, and the failure reaches the caller to report", () => {
    const kv = memoryKV();
    kv.set(CREATE_DRAFT_KEY, "{}");
    const store = { deleteAll: (): number => { throw new Error("quota"); } };
    expect(() => deleteAllGames(store, kv)).toThrow("quota");
    expect(kv.get(CREATE_DRAFT_KEY)).toBeNull();
  });
});

describe("sync line and dates", () => {
  it("picks one clear sentence for the library footer", () => {
    expect(syncLineKey("syncing", 5)).toBe("mob.account.syncing");
    expect(syncLineKey("error", 5)).toBe("mob.account.syncError");
    expect(syncLineKey("ok", 5)).toBe("mob.account.lastSync");
    expect(syncLineKey("idle", null)).toBe("mob.account.notSynced");
    expect(syncLineKey("ok", null)).toBe("mob.account.notSynced");
  });
  it("formats the last sync in the app language, not the device's", () => {
    const ts = new Date(2026, 9, 11, 14, 30).getTime();
    expect(formatWhen(ts, "en")).toBe("11/10/2026, 14:30");
    expect(formatWhen(ts, "he")).toMatch(/11\.10\.2026/);
  });
});

describe("stripQuery", () => {
  afterEach(() => vi.unstubAllGlobals());
  const stub = (hash: string) => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", { location: { hash }, history: { state: { k: 1 }, replaceState } });
    return replaceState;
  };
  it("removes a one-shot flag from the URL without adding a history entry", () => {
    const replace = stub("#/?welcome=1");
    stripQuery();
    expect(replace).toHaveBeenCalledWith({ k: 1 }, "", "#/");
  });
  it("keeps the route and leaves query-less URLs alone", () => {
    const replace = stub("#/create?example=1");
    stripQuery();
    expect(replace).toHaveBeenCalledWith({ k: 1 }, "", "#/create");
    const none = stub("#/settings");
    stripQuery();
    expect(none).not.toHaveBeenCalled();
  });
});

/** Every <a> and <button> in the markup must be at least 44px tall (Tailwind min-h-11 = 2.75rem and up). */
function touchTargets(html: string): { tag: string; cls: string }[] {
  return [...html.matchAll(/<(a|button)\b([^>]*)>/g)].map((m) => ({ tag: m[1]!, cls: /class="([^"]*)"/.exec(m[2]!)?.[1] ?? "" }));
}
const tallEnough = (cls: string) => /(?:^|\s)min-h-(?:11|12|14|16)(?:\s|$)/.test(cls);

describe("welcome: the whole first-run explanation on one screen", () => {
  for (const locale of ["en", "he"] as const) {
    it(`shows every step at once, one primary action and one alternative (${locale})`, () => {
      const html = render(h(Welcome, { onDone: () => {} }), locale);
      const t = makeT(DICTIONARIES[locale]);
      for (const step of WELCOME_STEPS) {
        expect(html).toContain(`data-testid="welcome-step-${step}"`);
        expect(html).toContain(t(`mob.welcome.${step}.title`));
        expect(html).toContain(t(`mob.welcome.${step}.short`));
      }
      expect((html.match(/<li\b/g) ?? []).length).toBe(WELCOME_STEPS.length);
      // no paging controls any more: only skip + two ways to start
      const ids = [...html.matchAll(/<button[^>]*data-testid="([^"]+)"/g)].map((m) => m[1]);
      expect(ids.sort()).toEqual(["welcome-own", "welcome-skip", "welcome-start"]);
      expect(html).toContain('role="region"');
      expect(html).toContain('aria-labelledby="welcome-title"');
      for (const x of touchTargets(html)) expect(tallEnough(x.cls), `${x.tag} ${x.cls}`).toBe(true);
    });
  }
  it("the short lines stay short enough for a 360px screen", () => {
    for (const locale of ["en", "he", "es"] as const) {
      const d = DICTIONARIES[locale];
      for (const step of WELCOME_STEPS) expect(d[`mob.welcome.${step}.short`].length).toBeLessThanOrEqual(80);
    }
  });
});

describe("library pieces", () => {
  const t = makeT(DICTIONARIES.en);
  it("the continue card names the game, shows its progress and links straight into it", () => {
    const html = render(h(ContinueCard, { game: lg({ id: "abc", title: "Plants", inProgress: true, percent: 40 }), t }));
    expect(html).toContain('href="#/play/abc"');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain("Continue: Plants");
    expect(html).toContain('aria-labelledby="continue-title"');
    for (const x of touchTargets(html)) expect(tallEnough(x.cls), x.cls).toBe(true);
  });
  it("a game card keeps the testids the e2e flow uses and every control is a 44px target", () => {
    const html = render(h(GameCard, { game: lg({ id: "g1", inProgress: true, percent: 10, lastSessionId: "s1", bestStars: 2, bestScore: 50 }), t, onDelete: () => {} }));
    for (const id of ["mobile-game", "mobile-play"]) expect(html).toContain(`data-testid="${id}"`);
    expect(html).toContain('href="#/games/g1/results/s1"');
    expect(html).toContain('role="progressbar"');
    for (const x of touchTargets(html)) expect(tallEnough(x.cls), x.cls).toBe(true);
  });
  it("a finished game offers Play, not Continue, and has no progress bar", () => {
    const html = render(h(GameCard, { game: lg({ id: "g2" }), t, onDelete: () => {} }));
    expect(html).not.toContain("progressbar");
    expect(html).toContain(">Play<");
  });
  it("a game card names the game, its source label and its level, and deleting is a named icon button", () => {
    const html = render(h(GameCard, { game: lg({ id: "g3", title: "Plants", subject: "Biology", generatorKind: "catalog", difficulty: "advanced" }), t, onDelete: () => {} }));
    expect(html).toContain("Plants");
    expect(html).toContain('data-testid="badge-catalog"'); // honest label: the topic library, never AI
    expect(html).not.toContain("badge-ai");
    expect(html).toContain('data-testid="game-level">Advanced<');
    expect(html).toContain('aria-label="Delete: Plants"'); // the icon button says what it deletes
    expect(html).toContain("<svg"); // (the trash icon)
    for (const x of touchTargets(html)) expect(tallEnough(x.cls), x.cls).toBe(true);
    // an unknown or missing level is simply left out
    expect(render(h(GameCard, { game: lg({ id: "g4", difficulty: "expert" }), t, onDelete: () => {} }))).not.toContain("game-level");
    expect(render(h(GameCard, { game: lg({ id: "g5" }), t, onDelete: () => {} }))).not.toContain("game-level");
  });
  it("the demo and engine games keep their own labels on the card", () => {
    expect(render(h(GameCard, { game: lg({ generatorKind: "demo" }), t, onDelete: () => {} }))).toContain("badge-demo");
    expect(render(h(GameCard, { game: lg({ generatorKind: "engine" }), t, onDelete: () => {} }))).toContain("badge-engine");
  });
  it("the empty library: example first, own notes second, and a ready-made-topics suggestion from the first interest", () => {
    const withInterest = render(h(EmptyLibrary, { t, interest: "science" }));
    expect(withInterest).toContain('data-testid="mobile-empty"');
    expect(withInterest.indexOf("empty-example")).toBeLessThan(withInterest.indexOf("empty-create"));
    expect(withInterest).toContain('href="#/create?example=1"');
    expect(withInterest).toContain('data-testid="empty-suggest"');
    expect(withInterest).toContain('href="#/create?source=library"');
    expect(withInterest).toContain("Ready-made topics: Science");
    const he = render(h(EmptyLibrary, { t: makeT(DICTIONARIES.he), interest: "math" }), "he");
    expect(he).toContain("נושאים מוכנים: מתמטיקה");
    const without = render(h(EmptyLibrary, { t }));
    expect(without).not.toContain("empty-suggest");
    for (const html of [withInterest, without]) for (const x of touchTargets(html)) expect(tallEnough(x.cls), x.cls).toBe(true);
  });
  it("filter chips are toggle buttons with counts and exactly the current one is pressed", () => {
    const html = render(h(FilterBar, { filter: "progress", counts: { all: 5, progress: 2, done: 3 }, onChange: () => {}, t }));
    expect(html).toContain('role="group"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
    for (const x of touchTargets(html)) expect(tallEnough(x.cls), x.cls).toBe(true);
  });
});

describe("bottom tab bar", () => {
  it("has four labelled tabs, marks exactly the current one, and every tab is a 56px target", () => {
    const html = render(h(TabBar, { path: "/review" }));
    expect(html).toContain('aria-label="Main navigation"');
    for (const id of ["tab-home", "tab-create", "tab-review", "tab-settings"]) expect(html).toContain(`data-testid="${id}"`);
    expect(count(html, 'aria-current="page"')).toBe(1);
    expect(html).toMatch(/aria-current="page" data-testid="tab-review"/);
    for (const x of touchTargets(html)) expect(/(?:^|\s)min-h-14(?:\s|$)/.test(x.cls), x.cls).toBe(true);
    // the active tab is more than a colour: a pill behind the icon, and the label is bold
    expect(html).toMatch(/data-testid="tab-review"[^>]*class="[^"]*font-bold[^"]*"/);
    expect(html).toContain("bg-neon/20");
    // the bar sits above the system navigation bar
    expect(html).toContain("env(safe-area-inset-bottom)");
  });
  it("a game's results and the plans screen belong to their parent tab", () => {
    expect(render(h(TabBar, { path: "/games/g/results/s" }))).toMatch(/aria-current="page" data-testid="tab-home"/);
    expect(render(h(TabBar, { path: "/plans" }))).toMatch(/aria-current="page" data-testid="tab-settings"/);
  });
});

describe("error screen", () => {
  it("offers a retry and the way back, both 44px targets, in both languages", () => {
    for (const locale of ["en", "he"] as const) {
      const html = render(h(ErrorFallback, { onRetry: () => {} }), locale);
      expect(html).toContain('data-testid="app-error-retry"');
      expect(html).toContain('href="#/"');
      expect(html).toContain(DICTIONARIES[locale]["mob.error.title"]);
      for (const x of touchTargets(html)) expect(tallEnough(x.cls), x.cls).toBe(true);
    }
  });
  it("turns a render error into the fallback state and renders healthy children untouched", () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
    expect(render(h(ErrorBoundary, null, h("p", null, "fine")))).toBe("<p>fine</p>");
  });
});

describe("phone screens: conventions the source must keep", () => {
  const root = path.resolve(import.meta.dirname, "../../mobile/src");
  const files = ["App.tsx", "ErrorBoundary.tsx", "pages/TabBar.tsx", "pages/Create.tsx", "pages/Welcome.tsx", "pages/Library.tsx", "pages/library-parts.tsx", "pages/Settings.tsx", "pages/Results.tsx", "pages/Deck.tsx"];
  const src = Object.fromEntries(files.map((f) => [f, readFileSync(path.join(root, f), "utf8")]));

  it("uses logical Tailwind properties only (RTL is the default language)", () => {
    const physical = /(?<![\w-])(?:ml|mr|pl|pr)-(?:\d|auto|\[)|text-(?:left|right)\b|(?<![\w-])border-[lr](?:-|\b)|rounded-[lr]-|(?<![\w:-])(?:left|right)-(?:\d|\[)/;
    for (const [f, s] of Object.entries(src)) {
      for (const m of s.matchAll(/(?:className|class)=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const cls = m[1] ?? m[2] ?? "";
        expect(physical.test(cls), `${f}: ${cls}`).toBe(false);
      }
    }
  });

  it("every literal translation key these screens use exists in both languages with matching placeholders", () => {
    const keys = new Set<string>();
    for (const s of Object.values(src)) for (const m of s.matchAll(/\bt\(\s*"([\w.]+)"/g)) keys.add(m[1]!);
    expect(keys.size).toBeGreaterThan(30);
    const ph = (v: string) => [...v.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort().join(",");
    for (const k of keys) {
      const en = (DICTIONARIES.en as Record<string, string>)[k];
      const he = (DICTIONARIES.he as Record<string, string>)[k];
      expect(en, `en ${k}`).toBeTruthy();
      expect(he, `he ${k}`).toBeTruthy();
      expect(ph(he!), `placeholders ${k}`).toBe(ph(en!));
    }
  });

  it("no fixed pixel widths on the phone screens (they must fit 360px)", () => {
    for (const [f, s] of Object.entries(src)) expect(/\bw-\[\d+px\]/.test(s), f).toBe(false);
  });
});
