import { expect, test } from "@playwright/test";
import * as R from "@/services/data/reducers";
import { KEY, defaultFocus } from "@/services/learning/focus";
import { addDays, collectErrors, onboarded, seed, storeData, today } from "./helpers";

const NL = "[role=alert]:not(#__next-route-announcer__)";

test.describe("כרטיסיות", () => {
  test("יצירה, היפוך, ידעתי / לא ידעתי, חזרה מרווחת ושמירה", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/flashcards");
    await expect(page.getByText("אין עדיין כרטיסיות")).toBeVisible();

    const create = async (front: string, back: string) => {
      await page.getByRole("button", { name: "כרטיסייה חדשה" }).first().click();
      await page.getByRole("button", { name: "שמירה", exact: true }).click();
      await expect(page.locator(NL)).toContainText("יש למלא שאלה ותשובה");
      await page.getByLabel("שאלה (צד קדמי)").fill(front);
      await page.getByLabel("תשובה (צד אחורי)").fill(back);
      await page.getByRole("button", { name: "שמירה", exact: true }).click();
    };
    await create("כמה זה 2+2?", "4");
    await create("בירת צרפת?", "פריז");
    await expect(page.getByText("2 כרטיסיות מוכנות לחזרה")).toBeVisible();

    await page.getByRole("button", { name: "התחל סבב חזרה" }).click();
    const card = page.getByTestId("flashcard");
    // לפני ההיפוך אי אפשר לענות
    await expect(page.getByRole("button", { name: "ידעתי", exact: true })).toBeDisabled();
    await card.click();
    await expect(page.getByRole("button", { name: "ידעתי", exact: true })).toBeEnabled();
    await page.keyboard.press("1"); // מקלדת: 1 = ידעתי
    // הכרטיסייה הבאה: לא ידעתי → חוזרת לאותו מפגש
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: "לא ידעתי" }).click();
    await expect(page.getByText("נותרו 1")).toBeVisible();
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: "ידעתי", exact: true }).click();
    await expect(page.getByTestId("cards-done")).toContainText("ידעת 2 · לא ידעת 1");

    const data = await storeData(page);
    const known = data.flashcards.find((c: { front: string }) => c.front === "כמה זה 2+2?");
    expect(known).toMatchObject({ attempts: 1, successes: 1, intervalDays: 1, due: addDays(today(), 1) });
    expect(data.flashcards.find((c: { front: string }) => c.front === "בירת צרפת?")).toMatchObject({ attempts: 2, successes: 1, lapses: 1 });
    expect(data.flashcardReviews).toHaveLength(3);

    // אחרי הסבב אין כרטיסיות לחזרה, ושמירה אחרי רענון
    await page.reload();
    await expect(page.getByText("אין כרטיסיות לחזרה כרגע")).toBeVisible();

    // ניהול: עריכה ומחיקה
    await page.getByRole("tab", { name: /ניהול/ }).click();
    await page.getByRole("button", { name: "עריכת כרטיסייה" }).first().click();
    await page.getByLabel("תשובה (צד אחורי)").fill("ארבע");
    await page.getByRole("button", { name: "שמירה", exact: true }).click();
    await expect(page.getByText("ארבע")).toBeVisible();
    await page.getByRole("button", { name: "מחיקת כרטיסייה" }).first().click();
    await page.getByRole("button", { name: "מחיקה", exact: true }).click();
    expect((await storeData(page)).flashcards).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test("כרטיסיות קשות מופיעות בתדירות גבוהה יותר (קודם בתור)", async ({ page }) => {
    const d = onboarded((x) => {
      let n = R.addFlashcards(x, [
        { subjectId: null, topic: "", front: "קלה", back: "א", source: "manual" },
        { subjectId: null, topic: "", front: "קשה", back: "ב", source: "manual" },
      ]).data;
      const hard = n.flashcards.find((c) => c.front === "קשה")!;
      for (let i = 0; i < 4; i++) n = R.reviewFlashcard(n, hard.id, false).data; // מורידים ease
      return n;
    });
    await seed(page, d);
    await page.goto("/flashcards");
    await page.getByRole("button", { name: "התחל סבב חזרה" }).click();
    await expect(page.getByTestId("flashcard")).toContainText("קשה");
  });
});

