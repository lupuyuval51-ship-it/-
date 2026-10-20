import { describe, expect, it } from "vitest";
import { PLAN_GRACE_MS, PLAY_PRODUCTS, effectivePlan, loadPlanState, planFromPurchases, savePlanState, sanitizePlanState } from "@/lib/offline/billing-state";
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
