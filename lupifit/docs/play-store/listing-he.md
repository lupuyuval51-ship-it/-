# Google Play listing: Hebrew (he-IL), default language

> **Draft** for the **device-mode** Android app (no account, data only on the phone, see `docs/device-mode.md`).
> Every claim below was checked against the code on 2026-10-30. Re-check it after feature changes. Counts are
> Unicode characters of the text between the fences (Python `len()`), as Play Console counts them.

## App name (max 30)

```text
LUPU-FIT: אימונים ותזונה
```
**24 characters of 30 max**

Shorter alternative: `LUPU-FIT` (8 characters).

## Short description (max 80)

```text
תוכנית אימונים אישית, מעקב אימון, יומן תזונה והתקדמות. בלי חשבון ובלי פרסומות.
```
**78 characters of 80 max**

## Full description (max 4000)

```text
LUPU-FIT היא אפליקציית כושר ותזונה בעברית. היא בונה תוכנית אימונים לפי המטרה, הציוד והזמן שלך, מלווה אותך בזמן האימון ועוזרת לעקוב אחרי מה שאוכלים ואחרי ההתקדמות.

בלי חשבון, הכול בטלפון
• בלי הרשמה: מזינים שם, עונים על שאלון קצר ומתחילים
• הנתונים נשמרים רק בטלפון, לא בשרת
• עובדת גם בלי אינטרנט; רק חיפוש לפי ברקוד צריך חיבור

תוכנית אימונים אישית
• שאלון קצר: מטרה, ניסיון, ציוד, ימים בשבוע, משך אימון, פציעות ושרירים שרוצים לחזק
• מנוע אימונים שבונה תוכנית לחדר כושר, לבית או לאימון בחוץ
• כללי בטיחות מובנים: תוכניות שמרניות יותר לבני נוער ומגיל 50
• אפשר לערוך הכול: להחליף תרגילים ולשנות סטים, חזרות ומנוחה

אימון חי
• רישום של כל סט: משקל, חזרות, זמן ומאמץ
• טיימר מנוחה, הביצועים מהאימון הקודם והצעה מתי להעלות משקל
• בדיקת מוכנות קצרה לפני האימון, שמקלה את האימון כשהגוף עייף

ספריית תרגילים
• 119 תרגילים עם הסבר בעברית ובאנגלית, טעויות נפוצות, דגשי בטיחות ואנימציה של התנועה

תזונה
• יעדי קלוריות, חלבון, פחמימות ושומן לפי הפרופיל, שלא יורדים מתחת למינימום בטוח
• מאגר מזונות בעברית ובאנגלית, מזונות אישיים, ארוחות שמורות ורישום מהיר
• חיפוש מוצר לפי ברקוד במאגר Open Food Facts (צריך אינטרנט; נשלח רק מספר הברקוד)
• תפריט יומי של מנות מוכנות לפי היעדים, עם רשימת קניות. הערכים התזונתיים משוערים, ולמנות אין מידע על אלרגנים, לכן תמיד כדאי לבדוק את הרכיבים

מאמן
• מאמן שעונה על שאלות לפי הנתונים שלך: התוכנית, האימונים, התזונה והמשקל

התקדמות
• אימונים בשבוע, נפח אימון וסטים לפי קבוצת שרירים
• שיאים אישיים ומגמת כוח לכל תרגיל
• מגמת משקל גוף, עקביות שבועית, הישגים ונקודות

תזכורות
• תזכורות לאימון ולארוחות כהתראות בטלפון, גם כשהאפליקציה סגורה

הנתונים שלך
• בלי פרסומות ובלי קוד מעקב
• אפשר לשמור קובץ גיבוי בכל עת, כדי לשמור על הנתונים או להעביר אותם לטלפון חדש
• אפשר למחוק הכול בכל עת. הסרת האפליקציה מוחקת את הנתונים, אלא אם נשמר קובץ גיבוי

עברית מלאה מימין לשמאל, וגם אנגלית. ערכת תצוגה כהה ובהירה.

חשוב לדעת: LUPU-FIT נותנת הכוונה כללית לכושר ותזונה ואינה מחליפה ייעוץ רפואי. לפני שמתחילים תוכנית אימונים או תזונה, ובמיוחד במקרה של מצב רפואי, פציעה, היריון או הפרעת אכילה, יש להתייעץ עם רופא. השימוש מגיל 13; מתחת לגיל 18 בהסכמת הורה.
```
**2059 characters of 4000 max**

Before publishing: the **תזכורות** (reminders) section is true for the app's code (local notifications, checked
by unit tests) but was not yet seen on a real phone. Check it on a phone first (`docs/android.md`, "Testing on a
real phone before a release"); until then, remove those two lines.

## Do not claim

- **AI** of any kind ("AI coach", "AI-generated plans", meal-photo analysis): the device-mode app has no AI. The
  coach is the built-in one; plans come from the rule-based training engine.
- **Sync, cloud storage or "your data is safe in the cloud"**: the data is only on the phone. Android's own
  backup may keep a copy, but it is not guaranteed; the backup file is the reliable way.
- **Account features** (sign in on another device, password reset, "access your data anywhere").
- **Camera barcode scanning**: the Android app has no camera permission; barcodes are typed in.
- **"Works fully offline"** without the barcode exception.
- **Reminders** before they were seen working on a real phone (see above).
- **"Free"**: the app has no payments today, but the price is a Play Console setting; decide it there.
- **Exercise videos**: the library has built-in animations, not videos.
- **Allergen-safe menus**: the dishes have no allergen data.
- **Medical claims** of any kind (diagnosis, treatment, "doctor approved").

## Screenshots (phone, 1080×1920, Hebrew, dark)

Upload in this order from `screenshots/`. Suggested captions if you add text overlays later:

| File | Screen | Caption idea |
|---|---|---|
| `01-dashboard.png` | Home | האימון הבא שלך מחכה |
| `02-live-workout.png` | Live workout | כל סט נרשם, גם בלי אינטרנט |
| `03-workout-plan.png` | Workout plan | תוכנית שנבנית לפי המטרה והציוד שלך |
| `04-nutrition-day.png` | Nutrition day | קלוריות וחלבון ביום אחד |
| `05-daily-menu.png` | Daily menu | **Do not upload until the dish-photo licence is confirmed** (see `checklist.md`) |
| `06-progress.png` | Progress | רואים את ההתקדמות שבוע אחרי שבוע |

The screenshots were made from the hosted (website) build with a demo account by
`scripts/play-store-assets.mjs`. These six screens look the same in the device-mode app as far as the code
shows, but compare them with the app on a phone before uploading. Device-mode screenshots (390 px wide, for
checking) come from `DEVICE_SHOTS=<dir> npm run test:e2e:device`. Feature graphic: `feature-graphic-he.png`.
Icon: `icon-512.png`.

## Hosted mode (`android-twa/`) only

If the website app is ever the listing instead: it has accounts, works only online for anything not cached,
and has AI (coach answers and meal-photo analysis) only when the server has `AI_API_KEY`. Then the sections
"בלי חשבון, הכול בטלפון", "תזכורות" and "הנתונים שלך" above do not apply; use account wording instead ("אפשר
להוריד את כל הנתונים ולמחוק את החשבון בכל עת מתוך האפליקציה") and check `checklist.md`, "Hosted mode only".