test.describe("מצב ריכוז", () => {
  test("פומודורו: התחלה, השהיה, המשך, מעבר להפסקה, סיום ושמירת זמן לימוד", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.clock.install({ time: new Date() });
    await page.goto("/focus");
    await expect(page.getByTestId("focus-preview")).toHaveText("25:00");
    await page.getByLabel("משך ריכוז מותאם אישית").fill("25");
    await page.getByTestId("focus-start").click();
    await expect(page.getByTestId("focus-overlay")).toBeVisible();

    await page.clock.fastForward("10:00");
    await expect(page.getByTestId("focus-clock")).toHaveText(/1[45]:\d\d/);
    await page.getByTestId("focus-pause").click();
    const paused = await page.getByTestId("focus-clock").innerText();
    await page.clock.fastForward("05:00"); // בהשהיה הזמן לא עובר
    await expect(page.getByTestId("focus-clock")).toHaveText(paused);
    await page.getByTestId("focus-resume").click();
    await page.clock.fastForward("15:00"); // מסיים את מחזור הריכוז → הפסקה
    await expect(page.getByTestId("focus-overlay")).toContainText("הפסקה");
    await page.getByTestId("focus-finish").click();
    await expect(page.getByTestId("focus-summary")).toContainText("25 דק׳");

    const data = await storeData(page);
    expect(data.studySessions).toHaveLength(1);
    expect(data.studySessions[0]).toMatchObject({ kind: "focus", completed: true });
    expect(data.studySessions[0].minutes).toBeGreaterThanOrEqual(24);
    expect(data.xpEvents.some((e: { dedupeKey: string }) => e.dedupeKey.startsWith("session:"))).toBe(true);
    await page.getByRole("dialog").getByRole("button", { name: "סגירה", exact: true }).last().click();
    await expect(page.getByText("זמן לימוד היום")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("הטיימר שורד רענון, והגדרות 45/10 מותאמות אישית", async ({ page }) => {
    await seed(page, onboarded());
    await page.addInitScript(([key, payload]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, payload); }, [KEY, JSON.stringify({ ...defaultFocus(), focusMinutes: 45, breakMinutes: 10, status: "running", segmentStart: Date.now() - 10 * 60_000, startedAt: new Date().toISOString() })]);
    await page.goto("/focus");
    await expect(page.getByTestId("focus-overlay")).toBeVisible();
    await expect(page.getByTestId("focus-clock")).toHaveText(/3[45]:\d\d/);
    await page.reload();
    await expect(page.getByTestId("focus-clock")).toHaveText(/3[45]:\d\d/);
    await page.getByTestId("focus-finish").click();
    await expect(page.getByTestId("focus-summary")).toContainText("10 דק׳");
  });

  test("מפגש קצר מדקה לא נשמר; זמן ידני נשמר ללא XP", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/focus");
    await page.getByTestId("focus-start").click();
    await page.getByTestId("focus-finish").click();
    await expect(page.getByText("המפגש היה קצר מדקה")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה", exact: true }).last().click();
    expect((await storeData(page)).studySessions).toHaveLength(0);

    await page.getByRole("button", { name: "זמן לימוד ידני" }).click();
    await page.getByLabel("דקות").fill("0");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator(NL)).toContainText("בין 1 ל-600");
    await page.getByLabel("דקות").fill("40");
    await page.getByRole("button", { name: "שמירה" }).click();
    const data = await storeData(page);
    expect(data.studySessions).toHaveLength(1);
    expect(data.xpEvents).toHaveLength(0);
  });
});

