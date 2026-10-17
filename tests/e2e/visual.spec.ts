import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, setLocaleCookie } from "./helpers";
import { openGame } from "./play-helpers";

/**
 * Visual regression: pixel snapshots of the public pages in both themes and both directions. A design change that
 * breaks layout, colour or typography fails here instead of slipping through silently.
 * Update the baselines on purpose with `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`.
 */
for (const theme of ["dark", "light"] as const) {
  for (const locale of ["he", "en"] as const) {
    test(`public pages look right (${locale}, ${theme})`, async ({ page, context, baseURL }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await context.addCookies([{ name: "lu-theme", value: theme, url: baseURL! }]);
      await setLocaleCookie(page, locale);
      for (const [path, name] of [["/", "home"], ["/pricing", "pricing"], ["/login", "login"], ["/missing-page", "404"]] as const) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}-${locale}-${theme}.png`, { fullPage: true, animations: "disabled", maxDiffPixelRatio: 0.01 });
      }
    });
  }
}

test("theme switch cycles system → light → dark and is remembered", async ({ page }) => {
  await setLocaleCookie(page, "en");
  await page.goto("/");
  const sw = page.getByTestId("theme-switch");
  await expect(sw).toHaveAttribute("data-theme-pref", "system");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  await sw.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(245, 247, 252)");
  await sw.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("theme-switch")).toHaveAttribute("data-theme-pref", "dark");
});

test("system preference picks light when the device is light, and the 3D play screen stays dark", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ colorScheme: "light" });
  await setLocaleCookie(page, "en");
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(245, 247, 252)");
  await expect(page.locator("body")).toHaveCSS("font-family", /Heebo/);
  await registerViaApi(page, { locale: "en" });
  const gameId = await createGameViaApi(page);
  await openGame(page, gameId);
  await expect(page.getByTestId("play-root")).toHaveCSS("background-color", "rgb(6, 9, 20)");
});
