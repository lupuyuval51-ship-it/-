import { expect, test } from "@playwright/test";

/**
 * First launch of a real install: a short questionnaire — language (English preselected, the page switches at once; Spanish
 * too), what to learn, how much time a day, then the country for prices and the plan the learner wants (a preference only:
 * nothing to buy). Then the welcome. The e2e build skips this screen by default, so the spec seeds the state of a fresh
 * install once (a second load keeps whatever the app saved).
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

const noSideScroll = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test("the questionnaire asks the language, the topics, the time and the plan, then the welcome follows and the answers are kept", async ({ page }) => {
  await page.goto("/#/");
  const setup = page.getByTestId("first-setup");
  await expect(setup).toHaveAttribute("data-step", "language");
  await expect(page.getByTestId("welcome")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByTestId("setup-lang-en")).toBeChecked();
  await expect(page.getByTestId("setup-progress")).toHaveText("1 of 4");

  // switching the language switches the page at once: Hebrew is RTL, Spanish is LTR
  await page.getByTestId("setup-lang-he").check();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByTestId("setup-lang-es").check();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByTestId("setup-es-note")).toBeVisible();
  await page.getByTestId("setup-lang-en").check();
  await page.getByTestId("setup-next").click();

  await expect(setup).toHaveAttribute("data-step", "topics");
  await page.getByTestId("setup-topic-science").check();
  await page.getByTestId("setup-topic-math").check();
  expect(await noSideScroll(page)).toBe(true);
  await page.getByTestId("setup-next").click();

  await expect(setup).toHaveAttribute("data-step", "time");
  await page.getByTestId("setup-minutes-20").check();
  await page.getByTestId("setup-next").click();

  await expect(setup).toHaveAttribute("data-step", "plan");
  await page.getByTestId("setup-region").selectOption("IL");
  await expect(page.getByTestId("setup-price-PLUS")).toContainText("₪10");
  await expect(page.getByTestId("setup-price-PRO")).toContainText("₪40");
  await expect(page.getByTestId("setup-open-now")).toBeVisible();
  await page.getByTestId("setup-plan-PLUS").check();
  // nothing to buy and nothing leading out of the app
  await expect(setup.locator("a[href^='http']")).toHaveCount(0);
  expect(await noSideScroll(page)).toBe(true);
  await page.getByTestId("setup-next").click();

  await expect(setup).toHaveCount(0);
  await expect(page.getByTestId("welcome")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("first-setup")).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("levelup.mobile.settings")!));
  expect(saved).toMatchObject({ locale: "en", region: "IL", setupDone: true, interests: ["science", "math"], minutesPerDay: 20, planChoice: "PLUS" });

  // the answers are used: the topic library opens on the first interest; 20 minutes a day proposes a full adventure
  await page.goto("/#/create");
  await expect(page.locator("#mode")).toHaveValue("FULL");
  await page.getByTestId("source-library").check();
  await expect(page.getByTestId("topic-cat-science")).toHaveAttribute("aria-pressed", "true");
});

test("the language can be changed to Spanish or Hebrew in Settings, and the questions can be answered again", async ({ page }) => {
  await page.goto("/#/");
  for (let i = 0; i < 4; i++) await page.getByTestId("setup-next").click();
  await page.goto("/#/settings");
  await page.locator("#locale").selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.locator("#locale").selectOption("he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByTestId("setup-again").click();
  await expect(page.getByTestId("first-setup")).toHaveAttribute("data-step", "language");
});

test("plans and prices are information only, in the currency of the chosen country", async ({ page }) => {
  await page.goto("/#/");
  for (let i = 0; i < 3; i++) await page.getByTestId("setup-next").click();
  await page.getByTestId("setup-region").selectOption("IL");
  await page.getByTestId("setup-next").click();
  await page.goto("/#/settings");
  await page.getByTestId("open-plans").click();
  await expect(page.getByTestId("mobile-plans-page")).toBeVisible();
  await expect(page.getByTestId("plans-open-now")).toBeVisible();
  await expect(page.getByTestId("mobile-price-PLUS")).toContainText("₪10");
  await expect(page.getByTestId("mobile-price-PRO")).toContainText("₪40");
  await expect(page.getByTestId("mobile-plans-page").locator("button")).toHaveCount(0);
  await expect(page.getByTestId("mobile-plans-page").locator("a[href^='http']")).toHaveCount(0);
  expect(await noSideScroll(page)).toBe(true);
});
