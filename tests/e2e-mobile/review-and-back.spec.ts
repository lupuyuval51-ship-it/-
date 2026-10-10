import { expect, test, type Page } from "@playwright/test";
import type { GameSpec } from "@/lib/game/spec/schema";
import { answerInUi, challengeOf, goNear, snapshot } from "../e2e/play-helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

const storedSpec = (page: Page, gameId: string): Promise<GameSpec> => page.evaluate((id) => JSON.parse(localStorage.getItem(`levelup.offline.game.${id}`)!).spec, gameId);
const back = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event("levelup:back")));

test("Android back button pauses the game, then leaves it; a missed question waits in 'review my mistakes'", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("deck-open")).toHaveCount(0); // nothing to review yet
  await page.getByTestId("mobile-new").click();
  await page.locator("#subject").fill("Plants");
  await page.locator("#material").fill(NOTES);
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toBeVisible();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });

  // miss a question once, then get it right
  const gameId = page.url().split("/play/")[1]!;
  const spec = await storedSpec(page, gameId);
  const snap = await snapshot(page);
  const area = spec.areas.find((a) => a.id === snap.client.areaId)!;
  const st = area.stations.find((s) => s.kind === "challenge" && ["choice", "numeric", "sequence", "match"].includes(challengeOf(spec, s.challengeId!).type))!;
  await goNear(page, "station", st.id);
  await page.getByTestId("interact-prompt").click();
  const panel = page.getByTestId("challenge-panel");
  await expect(panel).toBeVisible();
  const ch = challengeOf(spec, (await panel.getAttribute("data-challenge"))!);
  await answerInUi(page, ch, "wrong");
  await expect(page.getByTestId("result")).toBeVisible();
  await answerInUi(page, ch, "right");
  await expect(page.getByTestId("result")).toContainText(/correct|נכון/i);

  // back: closes the panel → pauses → leaves the game
  await back(page);
  await expect(panel).toBeHidden();
  await back(page);
  await expect(page.getByTestId("pause-menu")).toBeVisible();
  await back(page);
  await expect(page.getByTestId("mobile-library")).toBeVisible();

  // the missed question is due in "review my mistakes"
  await expect(page.getByTestId("deck-open")).toHaveAttribute("data-due", "1");
  await page.getByTestId("deck-open").click();
  await expect(page.getByTestId("deck")).toBeVisible();
  const deckPanel = page.getByTestId("challenge-panel");
  await expect(deckPanel).toBeVisible();
  await answerInUi(page, ch, "right");
  await expect(page.getByTestId("result")).toContainText(/correct|נכון/i);
  await page.getByTestId("challenge-close").click();
  await expect(page.getByTestId("practice-done")).toBeVisible();
  await expect(page.getByTestId("practice-score")).toContainText("1");

  // answered right on the first try → it comes back later, not now
  await page.goto("/");
  await expect(page.getByTestId("deck-open")).toHaveAttribute("data-due", "0");
  await page.getByTestId("deck-open").click();
  await expect(page.getByTestId("deck-empty")).toBeVisible();
  expect(errors).toEqual([]);
});

test("vibration can be switched off in settings and the choice is kept", async ({ page }) => {
  await page.goto("/#/settings");
  const box = page.getByRole("checkbox", { name: /vibration|רטט/i });
  await expect(box).toBeChecked();
  await box.uncheck();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /vibration|רטט/i })).not.toBeChecked();
});

test("the app never requests Unity files or any network resource, even when asked for the Unity renderer", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("http://127.0.0.1:4173/") && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) requested.push(r.url()); });
  const unity: string[] = [];
  page.on("request", (r) => { if (/unity|\/api\//i.test(new URL(r.url()).pathname)) unity.push(r.url()); });
  await page.goto("/?renderer=unity#/create");
  await page.locator("#subject").fill("Fractions");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toBeVisible();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1", undefined, { timeout: 60_000 });
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-renderer", "three"); // the built-in 3D renderer is what runs
  await expect(page.getByTestId("unity-canvas")).toHaveCount(0);
  expect(unity).toEqual([]);
  expect(requested).toEqual([]);
});

// Written for round-1 QA ("challenge panel on a landscape phone"); NOT run by the author of the change - the integrator runs it.
for (const vp of [{ width: 915, height: 412 }, { width: 390, height: 844 }]) {
  test(`challenge panel at ${vp.width}x${vp.height}: close X works by real touch after a wrong answer, answers are reachable`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByTestId("mobile-new").click();
    await page.locator("#subject").fill("Plants");
    await page.locator("#material").fill(NOTES);
    await page.getByTestId("mobile-create-submit").click();
    await expect(page.getByTestId("play-root")).toBeVisible();
    await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
    const gameId = page.url().split("/play/")[1]!;
    const spec = await storedSpec(page, gameId);
    const snap = await snapshot(page);
    const area = spec.areas.find((a) => a.id === snap.client.areaId)!;
    const st = area.stations.find((s) => s.kind === "challenge" && challengeOf(spec, s.challengeId!).type === "choice")!;
    await goNear(page, "station", st.id);
    await page.getByTestId("interact-prompt").tap();
    const panel = page.getByTestId("challenge-panel");
    await expect(panel).toBeVisible();

    // the panel fits the viewport and its close X is a >=44px target
    const pb = (await panel.boundingBox())!;
    expect(pb.y).toBeGreaterThanOrEqual(0);
    expect(pb.y + pb.height).toBeLessThanOrEqual(vp.height + 0.5);
    const x = page.getByTestId("challenge-x");
    const xb = (await x.boundingBox())!;
    expect(xb.width).toBeGreaterThanOrEqual(44);
    expect(xb.height).toBeGreaterThanOrEqual(44);

    // every answer can be scrolled to; while one is hidden a scroll cue is shown
    const options = panel.locator('[role="radio"]');
    const n = await options.count();
    expect(n).toBeGreaterThanOrEqual(2);
    const body = page.getByTestId("challenge-body");
    const hidden = await body.evaluate((el) => el.scrollHeight > el.clientHeight + 4);
    if (hidden) await expect(page.getByTestId("challenge-scroll-cue")).toBeVisible();
    await options.nth(n - 1).scrollIntoViewIfNeeded();
    const last = (await options.nth(n - 1).boundingBox())!;
    const foot = (await panel.locator("footer").boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(foot.y + 1); // not behind the footer

    // pick a wrong answer fast, check, and immediately tap the X with a real touch (the panel must not be mid-shake)
    const ch = challengeOf(spec, (await panel.getAttribute("data-challenge"))!);
    await answerInUi(page, ch, "wrong");
    await expect(page.getByTestId("result")).toBeVisible();
    const box = (await x.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(panel).toBeHidden();
    await ctx.close();
  });
}
