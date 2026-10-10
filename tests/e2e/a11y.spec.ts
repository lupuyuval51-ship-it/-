import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, setLocaleCookie } from "./helpers";
import { getGameSpec } from "./db";
import { goNear, openGame } from "./play-helpers";

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

    test("play screen: HUD, pause menu, dialogue and a challenge panel", async ({ page }) => {
      test.setTimeout(180_000);
      await setLocaleCookie(page, locale);
      await registerViaApi(page, { locale });
      const gameId = await createGameViaApi(page, { contentLanguage: locale });
      const spec = await getGameSpec(gameId);
      await openGame(page, gameId);
      const settle = () => page.waitForTimeout(500); // let the fade-in animations finish: axe would otherwise measure contrast on half-transparent text
      await settle();
      await audit(page, `${locale} play HUD`);
      await page.getByTestId("pause-button").click();
      await expect(page.getByTestId("pause-menu")).toBeVisible();
      await settle();
      await audit(page, `${locale} pause menu`);
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("pause-menu")).toBeHidden();
      const npc = spec.areas[0]!.npcs[0];
      if (npc) {
        await goNear(page, "npc", npc.id);
        await page.keyboard.press("KeyE");
        await expect(page.getByTestId("dialogue")).toBeVisible();
        await settle();
        await audit(page, `${locale} dialogue`);
        await page.keyboard.press("Escape");
        await expect(page.getByTestId("dialogue")).toBeHidden();
      }
      const station = spec.areas[0]!.stations.find((st) => st.kind === "challenge")!;
      await goNear(page, "station", station.id);
      await page.keyboard.press("KeyE");
      await expect(page.getByTestId("challenge-panel")).toBeVisible();
      await settle();
      await audit(page, `${locale} challenge panel`);
    });
  });
}
