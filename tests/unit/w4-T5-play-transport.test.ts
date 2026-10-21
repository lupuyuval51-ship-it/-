import { afterEach, describe, expect, it, vi } from "vitest";
import { RENDER_PROFILES } from "@/config/graphics";
import { DECK_SESSION, offlineTransport } from "@/components/game/offlineTransport";
import { ApiFailure } from "@/components/game/transport";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineError, OfflineStore } from "@/lib/offline/store";
import { navigate } from "../../mobile/src/router";
import { showPlans } from "../../mobile/src/features";
import { NOTES } from "./offline-helpers";
import { request } from "./helpers";

/**
 * What the play screen of the Android app talks to (`offlineTransport`): the same contract as the server's API, answered on the
 * phone. The screen relies on it for its error handling (a refused move is an `ApiFailure` with the server's status and code, never a
 * bare exception) and for the "review my mistakes" deck, which is a pseudo session.
 */

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

/** A store whose methods are spies, to check what the transport routes where. */
function spyStore(over: Partial<Record<"startSession" | "applyEvent" | "practice" | "deckPractice", (...a: never[]) => unknown>> = {}) {
  const calls: Record<string, unknown[][]> = { startSession: [], applyEvent: [], practice: [], deckPractice: [] };
  const rec = (name: string, result: unknown) => (...a: unknown[]) => { calls[name]!.push(a); return result; };
  const store = {
    startSession: over.startSession ?? rec("startSession", undefined),
    applyEvent: over.applyEvent ?? rec("applyEvent", { applied: true }),
    practice: over.practice ?? rec("practice", { from: "game" }),
    deckPractice: over.deckPractice ?? rec("deckPractice", { from: "deck" }),
  };
  return { store: store as unknown as OfflineStore, calls };
}

describe("practice: the mistake deck is a pseudo session of its own", () => {
  it("the deck's id goes to the deck, any other id to that game's run", async () => {
    const { store, calls } = spyStore();
    const t = offlineTransport(store, () => "B");
    expect(DECK_SESSION).toBe("deck");
    expect(await t.practice(DECK_SESSION, { action: "next" })).toEqual({ from: "deck" });
    expect(await t.practice("run-42", { action: "next" })).toEqual({ from: "game" });
    expect(calls.deckPractice).toEqual([[{ action: "next" }]]);
    expect(calls.practice).toEqual([["run-42", { action: "next" }]]);
  });

  it("a run whose id merely contains the word 'deck' is still a run", async () => {
    const { store, calls } = spyStore();
    await offlineTransport(store, () => "B").practice("deck-1", {});
    expect(calls.deckPractice).toEqual([]);
    expect(calls.practice).toHaveLength(1);
  });
});

