import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { OfflineStore } from "@/lib/offline/store";
import type { CloudApi, CloudRows, PushBatch } from "@/lib/offline/sync";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../../mobile/src/cloud/config";
import { request } from "./helpers";

/**
 * The account module (sign-in, sign-up, sign-out, delete, the automatic rounds) wired to fakes: no Supabase library, no network.
 * `account.test.ts` covers when rounds run; this file covers what the learner is told, what is forgotten on sign-out, and what
 * delete-account sends.
 */
type Session = { user: { id: string }; access_token: string };
const h = vi.hoisted(() => {
  const s = {
    session: null as null | { user: { id: string }; access_token: string },
    /** what a successful sign-in will make the session */
    next: null as null | { user: { id: string }; access_token: string },
    listener: null as null | ((event: string, session: unknown) => void),
    loadFails: false,
    loads: 0,
    saved: false,
    signInError: null as string | null,
    signUpError: null as string | null,
    /** sign-up answers with a session (no e-mail confirmation) or without one */
    signUpSession: false,
    signOutCalls: 0,
    pulls: 0,
    pushes: [] as unknown[],
    pullGate: null as null | Promise<void>,
  };
  return { s };
});

vi.mock("../../mobile/src/cloud/client", () => ({
  hasSavedSignIn: () => h.s.saved || h.s.session !== null,
  getSupabase: async () => { h.s.loads++; if (h.s.loadFails) throw new Error("chunk failed to load"); return fakeClient; },
}));
const fakeClient = vi.hoisted(() => ({
  auth: {
    getSession: async () => ({ data: { session: h.s.session } }),
    onAuthStateChange: (cb: (event: string, session: unknown) => void) => { h.s.listener = cb; return { data: { subscription: { unsubscribe() {} } } }; },
    signInWithPassword: async () => {
      if (h.s.signInError) return { error: { message: h.s.signInError } };
      h.s.session = h.s.next;
      h.s.listener?.("SIGNED_IN", h.s.session);
      return { error: null };
    },
    signUp: async () => {
      if (h.s.signUpError) return { data: { session: null }, error: { message: h.s.signUpError } };
      if (h.s.signUpSession) { h.s.session = h.s.next; h.s.listener?.("SIGNED_IN", h.s.session); }
      return { data: { session: h.s.signUpSession ? h.s.session : null }, error: null };
    },
    signOut: async () => { h.s.signOutCalls++; h.s.session = null; h.s.listener?.("SIGNED_OUT", null); return { error: null }; },
  },
}));
vi.mock("../../mobile/src/cloud/api", () => ({
  supabaseCloud: (): CloudApi => ({
    async pull(): Promise<CloudRows> {
      h.s.pulls++;
      if (h.s.pullGate) await h.s.pullGate;
      return { games: [], sessions: [], cards: [] };
    },
    async push(b: PushBatch) { h.s.pushes.push(b); },
  }),
}));
const shared = vi.hoisted(() => ({ store: null as unknown }));
vi.mock("../../mobile/src/app-state", () => ({ get store() { return shared.store; } }));

const SYNC_KEY = "levelup.offline.sync";
function installBrowser() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  });
  vi.stubGlobal("document", { visibilityState: "visible", addEventListener: vi.fn() });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  return data;
}
let data: Map<string, string>;
const U1: Session = { user: { id: "u1" }, access_token: "tok-1" };
const U2: Session = { user: { id: "u2" }, access_token: "tok-2" };

