import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAY_PRODUCTS, loadPlanState, savePlanState } from "@/lib/offline/billing-state";
import { getOfflinePlan, setDefaultOfflinePlan } from "@/lib/offline/entitlement";

/**
 * The purchase Play's sheet confirms is the one certain thing the app holds right after a payment: the query that follows it can
 * fail or be cut off (the plugin then answers an empty list, or rejects), and that must never leave a learner who has just paid on
 * Free. Same fake plugin as `play-billing-flow.test.ts` (what @capgo/native-purchases 7.19.3 does on Android).
 */
const plugin = vi.hoisted(() => ({
  getPurchases: vi.fn(), purchaseProduct: vi.fn(), acknowledgePurchase: vi.fn(), restorePurchases: vi.fn(), getProducts: vi.fn(), manageSubscriptions: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));

import { buyPlan, playPrices, refreshPlan } from "../../mobile/src/billing/play";

const DAY = 86_400_000;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
let store = mem();
// `purchaseProduct` on Android resolves only for a PURCHASED purchase (state "1"); pending and everything else reject
const android = (productIdentifier: string, over: Record<string, unknown> = {}) => ({
  transactionId: "tok", productIdentifier, purchaseDate: "2026-10-01T10:00:00Z", quantity: 1, productType: "subs", orderId: "GPA.1",
  purchaseToken: `token-${productIdentifier}`, isAcknowledged: true, purchaseState: "1", appAccountToken: null, willCancel: null, ...over,
});
const PRO = PLAY_PRODUCTS.PRO.productId;
const PLUS = PLAY_PRODUCTS.PLUS.productId;

beforeEach(() => {
  store = mem();
  vi.stubGlobal("localStorage", store);
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  setDefaultOfflinePlan("FREE");
  for (const fn of Object.values(plugin)) fn.mockReset();
  plugin.getPurchases.mockResolvedValue({ purchases: [] });
  plugin.acknowledgePurchase.mockResolvedValue(undefined);
  plugin.restorePurchases.mockResolvedValue(undefined);
  plugin.getProducts.mockResolvedValue({ products: [] });
});
afterEach(() => {
  vi.unstubAllGlobals();
  setDefaultOfflinePlan("PRO");
});

describe("the purchase Play's sheet confirmed counts even when the query right after it gives nothing", () => {
  it("an empty answer from the query (the plugin's reply to a failed or cut-off query) does not leave a learner who just paid on Free", async () => {
    plugin.purchaseProduct.mockResolvedValue(android(PRO));
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    expect(await buyPlan("PRO")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PRO");
    expect(loadPlanState(store)?.plan).toBe("PRO");
  });

  it("a query that rejects right after the purchase does not either", async () => {
    plugin.purchaseProduct.mockResolvedValue(android(PLUS));
    plugin.getPurchases.mockRejectedValue(new Error("Billing client not ready"));
    expect(await buyPlan("PLUS")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("the confirmed purchase is acknowledged when Play still lists it as unacknowledged", async () => {
    plugin.purchaseProduct.mockResolvedValue(android(PRO, { isAcknowledged: false, purchaseToken: "just-bought" }));
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    expect(await buyPlan("PRO")).toEqual({ ok: true });
    await vi.waitFor(() => expect(plugin.acknowledgePurchase).toHaveBeenCalledWith({ purchaseToken: "just-bought" }));
  });

  it("when the query does list purchases, the best of both wins (a Pro just bought over an older Plus the query still lists)", async () => {
    plugin.purchaseProduct.mockResolvedValue(android(PRO));
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PLUS)] });
    expect(await buyPlan("PRO")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PRO");
  });

  it("a cancelled or failed purchase still changes nothing", async () => {
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("Purchase is not purchased"));
    expect(await buyPlan("PRO")).toEqual({ ok: false, reason: "CANCELLED" });
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("Purchase is pending"));
    expect(await buyPlan("PRO")).toEqual({ ok: false, reason: "PENDING" });
    expect(getOfflinePlan()).toBe("FREE");
    expect(loadPlanState(store)?.plan).not.toBe("PRO");
  });
});

describe("a plain refresh keeps its rules", () => {
  it("a query that rejects with nothing just bought keeps what was stored and answers null (offline)", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() - DAY, checkedAt: Date.now() - DAY });
    plugin.getPurchases.mockRejectedValue(new Error("Billing client not ready"));
    expect(await refreshPlan()).toBeNull();
    expect(loadPlanState(store)?.plan).toBe("PLUS");
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("a query that rejects with nothing stored leaves the install on Free and acknowledges nothing", async () => {
    plugin.getPurchases.mockRejectedValue(new Error("Billing client not ready"));
    expect(await refreshPlan()).toBeNull();
    expect(getOfflinePlan()).toBe("FREE");
    await playPrices(); // anything queued behind the refresh has run by now
    expect(plugin.acknowledgePurchase).not.toHaveBeenCalled();
  });
});
