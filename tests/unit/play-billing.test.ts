import { describe, expect, it } from "vitest";
import { PLAN_GRACE_MS, PLAY_PRODUCTS, effectivePlan, loadPlanState, planFromPurchases, savePlanState, sanitizePlanState } from "@/lib/offline/billing-state";
import { levelsLeft, loadUsed, monthKey, pickBuildLevel, recordUse } from "@/lib/offline/device-quota";
import { quotaOf } from "@/config/plans";

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

describe("games per level on the phone", () => {
  it("counts per level and per UTC month, and a new month starts again", () => {
    const store = mem();
    recordUse(store, "B", NOW);
    recordUse(store, "C", NOW);
    recordUse(store, "C", NOW);
    expect(loadUsed(store, NOW)).toEqual({ A: 0, B: 1, C: 2 });
    expect(loadUsed(store, NOW + 40 * DAY)).toEqual({ A: 0, B: 0, C: 0 });
    expect(monthKey(NOW)).toBe("2026-10");
  });
  it("Free: B once, then C five times, then nothing (A is never offered)", () => {
    const used = { A: 0, B: 0, C: 0 };
    expect(pickBuildLevel("FREE", used)).toEqual({ level: "B", exhausted: false });
    used.B = quotaOf("FREE", "B") as number;
    expect(pickBuildLevel("FREE", used)).toEqual({ level: "C", exhausted: false });
    used.C = quotaOf("FREE", "C") as number;
    expect(pickBuildLevel("FREE", used)).toEqual({ level: "C", exhausted: true });
  });
  it("Plus and Pro start at A and fall to B, then to C which never runs out", () => {
    for (const plan of ["PLUS", "PRO"] as const) {
      expect(pickBuildLevel(plan, { A: 0, B: 0, C: 0 }).level).toBe("A");
      expect(pickBuildLevel(plan, { A: quotaOf(plan, "A") as number, B: 0, C: 0 }).level).toBe("B");
      expect(pickBuildLevel(plan, { A: 99, B: 99, C: 999 })).toEqual({ level: "C", exhausted: false });
    }
  });
  it("a level that is used up never reduces another", () => {
    expect(levelsLeft("PRO", { A: 20, B: 0, C: 0 })).toEqual({ A: 0, B: 40, C: null });
  });
});
