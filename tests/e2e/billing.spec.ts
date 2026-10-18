import { expect, test } from "./fixtures";
import { apiPost, registerViaApi, registerViaUi, setLocaleCookie } from "./helpers";
import { dbRows, userIdOf } from "./db";

/** The payment simulator (PAYMENTS_MODE=dev) exercised through the real UI. No money moves; everything is labelled. */
test.describe("pricing and subscriptions", () => {
  test("exact prices by region: Plus $5 / ₪5 and Pro $20 / ₪20 in Israel, Free $0; rules and billing disclosures are shown", async ({ page, browser }) => {
    await setLocaleCookie(page, "en");
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "US" }); // honoured because the E2E server runs behind a trusted proxy
    await page.goto("/pricing");
    await expect(page.getByTestId("price-FREE")).toContainText("Free");
    await expect(page.getByTestId("price-PLUS")).toContainText("$5");
    await expect(page.getByTestId("price-PRO")).toContainText("$20");
    // the offer is generated from each level's own quota (src/config/plans.ts)
    await expect(page.getByTestId("offer-FREE")).toContainText("1 topic at level B and 5 at level C per calendar month");
    await expect(page.getByTestId("offer-PLUS")).toContainText("5 topics at level A, 10 at level B and unlimited at level C per monthly billing period");
    await expect(page.getByTestId("offer-PRO")).toContainText("20 topics at level A, 40 at level B and unlimited at level C per monthly billing period");
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
    await expect(ilPage.getByTestId("price-PLUS")).toContainText("₪5");
    await expect(ilPage.getByTestId("price-PLUS")).not.toContainText("$");
    await expect(ilPage.getByTestId("price-PRO")).toContainText("₪20");
    await expect(ilPage.getByTestId("price-PRO")).not.toContainText("$");
    await il.close();
  });

  test("Hebrew pricing page is RTL and keeps prices readable", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("price-PLUS")).toContainText("$5");
    await expect(page.getByTestId("pricing-title")).toContainText("מחירים");
  });

  test("Plus in Israel: checkout → simulated payment → active plan; cancel/resume; failed payment; renewal; refund", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Noa", region: "IL" });
    const userId = await userIdOf(email);

    await page.goto("/pricing");
    await expect(page.getByTestId("price-PLUS")).toContainText("₪5");
    await page.getByTestId("checkout-PLUS").click();
    await page.waitForURL(/\/billing\/dev-checkout\//);
    await expect(page.getByTestId("dev-checkout")).toContainText("NOT a real payment");
    await expect(page.getByTestId("dev-checkout")).toContainText("₪5");
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
    await expect(page.getByTestId("subscription-panel")).toContainText("₪5");
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

  test("Pro: $20, 20 topics at level A and 40 at level B per period (four times Plus), each level counted on its own", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    await registerViaUi(page, { name: "Pro Player", region: "US" });
    await page.goto("/pricing");
    await expect(page.getByTestId("price-PRO")).toContainText("$20");
    await page.getByTestId("checkout-PRO").click();
    await page.waitForURL(/\/billing\/dev-checkout\//);
    await expect(page.getByTestId("dev-checkout")).toContainText("$20");
    await page.getByTestId("dev-pay").click();
    await expect(page.getByTestId("checkout-status")).toHaveAttribute("data-active", "true", { timeout: 20_000 });

    await page.goto("/dashboard");
    await expect(page.getByTestId("dash-remaining-A")).toHaveText("20");
    await expect(page.getByTestId("dash-remaining-B")).toHaveText("40");
    await expect(page.getByTestId("dash-remaining-C")).toHaveText("Unlimited");
    await expect(page.getByTestId("dash-offer")).toContainText("20 topics at level A, 40 at level B and unlimited at level C");
    // without a level wish, Pro gets level A: one of its 20, and level B keeps all 40
    const res = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: "pro-1-0123456789abcdef", request: { mode: "FAST", subject: "Topic 1", learningGoal: "Goal 1", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" } });
    expect(res.status).toBe(202);
    await expect.poll(async () => (await (await page.request.get(`/api/generations/${res.body.jobId}`)).json()).status, { timeout: 30_000 }).toBe("SUCCEEDED");
    await page.goto("/dashboard");
    await expect(page.getByTestId("dash-remaining-A")).toHaveText("19");
    await expect(page.getByTestId("dash-remaining-B")).toHaveText("40");
    await expect(page.getByTestId("allowance-pill")).toContainText("A: 19");
    // the form shows each level's own count; level C is unlimited (running a level out is covered by the integration tests)
    await page.goto("/create");
    await expect(page.getByTestId("level-left-A")).toContainText("19 of 20 left");
    await expect(page.getByTestId("level-left-B")).toContainText("40 of 40 left");
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
