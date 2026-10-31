import { describe, expect, it } from "vitest";
import { PLAN_GRACE_MS, PLAY_PRODUCTS, classifyPurchaseError, effectivePlan, loadPlanState, planAfterRefresh, planFromPurchases, purchasesToAcknowledge, savePlanState, sanitizePlanState } from "@/lib/offline/billing-state";
import { createSerialQueue } from "@/lib/offline/serial-queue";
import { canStartTopic, halfYear, loadTracks, recordTopic, tracksLeft } from "@/lib/offline/tracks";
import { APP_TRACKS } from "@/config/plans";

const NOW = Date.UTC(2026, 9, 20, 12);
const DAY = 86_400_000;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const buy = (productIdentifier: string, over: Record<string, unknown> = {}) => ({ productIdentifier, isActive: true, expirationDate: new Date(NOW + 20 * DAY).toISOString(), ...over });

describe("plan from Google Play purchases", () => {
  it("no purchase is Free", () => {
    expect(planFromPurchases([], NOW)).toMatchObject({ plan: "FREE", expiresAt: null });
  });
  it("a running Plus or Pro subscription gives that plan, and Pro wins over Plus", () => {
    expect(planFromPurchases([buy(PLAY_PRODUCTS.PLUS.productId)], NOW).plan).toBe("PLUS");
    expect(planFromPurchases([buy(PLAY_PRODUCTS.PLUS.productId), buy(PLAY_PRODUCTS.PRO.productId)], NOW).plan).toBe("PRO");
  });
  it("ignores expired, revoked and unknown products", () => {
    expect(planFromPurchases([buy(PLAY_PRODUCTS.PRO.productId, { isActive: false, expirationDate: new Date(NOW - DAY).toISOString() })], NOW).plan).toBe("FREE");
    expect(planFromPurchases([buy(PLAY_PRODUCTS.PRO.productId, { revocationDate: new Date(NOW - DAY).toISOString() })], NOW).plan).toBe("FREE");
    expect(planFromPurchases([buy("something_else")], NOW).plan).toBe("FREE");
  });
  it("is kept on the phone and used until its period plus the grace is over, then Free", () => {
    const store = mem();
    expect(effectivePlan(loadPlanState(store), NOW)).toBeNull();
    const state = planFromPurchases([buy(PLAY_PRODUCTS.PLUS.productId)], NOW);
    savePlanState(store, state);
    expect(effectivePlan(loadPlanState(store), NOW)).toBe("PLUS");
    expect(effectivePlan(loadPlanState(store), state.expiresAt! + PLAN_GRACE_MS - 1)).toBe("PLUS");
    expect(effectivePlan(loadPlanState(store), state.expiresAt! + PLAN_GRACE_MS + 1)).toBe("FREE");
  });
  it("damaged stored data is ignored", () => {
    expect(sanitizePlanState({ plan: "GOLD", checkedAt: 1 })).toBeNull();
    expect(sanitizePlanState("x")).toBeNull();
    const store = mem();
    store.setItem("levelup.plan.v1", "{not json");
    expect(loadPlanState(store)).toBeNull();
  });
});

// What @capgo/native-purchases 7.19.3 really returns on Android (getPurchases and purchaseProduct): no isActive, no expirationDate.
const android = (productIdentifier: string, over: Record<string, unknown> = {}) => ({
  transactionId: "tok", productIdentifier, purchaseDate: "2026-10-01T10:00:00Z", quantity: 1, productType: "subs", orderId: "GPA.1", purchaseToken: `token-${productIdentifier}`,
  isAcknowledged: true, purchaseState: "1", appAccountToken: null, willCancel: null, ...over,
});

