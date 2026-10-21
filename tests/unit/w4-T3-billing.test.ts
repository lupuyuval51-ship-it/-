import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_TRACKS, PLANS } from "@/config/plans";
import { PLAN_GRACE_MS, PLAY_PRODUCTS, loadPlanState, savePlanState } from "@/lib/offline/billing-state";
import { getOfflinePlan, getOfflineTier, setDefaultOfflinePlan } from "@/lib/offline/entitlement";
import { canStartTopic, halfYear, loadTracks, recordTopic, tracksLeft } from "@/lib/offline/tracks";

/**
 * Billing, the stored plan and the tracks on the phone: what the Play wrapper does when it is not on Android, when it tells the rest
 * of the app that the plan changed, which product ids are really sold (they must match the Play Console and the docs), and the
 * edges of the half-year history.
 */
const native = vi.hoisted(() => ({ value: true as boolean | "throws" }));
const plugin = vi.hoisted(() => ({
  getPurchases: vi.fn(), purchaseProduct: vi.fn(), acknowledgePurchase: vi.fn(), restorePurchases: vi.fn(), getProducts: vi.fn(), manageSubscriptions: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => { if (native.value === "throws") throw new Error("no bridge"); return native.value; } } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));

import { PLAN_EVENT, billingAvailable, buyPlan, manageSubscription, playPrices, refreshPlan, restorePurchases } from "../../mobile/src/billing/play";

const DAY = 86_400_000;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), data: m }; };
let store = mem();
let events: Event[] = [];
const android = (productIdentifier: string, over: Record<string, unknown> = {}) => ({
  transactionId: "t", productIdentifier, purchaseDate: "2026-10-01T10:00:00Z", quantity: 1, productType: "subs", orderId: "GPA.1",
  purchaseToken: `token-${productIdentifier}`, isAcknowledged: true, purchaseState: "1", appAccountToken: null, willCancel: null, ...over,
});

beforeEach(() => {
  native.value = true;
  store = mem();
  events = [];
  vi.stubGlobal("localStorage", store);
  vi.stubGlobal("window", { dispatchEvent: (e: Event) => { events.push(e); return true; } });
  setDefaultOfflinePlan("FREE");
  for (const fn of Object.values(plugin)) fn.mockReset();
  plugin.getPurchases.mockResolvedValue({ purchases: [] });
  plugin.acknowledgePurchase.mockResolvedValue(undefined);
  plugin.restorePurchases.mockResolvedValue(undefined);
  plugin.getProducts.mockResolvedValue({ products: [] });
  plugin.manageSubscriptions.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  setDefaultOfflinePlan("PRO");
});

describe("what is sold is what the Play Console has", () => {
  it("product ids and base plan are exactly the ones the docs tell the owner to create", () => {
    expect(PLAY_PRODUCTS).toEqual({ PLUS: { productId: "levelup_plus", basePlanId: "monthly" }, PRO: { productId: "levelup_pro", basePlanId: "monthly" } });
    // (line breaks in the docs are not part of what is checked)
    const docs = fs.readFileSync(path.resolve(import.meta.dirname, "../../docs/play-release.md"), "utf8").replace(/\s+/g, " ");
    for (const { productId, basePlanId } of Object.values(PLAY_PRODUCTS)) {
      expect(docs).toContain(`\`${productId}\``);
      expect(docs).toContain(`\`${basePlanId}\``);
    }
    // the prices the docs give for the console come from the plans file, in shekels
    expect(docs).toContain(`₪${PLANS.PLUS.monthlyPrices.ILS! / 100}** (Plus)`);
    expect(docs).toContain(`₪${PLANS.PRO.monthlyPrices.ILS! / 100}** (Pro)`);
    // and so do the numbers of tracks and the length of the grace
    expect(docs).toContain(`Free ${APP_TRACKS.FREE}, Plus ${APP_TRACKS.PLUS}, Pro ${APP_TRACKS.PRO}`);
    expect(PLAN_GRACE_MS).toBe(3 * DAY);
    expect(docs).toContain("3 days after the last time Play confirmed it");
  });

  it("the purchase sheet is opened for the right product and base plan, as a subscription", async () => {
    plugin.purchaseProduct.mockResolvedValue(android("levelup_plus"));
    await buyPlan("PLUS");
    expect(plugin.purchaseProduct).toHaveBeenCalledWith({ productIdentifier: "levelup_plus", planIdentifier: "monthly", productType: "subs" });
    expect(plugin.getPurchases).toHaveBeenCalledWith({ productType: "subs" });
  });
});

