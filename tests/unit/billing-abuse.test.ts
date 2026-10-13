import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/** The two billing HTTP entry points wired to fakes: no database, no Stripe. Only the route-level guards are under test. */
const h = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getBillingView: vi.fn(async () => ({ plan: "FREE" })),
  syncCheckout: vi.fn(async () => ({ plan: "FREE" })),
  handleStripeWebhook: vi.fn(async () => ({ status: 200, body: { received: true } })),
}));

vi.mock("@/server/auth/session", async (orig) => ({
  ...(await orig<typeof import("@/server/auth/session")>()),
  getUserBySessionToken: async () => ({ id: "user-1", email: "a@b.co", displayName: "A", locale: "en", country: null, graphicsPreference: null, soundEnabled: true, musicEnabled: true }),
}));
vi.mock("@/server/ratelimit", () => ({ checkRateLimit: h.checkRateLimit }));
vi.mock("@/server/billing/service", () => ({ getBillingView: h.getBillingView, syncCheckout: h.syncCheckout, handleStripeWebhook: h.handleStripeWebhook }));

import { GET as status } from "@/app/api/billing/status/route";
import { POST as webhook } from "@/app/api/webhooks/stripe/route";

const COOKIE = `levelup_session=${"t".repeat(43)}`;
const get = (qs = "") => new NextRequest(`http://localhost:3000/api/billing/status${qs}`, { headers: { host: "localhost:3000", cookie: COOKIE } });

beforeEach(() => {
  vi.clearAllMocks();
  h.checkRateLimit.mockResolvedValue({ ok: true, remaining: 10, retryAfterSec: 1 });
});

describe("GET /api/billing/status", () => {
  it("rate limits checkout confirmation (it calls the payment provider) per user, and never reaches the provider once limited", async () => {
    h.checkRateLimit.mockResolvedValue({ ok: false, remaining: 0, retryAfterSec: 42 });
    const res = await status(get("?session_id=cs_test_aaaaaaaaaaaa"));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(h.syncCheckout).not.toHaveBeenCalled();
    expect(h.checkRateLimit).toHaveBeenCalledWith("billing-sync:u:user-1", { max: 90, windowSec: 600 });
  });

  it("confirms the checkout while under the limit (id truncated to 220 characters)", async () => {
    const res = await status(get(`?session_id=cs_${"x".repeat(400)}`));
    expect(res.status).toBe(200);
    expect(h.syncCheckout).toHaveBeenCalledWith("user-1", `cs_${"x".repeat(217)}`);
  });

  it("a plain status read makes no provider call and is not counted against the confirmation limit", async () => {
    const res = await status(get());
    expect(res.status).toBe(200);
    expect(h.checkRateLimit).not.toHaveBeenCalled();
    expect(h.syncCheckout).not.toHaveBeenCalled();
    expect(h.getBillingView).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/webhooks/stripe body handling", () => {
  const post = (body: BodyInit, headers: Record<string, string> = {}) =>
    new Request("http://localhost:3000/api/webhooks/stripe", { method: "POST", body, headers: { "stripe-signature": "t=1,v1=00", ...headers }, duplex: "half" } as RequestInit);

  it("refuses an oversized body, declared or chunked, with 413 and never hands it to the verifier", async () => {
    expect((await webhook(post("{}", { "content-length": "5000000" }))).status).toBe(413);

    let sent = 0;
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        if (sent++ >= 2000) return c.close();
        pulled++;
        c.enqueue(new Uint8Array(64 * 1024).fill(0x20));
      },
    });
    expect((await webhook(post(stream))).status).toBe(413);
    expect(pulled).toBeLessThan(40); // the 1 MB cap, not the 128 MB that was offered
    expect(h.handleStripeWebhook).not.toHaveBeenCalled();
  });

  it("passes the exact raw body and signature to the verifier", async () => {
    const raw = '{"id":"evt_1",  "spacing":"matters for the signature"}\n';
    const res = await webhook(post(raw));
    expect(res.status).toBe(200);
    expect(h.handleStripeWebhook).toHaveBeenCalledWith(raw, "t=1,v1=00");
  });
});
