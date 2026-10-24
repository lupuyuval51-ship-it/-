import { expect, test } from "@playwright/test";

// Regression (round 1): the page <h1> is focused programmatically after navigation (TalkBack) and must not
// show the global teal focus ring, while real controls keep theirs.
for (const route of ["/#/settings", "/#/create"]) {
  test(`h1 has no focus outline after navigating to ${route}`, async ({ page }) => {
    await page.goto("/#/");
    await page.goto(route);
    const h1 = page.locator("main h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).toBeFocused();
    expect(await h1.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");
  });
}

test("real controls keep a visible focus ring", async ({ page }) => {
  await page.goto("/#/create");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as HTMLElement).outlineStyle);
  expect(outline).toBe("solid");
});
