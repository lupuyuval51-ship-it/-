import { describe, expect, it, vi } from "vitest";
import { GOOGLE_FLOW_TTL_MS, GOOGLE_REDIRECT_TO, finishGoogleSignIn, googleAuthEnabled, parseGoogleCallback, startGoogleSignIn, type OAuthClient, type PendingStore } from "../../mobile/src/cloud/google";
import { SUPABASE_URL } from "../../mobile/src/cloud/config";

const memory = (): PendingStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

function fakeClient(over: { url?: string | null; error?: string; exchangeError?: string } = {}) {
  const calls = { oauth: [] as unknown[], exchange: [] as string[] };
  const client: OAuthClient = {
    auth: {
      signInWithOAuth: async (args) => {
        calls.oauth.push(args);
        return { data: { url: over.url === undefined ? `${SUPABASE_URL}/auth/v1/authorize?provider=google&code_challenge=abc` : over.url }, error: over.error ? { message: over.error } : null };
      },
      exchangeCodeForSession: async (code) => {
        calls.exchange.push(code);
        return { error: over.exchangeError ? { message: over.exchangeError } : null };
      },
    },
  };
  return { client, calls };
}

describe("build flag", () => {
  it("the button exists only when VITE_GOOGLE_AUTH is exactly 1", () => {
    expect(googleAuthEnabled("1")).toBe(true);
    for (const v of [undefined, "", "0", "true", "yes", 1, null]) expect(googleAuthEnabled(v)).toBe(false);
  });
});

describe("return link parsing", () => {
  it("accepts only app.levelup.learn3d://auth with a code (or a provider error)", () => {
    expect(parseGoogleCallback("app.levelup.learn3d://auth?code=abc-123")).toEqual({ code: "abc-123" });
    expect(parseGoogleCallback("app.levelup.learn3d://auth/?code=abc")).toEqual({ code: "abc" });
    expect(parseGoogleCallback("app.levelup.learn3d://auth?error=access_denied&error_description=x")).toEqual({ error: "access_denied" });
    expect(parseGoogleCallback("app.levelup.learn3d://auth#error=access_denied")).toEqual({ error: "access_denied" });
    expect(parseGoogleCallback("app.levelup.learn3d://auth")).toEqual({ error: "missing_code" });
  });

  it("ignores everything else", () => {
    for (const bad of ["", "not a url", "https://evil.example/?code=1", "app.levelup.learn3d://other?code=1", "app.levelup.learn3d://auth/extra?code=1", "app.levelup.learn3d://u:p@auth?code=1", "other.app://auth?code=1", "app.levelup.learn3d.evil://auth?code=1", `app.levelup.learn3d://auth?code=${"x".repeat(3000)}`.replace(/code=x+/, "code=" + "x".repeat(3000)) ]) {
      const r = parseGoogleCallback(bad);
      expect(r === null || "error" in r).toBe(true);
    }
    expect(parseGoogleCallback("https://evil.example/?code=1")).toBeNull();
    expect(parseGoogleCallback("app.levelup.learn3d://auth/extra?code=1")).toBeNull();
  });
});

describe("start", () => {
  it("builds the URL through Supabase (PKCE, no redirect) and opens it outside the WebView, remembering the pending flow", async () => {
    const { client, calls } = fakeClient();
    const open = vi.fn();
    const store = memory();
    expect(await startGoogleSignIn(client, open, SUPABASE_URL, store, 1000)).toEqual({ ok: true });
    expect(calls.oauth).toEqual([{ provider: "google", options: { redirectTo: GOOGLE_REDIRECT_TO, skipBrowserRedirect: true } }]);
    expect(open).toHaveBeenCalledTimes(1);
    expect(new URL(open.mock.calls[0]![0] as string).origin).toBe(SUPABASE_URL);
    expect(store.data.size).toBe(1);
  });

  it("never opens a URL that is not on the Supabase project, or when Supabase reports an error", async () => {
    for (const over of [{ url: "https://evil.example/phish" }, { url: null }, { error: "provider is not enabled" }, { url: `${SUPABASE_URL}.evil.example/x` }]) {
      const { client } = fakeClient(over);
      const open = vi.fn();
      expect(await startGoogleSignIn(client, open, SUPABASE_URL, memory())).toEqual({ ok: false, reason: "failed" });
      expect(open).not.toHaveBeenCalled();
    }
    const throwing: OAuthClient = { auth: { signInWithOAuth: async () => { throw new Error("offline"); }, exchangeCodeForSession: async () => ({ error: null }) } };
    expect(await startGoogleSignIn(throwing, vi.fn(), SUPABASE_URL, memory())).toEqual({ ok: false, reason: "failed" });
  });
});

describe("finish (deep link)", () => {
  const link = "app.levelup.learn3d://auth?code=one-time-code";

  it("exchanges the code once for a flow this app started", async () => {
    const { client, calls } = fakeClient();
    const store = memory();
    await startGoogleSignIn(client, vi.fn(), SUPABASE_URL, store, 1000);
    expect(await finishGoogleSignIn(client, link, store, 5000)).toEqual({ ok: true });
    expect(calls.exchange).toEqual(["one-time-code"]);
    // replaying the same link does nothing: the pending marker is gone
    expect(await finishGoogleSignIn(client, link, store, 6000)).toBeNull();
    expect(calls.exchange).toHaveLength(1);
  });

  it("ignores unsolicited links (no flow started), expired flows, and links that are not ours: no request is made", async () => {
    const { client, calls } = fakeClient();
    expect(await finishGoogleSignIn(client, link, memory(), 5000)).toBeNull();
    const store = memory();
    await startGoogleSignIn(client, vi.fn(), SUPABASE_URL, store, 1000);
    expect(await finishGoogleSignIn(client, link, store, 1000 + GOOGLE_FLOW_TTL_MS + 1)).toBeNull();
    await startGoogleSignIn(client, vi.fn(), SUPABASE_URL, store, 1000);
    expect(await finishGoogleSignIn(client, "https://evil.example/?code=1", store, 2000)).toBeNull();
    expect(await finishGoogleSignIn(client, "app.levelup.learn3d://elsewhere?code=1", store, 2000)).toBeNull();
    expect(calls.exchange).toEqual([]);
  });

  it("reports cancel and failure without leaking the provider's message", async () => {
    const { client } = fakeClient({ exchangeError: "invalid flow state, no matching state found in storage" });
    const store = memory();
    await startGoogleSignIn(client, vi.fn(), SUPABASE_URL, store, 1000);
    expect(await finishGoogleSignIn(client, "app.levelup.learn3d://auth?error=access_denied", store, 2000)).toEqual({ ok: false, reason: "cancelled" });
    await startGoogleSignIn(client, vi.fn(), SUPABASE_URL, store, 1000);
    expect(await finishGoogleSignIn(client, "app.levelup.learn3d://auth?error=server_error", store, 2000)).toEqual({ ok: false, reason: "failed" });
    await startGoogleSignIn(client, vi.fn(), SUPABASE_URL, store, 1000);
    expect(await finishGoogleSignIn(client, link, store, 2000)).toEqual({ ok: false, reason: "failed" });
  });
});
