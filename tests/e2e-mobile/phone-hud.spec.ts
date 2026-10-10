import { expect, test } from "@playwright/test";

const HE = `פוטוסינתזה: התהליך שבו צמחים הופכים אור לאנרגיה כימית.
כלורופיל: הצבען הירוק בעלים שקולט אור.
פיוניות: נקבוביות קטנות בעלה שמאפשרות כניסה ויציאה של גזים.
קסילם: הרקמה שמובילה מים מהשורשים לצמח.
פלואם: הרקמה שמובילה סוכר בצמח.
גלוקוז: הסוכר שהצמחים מייצרים בפוטוסינתזה.`;

const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1;

test("Hebrew phone: the top bar has no overlaps, the score reads in the right order, missions start folded, reduced motion follows the device", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/create");
  await page.locator("#subject").fill("פוטוסינתזה");
  await page.locator("#material").fill(HE);
  await page.getByTestId("mobile-create-submit").click();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1", undefined, { timeout: 60_000 });

  // score: "0/580" order even in right-to-left text
  const score = page.getByTestId("score");
  await expect(score).toHaveAttribute("dir", "ltr");
  const text = (await score.innerText()).replace(/\s+/g, "");
  expect(text).toMatch(/^0\/\d+$/);

  // no two top-bar controls overlap, and all stay inside the screen
  const vw = page.viewportSize()!.width;
  const boxes = [] as { x: number; y: number; width: number; height: number }[];
  for (const loc of [page.getByRole("link", { name: /Back|חזרה/ }).first(), page.getByTestId("area-name").locator("xpath=.."), score.locator("xpath=.."), page.getByTestId("pause-button")]) {
    const b = (await loc.boundingBox())!;
    expect(b, "top bar control is visible").not.toBeNull();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(vw + 0.5);
    boxes.push(b);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i]!, boxes[j]!), `top bar controls ${i} and ${j} overlap`).toBe(false);

  // the mission list is folded on a phone so the world stays visible
  await expect(page.getByTestId("missions")).toHaveCount(0);

  // "reduce motion" starts on because the device asks for it, and can be changed in the pause menu
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-reduce-motion", "1");
  await page.getByTestId("pause-button").click();
  const toggle = page.getByTestId("motion-toggle");
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-reduce-motion", "0");
});

test("library card of a game in progress shows a real percentage, never a raw template", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#subject").fill("Fractions");
  await page.getByTestId("mobile-create-submit").click();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1", undefined, { timeout: 60_000 });
  await page.goto("/#/");
  const card = page.getByTestId("mobile-game");
  await expect(card).toBeVisible();
  const text = await card.innerText();
  expect(text).not.toMatch(/[{}]/);
  expect(text).toMatch(/0%/);
});