async function load() {
  vi.resetModules();
  const { OfflineStore: Store, memoryKV } = await import("@/lib/offline/store");
  shared.store = new Store(memoryKV());
  Object.assign(h.s, { session: null, next: U1, listener: null, loadFails: false, loads: 0, saved: false, signInError: null, signUpError: null, signUpSession: false, signOutCalls: 0, pulls: 0, pushes: [], pullGate: null });
  return import("../../mobile/src/cloud/account");
}
beforeEach(() => { data = installBrowser(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("signing in", () => {
  it("a refused password gives the server's message, signs nobody in and starts no round", async () => {
    const acc = await load();
    h.s.signInError = "Invalid login credentials";
    expect(await acc.signIn("a@b.c", "wrong")).toEqual({ ok: false, message: "Invalid login credentials" });
    expect(acc.getAccountSnapshot()).toMatchObject({ session: null, status: "idle", error: null });
    expect(h.s.pulls).toBe(0);
  });

  it("a good password signs in, and a round runs for that account at once", async () => {
    const acc = await load();
    expect(await acc.signIn("a@b.c", "pw")).toEqual({ ok: true });
    expect(acc.getAccountSnapshot().session?.user.id).toBe("u1");
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("ok"));
    expect(h.s.pulls).toBe(1);
    expect(JSON.parse(data.get(SYNC_KEY)!)).toMatchObject({ userId: "u1" });
  });
});

describe("signing up", () => {
  it("with e-mail confirmation switched on there is no session yet: the learner is told to confirm, and nothing syncs", async () => {
    const acc = await load();
    expect(await acc.signUp("a@b.c", "pw")).toEqual({ ok: true, needsConfirmation: true });
    expect(acc.getAccountSnapshot().session).toBeNull();
    expect(h.s.pulls).toBe(0);
  });

  it("with a session straight away the account is signed in and synced, with no confirmation step", async () => {
    const acc = await load();
    h.s.signUpSession = true;
    expect(await acc.signUp("a@b.c", "pw")).toEqual({ ok: true });
    expect(acc.getAccountSnapshot().session?.user.id).toBe("u1");
    await vi.waitFor(() => expect(h.s.pulls).toBe(1));
  });

  it("an address that is taken or a password that is too weak shows the server's message and nothing else changes", async () => {
    const acc = await load();
    h.s.signUpError = "User already registered";
    expect(await acc.signUp("a@b.c", "pw")).toEqual({ ok: false, message: "User already registered" });
    expect(acc.getAccountSnapshot().session).toBeNull();
    expect(h.s.pulls).toBe(0);
  });
});

describe("the cloud library cannot be loaded", () => {
  it("every account action says there is no connection, and the next one tries to load it again", async () => {
    const acc = await load();
    h.s.loadFails = true;
    expect(await acc.signIn("a@b.c", "pw")).toEqual({ ok: false, message: "no connection" });
    expect(await acc.signUp("a@b.c", "pw")).toEqual({ ok: false, message: "no connection" });
    expect(h.s.loads).toBe(2); // a failed load is not remembered
    h.s.loadFails = false;
    expect(await acc.signIn("a@b.c", "pw")).toEqual({ ok: true });
    expect(h.s.loads).toBeGreaterThan(2); // (the round that follows asks for the client again, which the real one caches)
  });

  it("signing out still works: the learner is signed out here and the marks are forgotten", async () => {
    const acc = await load();
    data.set(SYNC_KEY, JSON.stringify({ userId: "u1", cursor: null, lastPushMs: 5, lastSyncAt: 6 }));
    h.s.saved = true;
    h.s.loadFails = true;
    await expect(acc.signOut()).resolves.toBeUndefined();
    expect(data.has(SYNC_KEY)).toBe(false);
    expect(acc.getAccountSnapshot()).toMatchObject({ session: null, status: "idle", lastSyncAt: null });
  });
});

describe("signing out", () => {
  it("forgets the sync marks and the last sync time, so the next account starts clean; the games stay", async () => {
    const acc = await load();
    const store = shared.store as OfflineStore;
    store.addGame(generateOffline(request()).spec);
    await acc.signIn("a@b.c", "pw");
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("ok"));
    expect(data.has(SYNC_KEY)).toBe(true);
    expect(acc.getAccountSnapshot().lastSyncAt).not.toBeNull();
    await acc.signOut();
    expect(data.has(SYNC_KEY)).toBe(false);
    expect(acc.getAccountSnapshot()).toMatchObject({ session: null, status: "idle", lastSyncAt: null, error: null, skipped: 0, rejected: 0 });
    expect(store.listGames()).toHaveLength(1);
  });

  it("a change made just before signing out is not sent afterwards by the timer", async () => {
    vi.useFakeTimers();
    const acc = await load();
    h.s.session = U1;
    acc.startAccount();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    expect(h.s.pulls).toBe(1);
    (shared.store as OfflineStore).addGame(generateOffline(request()).spec); // starts the 15 s timer
    await acc.signOut();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.s.pulls).toBe(1);
  });

  it("a phone that never signed in does not load the library just to sign out", async () => {
    const acc = await load();
    await acc.signOut();
    expect(h.s.loads).toBe(0);
    expect(h.s.signOutCalls).toBe(0);
  });

  // Found while writing this file (see the report): `syncNow` hands the new session the round of the account that just left.
  it("an account that signs in while the previous account's round is still running gets its own round", async () => {
    const acc = await load();
    h.s.session = U1;
    let release!: () => void;
    h.s.pullGate = new Promise<void>((r) => { release = r; });
    acc.startAccount();
    await vi.waitFor(() => expect(h.s.pulls).toBe(1));
    await acc.signOut();
    h.s.next = U2;
    await acc.signIn("b@c.d", "pw");
    h.s.pullGate = null;
    release();
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("ok"));
    expect(h.s.pulls).toBe(2);
    expect(JSON.parse(data.get(SYNC_KEY)!)).toMatchObject({ userId: "u2" });
  });
});

describe("deleting the account", () => {
  it("asks the delete-account function with the learner's own token and the publishable key, and nothing else", async () => {
    const acc = await load();
    h.s.session = U1;
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", f);
    expect(await acc.deleteAccount()).toEqual({ ok: true });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${SUPABASE_URL}/functions/v1/delete-account`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer tok-1", apikey: SUPABASE_PUBLISHABLE_KEY });
    expect(init.body).toBeUndefined(); // the function knows who is asking from the token: no id is ever sent
  });

  it("afterwards the phone is signed out with clean sync marks, and every local game is still there", async () => {
    const acc = await load();
    const store = shared.store as OfflineStore;
    store.addGame(generateOffline(request()).spec);
    store.addGame(generateOffline(request({ subject: "Decimals" })).spec);
    await acc.signIn("a@b.c", "pw");
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("ok"));
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await acc.deleteAccount()).toEqual({ ok: true });
    expect(acc.getAccountSnapshot()).toMatchObject({ session: null, status: "idle", lastSyncAt: null });
    expect(data.has(SYNC_KEY)).toBe(false);
    expect(store.listGames()).toHaveLength(2);
  });

  it("a refusal or no connection leaves the sign-in, the marks and the games alone", async () => {
    const acc = await load();
    await acc.signIn("a@b.c", "pw");
    await vi.waitFor(() => expect(acc.getAccountSnapshot().status).toBe("ok"));
    const marks = data.get(SYNC_KEY);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 403 })));
    expect(await acc.deleteAccount()).toEqual({ ok: false, message: "delete failed (403)" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    expect(await acc.deleteAccount()).toEqual({ ok: false, message: "no connection" });
    expect(acc.getAccountSnapshot().session?.user.id).toBe("u1");
    expect(data.get(SYNC_KEY)).toBe(marks);
    expect(h.s.signOutCalls).toBe(0);
  });
});