describe("outside the Android app billing does nothing, and nothing in it throws", () => {
  for (const mode of [false, "throws"] as const) {
    it(`Capacitor says ${mode === false ? "not native" : "nothing (it throws)"}: neutral answers, the plugin is never touched, no event`, async () => {
      native.value = mode;
      expect(billingAvailable()).toBe(false);
      expect(await refreshPlan()).toBeNull();
      expect(await buyPlan("PRO")).toEqual({ ok: false, reason: "UNAVAILABLE" });
      expect(await restorePurchases()).toBe(false);
      expect(await playPrices()).toEqual({});
      await expect(manageSubscription()).resolves.toBeUndefined();
      for (const fn of Object.values(plugin)) expect(fn).not.toHaveBeenCalled();
      expect(events).toEqual([]);
      expect(store.data.size).toBe(0); // no plan is written either
    });
  }
});

describe("the rest of the app is told when the plan changes, and only then", () => {
  const plans = () => events.filter((e) => e.type === PLAN_EVENT).length;

  it("the event is 'levelup-plan'", () => {
    expect(PLAN_EVENT).toBe("levelup-plan");
  });

  it("Free to Plus announces once; asking again with the same answer stays quiet", async () => {
    plugin.getPurchases.mockResolvedValue({ purchases: [android("levelup_plus")] });
    await refreshPlan();
    expect(plans()).toBe(1);
    await refreshPlan();
    expect(plans()).toBe(1);
  });

  it("Plus to Pro announces; an empty answer inside the grace keeps Plus and says nothing", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now(), checkedAt: Date.now() });
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    await refreshPlan();
    expect(plans()).toBe(0);
    expect(getOfflinePlan()).toBe("PLUS");
    plugin.getPurchases.mockResolvedValue({ purchases: [android("levelup_pro")] });
    await refreshPlan();
    expect(plans()).toBe(1);
    expect(getOfflinePlan()).toBe("PRO");
  });

  it("a stored plan past its grace was already Free: believing an empty answer changes nothing, so nothing is announced", async () => {
    savePlanState(store, { plan: "PRO", expiresAt: Date.now() - PLAN_GRACE_MS - DAY, checkedAt: Date.now() - PLAN_GRACE_MS - DAY });
    await refreshPlan();
    expect(plans()).toBe(0);
    expect(loadPlanState(store)?.plan).toBe("FREE");
  });

  it("a cancelled or failed purchase announces nothing; a bought one does, even if the query after it adds nothing new", async () => {
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("Purchase is not purchased"));
    await buyPlan("PRO");
    plugin.purchaseProduct.mockRejectedValueOnce(new Error("Purchase is pending"));
    await buyPlan("PRO");
    expect(plans()).toBe(0);
    plugin.purchaseProduct.mockResolvedValue(android("levelup_pro"));
    expect(await buyPlan("PRO")).toEqual({ ok: true });
    expect(plans()).toBeGreaterThanOrEqual(1);
  });

  it("a refused second subscription announces nothing and asks Play nothing", async () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() + DAY, checkedAt: Date.now() });
    expect(await buyPlan("PRO")).toEqual({ ok: false, reason: "SUBSCRIBED" });
    expect(plans()).toBe(0);
    expect(plugin.purchaseProduct).not.toHaveBeenCalled();
  });
});

