import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIFETIME_RECHECK_MS, PLAY_LIFETIME_PRODUCTS, PLAY_PRODUCTS, loadPlanState, savePlanState, type PlanState } from "@/lib/offline/billing-state";
import { MAX_PURCHASES, VERIFY_EVERY_MS, markVerified, parseVerdict, purchasesToVerify, shouldVerify, stateAfterVerdict, verifyKey } from "@/lib/offline/billing-verify";
import { setDefaultOfflinePlan } from "@/lib/offline/entitlement";

/** What the phone does with the server's check of its purchases: the pure rules, the request, and the wiring into the Play refresh. */
const plugin = vi.hoisted(() => ({
  getPurchases: vi.fn(), purchaseProduct: vi.fn(), acknowledgePurchase: vi.fn(), restorePurchases: vi.fn(), getProducts: vi.fn(), manageSubscriptions: vi.fn(),
}));
const account = vi.hoisted(() => ({ session: null as null | { user: { id: string }; access_token: string } }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));

import { refreshPlan, setSessionProvider } from "../../mobile/src/billing/play";
import { verifyPurchases } from "../../mobile/src/cloud/purchases";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 1);
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const purchase = (productIdentifier: string, over: Record<string, unknown> = {}) => ({
  productIdentifier, purchaseState: "1", purchaseToken: `token-for-${productIdentifier}`, isAcknowledged: true, ...over,
});
const PLUS = PLAY_PRODUCTS.PLUS.productId, PRO_ONCE = PLAY_LIFETIME_PRODUCTS.PRO;
const verdict = (over: Record<string, unknown> = {}) => ({ plan: "PLUS", expiresAt: NOW + 20 * DAY, definitive: true, verifiedAt: NOW, results: [], ...over });
const ok = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
const session = { userId: "u1", accessToken: "jwt-1" };

describe("which purchases are sent", () => {
  it("ours, paid, not revoked, with a token, once each, at most the server's limit", () => {
    expect(purchasesToVerify([purchase(PLUS), purchase(PRO_ONCE)])).toEqual([
      { productId: PLUS, purchaseToken: `token-for-${PLUS}` }, { productId: PRO_ONCE, purchaseToken: `token-for-${PRO_ONCE}` },
    ]);
    expect(purchasesToVerify([purchase("other_app_product")])).toEqual([]);
    expect(purchasesToVerify([purchase(PLUS, { purchaseState: "2" })])).toEqual([]);
    expect(purchasesToVerify([purchase(PLUS, { revocationDate: "2026-10-02T00:00:00Z" })])).toEqual([]);
    expect(purchasesToVerify([purchase(PLUS, { purchaseToken: undefined }), purchase(PLUS, { purchaseToken: "" })])).toEqual([]);
    expect(purchasesToVerify([purchase(PLUS), purchase(PLUS)])).toHaveLength(1);
    const many = Array.from({ length: MAX_PURCHASES + 3 }, (_, i) => purchase(PLUS, { purchaseToken: `t-${i}` }));
    expect(purchasesToVerify(many)).toHaveLength(MAX_PURCHASES);
  });
});

describe("what the server's answer does to the plan", () => {
  const paid: PlanState = { plan: "PRO", expiresAt: NOW, checkedAt: NOW };

  it("a definitive answer is the truth: it can lower, end or confirm the plan, with Google's end date", () => {
    expect(stateAfterVerdict(paid, { plan: "PLUS", expiresAt: NOW + 5 * DAY, definitive: true, verifiedAt: NOW }, NOW)).toEqual({ plan: "PLUS", expiresAt: NOW + 5 * DAY, checkedAt: NOW });
    expect(stateAfterVerdict(paid, { plan: "FREE", expiresAt: null, definitive: true, verifiedAt: NOW }, NOW)).toEqual({ plan: "FREE", expiresAt: null, checkedAt: NOW });
    expect(stateAfterVerdict(null, { plan: "PRO", expiresAt: null, definitive: true, verifiedAt: NOW }, NOW)).toEqual({ plan: "PRO", expiresAt: NOW + LIFETIME_RECHECK_MS, checkedAt: NOW });
  });

  it("an answer that is not definitive changes nothing", () => {
    expect(stateAfterVerdict(paid, { plan: "FREE", expiresAt: null, definitive: false, verifiedAt: NOW }, NOW)).toBe(paid);
    expect(stateAfterVerdict(null, { plan: "FREE", expiresAt: null, definitive: false, verifiedAt: NOW }, NOW)).toBeNull();
  });

  it("reads only a well-formed verdict", () => {
    expect(parseVerdict(verdict())).toEqual({ plan: "PLUS", expiresAt: NOW + 20 * DAY, definitive: true, verifiedAt: NOW });
    expect(parseVerdict(verdict({ plan: "ADMIN" }))).toBeNull();
    expect(parseVerdict(verdict({ definitive: "yes" }))).toBeNull();
    expect(parseVerdict({ error: { code: "NOT_CONFIGURED" } })).toBeNull();
    expect(parseVerdict(null)).toBeNull();
    expect(parseVerdict(verdict({ expiresAt: "soon" }))?.expiresAt).toBeNull();
  });
});

