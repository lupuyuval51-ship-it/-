import { expect, test } from "@playwright/test";
import * as R from "@/services/data/reducers";
import { addDays, collectErrors, onboarded, seed, storeData, today } from "./helpers";

const withBank = () =>
  onboarded((d) => {
    const subjectId = d.subjects[0].id;
    let n = R.addExam(d, { subjectId, title: "מבחן שברים", date: addDays(today(), 6), topics: ["שברים", "פיתגורס"], materialIds: [], minutesPerDay: 30 }).data;
    const examId = n.exams[0].id;
    n = R.addQuestions(n, [
      { examId, subjectId, topic: "שברים", type: "mcq", prompt: "כמה הם 25% מ-80?", options: ["10", "20", "25", "40"], answerKey: "1", rubric: "", explanation: "רבע מ-80 הוא 20.", difficulty: 1, source: "manual" },
      { examId, subjectId, topic: "פיתגורס", type: "tf", prompt: "היתר הוא הצלע הקצרה ביותר", options: [], answerKey: "false", rubric: "", explanation: "היתר הוא הארוך ביותר.", difficulty: 1, source: "manual" },
      { examId, subjectId, topic: "שברים", type: "fill", prompt: "3/4 בכתיב עשרוני: ___", options: [], answerKey: "0.75|0,75", rubric: "", explanation: "3÷4=0.75", difficulty: 2, source: "manual" },
      { examId, subjectId, topic: "פיתגורס", type: "open", prompt: "הסבר מהו יתר", options: [], answerKey: "הצלע שמול הזווית הישרה", rubric: "הגדרה נכונה - 100%", explanation: "", difficulty: 2, source: "manual" },
    ]).data;
    return n;
  });

