import { beforeEach, describe, expect, it, vi } from "vitest";

// The cloud library is a lazily loaded chunk. A load that fails once (no connection on the website, a WebView hiccup) must not
// leave every later account action failing until the app restarts.
const h = vi.hoisted(() => ({ fail: true, created: 0 }));
vi.mock("@supabase/supabase-js", () => {
  if (h.fail) { h.fail = false; throw new Error("chunk failed to load"); }
  return { createClient: () => { h.created++; return { auth: {} }; } };
});

describe("getSupabase", () => {
  beforeEach(() => { vi.resetModules(); h.fail = true; h.created = 0; });

  it("tries the library again after a failed load", async () => {
    const { getSupabase } = await import("../../mobile/src/cloud/client");
    await expect(getSupabase()).rejects.toThrow();
    await expect(getSupabase()).resolves.toBeTruthy(); // the same module, a second call: the failure was not remembered
    expect(h.created).toBe(1);
  });

  it("keeps one client once it loaded", async () => {
    h.fail = false;
    const { getSupabase } = await import("../../mobile/src/cloud/client");
    const [a, b] = await Promise.all([getSupabase(), getSupabase()]);
    expect(a).toBe(b);
    expect(h.created).toBe(1);
  });
});