describe("plan from Android purchases (Play gives no isActive and no expiry date there)", () => {
  it("a paid purchase (purchaseState 1) gives its plan, Pro over Plus", () => {
    expect(planFromPurchases([android(PLAY_PRODUCTS.PLUS.productId)], NOW).plan).toBe("PLUS");
    expect(planFromPurchases([android(PLAY_PRODUCTS.PLUS.productId), android(PLAY_PRODUCTS.PRO.productId)], NOW).plan).toBe("PRO");
  });
  it("a pending or unknown purchase, an unknown product, a revoked one and an empty list give Free", () => {
    expect(planFromPurchases([android(PLAY_PRODUCTS.PRO.productId, { purchaseState: "2" })], NOW).plan).toBe("FREE");
    expect(planFromPurchases([android(PLAY_PRODUCTS.PRO.productId, { purchaseState: "0" })], NOW).plan).toBe("FREE");
    expect(planFromPurchases([android(PLAY_PRODUCTS.PRO.productId, { purchaseState: undefined })], NOW).plan).toBe("FREE");
    expect(planFromPurchases([android("something_else")], NOW).plan).toBe("FREE");
    expect(planFromPurchases([android(PLAY_PRODUCTS.PRO.productId, { revocationDate: new Date(NOW - DAY).toISOString() })], NOW).plan).toBe("FREE");
    expect(planFromPurchases([], NOW).plan).toBe("FREE");
  });
  it("without an expiry the plan works offline for one grace after Play last confirmed it (not two)", () => {
    const state = planFromPurchases([android(PLAY_PRODUCTS.PLUS.productId)], NOW);
    expect(state).toMatchObject({ plan: "PLUS", expiresAt: NOW, checkedAt: NOW });
    expect(effectivePlan(state, NOW + PLAN_GRACE_MS - 1)).toBe("PLUS");
    expect(effectivePlan(state, NOW + PLAN_GRACE_MS + 1)).toBe("FREE");
  });
  it("an iOS-style purchase that is active but gives no date gets the same single grace", () => {
    const state = planFromPurchases([{ productIdentifier: PLAY_PRODUCTS.PRO.productId, isActive: true }], NOW);
    expect(effectivePlan(state, NOW + PLAN_GRACE_MS + 1)).toBe("FREE");
    expect(effectivePlan(state, NOW + PLAN_GRACE_MS - 1)).toBe("PRO");
  });
});

describe("acknowledging purchases", () => {
  it("lists only our paid, not yet acknowledged subscriptions, once each", () => {
    const list = purchasesToAcknowledge([
      android(PLAY_PRODUCTS.PLUS.productId, { isAcknowledged: false, purchaseToken: "a" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: false, purchaseToken: "a" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: false, purchaseToken: "b" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: true, purchaseToken: "done" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: false, purchaseState: "2", purchaseToken: "pending" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: undefined, purchaseToken: "unknown" }),
      android("something_else", { isAcknowledged: false, purchaseToken: "other" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: false, purchaseToken: "" }),
      android(PLAY_PRODUCTS.PRO.productId, { isAcknowledged: false, purchaseToken: undefined }),
    ]);
    expect(list).toEqual(["a", "b"]);
    expect(purchasesToAcknowledge([])).toEqual([]);
  });
});

describe("an empty answer from Play", () => {
  const stored = planFromPurchases([android(PLAY_PRODUCTS.PRO.productId)], NOW);
  const empty = (at: number) => planFromPurchases([], at);
  it("does not take a paid plan away while the stored one still runs (the plugin also answers [] when its query failed)", () => {
    const at = NOW + DAY;
    expect(planAfterRefresh(stored, empty(at), at)).toBe(stored);
    expect(planAfterRefresh(stored, empty(NOW + PLAN_GRACE_MS), NOW + PLAN_GRACE_MS)).toBe(stored);
  });
  it("is believed once the stored plan is past its grace, and when nothing paid was stored", () => {
    const late = NOW + PLAN_GRACE_MS + 1;
    expect(planAfterRefresh(stored, empty(late), late).plan).toBe("FREE");
    expect(planAfterRefresh(null, empty(NOW), NOW).plan).toBe("FREE");
    const free = empty(NOW);
    expect(planAfterRefresh(free, empty(NOW + DAY), NOW + DAY).plan).toBe("FREE");
  });
  it("a purchase Play does list always replaces what was stored (a change of plan, a renewal)", () => {
    const plus = planFromPurchases([android(PLAY_PRODUCTS.PLUS.productId)], NOW + DAY);
    expect(planAfterRefresh(stored, plus, NOW + DAY)).toBe(plus);
  });
});

describe("why a purchase did not complete (the plugin's own texts)", () => {
  it("closing Play's sheet and any other not-OK answer is a cancel; a payment still being confirmed is pending", () => {
    expect(classifyPurchaseError(new Error("Purchase is not purchased"))).toBe("CANCELLED");
    expect(classifyPurchaseError({ message: "User cancelled" })).toBe("CANCELLED");
    expect(classifyPurchaseError(new Error("Purchase is pending"))).toBe("PENDING");
  });
  it("everything else is a plain failure", () => {
    expect(classifyPurchaseError(new Error("BILLING_SETUP_FAILED"))).toBe("FAILED");
    expect(classifyPurchaseError(new Error("Product not found"))).toBe("FAILED");
    expect(classifyPurchaseError(undefined)).toBe("FAILED");
    expect(classifyPurchaseError("boom")).toBe("FAILED");
  });
});

