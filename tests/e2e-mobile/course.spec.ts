import { expect, test, type Page } from "@playwright/test";
import type { GameSpec } from "@/lib/game/spec/schema";

/**
 * The learning path: the home screen leads to the course, the course starts its next chapter on the phone (no network),
 * the chapter game opens with the lesson boards before the questions, and coming back shows the chapter in progress.
 */

async function storedSpec(page: Page, gameId: string): Promise<GameSpec> {
  return page.evaluate((id) => JSON.parse(localStorage.getItem(`levelup.offline.game.${id}`)!).spec, gameId);
}

function seed(page: Page, locale: "he" | "en") {
  return page.addInitScript((l) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.clear();
    localStorage.setItem("levelup.mobile.settings", JSON.stringify({ locale: l, region: "IL", setupDone: true, interests: ["math"] }));
    localStorage.setItem("levelup.mobile.welcome", "1");
  }, locale);
}

test("home → path → chapter 1 starts with the lesson; back on the path it is in progress (Hebrew, offline)", async ({ page, context, baseURL }) => {
  const own = new URL(baseURL!).origin;
  await context.route((url) => url.origin !== own, (route) => route.abort());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, "he");
  await page.goto("/#/");

  const card = page.getByTestId("course-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("שברים, מספרים עשרוניים ואחוזים");
  await expect(card).toContainText("0 מתוך 9 פרקים הושלמו");
  await expect(card).toContainText("הבא בתור: פרק 1");
  await card.click();

  await expect(page.getByTestId("mobile-course")).toBeVisible();
  await expect(page.getByTestId("course-audience")).toContainText("כיתות ה׳–ו׳");
  await expect(page.getByTestId("course-chapter")).toHaveCount(9);
  await expect(page.getByTestId("course-chapter").first()).toContainText("פרק 1: מהו שבר?");
  await expect(page.getByTestId("course-source")).toContainText("לא בינה מלאכותית");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // every chapter's button is a real touch target
  for (const b of await page.getByTestId("chapter-start").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);

  await page.getByTestId("course-next-start").click();
  await page.waitForURL(/#\/play\/[\w-]+$/, { timeout: 30_000 });
  const gameId = page.url().split("/play/")[1]!;
  const spec = await storedSpec(page, gameId);
  expect(spec.meta.generator).toMatchObject({ kind: "catalog", templateId: "course-fractions-1" });
  expect(spec.meta.difficulty).toBe("beginner");
  expect(spec.meta.language).toBe("he");
  // the lesson boards stand in the first area, and the lesson mission comes before every question
  const boards = spec.areas[0]!.stations.filter((s) => s.kind === "lore").map((s) => s.id);
  expect(boards).toEqual(expect.arrayContaining(["s-1-lesson-1", "s-1-example"]));
  expect(spec.missions[0]!.id).toBe("m-1-0");
  expect(spec.missions[1]!.requires).toContain("m-1-0");
  await expect(page.getByTestId("play-root")).toBeVisible();

  await page.goto("/#/course/fractions-5-6");
  const first = page.getByTestId("course-chapter").first();
  await expect(first.getByTestId("chapter-status")).toHaveText("באמצע");
  await expect(page.getByTestId("course-next-start")).toHaveText(/להמשיך את פרק 1/);
  // continuing opens the same game, not a new one
  await page.getByTestId("course-next-start").click();
  await page.waitForURL(new RegExp(`#/play/${gameId}$`));
  expect(errors).toEqual([]);
});

test("in English the path and its chapters are in English, and an unknown course says so", async ({ page }) => {
  await seed(page, "en");
  await page.goto("/#/course/fractions-5-6");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fractions, decimals and percentages");
  await expect(page.getByTestId("course-chapter").nth(8)).toContainText("Chapter 9: Percentages");
  await expect(page.getByTestId("course-next")).toContainText("Next: chapter 1");
  await page.goto("/#/course/nope");
  await expect(page.getByTestId("course-missing")).toBeVisible();
});
