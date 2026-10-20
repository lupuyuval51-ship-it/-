import { expect, test } from "@playwright/test";

/**
 * First launch of a real install: a short questionnaire — language (Hebrew by default; the specs seed English, the page switches at once; Spanish
 * too), what to learn and how much time a day. The plan step (country for prices, the plan wanted) and every other place
 * that showed plans or prices are hidden in a normal build (`mobile/src/features.ts`). Then the welcome. The e2e build skips this screen by default, so the spec seeds the state of a fresh
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

test("the questionnaire asks the language, the topics and the time, then the welcome follows and the answers are kept", async ({ page }) => {
  await page.goto("/#/");
  const setup = page.getByTestId("first-setup");
  await expect(setup).toHaveAttribute("data-step", "language");
  await expect(page.getByTestId("welcome")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByTestId("setup-lang-en")).toBeChecked();
  await expect(page.getByTestId("setup-progress")).toHaveText("1 of 3");

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
  // the last step: no plan, no price, nothing to buy and nothing leading out of the app
  await expect(page.getByTestId("setup-next")).toHaveText("Start");
  await expect(page.getByTestId("setup-plan")).toHaveCount(0);
  await expect(setup.locator("a[href^='http']")).toHaveCount(0);
  expect(await noSideScroll(page)).toBe(true);
  await page.getByTestId("setup-next").click();

  await expect(setup).toHaveCount(0);
  await expect(page.getByTestId("welcome")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("first-setup")).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("levelup.mobile.settings")!));
  expect(saved).toMatchObject({ locale: "en", setupDone: true, interests: ["science", "math"], minutesPerDay: 20, planChoice: null });

  // the answers are used: the topic library opens on the first interest; 20 minutes a day proposes a full adventure
  await page.goto("/#/create");
  await expect(page.locator("#mode")).toHaveValue("FULL");
  await page.getByTestId("source-library").check();
  await expect(page.getByTestId("topic-cat-science")).toHaveAttribute("aria-pressed", "true");
});

test("the language can be changed to Spanish or Hebrew in Settings, and the questions can be answered again", async ({ page }) => {
  await page.goto("/#/");
  for (let i = 0; i < 3; i++) await page.getByTestId("setup-next").click();
  await page.goto("/#/settings");
  await page.locator("#locale").selectOption("es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.locator("#locale").selectOption("he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByTestId("setup-again").click();
  await expect(page.getByTestId("first-setup")).toHaveAttribute("data-step", "language");
});

test("plans are on their own screen: Settings → Plans lists the three plans in shekels, buying needs the installed app, and the setup has no plan step", async ({ page }) => {
  await page.goto("/#/");
  for (let i = 0; i < 3; i++) await page.getByTestId("setup-next").click();
  await page.goto("/#/settings");
  await expect(page.getByTestId("mobile-settings-page")).toBeVisible();
  await expect(page.locator("#region")).toHaveCount(0);
  await page.getByTestId("open-plans").click();
  await expect(page.getByTestId("mobile-plans-page")).toBeVisible();
  await expect(page.getByTestId("mobile-price-PLUS")).toContainText("₪5");
  await expect(page.getByTestId("mobile-price-PRO")).toContainText("₪20");
  await expect(page.getByTestId("mobile-price-PRO")).not.toContainText("$");
  // outside the installed app (the browser test build) Google Play is not there: the buttons are disabled and say why
  await expect(page.getByTestId("plans-unavailable")).toBeVisible();
  await expect(page.getByTestId("plan-buy-PLUS")).toBeDisabled();
  await expect(page.getByTestId("plans-restore")).toBeDisabled();
});

test("the questionnaire is the whole first screen (nothing behind it) and 'Skip' keeps the defaults", async ({ page }) => {
  await page.goto("/#/");
  await expect(page.getByTestId("first-setup")).toBeVisible();
  await expect(page.getByTestId("mobile-library")).toHaveCount(0);
  await expect(page.getByTestId("tab-bar")).toHaveCount(0);
  // even a deep link opens the questionnaire first on a new install
  await page.goto("/#/create");
  await expect(page.getByTestId("first-setup")).toBeVisible();
  await page.getByTestId("setup-next").click();
  await page.getByTestId("setup-skip").click();
  await expect(page.getByTestId("first-setup")).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("levelup.mobile.settings")!));
  expect(saved).toMatchObject({ setupDone: true, locale: "en" });
});

test("the bottom tab bar reaches every main screen, its tabs are thumb-sized, and it never covers the content", async ({ page }) => {
  await page.goto("/#/");
  for (let i = 0; i < 3; i++) await page.getByTestId("setup-next").click();
  const bar = page.getByTestId("tab-bar");
  await expect(bar).toBeVisible();
  for (const [tab, screen] of [["tab-create", "mobile-create"], ["tab-review", null], ["tab-settings", "mobile-settings-page"], ["tab-home", "mobile-library"]] as const) {
    await page.getByTestId(tab).click();
    await expect(page.getByTestId(tab)).toHaveAttribute("aria-current", "page");
    if (screen) await expect(page.getByTestId(screen)).toBeVisible();
    const box = await page.getByTestId(tab).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // scrolled to the very end, the last thing on the settings screen sits above the bar
  await page.getByTestId("tab-settings").click();
  await expect(page.getByTestId("mobile-settings-page")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(bar).toBeVisible();
  const barTop = (await bar.boundingBox())!.y;
  const lastBottom = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>("main button, main a, main p")].filter((e) => e.offsetParent);
    return Math.max(...els.map((e) => e.getBoundingClientRect().bottom));
  });
  expect(lastBottom).toBeLessThanOrEqual(barTop + 1);
  // the play screen has no tab bar
  await page.getByTestId("tab-home").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
