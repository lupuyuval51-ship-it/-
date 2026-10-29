# Google Play listing: Hebrew (he-IL), default language

> **Draft.** Every claim below was checked against the code on 2026-10-29. Re-check it after feature
> changes. Counts are Unicode characters of the text between the fences (Python `len()`), as Play Console counts them.

## App name (max 30)

```text
LUPU-FIT: אימונים ותזונה
```
**24 characters of 30 max**

Shorter alternative: `LUPU-FIT` (8 characters).

## Short description (max 80)

```text
תוכנית אימונים אישית, מעקב אימון חי, יומן תזונה והתקדמות. בעברית, בלי פרסומות.
```
**78 characters of 80 max**

## Full description (max 4000)

```text
LUPU-FIT היא אפליקציית כושר ותזונה בעברית. היא בונה תוכנית אימונים לפי המטרה, הציוד והזמן שלך, מלווה אותך בזמן האימון ועוזרת לעקוב אחרי מה שאוכלים ואחרי ההתקדמות.

תוכנית אימונים אישית
• שאלון קצר: מטרה, ניסיון, ציוד, ימים בשבוע, משך אימון, פציעות ושרירים שרוצים לחזק
• מנוע אימונים שבונה תוכנית לחדר כושר, לבית או לאימון בחוץ
• כללי בטיחות מובנים: תוכניות שמרניות יותר לבני נוער ומגיל 50
• אפשר לערוך הכול: להחליף תרגילים ולשנות סטים, חזרות ומנוחה

אימון חי
• רישום של כל סט: משקל, חזרות, זמן ומאמץ
• טיימר מנוחה, הביצועים מהאימון הקודם והצעה מתי להעלות משקל
• בדיקת מוכנות קצרה לפני האימון, שמקלה את האימון כשהגוף עייף
• אפשר להמשיך לרשום סטים גם בלי קליטה; הם נשלחים כשהחיבור חוזר

ספריית תרגילים
• 119 תרגילים עם הסבר בעברית ובאנגלית, טעויות נפוצות, דגשי בטיחות ואנימציה של התנועה

תזונה
• יעדי קלוריות, חלבון, פחמימות ושומן לפי הפרופיל, שלא יורדים מתחת למינימום בטוח
• מאגר מזונות בעברית ובאנגלית, מזונות אישיים, ארוחות שמורות ורישום מהיר
• חיפוש מוצר לפי ברקוד (מאגר Open Food Facts)
• תפריט יומי של מנות מוכנות לפי היעדים, עם רשימת קניות. הערכים התזונתיים משוערים, ולמנות אין מידע על אלרגנים, לכן תמיד כדאי לבדוק את הרכיבים

מאמן
• מאמן שעונה על שאלות לפי הנתונים שלך: התוכנית, האימונים, התזונה והמשקל

התקדמות
• אימונים בשבוע, נפח אימון וסטים לפי קבוצת שרירים
• שיאים אישיים ומגמת כוח לכל תרגיל
• מגמת משקל גוף, עקביות שבועית, הישגים ונקודות

פרטיות
• בלי פרסומות ובלי קוד מעקב של צד שלישי
• אפשר להוריד את כל הנתונים ולמחוק את החשבון בכל עת מתוך האפליקציה

עברית מלאה מימין לשמאל, וגם אנגלית. ערכת תצוגה כהה ובהירה.

חשוב לדעת: LUPU-FIT נותנת הכוונה כללית לכושר ותזונה ואינה מחליפה ייעוץ רפואי. לפני שמתחילים תוכנית אימונים או תזונה, ובמיוחד במקרה של מצב רפואי, פציעה, היריון או הפרעת אכילה, יש להתייעץ עם רופא. השימוש מגיל 13; מתחת לגיל 18 בהסכמת הורה.
```
**1762 characters of 4000 max**

### Add only if AI features are enabled on the production server

The coach answers with an external AI service and meal-photo analysis exists **only** when `AI_API_KEY`
is set. Without it, do not mention either. If AI is enabled, replace the "מאמן" section with:

```text
מאמן
• מאמן AI שעונה על שאלות לפי הנתונים שלך: התוכנית, האימונים, התזונה והמשקל
• ניתוח תמונת ארוחה: מצלמים, בודקים ומתקנים כל פריט לפני שהוא נרשם
```
**146 characters**

Full description with the AI section instead of the plain one: **1832 characters of 4000 max**.

Before enabling AI in production, see the AI items in `checklist.md` (report button for AI answers,
privacy-policy wording, provider terms).

## Do not claim

- **"AI-generated workout plans"**: plans come from the rule-based training engine. AI (when enabled) only
  reads free-text preferences.
- **Push reminders**: reminders appear only while the app is open (`ReminderScheduler`); there is no push server.
- **"Free"**: the app has no payments today, but the price is a Play Console setting; decide it there.
- **Exercise videos**: the library has built-in animations, not videos.
- **Allergen-safe menus**: the dishes have no allergen data.
- **Medical claims** of any kind (diagnosis, treatment, "doctor approved").

## Screenshots (phone, 1080×1920, Hebrew, dark)

Upload in this order from `screenshots/`. Suggested captions if you add text overlays later:

| File | Screen | Caption idea |
|---|---|---|
| `01-dashboard.png` | Home | האימון הבא שלך מחכה |
| `02-live-workout.png` | Live workout | כל סט נרשם, גם בלי קליטה |
| `03-workout-plan.png` | Workout plan | תוכנית שנבנית לפי המטרה והציוד שלך |
| `04-nutrition-day.png` | Nutrition day | קלוריות וחלבון ביום אחד |
| `05-daily-menu.png` | Daily menu | **Do not upload until the dish-photo licence is confirmed** (see `checklist.md`) |
| `06-progress.png` | Progress | רואים את ההתקדמות שבוע אחרי שבוע |

The screenshots show a demo account created by `scripts/play-store-assets.mjs`; regenerate them after UI
changes. Feature graphic: `feature-graphic-he.png`. Icon: `icon-512.png`.