test.describe("לוח שנה", () => {
  test("אירוע: יצירה, תצוגת חודש ושבוע, עריכה ומחיקה; שיעורי בית מוצגים אוטומטית", async ({ page }) => {
    const errors = collectErrors(page);
    const d = onboarded((x) => R.addHomework(x, { subjectId: null, title: "משימה ביומן", description: "", dueDate: today(), priority: "low" }).data);
    await seed(page, d);
    await page.goto("/calendar");
    await page.getByRole("button", { name: "אירוע חדש" }).click();
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator(NL)).toContainText("כותרת");
    await page.getByLabel("כותרת").fill("מפגש לימוד קבוצתי");
    await page.getByLabel("שעת התחלה").fill("17:00");
    await page.getByLabel("שעת סיום").fill("16:00");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator(NL)).toContainText("אחרי שעת ההתחלה");
    await page.getByLabel("שעת סיום").fill("18:00");
    await page.getByRole("button", { name: "שמירה" }).click();

    await expect(page.getByRole("gridcell", { name: /[12] אירועים/ }).first()).toBeVisible();
    await page.getByRole("tab", { name: "שבוע" }).click();
    await expect(page.getByText("מפגש לימוד קבוצתי").first()).toBeVisible();
    await expect(page.getByText("משימה ביומן").first()).toBeVisible();

    await page.getByText("מפגש לימוד קבוצתי").first().click();
    await page.getByRole("button", { name: "עריכה" }).click();
    await page.getByLabel("כותרת").fill("מפגש מעודכן");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByText("מפגש מעודכן").first()).toBeVisible();

    await page.reload();
    await page.getByRole("tab", { name: "שבוע" }).click();
    await page.getByText("מפגש מעודכן").first().click();
    await page.getByRole("button", { name: "מחיקה" }).click();
    expect((await storeData(page)).calendarEvents.filter((e: { title: string }) => e.title.includes("מפגש"))).toHaveLength(0);
    expect(errors).toEqual([]);
  });

  test("מערכת שעות שבועית ניתנת לעריכה ושורדת רענון", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/calendar");
    await page.getByRole("tab", { name: "מערכת שעות" }).click();
    await expect(page.getByText("אין עדיין מערכת שעות")).toBeVisible();
    await page.getByRole("button", { name: "שיעור" }).click();
    await page.getByLabel("יום", { exact: true }).selectOption("1");
    await page.getByLabel("התחלה").fill("09:00");
    await page.getByLabel("סיום").fill("09:45");
    await page.getByLabel("מקצוע", { exact: true }).selectOption({ label: "מתמטיקה" });
    await page.getByLabel("כיתה / חדר").fill("12");
    await page.getByRole("button", { name: "שמירה" }).click();
    await page.reload();
    await page.getByRole("tab", { name: "מערכת שעות" }).click();
    await expect(page.getByText("09:00–09:45 · 12")).toBeVisible();
    await page.getByText("09:00–09:45 · 12").click();
    await page.getByLabel("סיום").fill("08:00");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator(NL)).toContainText("אחרי שעת ההתחלה");
    await page.getByRole("button", { name: "מחיקה" }).click();
    expect((await storeData(page)).timetable).toHaveLength(0);
  });

  test("מנוע התכנון מציע מפגש למבחן בלי תוכנית, עם נימוק, ומוסיף ליומן", async ({ page }) => {
    const d = onboarded((x) => R.addExam(x, { subjectId: x.subjects[0].id, title: "מבחן קרוב", date: addDays(today(), 5), topics: ["א"], materialIds: [], minutesPerDay: 30 }).data);
    await seed(page, d);
    await page.goto("/calendar");
    const block = page.getByTestId("study-blocks");
    await expect(block).toContainText("הכנה: מבחן קרוב");
    await expect(block).toContainText("למה?");
    await block.getByRole("button", { name: "הוסף ליומן" }).click();
    await expect(block).toHaveCount(0); // ההצעה נעלמת אחרי ההוספה
    expect((await storeData(page)).calendarEvents.some((e: { kind: string; title: string }) => e.kind === "session" && e.title === "הכנה: מבחן קרוב")).toBe(true);
  });
});
