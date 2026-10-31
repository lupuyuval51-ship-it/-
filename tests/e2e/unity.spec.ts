import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, setLocaleCookie } from "./helpers";
import { getGameSpec, setGraphicsPreference, setPlan } from "./db";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** A stand-in for Unity's loader: records everything the page sends, so the bridge can be checked without Unity. */
const FAKE_LOADER = `
window.__unityCalls = [];
window.createUnityInstance = async function (canvas, config) {
  return {
    SendMessage: function (obj, method, value) { window.__unityCalls.push({ obj: obj, method: method, value: value }); },
    Quit: async function () {},
  };
};`;

async function mockUnityBuild(page: import("@playwright/test").Page) {
  await page.route("**/unity/levelup/Build/levelup.loader.js", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_LOADER }));
}

test.describe("optional Unity renderer", () => {
  test("without a build the built-in renderer is used and says so", async ({ page }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    await setPlan(email, "PLUS");
    await setGraphicsPreference(email, "A");
    const gameId = await createGameViaApi(page);
    await page.goto(`/play/${gameId}?renderer=unity`);
    await expect(page.getByTestId("play-root")).toBeVisible();
    await expect(page.getByText(/No Unity build is installed/i)).toBeVisible();
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-renderer", "three");
    await expect(page.getByTestId("unity-canvas")).toHaveCount(0);
  });

  test("with a build: scene and frames go to Unity, Three.js stops drawing, and no challenge content is sent", async ({ page }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    await setPlan(email, "PLUS");
    await setGraphicsPreference(email, "A");
    const gameId = await createGameViaApi(page);
    const spec = await getGameSpec(gameId);
    await mockUnityBuild(page);
    await page.goto(`/play/${gameId}?renderer=unity`);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-renderer", "unity", { timeout: 60_000 });
    await expect(page.getByTestId("renderer-badge")).toBeVisible();

    await expect.poll(() => page.evaluate(() => (window as any).__unityCalls.filter((c: any) => c.method === "OnFrame").length), { timeout: 15_000 }).toBeGreaterThan(3);
    const calls: { obj: string; method: string; value: string }[] = await page.evaluate(() => (window as any).__unityCalls);
    expect(calls.every((c) => c.obj === "LevelUpBridge")).toBe(true);
    const loads = calls.filter((c) => c.method === "LoadScene");
    expect(loads).toHaveLength(1);
    const scene = JSON.parse(loads[0]!.value);
    expect(scene.schema).toBe("levelup.unity-scene");
    for (const ch of spec.challenges) expect(loads[0]!.value).not.toContain(ch.prompt);
    const frame = JSON.parse(calls.filter((c) => c.method === "OnFrame").at(-1)!.value);
    expect(frame.player).toMatchObject({ grounded: expect.any(Boolean) });
    expect(Object.keys(frame.stations).length).toBe(scene.stations.length);
  });

  test("FREE players never get the Unity scene (server-side tier check)", async ({ page }) => {
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);
    const res = await page.request.get(`/api/games/${gameId}/unity`);
    expect(res.status()).toBe(403);
  });
});
