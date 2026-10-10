import { expect, test } from "@playwright/test";

/* Written, not run, in the authoring worktree: the integrator runs Playwright. */

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

for (const [name, size] of [["landscape phone", { width: 915, height: 412 }], ["portrait phone", { width: 390, height: 844 }]] as const) {
  test(`pause menu is fully reachable on a ${name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/#/create");
    await page.locator("#subject").fill("Plants");
    await page.locator("#material").fill(NOTES);
    await page.getByTestId("mobile-create-submit").click();
    await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1", undefined, { timeout: 60_000 });
    await page.getByTestId("pause-button").click();
    const menu = page.getByTestId("pause-menu");
    await expect(menu).toBeVisible();

    const box = (await menu.boundingBox())!;
    expect(box.y, "dialog top edge is on screen").toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, "dialog bottom edge is on screen").toBeLessThanOrEqual(size.height + 0.5);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width + 0.5);
    expect((await menu.getByRole("heading").boundingBox())!.y).toBeGreaterThanOrEqual(0);

    // every action is reachable and, in landscape, the three buttons share one row at equal width
    const widths: number[] = [];
    for (const id of ["resume-button", "restart-button", "exit-link"]) {
      const el = page.getByTestId(id);
      await el.scrollIntoViewIfNeeded();
      await expect(el).toBeInViewport();
      widths.push((await el.boundingBox())!.width);
    }
    if (size.width > size.height) for (const w of widths) expect(Math.abs(w - widths[0]!)).toBeLessThan(2);
  });
}
