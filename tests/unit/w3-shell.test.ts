import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameSummaryRow } from "@/lib/offline/store";
import { filterCounts, filterGames, isDone, type LibraryGame } from "../../mobile/src/library-model";
import { CREATE_DRAFT_KEY } from "../../mobile/src/reset";
import { DRAFT_KEY } from "../../mobile/src/pages/createForm";

const row = (over: Partial<GameSummaryRow> = {}): LibraryGame => ({
  id: "g", title: "Game", subject: "Subject", createdAt: 1000, generatorKind: "engine", environment: "meadow", bestScore: 0, bestStars: 0, maxScore: 100,
  inProgress: false, percent: 0, lastSessionId: null, ...over, lastPlayedAt: over.lastPlayedAt ?? 1000,
});

describe("library: a game finished with every answer revealed is completed", () => {
  it("counts the store's own `completed` flag, not only a score above 0", () => {
    // a finished run may score 0 (every answer revealed): the store marks the game completed all the same
    const revealed = row({ id: "revealed", completed: true });
    expect(isDone(revealed)).toBe(true);
    expect(isDone(row({ id: "fresh", completed: false }))).toBe(false);
    // rows without the flag keep the old rule (the store only scores finished runs)
    expect(isDone(row({ bestScore: 40, bestStars: 2 }))).toBe(true);
    expect(isDone(row())).toBe(false);
  });

  it("the Completed filter and its count include it", () => {
    const games = [row({ id: "a", inProgress: true }), row({ id: "b", completed: true }), row({ id: "c", completed: true, bestScore: 70, bestStars: 2, inProgress: true }), row({ id: "d", completed: false })];
    expect(filterGames(games, "done").map((g) => g.id)).toEqual(["b", "c"]);
    expect(filterCounts(games)).toEqual({ all: 4, progress: 2, done: 2 });
  });
});

describe("delete all games also wipes the Create screen's draft", () => {
  it("uses the very key the Create screen saves its draft under", () => {
    expect(CREATE_DRAFT_KEY).toBe(DRAFT_KEY);
  });
});

describe("app shell", () => {
  it("sets the page language and direction before the first paint (no mirrored frame for an English or Spanish learner)", () => {
    const app = readFileSync("mobile/src/App.tsx", "utf8");
    expect(app).toMatch(/useLayoutEffect\(\(\) => \{\s*document\.documentElement\.lang = locale;\s*document\.documentElement\.dir = dirOf\(locale\);\s*\}, \[locale\]\);/);
  });

  it("documents every build switch the app reads, with the default each one really has", () => {
    const env = readFileSync("mobile/src/vite-env.d.ts", "utf8");
    for (const name of ["VITE_GOOGLE_AUTH", "VITE_REQUIRE_GOOGLE", "VITE_SHOW_PLANS", "VITE_SETUP_PLAN"]) expect(env).toContain(`readonly ${name}?: string;`);
    expect(env).not.toMatch(/demo/i); // there are no demo games
    expect(env).toMatch(/"0" hides them/);
  });

  describe("settings store", () => {
    const mem = new Map<string, string>();
    const fakeStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
    const loadAppState = async () => {
      vi.resetModules();
      vi.stubGlobal("localStorage", fakeStorage);
      vi.stubGlobal("window", { location: { hash: "" }, localStorage: fakeStorage, addEventListener: () => {}, removeEventListener: () => {} });
      vi.stubGlobal("document", { documentElement: { removeAttribute: () => {}, setAttribute: () => {} } });
      return import("../../mobile/src/app-state");
    };
    afterEach(() => { mem.clear(); vi.unstubAllGlobals(); });

    it("can be read by a screen rendered outside the phone (static render) and follows a change", async () => {
      mem.set("levelup.mobile.settings", JSON.stringify({ locale: "es", setupDone: true }));
      const s = await loadAppState();
      function Probe() { return h("span", null, s.useSettings().locale); }
      expect(renderToStaticMarkup(h(Probe))).toBe("<span>es</span>");
      s.setSettings({ locale: "en" });
      expect(renderToStaticMarkup(h(Probe))).toBe("<span>en</span>");
      expect(JSON.parse(mem.get("levelup.mobile.settings")!).locale).toBe("en");
    });
  });
});
