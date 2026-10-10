import { expect, test } from "./fixtures";
import { createGameViaApi, expectNoHorizontalOverflow, registerViaApi, setLocaleCookie } from "./helpers";
import { dbRows, getGameSpec, userIdOf } from "./db";
import { goNear, openGame, snapshot } from "./play-helpers";

const WIDTHS = [360, 390, 768, 1280] as const;

test.describe("responsive layout (no horizontal scrolling at any common width, both languages)", () => {
  for (const locale of ["he", "en"] as const) {
    test(`public pages in ${locale}`, async ({ page }) => {
      await setLocaleCookie(page, locale);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        for (const path of ["/", "/pricing", "/login", "/register"]) {
          await page.goto(path);
          await expect(page.locator("main")).toBeVisible();
          await expectNoHorizontalOverflow(page);
        }
      }
    });

    test(`signed-in screens in ${locale}`, async ({ page }) => {
      test.setTimeout(120_000);
      await setLocaleCookie(page, locale);
      await registerViaApi(page, { locale });
      const gameId = await createGameViaApi(page, { contentLanguage: locale });
      for (const width of [360, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        for (const path of ["/dashboard", "/create", "/create?mode=EXTEND", "/games", `/games/${gameId}`, "/account", "/pricing"]) {
          await page.goto(path);
          await expect(page.locator("main")).toBeVisible();
          await expectNoHorizontalOverflow(page);
        }
      }
    });
  }

  test("the mobile navigation menu opens and links work", async ({ page }) => {
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/dashboard");
    await page.getByLabel("Menu").click();
    await page.locator("details a", { hasText: "My games" }).click();
    await page.waitForURL("**/games");
  });
});

test.describe("touch devices", () => {
  test("play screen on a phone: touch controls, joystick moves the player, tap interacts, canvas fills the screen", async ({ page, isMobile }) => {
    test.skip(!isMobile, "runs in the mobile project only");
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);
    const spec = await getGameSpec(gameId);
    await openGame(page, gameId);

    await expect(page.getByTestId("touch-controls")).toBeVisible();
    await expect(page.getByTestId("touch-interact")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const box = await page.locator("canvas").first().boundingBox(); // first = the 3D scene (the minimap is a second, small canvas)
    const vp = page.viewportSize()!;
    expect(box!.width).toBeGreaterThanOrEqual(vp.width - 2);
    expect(box!.height).toBeGreaterThanOrEqual(vp.height - 2);

    // drag the joystick with real touch events (CDP) and watch the server-agnostic simulation move
    const stick = (await page.getByTestId("touch-controls").getByRole("application").boundingBox())!;
    const cx = stick.x + stick.width / 2, cy = stick.y + stick.height / 2;
    const before = (await snapshot(page)).player;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - i * 9 }] });
    await expect.poll(async () => { const p = (await snapshot(page)).player; return Math.hypot(p.x - before.x, p.z - before.z); }, { timeout: 15_000 }).toBeGreaterThan(1);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    // walk to a terminal and tap the on-screen interact prompt → the challenge opens
    const station = spec.areas[0]!.stations.find((s) => s.kind === "challenge")!;
    await goNear(page, "station", station.id);
    await page.getByTestId("interact-prompt").tap();
    await expect(page.getByTestId("challenge-panel")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const panel = (await page.getByTestId("challenge-panel").boundingBox())!;
    expect(panel.width).toBeLessThanOrEqual(vp.width + 1);
    // the answer button is reachable without scrolling the page
    await expect(page.getByTestId("challenge-submit")).toBeInViewport();
    expect(await dbRows('SELECT 1 FROM "PlaySession" WHERE "userId" = $1', [await userIdOf(email)])).toHaveLength(1);
  });
});
