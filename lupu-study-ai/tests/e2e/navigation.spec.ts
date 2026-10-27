import { expect, test } from "@playwright/test";
import { collectErrors, onboarded, seed } from "./helpers";

const ROUTES: [string, RegExp][] = [
  ["/dashboard", /בוקר טוב|צהריים טובים|ערב טוב|לילה טוב/],
  ["/tutor", /./],
  ["/subjects", /מקצועות/],
  ["/homework", /שיעורי בית/],
  ["/exams", /מבחנים/],
  ["/scan", /צלם שאלה/],
  ["/library", /ספריית חומרי לימוד/],
  ["/summaries", /סיכומים/],
  ["/flashcards", /כרטיסיות זיכרון/],
  ["/calendar", /לוח שנה/],
  ["/focus", /מצב ריכוז/],
  ["/progress", /התקדמות וסטטיסטיקות/],
  ["/achievements", /הישגים ויעדים/],
  ["/settings", /הגדרות/],
];

test("כל המסכים נטענים בלי שגיאות קונסול ובלי קישורים שבורים", async ({ page }) => {
  const errors = collectErrors(page);
  await seed(page, onboarded());
  for (const [path, heading] of ROUTES) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBeLessThan(400);
    await expect(page.locator("main h1").first(), path).toContainText(heading);
  }
  expect(errors).toEqual([]);
});

test("ניווט בתפריט הצד עובד בין כל האזורים", async ({ page }) => {
  await seed(page, onboarded());
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "תפריט ראשי" });
  const links = await nav.getByRole("link").evaluateAll((els) => els.map((e) => ({ href: (e as HTMLAnchorElement).getAttribute("href")!, text: e.textContent!.trim() })));
  expect(links.length).toBeGreaterThanOrEqual(13);
  for (const l of links) {
    await nav.getByRole("link", { name: l.text, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${l.href}$`));
    await expect(page.locator("main")).toBeVisible();
  }
});

test("כל הקישורים הפנימיים במסך הבית מובילים לדף קיים", async ({ page, request }) => {
  await seed(page, onboarded());
  await page.goto("/dashboard");
  const hrefs = await page.locator("a[href^='/']").evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!.split("?")[0].split("#")[0]))]);
  for (const h of hrefs) {
    const r = await request.get(h);
    expect(r.status(), h).toBeLessThan(400);
  }
});

test("משתמש שלא סיים הקמה מופנה להקמה בכל מסך", async ({ page }) => {
  await seed(page, null);
  await page.goto("/homework");
  await page.waitForURL("**/onboarding");
});

test("דף לא קיים מציג 404 ולא קורס", async ({ page }) => {
  const res = await page.goto("/nope-not-here");
  expect(res?.status()).toBe(404);
});

test("מצב כהה ובהיר: ההעדפה נשמרת אחרי רענון", async ({ page }) => {
  await seed(page, onboarded());
  await page.goto("/settings");
  await page.getByLabel("ערכת נושא", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByLabel("ערכת נושא", { exact: true }).selectOption("light");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
