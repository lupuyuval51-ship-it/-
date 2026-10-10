import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, setLocaleCookie } from "./helpers";

/** Automated accessibility audit (axe-core, WCAG 2.1 A/AA rules). Fails on any serious or critical finding. */
async function audit(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    bad.map((v) => `${label}: ${v.id} (${v.impact}) — ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
    `${label}: accessibility violations`,
  ).toEqual([]);
}

for (const locale of ["en", "he"] as const) {
  test.describe(`accessibility (${locale})`, () => {
    test("public pages", async ({ page }) => {
      await setLocaleCookie(page, locale);
      for (const path of ["/", "/pricing", "/login", "/register"]) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        await audit(page, `${locale} ${path}`);
      }
    });

    test("signed-in pages", async ({ page }) => {
      test.setTimeout(120_000);
      await setLocaleCookie(page, locale);
      await registerViaApi(page, { locale });
      const gameId = await createGameViaApi(page, { contentLanguage: locale });
      for (const path of ["/dashboard", "/create", "/create?mode=EXTEND", "/games", `/games/${gameId}`, "/account"]) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        await audit(page, `${locale} ${path}`);
      }
    });
  });
}
