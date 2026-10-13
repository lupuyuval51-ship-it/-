import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import type { CloudApi, CloudRows, PushBatch } from "@/lib/offline/sync";
import { request } from "./helpers";

/** The account module wired to fakes: no Supabase client, no browser, no network. */
const h = vi.hoisted(() => {
  const state = {
    session: null as null | { user: { id: string }; access_token: string },
    signOutCalls: [] as unknown[],
    signOutThrows: false,
    authListeners: 0,
    getSessionCalls: 0,
    pulls: 0,
    pullsSettled: 0,
    pullGate: null as null | Promise<void>,
    pullFails: false,
  };
  return { state };
});

vi.mock("../../mobile/src/cloud/client", () => ({
  supabase: {
    auth: {
      getSession: async () => { h.state.getSessionCalls++; return { data: { session: h.state.session } }; },
      onAuthStateChange: () => { h.state.authListeners++; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async (opts: unknown) => { h.state.signOutCalls.push(opts); if (h.state.signOutThrows) throw new Error("network down"); h.state.session = null; return { error: null }; },
      signInWithPassword: async () => ({ error: null }),
      signUp: async () => ({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock("../../mobile/src/cloud/api", () => ({
  supabaseCloud: (): CloudApi => ({
    async pull(): Promise<CloudRows> {
      h.state.pulls++;
      try {
        if (h.state.pullGate) await h.state.pullGate;
        if (h.state.pullFails) throw new Error("offline");
        return { games: [], sessions: [], cards: [] };
      } finally {
        h.state.pullsSettled++;
      }
    },
    async push(_b: PushBatch) { /* nothing to record */ },
  }),
}));

const shared = vi.hoisted(() => ({ store: null as unknown }));
vi.mock("../../mobile/src/app-state", async () => {
  const mod = await import("@/lib/offline/store");
  shared.store = new mod.OfflineStore(mod.memoryKV());
  return { store: shared.store };
});

/** A tiny localStorage, since the module reads the sync marks from the browser's. */
function installBrowser() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  });
  const doc = { visibilityState: "visible", handlers: [] as (() => void)[], addEventListener: (_type: string, fn: () => void) => void doc.handlers.push(fn) };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  return { data, doc };
}
let browser: ReturnType<typeof installBrowser>;

async function load() {
  vi.resetModules();
  h.state.session = null;
  h.state.signOutCalls = [];
  h.state.signOutThrows = false;
  h.state.authListeners = 0;
  h.state.getSessionCalls = 0;
  h.state.pulls = 0;
  h.state.pullsSettled = 0;
  h.state.pullGate = null;
  h.state.pullFails = false;
  return import("../../mobile/src/cloud/account");
}

beforeEach(() => { browser = installBrowser(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("account: signed out means silent", () => {
  it("no session: starting the account reads the saved sign-in and makes no cloud call", async () => {
    const acc = await load();
    acc.startAccount();
    await Promise.resolve();
    await acc.syncNow();
    expect(h.state.getSessionCalls).toBe(1);
    expect(h.state.pulls).toBe(0);
  });

  it("signed out, nothing the learner does triggers a request: changes, coming back, going away", async () => {
    vi.useFakeTimers();
    const acc = await load();
    acc.startAccount();
    await vi.advanceTimersByTimeAsync(0);
    (shared.store as OfflineStore).addGame(generateOffline(request()).spec);
    for (const state of ["hidden", "visible", "hidden"]) { browser.doc.visibilityState = state; browser.doc.handlers.forEach((fn) => fn()); }
    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.state.pulls).toBe(0);
  });

  it("startAccount can be called twice without wiring everything twice", async () => {
    const acc = await load();
    acc.startAccount();
    acc.startAccount();
    expect(h.state.authListeners).toBe(1);
    expect(h.state.getSessionCalls).toBe(1);
  });
});

describe("account: when changes are sent", () => {
  const change = () => (shared.store as OfflineStore).addGame(generateOffline(request()).spec);

  it("a change made while a round is running is sent afterwards, not forgotten", async () => {
    vi.useFakeTimers();
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "t" };
    let release!: () => void;
    h.state.pullGate = new Promise<void>((r) => { release = r; });
    acc.startAccount();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.state.pulls).toBe(1);
    change(); // the learner plays on while the first round waits for the network
    await vi.advanceTimersByTimeAsync(16_000); // the 15 s timer fires while the round is still busy and finds nothing to do
    expect(h.state.pulls).toBe(1);
    h.state.pullGate = null;
    release();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(16_000);
    expect(h.state.pulls).toBe(2);
  });

  it("when the app goes to the background with unsent changes, they are sent at once; with nothing to send, it stays quiet", async () => {
    vi.useFakeTimers();
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "t" };
    acc.startAccount();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    expect(h.state.pulls).toBe(1); // the start-up round
    const hide = () => { browser.doc.visibilityState = "hidden"; browser.doc.handlers.forEach((fn) => fn()); };
    hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.state.pulls).toBe(1); // nothing changed since the last round
    change();
    hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(h.state.pulls).toBe(2);
  });
});

describe("account: sign out", () => {
  it("ends this phone's sign-in only, never the learner's other phones", async () => {
    const acc = await load();
    await acc.signOut();
    expect(h.state.signOutCalls).toEqual([{ scope: "local" }]);
  });

  it("works offline: the server call failing still leaves the phone signed out and the games in place", async () => {
    const acc = await load();
    const store = shared.store as OfflineStore;
    const before = store.listGames().length;
    store.addGame(generateOffline(request()).spec);
    h.state.signOutThrows = true;
    await expect(acc.signOut()).resolves.toBeUndefined();
    expect(store.listGames()).toHaveLength(before + 1);
  });

  it("a sync that finishes after signing out does not change what Settings shows", async () => {
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "t" };
    let release!: () => void;
    h.state.pullGate = new Promise<void>((r) => { release = r; });
    h.state.pullFails = true; // the round will end in an error once released
    acc.startAccount();
    await vi.waitFor(() => expect(h.state.pulls).toBe(1));
    expect(acc.getAccountSnapshot().status).toBe("syncing");
    await acc.signOut();
    release();
    // Wait for the gated pull to actually settle (not a fixed sleep), then let the account module's own continuation run.
    await vi.waitFor(() => expect(h.state.pullsSettled).toBe(1));
    await new Promise((r) => setTimeout(r, 0));
    expect(acc.getAccountSnapshot()).toMatchObject({ session: null, status: "idle", error: null });
  });

  it("a finished round reports what it left out", async () => {
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "t" };
    acc.startAccount();
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("ok"));
    expect(acc.getAccountSnapshot()).toMatchObject({ skipped: 0, rejected: 0, error: null });
  });

  it("a failed round shows the error and the next trigger retries", async () => {
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "t" };
    h.state.pullFails = true;
    acc.startAccount();
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("error"));
    expect(acc.getAccountSnapshot().error).toBe("offline");
    h.state.pullFails = false;
    await acc.syncNow();
    expect(acc.getAccountSnapshot()).toMatchObject({ status: "ok", error: null });
  });
});

describe("account: delete account", () => {
  it("offline, deleting fails with a message instead of throwing, and nothing is signed out", async () => {
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "tok" };
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const r = await acc.deleteAccount();
    expect(r).toEqual({ ok: false, message: "no connection" });
    expect(h.state.signOutCalls).toEqual([]);
  });

  it("when the server refuses, the account stays signed in", async () => {
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "tok" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    expect(await acc.deleteAccount()).toEqual({ ok: false, message: "delete failed (500)" });
    expect(h.state.signOutCalls).toEqual([]);
  });

  it("success signs out locally", async () => {
    const acc = await load();
    h.state.session = { user: { id: "u1" }, access_token: "tok" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await acc.deleteAccount()).toEqual({ ok: true });
    expect(h.state.signOutCalls).toEqual([{ scope: "local" }]);
  });

  it("not signed in: nothing is sent", async () => {
    const acc = await load();
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await acc.deleteAccount()).toEqual({ ok: false, message: "not signed in" });
    expect(f).not.toHaveBeenCalled();
  });
});

describe("memory store used by the fakes", () => {
  it("is a plain OfflineStore", () => {
    expect(new OfflineStore(memoryKV()).listGames()).toEqual([]);
  });
});
