import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PLANS, levelsAllowed } from "@/config/plans";
import { computeEntitlement } from "@/server/allowance/entitlement";
import { startCheckout } from "@/server/billing/service";
import { resetEnvForTests } from "@/server/env";

// With PLANS_ENABLED=false nobody has a plan: everybody gets the full product and checkout does not exist.
describe("plans switched off", () => {
  beforeEach(() => { process.env.PLANS_ENABLED = "false"; resetEnvForTests(); });
  afterEach(() => { process.env.PLANS_ENABLED = "true"; resetEnvForTests(); });

  it("gives every account the full allowance, with no subscription", () => {
    const e = computeEntitlement(null, new Date());
    expect(e.plan).toBe("PRO");
    expect(e.source).toBe("FREE");
    expect(e.subscriptionId).toBeNull();
    // the full product: Pro's points budget as fair use, and every level (A included)
    expect(e.limit).toBe(PLANS.PRO.allowance.budget);
    expect(levelsAllowed(e.plan)).toEqual(["A", "B", "C"]);
  });

  it("refuses to start a checkout", async () => {
    await expect(startCheckout({ id: "u", email: "a@b.c", country: null }, "PLUS")).rejects.toMatchObject({ status: 404 });
  });
});
