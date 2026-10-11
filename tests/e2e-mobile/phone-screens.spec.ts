import { expect, test, type Page } from "@playwright/test";

/**
 * First-run and everyday screens on a small phone (360 x 640): nothing overflows sideways, every tap target is at least
 * 44 px, the welcome fits on one screen, and the library offers the right shortcuts. These are measurements on the real
 * layout, so they complement the unit tests that check the markup.
 */
test.use({ viewport: { width: 360, height: 640 } });

const MIN_TARGET = 43.5; // 44 px minus sub-pixel rounding

/** Interactive elements that are visible but shorter than a finger. */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate((min) => {
    const sel = "a[href], button, select, label:has(input[type=checkbox])";
    return [...document.querySelectorAll<HTMLElement>(sel)]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      })
      .map((el) => ({ name: (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName).trim().slice(0, 40), h: el.getBoundingClientRect().height }))
      .filter((x) => x.h < min)
      .map((x) => `${x.name} (${Math.round(x.h)}px)`);
  }, MIN_TARGET);
}

const overflowsSideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

/** Stores copies of the first game (without their runs) under the given ids, titled "Clone <id>". */
async function cloneGames(page: Page, cloneIds: string[]) {
  await page.evaluate((newIds) => {
    const P = "levelup.offline.";
    const ids: string[] = JSON.parse(localStorage.getItem(`${P}games`)!);
    const original = JSON.parse(localStorage.getItem(`${P}game.${ids[0]}`)!);
    for (const id of newIds) {
      localStorage.setItem(`${P}game.${id}`, JSON.stringify({ ...original, id, title: `Clone ${id}` }));
      ids.push(id);
    }
    localStorage.setItem(`${P}games`, JSON.stringify(ids));
  }, cloneIds);
}

test("first run: the whole welcome fits on one 360x640 screen, nothing overflows, every control is 44px", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("welcome")).toBeVisible();
  for (const step of ["what", "notes", "play"]) await expect(page.getByTestId(`welcome-step-${step}`)).toBeVisible();
  // the main action is reachable without scrolling
  const start = (await page.getByTestId("welcome-start").boundingBox())!;
  expect(start.y + start.height).toBeLessThanOrEqual(640);
  expect(await overflowsSideways(page)).toBe(false);
  expect(await smallTargets(page)).toEqual([]);

  // skipping keeps the choice and puts the screen-reader cursor on the list heading
  await page.getByTestId("welcome-skip").click();
  await expect(page.getByTestId("welcome")).toHaveCount(0);
  await expect(page.locator("#library-title")).toBeFocused();
  await expect(page.getByTestId("empty-example")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("welcome")).toHaveCount(0);
});

test("several games: continue card, filter chips, deleting names the game and keeps the cursor", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#subject").fill("Fractions");
  await page.getByTestId("mobile-create-submit").click();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1", undefined, { timeout: 60_000 });
  await cloneGames(page, ["a", "b"]); // three games in all: the continue card appears, the filter chips do not yet
  await page.goto("/#/");
  await page.reload();
  await expect(page.getByTestId("mobile-game")).toHaveCount(3);
  await expect(page.getByTestId("continue-card")).toBeVisible();
  await expect(page.getByTestId("library-filters")).toHaveCount(0);
  expect(await overflowsSideways(page)).toBe(false);
  expect(await smallTargets(page)).toEqual([]);

  await cloneGames(page, ["c"]); // four games: now the chips are offered
  await page.reload();
  await expect(page.getByTestId("mobile-game")).toHaveCount(4);
  await expect(page.getByTestId("library-filters")).toBeVisible();
  expect(await smallTargets(page)).toEqual([]);
  await page.getByTestId("filter-progress").click();
  await expect(page.getByTestId("filter-progress")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("mobile-game")).toHaveCount(1); // only the game that was started
  await page.getByTestId("filter-all").click();
  await expect(page.getByTestId("mobile-game")).toHaveCount(4);

  // delete: the confirmation names the game, a status message appears, focus moves to the list heading
  let asked = "";
  page.once("dialog", (d) => { asked = d.message(); void d.accept(); });
  await page.getByRole("button", { name: /Clone c/ }).click();
  expect(asked).toContain("Clone c");
  await expect(page.getByTestId("mobile-game")).toHaveCount(3);
  await expect(page.getByTestId("library-notice")).toBeVisible();
  await expect(page.locator("#library-title")).toBeFocused();
});

test("settings: sections, 44px controls, no sideways scroll, English switches direction", async ({ page }) => {
  await page.goto("/#/settings");
  for (const id of ["set-look", "set-feel", "set-data", "set-about"]) await expect(page.locator(`#${id}`)).toBeVisible();
  expect(await overflowsSideways(page)).toBe(false);
  expect(await smallTargets(page)).toEqual([]);
  await page.locator("#locale").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  expect(await overflowsSideways(page)).toBe(false);
  expect(await smallTargets(page)).toEqual([]);

  // "show the welcome again" opens it once; closing it clears the flag from the address so Back does not replay it
  await page.getByTestId("welcome-again").click();
  await expect(page.getByTestId("welcome")).toBeVisible();
  await page.getByTestId("welcome-skip").click();
  await expect(page.getByTestId("welcome")).toHaveCount(0);
  expect(page.url()).not.toContain("welcome=1");
});
