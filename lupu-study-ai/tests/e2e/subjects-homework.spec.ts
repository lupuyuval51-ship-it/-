import { expect, test } from "@playwright/test";
import { addDays, collectErrors, onboarded, seed, storeData, today } from "./helpers";

test.describe("מקצועות", () => {
  test("הוספה, עריכה ומחיקה של מקצוע ונושא אישיים, ושמירה אחרי רענון", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/subjects");
    await expect(page.getByRole("heading", { name: "מתמטיקה", level: 2 })).toBeVisible();

    await page.getByRole("button", { name: "מקצוע אישי" }).click();
    await page.getByLabel("שם המקצוע").fill("מוזיקה");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { name: "מוזיקה", level: 2 })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "מוזיקה", level: 2 })).toBeVisible();

    await page.getByRole("heading", { name: "מוזיקה", level: 2 }).locator("xpath=ancestor::li").getByRole("link", { name: "פתח מקצוע" }).click();
    await page.getByLabel("שם נושא חדש").fill("סולפז׳");
    await page.getByRole("button", { name: "הוסף", exact: true }).click();
    await expect(page.getByText("סולפז׳")).toBeVisible();
    await page.getByRole("button", { name: "עריכת סולפז׳" }).click();
    await page.getByLabel("שם הנושא").fill("סולפז׳ בסיסי");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByText("סולפז׳ בסיסי")).toBeVisible();
    await page.getByRole("button", { name: "מחיקת סולפז׳ בסיסי" }).click();
    await expect(page.getByText("סולפז׳ בסיסי")).toHaveCount(0);

    // מחיקת המקצוע
    await page.getByRole("button", { name: "מחיקת מקצוע" }).click();
    await page.getByRole("button", { name: "מחיקה", exact: true }).click();
    await page.waitForURL("**/subjects");
    await expect(page.getByRole("heading", { name: "מוזיקה", level: 2 })).toHaveCount(0);
    const data = await storeData(page);
    expect(data.subjects.some((s: { name: string }) => s.name === "מוזיקה")).toBe(false);
    expect(errors).toEqual([]);
  });

  test("אחוז שליטה מוצג רק כשיש נתונים אמיתיים", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/subjects");
    await expect(page.getByText("אין עדיין נתונים").first()).toBeVisible();
  });
});

test.describe("שיעורי בית", () => {
  test("יצירה, סינון לפי מצב ומקצוע, השלמה עם XP פעם אחת, עריכה ומחיקה", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/homework");
    await expect(page.getByText("אין עדיין שיעורי בית")).toBeVisible();

    const list = page.locator("ul.space-y-3");
    const add = async (title: string, due: string, subject: string, prio: string) => {
      await page.getByRole("button", { name: "משימה חדשה" }).first().click();
      await page.getByLabel("כותרת").fill(title);
      await page.getByLabel("תאריך הגשה").fill(due);
      await page.getByLabel("מקצוע", { exact: true }).selectOption({ label: subject });
      await page.getByLabel("עדיפות").selectOption(prio);
      await page.getByRole("button", { name: "שמירה" }).click();
      await expect(list.getByText(title)).toBeVisible();
    };
    // ולידציה
    await page.getByRole("button", { name: "משימה חדשה" }).first().click();
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("כותרת");
    await page.getByRole("button", { name: "ביטול" }).click();

    await add("תרגילי משוואות", addDays(today(), -1), "מתמטיקה", "high");
    await add("Vocabulary", today(), "אנגלית", "medium");
    await add("בעיות מילוליות", addDays(today(), 3), "מתמטיקה", "low");

    await expect(page.getByRole("region", { name: "תזכורות" })).toContainText("תרגילי משוואות");
    await page.getByRole("tab", { name: /באיחור/ }).click();
    await expect(list.getByText("תרגילי משוואות")).toBeVisible();
    await expect(list.getByText("Vocabulary")).toHaveCount(0);
    await page.getByRole("tab", { name: /להיום/ }).click();
    await expect(list.getByText("Vocabulary")).toBeVisible();
    await page.getByRole("tab", { name: /פתוחות/ }).click();
    await page.getByLabel("סינון לפי מקצוע").selectOption({ label: "אנגלית" });
    await expect(list.getByText("Vocabulary")).toBeVisible();
    await expect(list.getByText("תרגילי משוואות")).toHaveCount(0);
    await page.getByLabel("סינון לפי מקצוע").selectOption("");

    // השלמה: XP פעם אחת (גם אחרי סימון/ביטול חוזר)
    const box = page.getByRole("checkbox", { name: "סמן Vocabulary כהושלם" });
    await box.click();
    await expect(page.getByTestId("reward-xp").first()).toContainText("+15 XP");
    await page.getByRole("tab", { name: /הכול/ }).click();
    await page.getByRole("checkbox", { name: "בטל השלמה של Vocabulary" }).click();
    await page.getByRole("checkbox", { name: "סמן Vocabulary כהושלם" }).click();
    let data = await storeData(page);
    expect(data.xpEvents.filter((e: { dedupeKey: string }) => e.dedupeKey.startsWith("hw:"))).toHaveLength(1);

    await page.getByRole("tab", { name: /הושלמו/ }).click();
    await expect(list.getByText("Vocabulary")).toBeVisible();

    // עריכה ומחיקה
    await page.getByRole("tab", { name: /הכול/ }).click();
    await page.getByRole("button", { name: "עריכת בעיות מילוליות" }).click();
    await page.getByLabel("כותרת").fill("בעיות מילוליות 2");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(list.getByText("בעיות מילוליות 2")).toBeVisible();
    await page.getByRole("button", { name: "מחיקת בעיות מילוליות 2" }).click();
    await page.getByRole("button", { name: "מחיקה", exact: true }).click();
    await expect(list.getByText("בעיות מילוליות 2")).toHaveCount(0);

    await page.reload();
    data = await storeData(page);
    expect(data.homework).toHaveLength(2);
    expect(errors).toEqual([]);
  });

  test("צירוף קובץ למשימה: סוג לא מורשה נדחה, תמונה נשמרת", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/homework");
    await page.getByRole("button", { name: "משימה חדשה" }).first().click();
    await page.getByLabel("כותרת").fill("עם קובץ");
    const input = page.getByLabel("בחירת קבצים לצירוף");
    await input.setInputFiles({ name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("סוג קובץ לא נתמך");
    const { makePng } = await import("./helpers");
    await input.setInputFiles({ name: "exercise.png", mimeType: "image/png", buffer: makePng(32, [200, 30, 30]) });
    await expect(page.getByText("exercise.png")).toBeVisible();
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByText("exercise.png")).toBeVisible();
    await page.reload();
    await expect(page.getByText("exercise.png")).toBeVisible();
  });
});
