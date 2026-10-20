import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Capacitor plugins and the cloud library are replaced: this file tests the wiring of the sign-in button and the deep link.
const h = vi.hoisted(() => ({
  listeners: new Map<string, (e: never) => void>(),
  removed: [] as string[],
  connectAccount: vi.fn(),
  syncNow: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn(async (name: string, fn: (e: never) => void) => {
      h.listeners.set(name, fn);
      return { remove: async () => void h.removed.push(name) };
    }),
    getLaunchUrl: vi.fn(async () => null),
  },
}));
vi.mock("../../mobile/src/cloud/account", () => ({ connectAccount: h.connectAccount, syncNow: h.syncNow }));

const { SUPABASE_URL } = await import("../../mobile/src/cloud/config");
const native = await import("../../mobile/src/cloud/google-native");

/** What Supabase's client hands back: an address on the project, plus a counter of how often a flow was started. */
function fakeClient() {
  const started = vi.fn();
  return {
    started,
    auth: {
      signInWithOAuth: async () => { started(); return { data: { url: `${SUPABASE_URL}/auth/v1/authorize?provider=google` }, error: null }; },
      exchangeCodeForSession: async () => ({ error: null }),
    },
  };
}

beforeEach(() => {
  h.listeners.clear();
  h.removed.length = 0;
  h.connectAccount.mockReset();
  vi.stubGlobal("window", { location: { assign: vi.fn() } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("the Continue with Google button", () => {
  it("a second tap while the first is still being set up starts no second flow and opens the browser once", async () => {
    const client = fakeClient();
    let release!: (c: unknown) => void;
    h.connectAccount.mockReturnValue(new Promise((r) => { release = r; })); // the cloud library is still loading
    const first = native.signInWithGoogle();
    const second = native.signInWithGoogle();
    expect(second).toBe(first);
    release(client);
    expect(await first).toEqual({ ok: true });
    expect(client.started).toHaveBeenCalledTimes(1);
    expect((window.location.assign as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it("once it has answered, a later tap is a fresh attempt", async () => {
    const client = fakeClient();
    h.connectAccount.mockResolvedValue(client);
    await native.signInWithGoogle();
    await native.signInWithGoogle();
    expect(client.started).toHaveBeenCalledTimes(2);
  });

  it("a cloud library that cannot be loaded is a failed sign-in, not a rejection nobody handles, and the next tap can try again", async () => {
    h.connectAccount.mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"));
    await expect(native.signInWithGoogle()).resolves.toEqual({ ok: false, reason: "failed" });
    const client = fakeClient();
    h.connectAccount.mockResolvedValue(client);
    await expect(native.signInWithGoogle()).resolves.toEqual({ ok: true });
  });
});

describe("coming back from the system browser", () => {
  it("tells the screen when the app is active again, not when it goes to the background, and stops listening when asked", async () => {
    const fn = vi.fn();
    const stop = native.onAppResume(fn);
    const emit = h.listeners.get("appStateChange")!;
    emit({ isActive: false } as never);
    expect(fn).not.toHaveBeenCalled();
    emit({ isActive: true } as never);
    expect(fn).toHaveBeenCalledTimes(1);
    stop();
    await Promise.resolve();
    await Promise.resolve();
    expect(h.removed).toEqual(["appStateChange"]);
  });
});

describe("the deep link of a sign-in", () => {
  it("when the cloud library cannot be loaded, the screen still hears a failure (the gate would otherwise wait for ever)", async () => {
    vi.stubEnv("VITE_GOOGLE_AUTH", "1");
    h.connectAccount.mockRejectedValue(new Error("chunk"));
    const heard: unknown[] = [];
    const off = native.onGoogleResult((r) => heard.push(r));
    native.installGoogleDeepLink();
    h.listeners.get("appUrlOpen")!({ url: "app.levelup.learn3d://auth?code=abc" } as never);
    await vi.waitFor(() => expect(heard).toEqual([{ ok: false, reason: "failed" }]));
    // a link that is not ours is ignored without loading anything
    h.connectAccount.mockClear();
    h.listeners.get("appUrlOpen")!({ url: "https://example.com/?code=abc" } as never);
    await Promise.resolve();
    expect(h.connectAccount).not.toHaveBeenCalled();
    off();
  });
});
