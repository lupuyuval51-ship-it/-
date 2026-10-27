import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import * as R from "@/services/data/reducers";
import { addDays, onboarded, seed, today } from "./helpers";

test.describe("PWA", () => {
  test("manifest תקין, אייקונים נגישים, ו-Service Worker פעיל עם מצב לא מקוון", async ({ page, request, context }) => {
    const m = await (await request.get("/manifest.webmanifest")).json();
    expect(m).toMatchObject({ name: "LUPU Study AI", lang: "he", dir: "rtl", display: "standalone", start_url: "/dashboard" });
    for (const icon of m.icons) {
      const r = await request.get(icon.src);
      expect(r.status(), icon.src).toBe(200);
    }
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

    await seed(page, onboarded());
    await page.goto("/dashboard");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // אחרי הרענון ה-SW שולט בדף
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("נועה");
    // דף שלא נשמר במטמון: מסך "אין חיבור" ייעודי
    await page.goto("/never-visited-page");
    await expect(page.getByRole("heading", { name: "אין חיבור לאינטרנט" })).toBeVisible();
    await context.setOffline(false);
  });
});

const PAGES = ["/dashboard", "/tutor", "/subjects", "/homework", "/exams", "/scan", "/library", "/summaries", "/flashcards", "/calendar", "/focus", "/progress", "/achievements", "/settings"];

const rich = () =>
  onboarded((d) => {
    let n = R.addHomework(d, { subjectId: d.subjects[0].id, title: "משימה", description: "תיאור", dueDate: addDays(today(), 1), priority: "high" }).data;
    n = R.addExam(n, { subjectId: n.subjects[0].id, title: "מבחן", date: addDays(today(), 5), topics: ["א"], materialIds: [], minutesPerDay: 30 }).data;
    n = R.addFlashcards(n, [{ subjectId: n.subjects[0].id, topic: "א", front: "שאלה", back: "תשובה", source: "manual" }]).data;
    n = R.recordSession(n, { subjectId: n.subjects[0].id, minutes: 30, plannedMinutes: 30, kind: "focus", completed: true }).data;
    return n;
  });

for (const theme of ["light", "dark"] as const) {
  test.describe(`נגישות (${theme})`, () => {
    test("אין הפרות axe חמורות במסכים המרכזיים", async ({ page }) => {
      await seed(page, rich());
      await page.addInitScript((t) => localStorage.setItem("lupu:theme", t), theme);
      const failures: string[] = [];
      for (const path of PAGES) {
        await page.goto(path);
        await page.locator("main").waitFor();
        await page.waitForTimeout(500);
        const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        for (const v of res.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
          failures.push(`${path} [${v.id}] ${v.help} → ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
        }
      }
      expect(failures).toEqual([]);
    });
  });
}

test("ניווט מקלדת: קישור דילוג לתוכן, ומיקוד גלוי על כפתורים", async ({ page }) => {
  await seed(page, onboarded());
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "דלג לתוכן הראשי" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  // כל הכפתורים והקישורים בעלי שם נגיש
  const unnamed = await page.evaluate(() => [...document.querySelectorAll("button, a[href]")].filter((e) => !(e.getAttribute("aria-label") || e.textContent?.trim() || e.getAttribute("title"))).length);
  expect(unnamed).toBe(0);
});
