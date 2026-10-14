import { expect, test } from "@playwright/test";

/**
 * First launch of a real install: English is preselected, the learner picks the language (the page switches at once) and the
 * country for prices, then lands on the welcome. The e2e build skips this screen by default, so the spec seeds the state of a
 * fresh install once (a second load keeps whatever the app saved).
 */
test.use({ viewport: { width: 360, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.clear();
    localStorage.setItem("levelup.mobile.settings", JSON.stringify({ locale: "en", region: "OTHER", setupDone: false }));
  });
});

test("language and country are chosen on first launch, then the welcome follows and the choice is kept", async ({ page }) => {
  await page.goto("/#/");
  const setup = page.getByTestId("first-setup");
  await expect(setup).toBeVisible();
  await expect(page.getByTestId("welcome")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByTestId("setup-lang-en")).toBeChecked();

  // switching the language switches the page at once
  await page.getByTestId("setup-lang-he").check();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "מגדירים את LEVEL UP" })).toBeVisible();
  await page.getByTestId("setup-lang-en").check();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.getByTestId("setup-region").selectOption("IL");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByTestId("setup-continue").click();
  await expect(setup).toHaveCount(0);
  await expect(page.getByTestId("welcome")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("first-setup")).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("levelup.mobile.settings")!));
  expect(saved).toMatchObject({ locale: "en", region: "IL", setupDone: true });
  await page.goto("/#/settings");
  await expect(page.locator("#region")).toHaveValue("IL");
});

test("plans and prices are information only, in the currency of the chosen country", async ({ page }) => {
  await page.goto("/#/");
  await page.getByTestId("setup-region").selectOption("IL");
  await page.getByTestId("setup-continue").click();
  await page.goto("/#/settings");
  await page.getByTestId("open-plans").click();
  await expect(page.getByTestId("mobile-plans-page")).toBeVisible();
  await expect(page.getByTestId("plans-open-now")).toBeVisible();
  await expect(page.getByTestId("mobile-price-PLUS")).toContainText("₪10");
  await expect(page.getByTestId("mobile-price-PRO")).toContainText("₪40");
  // nothing to buy, nothing leading out of the app
  await expect(page.getByTestId("mobile-plans-page").locator("button")).toHaveCount(0);
  await expect(page.getByTestId("mobile-plans-page").locator("a[href^='http']")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
