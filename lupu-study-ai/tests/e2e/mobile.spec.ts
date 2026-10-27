import { expect, test } from "@playwright/test";
import { collectErrors, onboarded, seed } from "./helpers";

const ROUTES = ["/dashboard", "/tutor", "/subjects", "/homework", "/exams", "/scan", "/library", "/summaries", "/flashcards", "/calendar", "/focus", "/progress", "/achievements", "/settings", "/login"];

test.describe("תצוגת מובייל (אנדרואיד / אייפון)", () => {
  test("ניווט תחתון עם חמש לשוניות, ותפריט למסכים הנוספים", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/dashboard");
    const bottom = page.getByRole("navigation", { name: "ניווט תחתון" });
    await expect(bottom).toBeVisible();
    await expect(bottom.getByRole("link")).toHaveCount(5);
    await expect(page.getByRole("navigation", { name: "תפריט ראשי" })).toBeHidden(); // תפריט הצד מוסתר

    await page.getByRole("button", { name: /תפריט – כל המסכים/ }).click();
    const sheet = page.getByRole("dialog", { name: "כל המסכים" });
    await expect(sheet.getByRole("link")).toHaveCount(9);
    await sheet.getByRole("link", { name: "מצב ריכוז" }).click();
    await expect(page).toHaveURL(/\/focus$/);
    await bottom.getByRole("link", { name: "מבחנים" }).click();
    await expect(page).toHaveURL(/\/exams$/);
  });

  test("אין גלילה אופקית בשום מסך, ואין שגיאות", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    for (const path of ROUTES) {
      await page.goto(path);
      await page.locator("main, #main").first().waitFor();
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflow`).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });

  test("הקמה במובייל מתחילה ונגמרת, ויעדי מגע גדולים מספיק", async ({ page }) => {
    await seed(page, null);
    await page.goto("/");
    await page.waitForURL("**/onboarding");
    await page.locator("#name").fill("דנה");
    const next = page.getByTestId("onboarding-next");
    const box = await next.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    for (let i = 0; i < 5; i++) await next.click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("link", { name: "התחל ללמוד" })).toBeVisible();
    const small = await page.evaluate(() => [...document.querySelectorAll("a[href], button")].filter((e) => { const r = e.getBoundingClientRect(); return !e.closest(".sr-only") && !e.classList.contains("sr-only") && r.width > 0 && (r.width < 32 || r.height < 32); }).map((e) => e.getAttribute("aria-label") || e.textContent?.trim()));
    expect(small).toEqual([]);
  });

  test("מסך מבחן במובייל: מענה וניווט", async ({ page }) => {
    const R = await import("@/services/data/reducers");
    const d = onboarded((x) => {
      const n = R.addExam(x, { subjectId: x.subjects[0].id, title: "מבחן", date: "2099-01-01", topics: ["א"], materialIds: [], minutesPerDay: 30 }).data;
      return R.addQuestions(n, [{ examId: n.exams[0].id, subjectId: n.subjects[0].id, topic: "א", type: "tf", prompt: "שמיים כחולים", options: [], answerKey: "true", rubric: "", explanation: "", difficulty: 1, source: "manual" }]).data;
    });
    await seed(page, d);
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("button", { name: "התחל סימולציה" }).click();
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    await page.getByRole("radio", { name: "נכון", exact: true }).check();
    await page.getByRole("button", { name: "לסיום" }).click();
    await page.getByTestId("final-submit").click();
    await page.getByRole("button", { name: "הגשה", exact: true }).click();
    await expect(page.getByTestId("attempt-score")).toHaveText("100%");
  });

  test("אייפון SE (375×667): הדשבורד נקרא ללא גלישה", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "he-IL" });
    const page = await ctx.newPage();
    await seed(page, onboarded());
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await ctx.close();
  });
});