describe("one billing call at a time", () => {
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  it("runs tasks one after another, in the order they were asked for, and gives each caller its own result", async () => {
    const inLine = createSerialQueue(1_000);
    let running = 0;
    let most = 0;
    const log: string[] = [];
    const task = (name: string, ms: number) => async () => {
      running++;
      most = Math.max(most, running);
      log.push(`start ${name}`);
      await wait(ms);
      log.push(`end ${name}`);
      running--;
      return name;
    };
    const results = await Promise.all([inLine(task("a", 15)), inLine(task("b", 1)), inLine(task("c", 5))]);
    expect(results).toEqual(["a", "b", "c"]);
    expect(most).toBe(1);
    expect(log).toEqual(["start a", "end a", "start b", "end b", "start c", "end c"]);
  });
  it("a failing task rejects its own caller only; the next one still runs", async () => {
    const inLine = createSerialQueue(1_000);
    const bad = inLine(async () => { throw new Error("boom"); });
    const good = inLine(async () => "ok");
    await expect(bad).rejects.toThrow("boom");
    await expect(good).resolves.toBe("ok");
  });
  it("a task that never answers stops holding the line after its slot", async () => {
    const inLine = createSerialQueue(20);
    void inLine(() => new Promise<never>(() => undefined));
    const started = Date.now();
    await expect(inLine(async () => "next")).resolves.toBe("next");
    expect(Date.now() - started).toBeGreaterThanOrEqual(15);
  });
});

describe("library topics (tracks) per half-year on the phone", () => {
  it("the plans give 1, 4 and 7 topics per half-year", () => {
    expect(APP_TRACKS).toEqual({ FREE: 1, PLUS: 4, PRO: 7 });
  });
  it("half-years run January–June and July–December (UTC)", () => {
    expect(halfYear(NOW)).toEqual({ start: Date.UTC(2026, 6, 1), end: Date.UTC(2027, 0, 1) });
    expect(halfYear(Date.UTC(2026, 2, 3))).toEqual({ start: Date.UTC(2026, 0, 1), end: Date.UTC(2026, 6, 1) });
  });
  it("Free: one topic; replaying it is free, a second one is refused", () => {
    const store = mem();
    expect(canStartTopic("FREE", loadTracks(store, NOW), "math-fractions")).toBe(true);
    recordTopic(store, "math-fractions", NOW);
    recordTopic(store, "math-fractions", NOW + DAY);
    expect(loadTracks(store, NOW).topics).toEqual(["math-fractions"]);
    expect(canStartTopic("FREE", loadTracks(store, NOW), "math-fractions")).toBe(true);
    expect(canStartTopic("FREE", loadTracks(store, NOW), "science-cells")).toBe(false);
    expect(tracksLeft("FREE", loadTracks(store, NOW))).toBe(0);
  });
  it("Plus has 4 and Pro 7; deleting games does not give a topic back (the history is separate from the games)", () => {
    const store = mem();
    for (const id of ["math-fractions", "science-cells", "history-ancient-egypt", "cs-binary"]) recordTopic(store, id, NOW);
    expect(canStartTopic("PLUS", loadTracks(store, NOW), "econ-budgeting")).toBe(false);
    expect(canStartTopic("PRO", loadTracks(store, NOW), "econ-budgeting")).toBe(true);
    expect(tracksLeft("PRO", loadTracks(store, NOW))).toBe(3);
  });
  it("the history starts again in the next half-year", () => {
    const store = mem();
    recordTopic(store, "math-fractions", NOW);
    expect(loadTracks(store, Date.UTC(2027, 0, 2)).topics).toEqual([]);
    expect(canStartTopic("FREE", loadTracks(store, Date.UTC(2027, 0, 2)), "science-cells")).toBe(true);
  });
  it("course chapters are free on every plan and are not counted", () => {
    const store = mem();
    recordTopic(store, "math-fractions", NOW);
    recordTopic(store, "course-fractions-1", NOW);
    expect(loadTracks(store, NOW).topics).toEqual(["math-fractions"]);
    expect(canStartTopic("FREE", loadTracks(store, NOW), "course-fractions-2")).toBe(true);
  });
  it("damaged stored data is ignored", () => {
    const store = mem();
    store.setItem("levelup.tracks.v1", "{oops");
    expect(loadTracks(store, NOW).topics).toEqual([]);
  });
});
