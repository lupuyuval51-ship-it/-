import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { supabaseCloud } from "../../mobile/src/cloud/api";
import { AI_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../../mobile/src/cloud/config";

/**
 * The cloud client as the app really builds it: the real Supabase library on a stubbed browser, with `fetch` counted. This pins
 * the three things the sign-in depends on without a network: PKCE, the one storage key, and the key name the library writes while
 * a Google sign-in is waiting for its deep link (`hasSavedSignIn` reads it to decide whether to load the library at all).
 */
function installBrowser() {
  const data = new Map<string, string>();
  const ls = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  };
  const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("localStorage", ls);
  vi.stubGlobal("window", { localStorage: ls, addEventListener() {}, removeEventListener() {}, location: { href: "http://localhost/", hash: "", search: "" }, navigator: {} });
  vi.stubGlobal("document", { visibilityState: "visible", addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("fetch", fetchSpy);
  return { data, fetchSpy };
}

describe("the Supabase client the app builds", () => {
  let browser: ReturnType<typeof installBrowser>;
  beforeEach(() => { vi.resetModules(); browser = installBrowser(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("a phone without a sign-in knows it without loading the library, and starts no request", async () => {
    const { hasSavedSession, hasSavedSignIn } = await import("../../mobile/src/cloud/client");
    expect([hasSavedSession(), hasSavedSignIn()]).toEqual([false, false]);
    expect(browser.fetchSpy).not.toHaveBeenCalled();
  });

  it("uses PKCE and the one storage key, and a Google sign-in that was only started is a saved sign-in but not a session", async () => {
    const { AUTH_STORAGE_KEY, getSupabase, hasSavedSession, hasSavedSignIn } = await import("../../mobile/src/cloud/client");
    expect(AUTH_STORAGE_KEY).toBe("levelup.auth");
    const db = await getSupabase();
    try {
      const r = await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "app.levelup.learn3d://auth", skipBrowserRedirect: true } });
      expect(r.error).toBeNull();
      const url = new URL(r.data.url!);
      expect(url.origin).toBe(SUPABASE_URL);
      expect(url.searchParams.get("provider")).toBe("google");
      expect(url.searchParams.get("code_challenge")).toBeTruthy(); // PKCE: a bare token would come back through the link instead
      expect(url.searchParams.get("code_challenge_method")).toBeTruthy();
      expect(url.searchParams.get("redirect_to")).toBe("app.levelup.learn3d://auth");
      // the verifier is kept under this app's own key: that is what hasSavedSignIn reads, and nothing is kept under the library's default key
      expect(browser.data.has(`${AUTH_STORAGE_KEY}-code-verifier`)).toBe(true);
      expect([...browser.data.keys()].every((k) => k.startsWith(`${AUTH_STORAGE_KEY}`))).toBe(true);
      expect(hasSavedSignIn()).toBe(true);
      expect(hasSavedSession()).toBe(false);
      expect(browser.fetchSpy).not.toHaveBeenCalled(); // building the link makes no request
    } finally {
      await db.auth.stopAutoRefresh();
    }
  });

  it("a finished sign-in under the app's key counts as both", async () => {
    const { AUTH_STORAGE_KEY, hasSavedSession, hasSavedSignIn } = await import("../../mobile/src/cloud/client");
    browser.data.set(AUTH_STORAGE_KEY, "{}");
    expect([hasSavedSession(), hasSavedSignIn()]).toEqual([true, true]);
  });

  it("blocked storage (the accessor throws) reads as 'nothing saved', never as an error", async () => {
    const { hasSavedSession, hasSavedSignIn } = await import("../../mobile/src/cloud/client");
    vi.stubGlobal("localStorage", { getItem: () => { throw new DOMException("blocked", "SecurityError"); } });
    expect([hasSavedSession(), hasSavedSignIn()]).toEqual([false, false]);
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", undefined);
    expect([hasSavedSession(), hasSavedSignIn()]).toEqual([false, false]);
  });
});

describe("the project addresses in the app", () => {
  it("are https addresses of two different projects; the AI address carries no key (the function checks the sign-in)", () => {
    for (const u of [SUPABASE_URL, AI_URL]) expect(u).toMatch(/^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
    expect(AI_URL).not.toBe(SUPABASE_URL);
    expect(SUPABASE_PUBLISHABLE_KEY).toMatch(/^sb_publishable_/);
  });
});

describe("pulling from the cloud fails loudly instead of looping or skipping", () => {
  /** A client whose every select answers the same way. */
  const answering = (result: { data: unknown; error: { message: string } | null }) => {
    const q = { gt: () => q, in: () => q, or: () => q, order: () => q, limit: () => Promise.resolve(result) };
    return { from: () => ({ select: () => q }) } as unknown as SupabaseClient;
  };

  it("the server's own message reaches the caller (it is what Settings shows)", async () => {
    await expect(supabaseCloud(answering({ data: null, error: { message: "JWT expired" } })).pull(null)).rejects.toThrow("JWT expired");
    await expect(supabaseCloud(answering({ data: null, error: { message: "permission denied" } })).pullGameData!(["g"])).rejects.toThrow("permission denied");
  });

  it("an answer without data is an empty table, not a crash", async () => {
    await expect(supabaseCloud(answering({ data: null, error: null })).pull(null)).resolves.toEqual({ games: [], sessions: [], cards: [] });
  });

  it("a full page whose last row has no stamp or key cannot be continued: it raises, rather than asking for the same page for ever", async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ local_id: `g${i}`, title: "t", spec: {}, created_at: "x", deleted_at: null })); // no updated_at
    await expect(supabaseCloud(answering({ data: rows, error: null })).pull(null)).rejects.toThrow(/without its updated_at/);
    const noKey = Array.from({ length: 10 }, (_, i) => ({ updated_at: `2030-01-01T00:00:0${i}.000Z`, title: "t", spec: {}, created_at: "x", deleted_at: null }));
    await expect(supabaseCloud(answering({ data: noKey, error: null })).pull(null)).rejects.toThrow(/without its updated_at \/ local_id/);
  });

  it("a short page never needs the stamp: the last page of a table is returned as it is", async () => {
    const rows = [{ local_id: "g1", title: "t", spec: { a: 1 }, created_at: "c", updated_at: "u", deleted_at: null }];
    const out = await supabaseCloud(answering({ data: rows, error: null })).pull(null);
    expect(out.games).toEqual([expect.objectContaining({ localId: "g1", deletedAt: null, spec: { a: 1 } })]);
  });

  it("pullGameData with no game asks for nothing", async () => {
    const select = vi.fn();
    const db = { from: () => ({ select }) } as unknown as SupabaseClient;
    await expect(supabaseCloud(db).pullGameData!([])).resolves.toEqual({ sessions: [], cards: [] });
    expect(select).not.toHaveBeenCalled();
  });
});
