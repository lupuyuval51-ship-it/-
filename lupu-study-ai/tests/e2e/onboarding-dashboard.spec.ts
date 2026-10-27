import { expect, test } from "@playwright/test";
import { collectErrors, seed, storeData } from "./helpers";

test.describe("הקמה ודשבורד", () => {
  test("משתמש חדש עובר הקמה, ורואה דשבורד ריק אמיתי (בלי מספרים מומצאים)", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, null);
    await page.goto("/");
    await page.waitForURL("**/onboarding");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("LUPU Study AI");

    // ולידציה: אי אפשר להמשיך בלי שם
    await page.getByTestId("onboarding-next").click();
    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("איך לקרוא לך");

    await page.locator("#name").fill("נועה");
    await page.getByTestId("onboarding-next").click(); // כיתה
    await page.getByRole("radio", { name: /כיתה ט׳/ }).click();
    await page.getByTestId("onboarding-next").click(); // מקצועות
    // מבטלים את כל המקצועות ואז הודעת שגיאה
    for (const name of ["מתמטיקה", "אנגלית", "עברית", "מדעים"]) await page.getByRole("checkbox", { name }).click();
    await page.getByTestId("onboarding-next").click();
    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("לפחות מקצוע אחד");
    await page.getByRole("checkbox", { name: "מתמטיקה" }).click();
    await page.getByRole("checkbox", { name: "תנ\"ך" }).click();
    await page.getByTestId("onboarding-next").click(); // מטרות
    await page.getByRole("checkbox", { name: /שיעורי בית/ }).click();
    await page.getByTestId("onboarding-next").click(); // זמן
    await page.getByRole("radio", { name: /45/ }).click();
    await page.getByTestId("onboarding-next").click();

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("נועה");
    await expect(page.getByText("בואו נתחיל!")).toBeVisible();
    // אין באנר דמו, אין מספרים מומצאים
    await expect(page.getByText("מצב דמו")).toHaveCount(0);
    await expect(page.getByText("0 דק׳").first()).toBeVisible();
    await expect(page.getByText("יעד: 45 דקות")).toBeVisible();

    // נשמר גם אחרי רענון
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("נועה");
    const data = await storeData(page);
    expect(data.profile).toMatchObject({ displayName: "נועה", grade: 9, dailyMinutes: 45, isPrivate: true, onboarded: true });
    expect(data.subjects.map((s: { key?: string }) => s.key).sort()).toEqual(["bible", "math"].sort());
    expect(errors).toEqual([]);
  });

  test("נתוני דמו מסומנים בבירור ונמחקים בלחיצה", async ({ page }) => {
    const errors = collectErrors(page);
    const { onboarded } = await import("./helpers");
    await seed(page, onboarded());
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "טען נתוני דמו" }).click();
    await expect(page.getByText("מצב דמו: חלק מהנתונים")).toBeVisible();
    await expect(page.getByTestId("exam-countdown")).toContainText("9");
    await expect(page.getByText("תרגילי משוואות – עמ׳ 45").first()).toBeVisible();

    await page.goto("/settings#demo");
    await page.getByRole("button", { name: "הסר נתוני דמו" }).click();
    await page.getByRole("button", { name: "הסרה" }).click();
    await page.goto("/dashboard");
    await expect(page.getByText("מצב דמו: חלק מהנתונים")).toHaveCount(0);
    await expect(page.getByText("בואו נתחיל!")).toBeVisible();
    const data = await storeData(page);
    expect(data.homework).toHaveLength(0);
    expect(data.meta.demoLoaded).toBe(false);
    expect(errors).toEqual([]);
  });

  test("הדשבורד מציג נתונים מהפעילות האמיתית שנשמרה", async ({ page }) => {
    const { onboarded, today, addDays } = await import("./helpers");
    const R = await import("@/services/data/reducers");
    const d = onboarded((x) => {
      let n = R.addHomework(x, { subjectId: x.subjects[0].id, title: "משימה באיחור", description: "", dueDate: addDays(today(), -2), priority: "high" }).data;
      n = R.addExam(n, { subjectId: n.subjects[0].id, title: "מבחן גיאומטריה", date: addDays(today(), 5), topics: ["משולשים"], materialIds: [], minutesPerDay: 30 }).data;
      n = R.recordSession(n, { subjectId: n.subjects[0].id, minutes: 20, plannedMinutes: 25, kind: "focus", completed: true }).data;
      return n;
    });
    await seed(page, d);
    await page.goto("/dashboard");
    await expect(page.getByText("משימה באיחור").first()).toBeVisible();
    await expect(page.getByTestId("exam-countdown")).toContainText("5");
    await expect(page.getByText("מבחן גיאומטריה").first()).toBeVisible();
    await expect(page.getByText("20 דק׳").first()).toBeVisible();
    await expect(page.getByText("יעד: 30 דקות")).toBeVisible();
  });
});
