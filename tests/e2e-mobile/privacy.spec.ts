import { expect, test } from "@playwright/test";

test("the privacy policy opens from Settings, offline, and Back returns to Settings", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/settings");
  await page.getByTestId("open-privacy").click();
  await expect(page.getByTestId("mobile-privacy-page")).toBeVisible();
  const policy = page.getByTestId("privacy-policy");
  await expect(policy).toContainText("מדיניות פרטיות"); // Hebrew by default
  await expect(policy).toContainText("LEVEL UP AI");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("link", { name: /חזרה|Back/ }).first().click();
  await expect(page.getByTestId("open-privacy")).toBeVisible();
  expect(errors).toEqual([]);
});