describe("errors keep the server's shape", () => {
  const throwing = (e: unknown) => () => { throw e; };

  it("a refusal of the store is an ApiFailure with the same status, code and message, for every call", async () => {
    const refuse = throwing(new OfflineError(409, "ALREADY_COLLECTED", "Already picked up."));
    const t = offlineTransport(spyStore({ startSession: refuse, applyEvent: refuse, practice: refuse, deckPractice: refuse }).store, () => "B");
    const failures = await Promise.all([
      t.startSession("g", false).catch((e: unknown) => e),
      t.sendEvent("s", { type: "collect" }).catch((e: unknown) => e),
      t.practice("s", {}).catch((e: unknown) => e),
      t.practice(DECK_SESSION, {}).catch((e: unknown) => e),
    ]);
    for (const f of failures) {
      expect(f).toBeInstanceOf(ApiFailure);
      expect(f).toMatchObject({ status: 409, code: "ALREADY_COLLECTED", message: "Already picked up." });
    }
  });

  it("anything else is passed on as it is (a bug is not dressed up as a refused move)", async () => {
    const bug = new TypeError("x is undefined");
    const t = offlineTransport(spyStore({ applyEvent: throwing(bug) }).store, () => "B");
    await expect(t.sendEvent("s", {})).rejects.toBe(bug);
  });

  it("every call answers with a promise, even when the store throws at once: the play screen's `.catch` always runs", () => {
    const t = offlineTransport(spyStore({ startSession: throwing(new Error("boom")), applyEvent: throwing(new Error("boom")), practice: throwing(new Error("boom")) }).store, () => "B");
    let p: Promise<unknown>[] = [];
    expect(() => { p = [t.startSession("g", false), t.sendEvent("s", {}), t.practice("s", {})]; }).not.toThrow();
    return Promise.all(p.map((x) => x.catch(() => "rejected"))).then((r) => expect(r).toEqual(["rejected", "rejected", "rejected"]));
  });

  it("a game that is not on the phone is a 404 NOT_FOUND, like the server's", async () => {
    const t = offlineTransport(new OfflineStore(memoryKV()), () => "B");
    const e = await t.startSession("missing", false).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiFailure);
    expect(e).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("startSession on the phone", () => {
  const phone = () => {
    const store = new OfflineStore(memoryKV());
    const game = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FAST" })).spec);
    return { store, game };
  };

  it("describes the run the way the server does: no plan to buy, the game's label, the tier's profile", async () => {
    const { store, game } = phone();
    const s = await offlineTransport(store, () => "B").startSession(game.id, false);
    expect(s).toMatchObject({ resumed: false, testHooks: false, render: { tier: "B", plan: "OFFLINE" }, game: { id: game.id, title: game.title } });
    expect(s.render.profile).toBe(RENDER_PROFILES.B);
    expect(s.game.generator.kind).toBe(game.spec.meta.generator?.kind);
    expect(s.sessionId).toBeTruthy();
    expect(s.maxScore).toBeGreaterThan(0);
  });

  it("reads the tier at every call, so a tier changed in Settings reaches the next game without a restart", async () => {
    const { store, game } = phone();
    let tier: "A" | "B" | "C" = "A";
    const t = offlineTransport(store, () => tier);
    expect((await t.startSession(game.id, true)).render.profile).toBe(RENDER_PROFILES.A);
    tier = "C";
    expect((await t.startSession(game.id, true)).render.profile).toBe(RENDER_PROFILES.C);
  });

  it("test hooks are on only for an explicit `true` (the store build never passes it)", async () => {
    const { store, game } = phone();
    const flags: unknown[] = [];
    for (const opts of [undefined, {}, { testHooks: false }, { testHooks: "yes" as unknown as boolean }, { testHooks: true }]) {
      flags.push((await offlineTransport(store, () => "B", opts).startSession(game.id, false)).testHooks);
    }
    expect(flags).toEqual([false, false, false, false, true]);
  });

  it("a game saved without its generator note still starts, labelled as the old ready-made template", async () => {
    const { store: fake } = spyStore({
      startSession: () => ({ session: { id: "s1" }, resumed: true, game: { id: "g1", title: "Old", revision: 3, spec: { meta: {} } }, spec: {}, client: { areaId: "a" }, maxScore: 10 }) as never,
    });
    const s = await offlineTransport(fake, () => "C").startSession("g1", false);
    expect(s).toMatchObject({ sessionId: "s1", resumed: true, game: { id: "g1", title: "Old", revision: 3, generator: { kind: "demo", provider: "demo" } }, state: { areaId: "a" }, maxScore: 10 });
  });
});

describe("the app's routing and display switches", () => {
  it("navigate adds a history entry, and `replace` swaps the current one (Back must not return to a screen that only redirected)", () => {
    const win = { location: { hash: "#/", replace: vi.fn() } };
    vi.stubGlobal("window", win);
    navigate("/settings");
    expect(win.location.hash).toBe("/settings"); // assigning a hash adds an entry; the browser puts the # in front
    expect(win.location.replace).not.toHaveBeenCalled();
    navigate("/games/g1/results/s1/review", true);
    expect(win.location.replace).toHaveBeenCalledWith("#/games/g1/results/s1/review");
  });

  it("only the exact value \"0\" hides the plans: any other value, or none, shows them", () => {
    expect(showPlans("0")).toBe(false);
    for (const v of [undefined, "", "1", "true", "false", "off", 0]) expect(showPlans(v), String(v)).toBe(true);
  });

  it("reads the build's switch by default", () => {
    vi.stubEnv("VITE_SHOW_PLANS", "0");
    expect(showPlans()).toBe(false);
    vi.stubEnv("VITE_SHOW_PLANS", "1");
    expect(showPlans()).toBe(true);
  });
});
