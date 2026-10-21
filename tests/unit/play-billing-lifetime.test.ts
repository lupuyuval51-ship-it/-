import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_LIFETIME_PRICES_ILS, PAID_PLAN_IDS } from "@/config/plans";
import { LIFETIME_RECHECK_MS, PLAN_GRACE_MS, PLAY_LIFETIME_PRODUCTS, PLAY_PRODUCTS, effectivePlan, planAfterRefresh, planFromPurchases, purchasesToAcknowledge, savePlanState } from "@/lib/offline/billing-state";
import { getOfflinePlan, setDefaultOfflinePlan } from "@/lib/offline/entitlement";

/** The one-time ("for good") purchases beside the monthly subscriptions: the state functions and the Play wrapper against a fake plugin. */
const plugin = vi.hoisted(() => ({
  getPurchases: vi.fn(), purchaseProduct: vi.fn(), acknowledgePurchase: vi.fn(), restorePurchases: vi.fn(), getProducts: vi.fn(), manageSubscriptions: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));

import { buyPlan, playLifetimePrices, refreshPlan } from "../../mobile/src/billing/play";

const DAY = 86_400_000;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
let store = mem();
const bought = (productIdentifier: string, over: Record<string, unknown> = {}) => ({
  transactionId: "tok", productIdentifier, purchaseDate: "2026-10-01T10:00:00Z", quantity: 1, productType: "inapp", orderId: "GPA.1",
  purchaseToken: `token-${productIdentifier}`, isAcknowledged: true, purchaseState: "1", ...over,
});
const PLUS_ONCE = PLAY_LIFETIME_PRODUCTS.PLUS;
const PRO_ONCE = PLAY_LIFETIME_PRODUCTS.PRO;
const PLUS_MONTHLY = PLAY_PRODUCTS.PLUS.productId;

describe("a one-time purchase in the plan state", () => {
  const now = Date.UTC(2026, 9, 21);

  it("turns the plan on, with no end date: Play is asked again a year on", () => {
    const s = planFromPurchases([bought(PRO_ONCE)], now);
    expect(s).toEqual({ plan: "PRO", expiresAt: now + LIFETIME_RECHECK_MS, checkedAt: now });
    expect(effectivePlan(s, now + 300 * DAY)).toBe("PRO");
  });

  it("is not a plan while it is pending or refunded, and a made-up product is none", () => {
    expect(planFromPurchases([bought(PRO_ONCE, { purchaseState: "2" })], now).plan).toBe("FREE");
    expect(planFromPurchases([bought(PRO_ONCE, { revocationDate: "2026-10-02T00:00:00Z" })], now).plan).toBe("FREE");
    expect(planFromPurchases([bought("levelup_pro_forever")], now).plan).toBe("FREE");
  });

  it("the best plan wins between a subscription and a one-time purchase", () => {
    const sub = { productIdentifier: PLUS_MONTHLY, purchaseState: "1", productType: "subs" };
    expect(planFromPurchases([sub, bought(PRO_ONCE)], now).plan).toBe("PRO");
    expect(planFromPurchases([bought(PLUS_ONCE), bought(PRO_ONCE)], now).plan).toBe("PRO");
    expect(planFromPurchases([bought(PLUS_ONCE), sub], now).plan).toBe("PLUS");
  });

  it("an empty answer (a failed query) keeps a one-time plan for a year, then lets go of it", () => {
    const stored = planFromPurchases([bought(PLUS_ONCE)], now);
    const empty = planFromPurchases([], now + 10 * DAY);
    expect(planAfterRefresh(stored, empty, now + 10 * DAY)).toEqual(stored);
    const late = now + LIFETIME_RECHECK_MS + PLAN_GRACE_MS + DAY;
    expect(planAfterRefresh(stored, planFromPurchases([], late), late).plan).toBe("FREE");
  });

  it("an unacknowledged one-time purchase is acknowledged like a subscription (Play refunds it after 3 days)", () => {
    expect(purchasesToAcknowledge([bought(PLUS_ONCE, { isAcknowledged: false, purchaseToken: "needs-ack" })])).toEqual(["needs-ack"]);
  });

  it("the configured one-time prices are shekels, above the monthly price, one for each paid plan", () => {
    for (const plan of PAID_PLAN_IDS) {
      expect(Number.isInteger(APP_LIFETIME_PRICES_ILS[plan])).toBe(true);
      expect(APP_LIFETIME_PRICES_ILS[plan]).toBeGreaterThan(0);
    }
    expect(APP_LIFETIME_PRICES_ILS.PRO).toBeGreaterThan(APP_LIFETIME_PRICES_ILS.PLUS);
  });
});

describe("buying once in the app", () => {
  beforeEach(() => {
    store = mem();
    vi.stubGlobal("localStorage", store);
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    setDefaultOfflinePlan("FREE");
    for (const fn of Object.values(plugin)) fn.mockReset();
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    plugin.acknowledgePurchase.mockResolvedValue(undefined);
    plugin.getProducts.mockResolvedValue({ products: [] });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setDefaultOfflinePlan("PRO");
  });

  it("starts an in-app purchase with no base plan, and the plan turns on from the second list", async () => {
    plugin.purchaseProduct.mockResolvedValue(bought(PRO_ONCE));
    plugin.getPurchases.mockImplementation(async ({ productType }: { productType: string }) => ({ purchases: productType === "inapp" ? [bought(PRO_ONCE)] : [] }));
    expect(await buyPlan("PRO", "lifetime")).toEqual({ ok: true });
    expect(plugin.purchaseProduct).toHaveBeenCalledWith({ productIdentifier: PRO_ONCE, productType: "inapp" });
    expect(plugin.getPurchases).toHaveBeenCalledWith({ productType: "subs" });
    expect(plugin.getPurchases).toHaveBeenCalledWith({ productType: "inapp" });
    expect(getOfflinePlan()).toBe("PRO");
  });

  it("the plan stays when the one-time purchase is bought and the list that follows fails", async () => {
    plugin.purchaseProduct.mockResolvedValue(bought(PLUS_ONCE));
    plugin.getPurchases.mockRejectedValue(new Error("BILLING_UNAVAILABLE"));
    expect(await buyPlan("PLUS", "lifetime")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("a one-time purchase may raise the plan (Plus, then Pro for good) but never sells the plan the learner has, or a lower one", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() + DAY, checkedAt: Date.now() });
    expect(await buyPlan("PLUS", "lifetime")).toEqual({ ok: false, reason: "OWNED" });
    plugin.purchaseProduct.mockResolvedValue(bought(PRO_ONCE));
    plugin.getPurchases.mockImplementation(async ({ productType }: { productType: string }) => ({ purchases: productType === "inapp" ? [bought(PRO_ONCE)] : [] }));
    expect(await buyPlan("PRO", "lifetime")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PRO");
    expect(await buyPlan("PLUS", "lifetime")).toEqual({ ok: false, reason: "OWNED" });
    expect(plugin.purchaseProduct).toHaveBeenCalledTimes(1);
  });

  it("the monthly subscription is still refused for a learner who has a plan", async () => {
    savePlanState(store, { plan: "PRO", expiresAt: Date.now() + DAY, checkedAt: Date.now() });
    expect(await buyPlan("PLUS")).toEqual({ ok: false, reason: "SUBSCRIBED" });
    expect(plugin.purchaseProduct).not.toHaveBeenCalled();
  });

  it("restoring finds a one-time purchase on a new phone", async () => {
    plugin.getPurchases.mockImplementation(async ({ productType }: { productType: string }) => ({ purchases: productType === "inapp" ? [bought(PLUS_ONCE)] : [] }));
    await refreshPlan();
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("shows the price Play gives for the one-time product", async () => {
    plugin.getProducts.mockResolvedValue({ products: [{ identifier: PLUS_ONCE, priceString: "₪55.00" }] });
    expect(await playLifetimePrices()).toEqual({ PLUS: "₪55.00" });
    expect(plugin.getProducts).toHaveBeenCalledWith({ productIdentifiers: [PLUS_ONCE, PRO_ONCE], productType: "inapp" });
  });
});