describe("the price Play shows", () => {
  it("asks for both subscriptions and keeps the prices Play gives, in the learner's own currency", async () => {
    plugin.getProducts.mockResolvedValue({ products: [{ identifier: "levelup_pro", priceString: "₪19.90" }, { identifier: "levelup_plus", priceString: "₪4.90" }, { identifier: "other", priceString: "$1" }] });
    expect(await playPrices()).toEqual({ PLUS: "₪4.90", PRO: "₪19.90" });
    expect(plugin.getProducts).toHaveBeenCalledWith({ productIdentifiers: ["levelup_plus", "levelup_pro"], productType: "subs" });
  });

  it("a product without a price string is left out (the configured price is shown instead); a failing query gives nothing", async () => {
    plugin.getProducts.mockResolvedValue({ products: [{ identifier: "levelup_plus", priceString: "" }, { identifier: "levelup_pro" }] });
    expect(await playPrices()).toEqual({});
    plugin.getProducts.mockRejectedValue(new Error("Billing client not ready"));
    expect(await playPrices()).toEqual({});
  });

  it("the subscription page is opened through the plugin, and a failure there is not an error", async () => {
    await manageSubscription();
    expect(plugin.manageSubscriptions).toHaveBeenCalledTimes(1);
    plugin.manageSubscriptions.mockRejectedValue(new Error("no Play"));
    await expect(manageSubscription()).resolves.toBeUndefined();
  });
});

describe("the plan an install is entitled to", () => {
  it("with nothing stored it is the build's default, with blocked or damaged storage as well", () => {
    setDefaultOfflinePlan("PLUS");
    expect(getOfflinePlan()).toBe("PLUS");
    store.data.set("levelup.plan.v1", "{not json");
    expect(getOfflinePlan()).toBe("PLUS");
    store.data.set("levelup.plan.v1", JSON.stringify({ plan: "GOLD", checkedAt: 1 }));
    expect(getOfflinePlan()).toBe("PLUS");
    vi.stubGlobal("localStorage", { getItem: () => { throw new DOMException("blocked", "SecurityError"); } });
    expect(getOfflinePlan()).toBe("PLUS");
    vi.stubGlobal("localStorage", undefined);
    expect(getOfflinePlan()).toBe("PLUS");
  });

  it("the build's default never rescues what Play said: a stored Free stays Free, and a paid plan past its grace is Free", () => {
    setDefaultOfflinePlan("PRO");
    savePlanState(store, { plan: "FREE", expiresAt: null, checkedAt: 1 });
    expect(getOfflinePlan()).toBe("FREE");
    expect(getOfflineTier()).toBe("B");
    savePlanState(store, { plan: "PRO", expiresAt: 1000, checkedAt: 1000 });
    expect(getOfflinePlan(1000 + PLAN_GRACE_MS + 1)).toBe("FREE");
  });

  it("a paid plan works up to and including the last moment of its grace, and not a millisecond longer", () => {
    savePlanState(store, { plan: "PLUS", expiresAt: 50_000, checkedAt: 40_000 });
    expect(getOfflinePlan(50_000 + PLAN_GRACE_MS)).toBe("PLUS");
    expect(getOfflinePlan(50_000 + PLAN_GRACE_MS + 1)).toBe("FREE");
    expect(getOfflinePlan(0)).toBe("PLUS"); // a clock that is behind never takes the plan away
  });

  it("a paid plan without a known end is not trusted (it would never run out)", () => {
    store.data.set("levelup.plan.v1", JSON.stringify({ plan: "PRO", expiresAt: null, checkedAt: Date.now() }));
    expect(getOfflinePlan()).toBe("FREE");
  });

  it("the tier follows the plan that is in force right now, unless one is asked for", () => {
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() + DAY, checkedAt: Date.now() });
    expect(getOfflineTier()).toBe("A");
    expect(getOfflineTier("FREE")).toBe("B");
    savePlanState(store, { plan: "PLUS", expiresAt: Date.now() - PLAN_GRACE_MS - DAY, checkedAt: 1 });
    expect(getOfflineTier()).toBe("B"); // the game a Free phone makes is cut down
    expect(getOfflineTier("PRO")).toBe("A");
  });
});