test.describe("מבחנים", () => {
  test("יצירת מבחן, תוכנית חזרה בלוח השנה, ושמירה אחרי רענון", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/exams");
    await expect(page.getByText("אין עדיין מבחנים")).toBeVisible();
    await page.getByRole("button", { name: "מבחן חדש" }).first().click();

    // ולידציה: אין נושאים
    await page.getByLabel("תאריך המבחן").fill(addDays(today(), 6));
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("נושא אחד");

    await page.getByRole("button", { name: "שברים ואחוזים" }).click();
    await page.getByLabel("נושאים נוספים").fill("אומדן, חזקות");
    await page.getByRole("button", { name: "שמירה" }).click();
    await page.waitForURL(/\/exams\/[0-9a-f-]{36}$/);
    await expect(page.getByTestId("exam-days-left")).toContainText("6");
    await expect(page.getByText("אומדן").first()).toBeVisible();

    await page.getByRole("button", { name: "צור תוכנית חזרה" }).click();
    const first = page.getByRole("checkbox", { name: /סמן .* כהושלם/ }).first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(first).toHaveAttribute("aria-checked", "true");

    // התוכנית מופיעה בלוח השנה (בתצוגה השבועית) ונשארת אחרי רענון
    await page.goto("/calendar");
    await page.getByRole("tab", { name: "שבוע" }).click();
    await expect(page.getByText(/מבחן .*: /).first()).toBeVisible();
    await page.goto("/exams");
    await page.reload();
    await expect(page.getByText("מבחן במתמטיקה")).toBeVisible();
    const data = await storeData(page);
    expect(data.exams).toHaveLength(1);
    expect(data.exams[0].topics).toEqual(["שברים ואחוזים", "אומדן", "חזקות"]);
    expect(data.calendarEvents.filter((e: { kind: string }) => e.kind === "review").length).toBeGreaterThan(3);
    expect(errors).toEqual([]);
  });

  test("הוספת שאלות ידנית מכל הסוגים, עריכה ומחיקה", async ({ page }) => {
    const errors = collectErrors(page);
    const d = onboarded((x) => R.addExam(x, { subjectId: x.subjects[0].id, title: "מבחן", date: addDays(today(), 4), topics: ["נושא א"], materialIds: [], minutesPerDay: 30 }).data);
    await seed(page, d);
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("tab", { name: /בנק שאלות/ }).click();
    await expect(page.getByText("בנק השאלות ריק")).toBeVisible();

    await page.getByRole("button", { name: "שאלה חדשה" }).click();
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("נוסח השאלה");
    await page.getByLabel("נוסח השאלה").fill("מהו $2+3$?");
    await page.getByLabel("תשובה 1", { exact: true }).fill("4");
    await page.getByLabel("תשובה 2", { exact: true }).fill("5");
    await page.getByLabel("תשובה 3", { exact: true }).fill("6");
    await page.getByLabel("תשובה 2 היא הנכונה").check();
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByText("אמריקאית").first()).toBeVisible();

    await page.getByRole("button", { name: "שאלה חדשה" }).click();
    await page.getByLabel("סוג שאלה").selectOption("tf");
    await page.getByLabel("נוסח השאלה").fill("השמש היא כוכב");
    await page.getByLabel("התשובה הנכונה").selectOption("true");
    await page.getByRole("button", { name: "שמירה" }).click();

    await page.getByRole("button", { name: "שאלה חדשה" }).click();
    await page.getByLabel("סוג שאלה").selectOption("fill");
    await page.getByLabel("נוסח השאלה").fill("בירת ישראל: ___");
    await page.getByLabel("תשובות מקובלות").fill("ירושלים|Jerusalem");
    await page.getByRole("button", { name: "שמירה" }).click();

    await page.getByRole("button", { name: "שאלה חדשה" }).click();
    await page.getByLabel("סוג שאלה").selectOption("open");
    await page.getByLabel("נוסח השאלה").fill("הסבר את מחזור המים");
    await page.getByLabel("תשובה לדוגמה").fill("אידוי, התעבות, משקעים");
    await page.getByLabel("מחוון הערכה").fill("שלושה שלבים - 100%");
    await page.getByRole("button", { name: "שמירה" }).click();

    await page.getByRole("tab", { name: /בנק שאלות \(?4/ }).or(page.getByRole("tab", { name: /בנק שאלות/ })).click();
    await expect(page.locator("section[aria-label='בנק שאלות'] ul > li")).toHaveCount(4);
    await page.getByRole("button", { name: "מחיקת שאלה" }).first().click();
    await expect(page.locator("section[aria-label='בנק שאלות'] ul > li")).toHaveCount(3);
    const data = await storeData(page);
    expect(data.examQuestions.map((q: { type: string }) => q.type).sort()).toEqual(["fill", "open", "tf"]);
    expect(errors).toEqual([]);
  });

  test("סימולציה מלאה: ניווט, שמירת תשובות ברענון, הגשה, חישוב ציון והערכה עצמית", async ({ page }) => {
    const errors = collectErrors(page);
    const d = withBank();
    await seed(page, d);
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("button", { name: "התחל סימולציה" }).click();
    await page.getByLabel("מספר שאלות", { exact: false }).fill("4");
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    await page.waitForURL(/\/exams\/run\//);
    await expect(page.getByText(/שאלה 1 מתוך 4/)).toBeVisible();

    // עונים על כל סוג שאלה לפי הטקסט (סדר השאלות והאפשרויות מעורבב)
    const answerCurrent = async () => {
      const q = await page.getByTestId("exam-question").innerText();
      if (q.includes("25%")) await page.getByRole("radio", { name: "20", exact: true }).check();
      else if (q.includes("היתר")) await page.getByRole("radio", { name: "לא נכון" }).check(); // שגוי בכוונה? התשובה הנכונה היא "לא נכון" → נכון
      else if (q.includes("3/4")) await page.getByLabel("תשובה").fill("0,75");
      else await page.getByLabel("תשובה").fill("הצלע שמול הזווית הישרה");
    };
    for (let i = 0; i < 4; i++) {
      await answerCurrent();
      if (i === 1) {
        await page.reload(); // התשובות והמצב נשמרים אחרי רענון
        await expect(page.getByText(new RegExp(`שאלה ${i + 1} מתוך 4`))).toBeVisible();
      }
      if (i < 3) await page.getByRole("button", { name: "הבאה" }).click();
    }
    await page.getByRole("button", { name: "לסיום" }).click();
    await expect(page.getByText("ענית על 4 מתוך 4 שאלות")).toBeVisible();
    await page.getByTestId("final-submit").click();
    await page.getByRole("button", { name: "הגשה", exact: true }).click();
    await page.waitForURL(/\/exams\/attempt\//);

    // 3 שאלות נבדקו אוטומטית ונכונות (פתוחה ממתינה) → 100% על 3
    await expect(page.getByTestId("attempt-score")).toHaveText("100%");
    await expect(page.getByText(/1 שאלות פתוחות ממתינות להערכה/)).toBeVisible();
    await expect(page.getByTestId("review-item")).toHaveCount(4);

    // הערכה עצמית "לא נכון" על הפתוחה → 3/4 = 75%
    await page.getByRole("button", { name: "לא נכון", exact: true }).click();
    await expect(page.getByTestId("attempt-score")).toHaveText("75%");
    await expect(page.getByText("הערכה עצמית", { exact: true })).toBeVisible();

    // נשמר, מופיע בהתקדמות
    await page.goto("/progress");
    await expect(page.getByText("ממוצע סימולציות")).toBeVisible();
    await expect(page.getByText("75%").first()).toBeVisible();
    const data = await storeData(page);
    expect(data.examAttempts[0]).toMatchObject({ scorePercent: 75, gradedCount: 4, pendingCount: 0 });
    expect(data.practiceResults.some((p: { source: string }) => p.source === "exam")).toBe(true);
    expect(errors).toEqual([]);
  });

  test("תשובות שגויות מקבלות הסבר והמלצה לתרגול נוסף; שאלות שלא נענו נחשבות שגויות", async ({ page }) => {
    const d = withBank();
    await seed(page, d);
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("button", { name: "התחל סימולציה" }).click();
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    await page.getByTestId("to-review").click();
    await expect(page.getByText("ענית על 0 מתוך 4 שאלות")).toBeVisible();
    await page.getByTestId("final-submit").click();
    await page.getByRole("button", { name: "הגשה", exact: true }).click();
    await page.waitForURL(/\/exams\/attempt\//);
    await expect(page.getByTestId("attempt-score")).toHaveText("0%");
    await expect(page.getByTestId("recommendations")).toContainText("המלצות לתרגול נוסף");
    await expect(page.getByTestId("review-item").first()).toContainText("הסבר");
    await expect(page.getByTestId("review-item").first()).toContainText("(לא נענתה)");
  });

  test("טיימר: סופר לאחור ומגיש אוטומטית כשהזמן נגמר", async ({ page }) => {
    const d = withBank();
    await seed(page, d);
    await page.clock.install({ time: new Date() });
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("button", { name: "התחל סימולציה" }).click();
    await page.getByLabel("טיימר").check();
    await page.getByLabel("משך המבחן בדקות").fill("2");
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    await page.waitForURL(/\/exams\/run\//);
    await expect(page.getByTestId("exam-timer")).toContainText(/0[12]:\d\d/);
    await page.clock.fastForward("01:05");
    await expect(page.getByTestId("exam-timer")).toContainText(/00:[0-5]\d/);
    await page.clock.fastForward("01:00");
    await page.waitForURL(/\/exams\/attempt\//, { timeout: 15_000 });
    await expect(page.getByTestId("attempt-score")).toBeVisible();
  });
});
