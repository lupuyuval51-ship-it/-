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

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

/** The app stores games on the device; the test reads the stored spec to know the right answers. */
async function storedSpec(page: Page, gameId: string): Promise<GameSpec> {
  return page.evaluate((id) => JSON.parse(localStorage.getItem(`levelup.offline.game.${id}`)!).spec, gameId);
}

async function waitForWorld(page: Page) {
  await expect(page.getByTestId("play-root")).toBeVisible();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
}

test("Hebrew by default, no network: build a game from notes, play a challenge, progress survives a restart", async ({ page, context, baseURL }) => {
  const errors = watchErrors(page);
  // Everything must work with the network cut off (only the local preview server answers).
  const own = new URL(baseURL!).origin;
  await context.route((url) => url.origin !== own, (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("mobile-empty")).toBeVisible();

  await page.getByTestId("mobile-new").click();
  await page.locator("#subject").fill("פוטוסינתזה");
  await page.locator("#material").fill(NOTES);
  await expect(page.getByTestId("material-preview")).toHaveAttribute("data-ok", "1");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("mobile-progress")).toBeVisible(); // the percentage meter shows while building
  await waitForWorld(page);
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "engine");

  const gameId = page.url().split("/play/")[1]!;
  const spec = await storedSpec(page, gameId);
  const snap = await snapshot(page);
  const area = spec.areas.find((a) => a.id === snap.client.areaId)!;
  const st = area.stations.find((s) => s.kind === "challenge" && ["choice", "numeric", "sequence", "match"].includes(challengeOf(spec, s.challengeId!).type))!;
  await goNear(page, "station", st.id);
  await page.getByTestId("interact-prompt").click();
  const panel = page.getByTestId("challenge-panel");
  await expect(panel).toBeVisible();
  const servedId = await panel.getAttribute("data-challenge");
  await answerInUi(page, challengeOf(spec, servedId ?? st.challengeId!), "right");
  await expect(page.getByTestId("result")).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).client.score).toBeGreaterThan(0);
  const score = (await snapshot(page)).client.score;

  // close the app and open it again: the game is listed as in progress and resumes with the same score
  await page.goto("/");
  await expect(page.getByTestId("mobile-game")).toHaveCount(1);
  await page.reload();
  await page.getByTestId("mobile-play").click();
  await waitForWorld(page);
  expect((await snapshot(page)).client.score).toBe(score);

  // results of the run so far, on the device (marked incomplete, review empty: no mistakes yet)
  await page.goto("/");
  await page.getByRole("link", { name: "תוצאות אחרונות" }).click();
  await expect(page.getByTestId("results")).toBeVisible();
  await expect(page.getByTestId("results-score")).toContainText(String(score));
  expect(errors).toEqual([]);
});

test("English, demo game without notes, settings change language and graphics tier, delete works", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/#/settings");
  await page.locator("#locale").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.locator("#tier").selectOption("C");
  await page.goto("/#/create");
  await page.locator("#subject").fill("Fractions");
  await page.getByTestId("mobile-create-submit").click();
  await waitForWorld(page);
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-tier", "C");
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "demo");
  await page.goto("/");
  await expect(page.getByTestId("badge-demo")).toBeVisible();
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByTestId("mobile-empty")).toBeVisible();
  expect(errors).toEqual([]);
});

test("notes the engine cannot use give a clear message instead of a broken game", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#subject").fill("x");
  await page.locator("#material").fill("hello there, this is not really a lesson at all ok");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("mobile-create-error")).toBeVisible();
});

test("'Try an example' fills real notes, the help explains the format, and the example builds a game", async ({ page }) => {
  await page.goto("/#/create");
  await page.getByTestId("notes-help").locator("summary").click();
  await expect(page.getByTestId("notes-help")).toContainText(/מושג: הסבר/);
  await page.getByTestId("example-notes").click();
  await expect(page.locator("#subject")).toHaveValue("מחזור המים");
  await expect(page.getByTestId("material-preview")).toHaveAttribute("data-ok", "1");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "engine", { timeout: 60_000 });
});