describe("tracks: the edges of the half-year history", () => {
  const kv = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };
  const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) => Date.UTC(y, m - 1, d, h, min, s, ms);

  it("the year turns on 1 January and the half on 1 July at exactly 00:00:00.000 UTC, not a millisecond earlier or later", () => {
    const jul1 = at(2027, 7, 1);
    expect(halfYear(jul1 - 1)).toEqual({ start: at(2027, 1, 1), end: jul1 });
    expect(halfYear(jul1)).toEqual({ start: jul1, end: at(2028, 1, 1) });
    expect(halfYear(at(2027, 12, 31, 23, 59, 59, 999))).toEqual({ start: jul1, end: at(2028, 1, 1) });
    expect(halfYear(at(2028, 1, 1))).toEqual({ start: at(2028, 1, 1), end: at(2028, 7, 1) });
    expect(halfYear(at(2028, 6, 30, 23, 59, 59, 999)).end).toBe(at(2028, 7, 1)); // a leap year changes nothing
  });

  it("a history from an earlier half-year is empty now; one from this half-year is kept as it was written", () => {
    const s = kv();
    recordTopic(s, "math-fractions", at(2027, 3, 3));
    expect(loadTracks(s, at(2027, 6, 30, 23, 59, 59, 999)).topics).toEqual(["math-fractions"]);
    expect(loadTracks(s, at(2027, 7, 1)).topics).toEqual([]);
    // starting a topic in the new half-year replaces the old record
    recordTopic(s, "science-cells", at(2027, 7, 1));
    expect(loadTracks(s, at(2027, 7, 1)).topics).toEqual(["science-cells"]);
    expect(loadTracks(s, at(2027, 3, 3)).topics).toEqual([]); // (a clock set back does not bring the old list back)
  });

  it("a topic is written once; a stored list with repeats or odd entries is cleaned when read", () => {
    const s = kv();
    const now = at(2027, 3, 3);
    recordTopic(s, "a", now);
    recordTopic(s, "a", now + 5);
    expect(JSON.parse(s.m.get("levelup.tracks.v1")!).topics).toEqual(["a"]);
    s.m.set("levelup.tracks.v1", JSON.stringify({ start: halfYear(now).start, topics: ["a", "a", 5, null, "b", { x: 1 }, "b"] }));
    expect(loadTracks(s, now).topics).toEqual(["a", "b"]);
    s.m.set("levelup.tracks.v1", JSON.stringify({ start: halfYear(now).start, topics: "a" }));
    expect(loadTracks(s, now).topics).toEqual([]);
  });

  it("a phone that cannot save the history still lets the learner play: nothing throws, and the next try is not blocked by a record that was never written", () => {
    const blocked = { getItem: () => null, setItem: () => { throw new DOMException("full", "QuotaExceededError"); } };
    expect(() => recordTopic(blocked, "a", at(2027, 3, 3))).not.toThrow();
    expect(loadTracks(blocked, at(2027, 3, 3)).topics).toEqual([]);
    const throwingRead = { getItem: () => { throw new Error("blocked"); }, setItem: () => undefined };
    expect(loadTracks(throwingRead, at(2027, 3, 3)).topics).toEqual([]);
  });

  it("after a downgrade the topics already started stay open and a new one is refused; nothing is left below zero", () => {
    const history = { start: halfYear(at(2027, 3, 3)).start, topics: ["a", "b", "c", "d", "e"] }; // Pro used five of seven, then the plan ended
    expect(tracksLeft("FREE", history)).toBe(0);
    expect(canStartTopic("FREE", history, "c")).toBe(true);
    expect(canStartTopic("FREE", history, "new-topic")).toBe(false);
    expect(tracksLeft("PLUS", history)).toBe(0);
    expect(tracksLeft("PRO", history)).toBe(APP_TRACKS.PRO - 5);
    expect(canStartTopic("PRO", history, "new-topic")).toBe(true);
  });

  it("a course chapter is never refused and never recorded, even when the history is full", () => {
    const s = kv();
    const now = at(2027, 3, 3);
    recordTopic(s, "course-fractions-1", now);
    expect(s.m.has("levelup.tracks.v1")).toBe(false);
    const full = { start: halfYear(now).start, topics: ["a"] };
    expect(canStartTopic("FREE", full, "course-fractions-1")).toBe(true);
    expect(canStartTopic("FREE", full, "course-fractions-9")).toBe(true);
  });

  it("the free plan has exactly one track: the second new topic is the first one refused", () => {
    const s = kv();
    const now = at(2027, 3, 3);
    expect(canStartTopic("FREE", loadTracks(s, now), "a")).toBe(true);
    recordTopic(s, "a", now);
    expect(canStartTopic("FREE", loadTracks(s, now), "b")).toBe(false);
    expect(canStartTopic("FREE", loadTracks(s, now), "a")).toBe(true);
  });
});
