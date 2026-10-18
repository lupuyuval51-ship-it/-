import { expect, test } from "./fixtures";
import { apiPost, registerViaApi, registerViaUi, setLocaleCookie } from "./helpers";
import { dbRows, userIdOf } from "./db";

/** The payment simulator (PAYMENTS_MODE=dev) exercised through the real UI. No money moves; everything is labelled. */
test.describe("pricing and subscriptions", () => {
  test("exact prices by region: Plus $10 / ₪10 and Pro $40 / ₪40 in Israel, Free $0; rules and billing disclosures are shown", async ({ page, browser }) => {
    await setLocaleCookie(page, "en");
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "US" }); // honoured because the E2E server runs behind a trusted proxy
    await page.goto("/pricing");
    await expect(page.getByTestId("price-FREE")).toContainText("Free");
    await expect(page.getByTestId("price-PLUS")).toContainText("$10");
    await expect(page.getByTestId("price-PRO")).toContainText("$40");
    // the offer is generated from each level's own quota (src/config/plans.ts)
    await expect(page.getByTestId("offer-FREE")).toContainText("1 topic at level B and 5 at level C per calendar month");
    await expect(page.getByTestId("offer-PLUS")).toContainText("5 topics at level A, 10 at level B and unlimited at level C per monthly billing period");
    await expect(page.getByTestId("offer-PRO")).toContainText("5 topics at level A, 10 at level B and unlimited at level C per monthly billing period");
    await expect(page.getByTestId("offer-PLUS")).toContainText("Every level has its own count");
    await expect(page.getByTestId("offer-FREE")).not.toContainText("level A");
    await expect(page.getByTestId("plan-FREE")).toContainText("Tier B / C");
    await expect(page.getByTestId("plan-PLUS")).toContainText("Tier A");
    await expect(page.getByTestId("plan-PRO")).toContainText("same Tier A graphics as Plus");
    await expect(page.getByTestId("pricing-rules")).toContainText("not charged");
    await expect(page.getByTestId("pricing-billing")).toContainText("cancel at any time");
    await expect(page.getByTestId("payments-dev-banner")).toContainText("no real money");

    const il = await browser.newContext({ extraHTTPHeaders: { "x-vercel-ip-country": "IL" } });
    const ilPage = await il.newPage();
    await ilPage.goto("/pricing");
    await expect(ilPage.getByTestId("price-PLUS")).toContainText("₪10");
    await expect(ilPage.getByTestId("price-PLUS")).not.toContainText("$");
    await expect(ilPage.getByTestId("price-PRO")).toContainText("₪40");
    await expect(ilPage.getByTestId("price-PRO")).not.toContainText("$");
    await il.close();
  });

  test("Hebrew pricing page is RTL and keeps prices readable", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("price-PLUS")).toContainText("$10");
    await expect(page.getByTestId("pricing-title")).toContainText("מחירים");
  });

  test("Plus in Israel: checkout → simulated payment → active plan; cancel/resume; failed payment; renewal; refund", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Noa", region: "IL" });
    const userId = await userIdOf(email);

    await page.goto("/pricing");
    await expect(page.getByTestId("price-PLUS")).toContainText("₪10");
    await page.getByTestId("checkout-PLUS").click();
    await page.waitForURL(/\/billing\/dev-checkout\//);
    await expect(page.getByTestId("dev-checkout")).toContainText("NOT a real payment");
    await expect(page.getByTestId("dev-checkout")).toContainText("₪10");
    await page.getByTestId("dev-pay").click();
    await page.waitForURL("**/billing/success");
    await expect(page.getByTestId("checkout-status")).toHaveAttribute("data-active", "true", { timeout: 20_000 });
    await expect(page.getByTestId("checkout-status")).toContainText("Plus plan is active");

    // the subscription was created by the shared ingest pipeline, tagged as simulated, with the exact configured price
    const [sub] = await dbRows<{ provider: string; plan: string; status: string; currency: string; unitAmount: number }>('SELECT provider, plan, status, currency, "unitAmount" FROM "Subscription" WHERE "userId" = $1', [userId]);
    expect(sub).toMatchObject({ provider: "DEV", plan: "PLUS", status: "ACTIVE", currency: "ils", unitAmount: 1000 });
    const events = await dbRows<{ type: string; status: string }>('SELECT type, status FROM "WebhookEvent" WHERE id LIKE \'evt_dev_%\' AND "payload"::text LIKE $1 ORDER BY type', [`%${userId}%`]);
    expect(events).toEqual([{ type: "customer.subscription.created", status: "PROCESSED" }, { type: "invoice.paid", status: "PROCESSED" }]);

    await page.goto("/account");
    await expect(page.getByTestId("account-plan")).toHaveText("Plus");
    await expect(page.getByTestId("sub-status")).toHaveText("Active");
    await expect(page.getByTestId("sub-simulated")).toContainText("No money was charged");
    await expect(page.getByTestId("subscription-panel")).toContainText("₪10");
    await expect(page.getByTestId("allowance-pill")).toContainText("Plus");

    // cancel keeps the plan until the period end; resume undoes it
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("sub-cancel").click();
    await expect(page.getByTestId("sub-ends")).toBeVisible();
    await expect(page.getByTestId("account-plan")).toHaveText("Plus");
    await page.getByTestId("sub-resume").click();
    await expect(page.getByTestId("sub-ends")).toBeHidden();

    // a second purchase is refused while subscribed (UI offers management instead, API says 409)
    await page.goto("/pricing");
    await expect(page.getByTestId("checkout-PRO")).toHaveCount(0);
    expect((await apiPost<{ error: { code: string } }>(page, "/api/billing/checkout", { plan: "PRO" })).body.error.code).toBe("ALREADY_SUBSCRIBED");

    // lifecycle events from the simulator
    await page.goto("/account");
    await page.getByTestId("dev-fail").click();
    await expect(page.getByTestId("sub-past-due")).toBeVisible();
    await expect(page.getByTestId("account-plan")).toHaveText("Free");
    await page.getByTestId("dev-renew").click();
    await expect(page.getByTestId("account-plan")).toHaveText("Plus");
    await expect(page.getByTestId("sub-past-due")).toBeHidden();
    await page.getByTestId("dev-refund").click();
    await expect(page.getByTestId("sub-refunded")).toBeVisible();
    await expect(page.getByTestId("account-plan")).toHaveText("Free");
    await page.getByTestId("dev-renew").click();
    await expect(page.getByTestId("account-plan")).toHaveText("Plus");
  });

  test("Pro: $40, 5 topics at level A and 10 at level B per period, each level counted on its own and enforced after each delivery", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    await registerViaUi(page, { name: "Pro Player", region: "US" });
    await page.goto("/pricing");
    await expect(page.getByTestId("price-PRO")).toContainText("$40");
    await page.getByTestId("checkout-PRO").click();
    await page.waitForURL(/\/billing\/dev-checkout\//);
    await expect(page.getByTestId("dev-checkout")).toContainText("$40");
    await page.getByTestId("dev-pay").click();
    await expect(page.getByTestId("checkout-status")).toHaveAttribute("data-active", "true", { timeout: 20_000 });

    await page.goto("/dashboard");
    await expect(page.getByTestId("dash-remaining-A")).toHaveText("5");
    await expect(page.getByTestId("dash-remaining-B")).toHaveText("10");
    await expect(page.getByTestId("dash-remaining-C")).toHaveText("Unlimited");
    await expect(page.getByTestId("dash-offer")).toContainText("5 topics at level A, 10 at level B and unlimited at level C");
    for (let i = 1; i <= 5; i++) {
      const res = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: `pro-${i}-0123456789abcdef`, request: { mode: "FAST", subject: `Topic ${i}`, learningGoal: `Goal ${i}`, difficulty: "beginner", gameType: "adventure", contentLanguage: "en" } });
      expect(res.status, `generation ${i}`).toBe(202);
      await expect.poll(async () => (await (await page.request.get(`/api/generations/${res.body.jobId}`)).json()).status, { timeout: 30_000 }).toBe("SUCCEEDED");
      if (i === 1) {
        // without a level wish, Pro gets level A: one of its 5, and level B keeps all 10
        await page.goto("/dashboard");
        await expect(page.getByTestId("dash-remaining-A")).toHaveText("4");
        await expect(page.getByTestId("dash-remaining-B")).toHaveText("10");
        await expect(page.getByTestId("allowance-pill")).toContainText("A: 4");
      }
    }
    // the sixth level-A game is refused with the level's details (the sixth request is also the last the generate rate limit allows)
    const sixth = { mode: "FAST", subject: "Six", learningGoal: "Six", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", level: "A" };
    const refused = await apiPost<{ error: { code: string; details: { level: string; remaining: number } } }>(page, "/api/generations", { idempotencyKey: "pro-6-0123456789abcdef", request: sixth });
    expect(refused).toMatchObject({ status: 402, body: { error: { code: "ALLOWANCE_EXHAUSTED", details: { level: "A", remaining: 0 } } } });
    await page.goto("/dashboard");
    await expect(page.getByTestId("dash-remaining-A")).toHaveText("0");
    await expect(page.getByTestId("dash-remaining-B")).toHaveText("10");
    // the form shows level A used up and moves to level B, which is its own count and still has all 10; level C is unlimited
    await page.goto("/create");
    await expect(page.getByTestId("level-A")).toBeDisabled();
    await expect(page.getByTestId("level-short-A")).toContainText("none left until");
    await expect(page.getByTestId("level-B")).toBeEnabled();
    await expect(page.getByTestId("level-B")).toBeChecked();
    await expect(page.getByTestId("level-left-B")).toContainText("10 of 10 left");
    await expect(page.getByTestId("create-allowance")).toContainText("Level B: 10 of 10 games left");
    await expect(page.getByTestId("create-submit")).toBeEnabled();
    await expect(page.getByTestId("level-C")).toBeEnabled();
    await expect(page.getByTestId("level-left-C")).toContainText("Unlimited");
    // Pro cannot buy more through the UI either
    await expect(page.getByText("Upgrade for more games")).toHaveCount(0);
  });

  test("nothing a browser sends can grant a plan: success page, forged checkouts and other users' checkouts", async ({ page, browser }) => {
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    // landing on the success page without paying changes nothing
    await page.goto("/billing/success?session_id=cs_test_forged1234567890");
    await expect(page.getByTestId("checkout-status")).toHaveAttribute("data-active", "false");
    await page.waitForTimeout(2500);
    await expect(page.getByTestId("checkout-status")).toHaveAttribute("data-active", "false");
    expect((await (await page.request.get("/api/billing/status")).json()).plan).toBe("FREE");
    // the completion endpoints do not accept made-up ids
    expect((await apiPost(page, "/api/billing/dev/complete", { checkoutId: "does-not-exist" })).status).toBe(404);
    expect((await apiPost(page, "/api/billing/dev/simulate", { event: "renew" })).status).toBe(409);
    // webhooks without a valid Stripe signature are never accepted (Stripe mode is not even enabled here)
    const hook = await page.request.post("/api/webhooks/stripe", { data: { id: "evt_x", type: "customer.subscription.created" } });
    expect([400, 503]).toContain(hook.status());

    // someone else's simulated checkout cannot be completed or even opened
    const owner = await browser.newContext();
    const ownerPage = await owner.newPage();
    await registerViaApi(ownerPage, { locale: "en" });
    const co = await apiPost<{ url: string }>(ownerPage, "/api/billing/checkout", { plan: "PLUS" });
    expect(co.status).toBe(200);
    const id = co.body.url.split("/").pop()!;
    expect((await apiPost(page, "/api/billing/dev/complete", { checkoutId: id })).status).toBe(404);
    expect((await page.goto(`/billing/dev-checkout/${id}`))?.url()).toContain(id);
    await expect(page.getByTestId("not-found")).toBeVisible();
    expect((await (await page.request.get("/api/billing/status")).json()).plan).toBe("FREE");
    await owner.close();
  });
});