describe("how often the server is asked", () => {
  it("again for another account or other purchases, or after six hours; never keeps the token", () => {
    const store = mem();
    const a = verifyKey("u1", [{ productId: PLUS, purchaseToken: "secret-token-aaaaaaaa" }]);
    expect(shouldVerify(store, a, NOW)).toBe(true);
    markVerified(store, a, NOW);
    expect(shouldVerify(store, a, NOW + 1000)).toBe(false);
    expect(shouldVerify(store, verifyKey("u2", [{ productId: PLUS, purchaseToken: "secret-token-aaaaaaaa" }]), NOW + 1000)).toBe(true);
    expect(shouldVerify(store, verifyKey("u1", [{ productId: PLUS, purchaseToken: "another-token-bbbbbbbb" }]), NOW + 1000)).toBe(true);
    expect(shouldVerify(store, a, NOW + VERIFY_EVERY_MS + 1)).toBe(true);
    expect(JSON.stringify([...Array(1)].map(() => store.getItem("levelup.plan.verified.v1")))).not.toContain("secret-token");
    expect(shouldVerify({ getItem: () => "not json", setItem: () => undefined }, a, NOW)).toBe(true);
  });
});

describe("the request", () => {
  it("signed out: nothing is sent", async () => {
    const f = ok(verdict());
    expect(await verifyPurchases([purchase(PLUS)], { session: null, store: mem(), now: NOW, fetchImpl: f })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("nothing to ask when Play lists no paid purchase of ours", async () => {
    const f = ok(verdict());
    expect(await verifyPurchases([purchase(PLUS, { purchaseState: "2" })], { session, store: mem(), now: NOW, fetchImpl: f })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the tokens with the account's sign-in to the one function, and keeps a definitive answer", async () => {
    const store = mem();
    savePlanState(store, { plan: "PRO", expiresAt: NOW, checkedAt: NOW });
    const f = ok(verdict({ plan: "PLUS" }));
    const next = await verifyPurchases([purchase(PLUS)], { session, store, now: NOW, fetchImpl: f });
    expect(next).toEqual({ plan: "PLUS", expiresAt: NOW + 20 * DAY, checkedAt: NOW });
    expect(loadPlanState(store)).toEqual(next);
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]!;
    expect(url).toBe("https://yhxwgfgodxbzdvaqtqjz.supabase.co/functions/v1/verify-purchase");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-1");
    expect(JSON.parse(String(init.body))).toEqual({ purchases: [{ productId: PLUS, purchaseToken: `token-for-${PLUS}` }] });
    // asked again straight away: not sent twice
    expect(await verifyPurchases([purchase(PLUS)], { session, store, now: NOW + 1000, fetchImpl: f })).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("every kind of doubt leaves the plan alone: offline, 5xx, 401, not set up, garbage, not definitive", async () => {
    for (const make of [
      () => vi.fn(async () => { throw new TypeError("offline"); }) as unknown as typeof fetch,
      () => ok({ error: { code: "UNAVAILABLE" } }, 503),
      () => ok({ error: { code: "NOT_CONFIGURED" } }, 503),
      () => ok({ error: { code: "UNAUTHENTICATED" } }, 401),
      () => ok("garbage"),
      () => ok(verdict({ plan: "FREE", expiresAt: null, definitive: false })),
    ]) {
      const store = mem();
      const before: PlanState = { plan: "PRO", expiresAt: NOW + DAY, checkedAt: NOW };
      savePlanState(store, before);
      expect(await verifyPurchases([purchase(PLUS)], { session, store, now: NOW, fetchImpl: make() })).toBeNull();
      expect(loadPlanState(store)).toEqual(before);
    }
  });

  it("a refunded purchase that Play still lists is ended by the server's definitive Free", async () => {
    const store = mem();
    savePlanState(store, { plan: "PRO", expiresAt: NOW + 300 * DAY, checkedAt: NOW });
    const next = await verifyPurchases([purchase(PRO_ONCE)], { session, store, now: NOW, fetchImpl: ok(verdict({ plan: "FREE", expiresAt: null })) });
    expect(next?.plan).toBe("FREE");
    expect(loadPlanState(store)?.plan).toBe("FREE");
  });
});

describe("in the Play refresh", () => {
  beforeEach(() => {
    const store = mem();
    vi.stubGlobal("localStorage", store);
    vi.stubGlobal("window", { dispatchEvent: () => true });
    setDefaultOfflinePlan("FREE");
    plugin.getPurchases.mockReset().mockImplementation(async ({ productType }: { productType: string }) => ({ purchases: productType === "subs" ? [purchase(PLUS)] : [] }));
    plugin.acknowledgePurchase.mockReset();
    account.session = null;
    setSessionProvider(() => account.session);
  });

  it("signed out the phone asks only Google Play and makes no network request", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect((await refreshPlan())?.plan).toBe("PLUS");
    await Promise.resolve();
    expect(f).not.toHaveBeenCalled();
  });

  it("signed in, the server also checks, and its definitive answer replaces what Play listed", async () => {
    account.session = { user: { id: "u1" }, access_token: "jwt-1" };
    const f = ok(verdict({ plan: "FREE", expiresAt: null }));
    vi.stubGlobal("fetch", f);
    expect((await refreshPlan())?.plan).toBe("PLUS");
    await vi.waitFor(() => expect(loadPlanState(localStorage)?.plan).toBe("FREE"));
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("signed in but the server is down: the plan is what Play listed", async () => {
    account.session = { user: { id: "u1" }, access_token: "jwt-1" };
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await refreshPlan();
    await Promise.resolve();
    expect(loadPlanState(localStorage)?.plan).toBe("PLUS");
  });
});
