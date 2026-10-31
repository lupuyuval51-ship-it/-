import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_GRACE_MS, PLAY_PRODUCTS, loadPlanState, savePlanState } from "@/lib/offline/billing-state";
import { getOfflinePlan, setDefaultOfflinePlan } from "@/lib/offline/entitlement";

/** The app's Play wrapper (`mobile/src/billing/play.ts`) against a fake plugin that answers the way @capgo/native-purchases 7.19.3 does on Android. */
const plugin = vi.hoisted(() => ({
  getPurchases: vi.fn(), purchaseProduct: vi.fn(), acknowledgePurchase: vi.fn(), restorePurchases: vi.fn(), getProducts: vi.fn(), manageSubscriptions: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));

import { buyPlan, refreshPlan, restorePurchases, playPrices } from "../../mobile/src/billing/play";

const DAY = 86_400_000;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
let store = mem();
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
  vi.useRealTimers();
  setDefaultOfflinePlan("PRO");
});

describe("Google Play Billing on Android", () => {
  it("a purchase Play lists (purchaseState 1, no isActive, no expiry) turns the plan on, also right after buying", async () => {
    plugin.purchaseProduct.mockResolvedValue(android(PRO));
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PRO)] });
    expect(getOfflinePlan()).toBe("FREE");
    expect(await buyPlan("PRO")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PRO");
    expect(plugin.purchaseProduct).toHaveBeenCalledWith({ productIdentifier: PRO, planIdentifier: "monthly", productType: "subs" });
  });

  it("a learner who already has a plan is not sold a second subscription: Plus to Pro and Pro to Plus both stop before Play's sheet", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now(), checkedAt: Date.now() });
    expect(await buyPlan("PRO")).toEqual({ ok: false, reason: "SUBSCRIBED" });
    savePlanState(store, { plan: "PRO", expiresAt: Date.now(), checkedAt: Date.now() });
    expect(await buyPlan("PLUS")).toEqual({ ok: false, reason: "SUBSCRIBED" });
    expect(plugin.purchaseProduct).not.toHaveBeenCalled();
  });

  it("closing Play's sheet is a cancel; a payment still being confirmed is pending, not 'nothing was charged'", async () => {
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("Purchase is not purchased"));
    expect(await buyPlan("PLUS")).toEqual({ ok: false, reason: "CANCELLED" });
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("Purchase is pending"));
    expect(await buyPlan("PLUS")).toEqual({ ok: false, reason: "PENDING" });
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("BILLING_SETUP_FAILED"));
    expect(await buyPlan("PLUS")).toEqual({ ok: false, reason: "FAILED" });
    expect(getOfflinePlan()).toBe("FREE");
  });

  it("a query that came back empty (the plugin answers [] when Play's query failed) does not drop a paid plan inside its grace", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() - DAY, checkedAt: Date.now() - DAY });
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    const state = await refreshPlan();
    expect(state?.plan).toBe("PLUS");
    expect(loadPlanState(store)?.plan).toBe("PLUS");
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("an empty answer is believed once the stored plan is past its grace", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() - PLAN_GRACE_MS - DAY, checkedAt: Date.now() - PLAN_GRACE_MS - DAY });
    await refreshPlan();
    expect(loadPlanState(store)?.plan).toBe("FREE");
    expect(getOfflinePlan()).toBe("FREE");
  });

  it("a plan Play lists replaces the stored one (a change made in Play)", async () => {
    savePlanState(store, { plan: "PRO", expiresAt: Date.now(), checkedAt: Date.now() });
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PLUS)] });
    await refreshPlan();
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("acknowledges a paid purchase Play still lists as unacknowledged, and leaves acknowledged ones alone", async () => {
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PRO, { isAcknowledged: false, purchaseToken: "needs-ack" })] });
    await refreshPlan();
    await vi.waitFor(() => expect(plugin.acknowledgePurchase).toHaveBeenCalledWith({ purchaseToken: "needs-ack" }));
    plugin.acknowledgePurchase.mockClear();
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PRO, { isAcknowledged: true })] });
    await refreshPlan();
    await playPrices(); // anything queued behind the refresh has run by now
    expect(plugin.acknowledgePurchase).not.toHaveBeenCalled();
  });

  it("a failing acknowledgement never breaks the refresh or the plan", async () => {
    plugin.acknowledgePurchase.mockRejectedValue(new Error("Failed to acknowledge purchase"));
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PRO, { isAcknowledged: false })] });
    expect((await refreshPlan())?.plan).toBe("PRO");
    await vi.waitFor(() => expect(plugin.acknowledgePurchase).toHaveBeenCalled());
    expect(getOfflinePlan()).toBe("PRO");
  });

  it("restoring asks Play and reads the plan back", async () => {
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PLUS)] });
    expect(await restorePurchases()).toBe(true);
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("never runs two plugin calls at the same time (the plugin has one billing client that every call closes)", async () => {
    let running = 0;
    let most = 0;
    const slow = <T>(value: T) => async () => {
      running++;
      most = Math.max(most, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return value;
    };
    plugin.getPurchases.mockImplementation(slow({ purchases: [] }));
    plugin.getProducts.mockImplementation(slow({ products: [] }));
    plugin.purchaseProduct.mockImplementation(slow(android(PRO)));
    // the plans screen asks for the purchases and the prices together, the app asks again when it comes back to the screen
    await Promise.all([refreshPlan(), playPrices(), refreshPlan(), buyPlan("PRO"), restorePurchases()]);
    expect(most).toBe(1);
  });
});
