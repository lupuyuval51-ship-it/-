# LUPU-FIT: תוכנית ביצוע מלאה (Orange × Black)

## Context

**מה התבקש.** ארבע הודעות שמתאחדות לבקשה אחת:
- תוכנית מלאה ל-LUPU-FIT.
- עיצוב מחדש "אנושי" ולא גנרי-AI.
- כיוון מחייב של **כתום על שחור**.
- Master Prompt עם 14 תוצרים.

אנחנו במצב תכנון: לא נגעתי בשום קובץ בריפו.

**מה באמת קיים.** בדקתי והרצתי:

| מקום | מה יש שם | מצב |
|---|---|---|
| `main` / `claude/optimistic-cori-a3f48u` | **LEVELUP AI**: SaaS למידה עם תלות-אפס, שהועלה **שטוח** (62 קבצים, כפילויות `x (N).js`) | לא רץ כמו שהוא (`ERR_MODULE_NOT_FOUND src/config.js`). אחרי שחזור מבנה בעותק נפרד: 13/13 בדיקות. **אין בו קוד כושר.** |
| PR #8 `claude/trusting-planck-p4zwmo` → `fitai/` | **FITAI**: אפליקציית כושר מלאה. React 19 + TS + Vite 7 + React Router 7 + TanStack Query; Express 5 + pg + zod; Claude דרך `@anthropic-ai/sdk` בצד השרת; Vitest; Playwright | **הרצתי כאן מול Postgres 16:** typecheck ✓, lint ✓, validate:content ✓ (119 תרגילים, 198 מזונות, 36 תבניות ארוחה), שרת 499/499, לקוח 151/151, build ✓, E2E 93 עברו / 2 דולגו |
| PR #10 `ninja-app/` | NINJA CIRCUIT: אפליקציית HTML יחידה, 72 קליפי mp4, 107 תמונות תרגילים ו-300 תמונות מנות | **המקור והרישוי של המדיה לא מתועדים** → לא נכנסת לתוכנית כנכס |
| חשבונות מחוברים | Supabase: 6 פרויקטים (2 פעילים), אין פרויקט fitai או lupifit. Netlify: הרבה אתרי `fitai-app*` סטטיים. | אין deployment של שרת + DB ל-FITAI |

**ההחלטה, ואני ממליץ עליה בבירור.** LUPU-FIT = FITAI אחרי מיתוג מחדש, עיצוב מחדש מלא, ומילוי הפערים מול המפרט:
- לא כותבים מאפס.
- לא בונים על LEVELUP, שהוא תחום אחר ו-stack חלש יותר למוצר כזה.
- ה-stack, ה-API, ה-DB, האימות, הטיימרים, הסנכרון האופליין ו-650 הבדיקות נשמרים.

**הנחות** (אפשר לשנות כשמאשרים):
1. העבודה מתבצעת ב-branch המוגדר. ממזגים אליו את branch ה-FITAI, כך שההיסטוריה נשמרת, ומעבירים את `fitai/` ל-`lupifit/`.
2. LEVELUP נשאר בשורש ולא נמחק.
3. ערכת נושא בהירה נשמרת כפיצ'ר קיים. כהה היא ברירת המחדל ומגדירה את המותג.
4. אין מפתח AI בסביבה הזו, ולכן המאמן יאומת רק מול fake LLM עד שיוגדר מפתח.

---

## 1. Repository audit: מה עובד, מה חלקי, מה חסר

**ארכיטקטורה קיימת** (`fitai/`):
- `shared/`: enums, סכמות zod, DTO, ולוגיקה טהורה (`nutrition.ts`, `training.ts`, `timer.ts`, `gamification.ts`, `plates.ts`, `split.ts`) ו-`shared/animation/` (engine/svg/types + data/*.ts).
- `server/src/`: `app.ts`, middleware לאבטחה, CSRF, Origin, idempotency ו-rate limit; `ai/llm.ts` הוא שער ה-LLM היחיד; `modules/{auth,profile,exercises,workouts,sessions,nutrition,progress,gamification,dashboard,coach}`; `db/migrations/*.sql`; `data/`.
- `client/src/`: `pages/*`, `features/*`, `components/ui/*`, `components/charts/Charts.tsx`, `layout/AppShell.tsx`, `i18n/locales/{he,en}`, `styles/*.css` (14 קבצים, 144KB).
- `e2e/`: 17 specs, fake LLM, איפוס DB.
- טבלאות: `users`, `auth_sessions`, `password_reset_tokens`, `idempotency_keys`, `profiles`, `body_weight_entries`, `exercises`, `workout_plans`, `plan_workouts`, `plan_exercises`, `workout_sessions`, `session_exercises`, `session_sets`, `personal_records`, `foods`, `food_log_entries`, `saved_meals`, `saved_meal_items`, `meal_templates`, `coach_threads`, `coach_messages`, `coach_usage`, `xp_events`, `user_achievements`, `notifications`.

**עובד (מכוסה בבדיקות):**
- הרשמה, התחברות, איפוס סיסמה, ייצוא ומחיקת חשבון.
- Onboarding בשבעה שלבים.
- מחולל תוכניות מבוסס חוקים (`rules-1.0`), עם עריכה, החלפה, סידור, שכפול וארכיון.
- אימון חי:
  - טיימר מבוסס timestamps שנשמר בשרת.
  - תור אופליין עם idempotency.
  - Wake lock והתראת סיום מנוחה.
  - מחשבון פלטות.
  - סיכום אימון ושיאים אישיים.
- ספרייה של 119 תרגילים עם חיפוש דו-לשוני.
- תזונה:
  - Mifflin-St Jeor עם רצפות בטיחות; בלי גירעון לקטינים.
  - מזונות מותאמים אישית וארוחות שמורות.
  - ברקוד (Open Food Facts) וניתוח תמונה (AI).
- התקדמות 7/30/90 עם טיפול כן בנתונים דלילים.
- מאמן עם מצב מובנה וסינון בטיחות.
- PWA עם app-shell אופליין.

**חלקי או פגום (ממצאים עם ראיות):**
- **עיצוב.** "גנרי-AI" מקודד בטוקנים:
  - `--primary-gradient`, `--primary-glow` על כל `.btn-primary`, ו-`--page-glow` ברקע (`client/src/styles/global.css:38-104`).
  - 43 גרדיאנטים, 11 זוהרים צבעוניים, 5 backdrop-blur.
  - 19 ערכי radius, 18 pills ו-24 עיגולים.
  - 167 ערכי font-size, מתוכם רק 5 טוקנים.
  - גופן מערכת בלבד.
  - בשקיפות `.card` (radius 18, inset, צל כפול) מופיעה ב-53 מתוך 131 קבצי TSX.
  - עשרה מקרים של מיכל מעוגל בתוך מיכל מעוגל.
  - Achievements עם אימוג'י (`shared/gamification.ts:74-87`).
  - success = primary (אותו ירוק).
- **ארכיטקטורת CSS שבירה:**
  - `main.tsx` מייבא את `App` לפני `global.css`, ולכן `progress.css` ו-`session.css` נטענים לפני הגלובלי.
  - שכבות "Visual polish" דורסות בתוך הקבצים: `coach.css:443`, `progress.css:448`, `session.css:660`, `nutrition.css:396`, `profile.css:266`.
  - באגי cascade מאומתים:
    - צבע ההודעות הבטיחותיות של המאמן אובד.
    - `.set-check` הופך לריבוע ב-focus.
    - הטוקנים `--hero-bg` ו-`--gold` מוגדרים רק אחרי שה-dashboard נטען.
- **אימון חי** (`pages/session/ActiveSessionPage.tsx`):
  - ב-390×844 בלי גלילה אין כלום מהתרגיל הנוכחי: לא שם, לא אנימציה ולא סטים.
  - `RestTimerCard` (13 פקדים) מרונדר **מעל** התרגיל (שורות 510-515), וכ-17 כפתורים מתחרים.
  - הפעולה החזקה במסך היא "סיום", לא "השלמת סט".
  - האנימציה מוגדרת `size="sm" controls={false}` (`features/sessions/ExerciseCard.tsx:144`): כ-220px, 1.3 מסכים מתחת לקפל.
  - "יעד: 10" בכל סט סותר את "6–10" בכותרת.
  - אפשר להשלים סט במוט בלי משקל.
- **אנימציות** (בדיקה אוטומטית של המנוע, `scratchpad/wf3/engine/out/*`):
  - **5 וריאציות כפיפת מרפק עם keyframes זהים:** `barbell_curl`, `dumbbell_curl`, `hammer_curl`, `cable_biceps_curl` ו-`band_biceps_curl`. hammer ו-dumbbell זהים גם בגאומטריה המרונדרת.
  - **9 חריגות טווח תנועה:**
    - `face_pull`: מרפק -138° וכתף 223°. הזרועות מתקפלות מאחורי הראש.
    - `barbell_back_squat` ו-`smith_machine_squat`: מרפק 162°.
    - וגם `muscle_up`, `worlds_greatest_stretch` ו-`pike_push_up`.
  - **39 החטאות IK:** ב-`lat_pulldown` חסרים ≈8 ס"מ עד הידית, ב-`leg_press` ≈15 ס"מ עד הפלטה, וב-`deadlift` הידיים עוזבות את המוט.
  - **53 קפיצות בלולאה.**
  - **פקדים:** רק play/pause ו-½×/1×. אין replay, אין 0.25×, אין סימון כיוון תנועה ואין scrub.
  - צבע הגומייה `#f97316` יתנגש עם הכתום.
  - מגבלה מוצהרת: דמות 2D שטוחה לתנועות בעומק (flys, twists).
- **באגים פונקציונליים:**
  - `MessageBubble.tsx:49` `dir="auto"` הופך תשובה עברית ל-LTR.
  - ✓ בנקודות השבוע מול 0/4 ביעד (`WeeklyGoalCard.tsx`).
  - "0 דק׳" מול "1 דק׳": `progress/format.ts:39` מול `sessions/format.ts:11`.
  - "התחלת אימון" מוצג כשכבר יש אימון פתוח.
  - שמות תוכנית ואימון נשמרים כטקסט בשפת היצירה (`server/src/modules/workouts/i18n.ts`). תוצאה: אנגלית בתוך UI עברי.
  - חשבון ב-UTC מול Asia/Jerusalem.
  - אין טאב פעיל בספרייה ובפרופיל.
  - 5 מתוך 9 טאבים ברישום מזון מוסתרים.
  - תג "נוצרה ב-AI" על מחולל מבוסס חוקים.
- **שפה:**
  - ארבע שיטות פנייה מגדרית מעורבבות.
  - "ביטול" בארבע משמעויות, "רמה" בשלוש.
  - RPE ו-XP לא מתורגמים.
  - קק"ל מופיע בשני כתיבים, וגרם בשלושה.
- **תשתית:**
  - `engines >=20.12`, בזמן ש-Node 20 הגיע ל-EOL ב-2026-04-30.
  - `@anthropic-ai/sdk ^0.133`, והגרסה העדכנית היא 1.x.
  - `@playwright/test` נעול ל-1.56.1, ובסביבה מותקן הדפדפן של 1.63.
  - אין Dockerfile, אין CI, rate limit בזיכרון, ואין ספק email.

**חסר לגמרי מול המפרט:**
- מועדפים לתרגילים.
- מעקב מים.
- **מתכנן ארוחות ורשימת קניות.**
- תרגילים אישיים.
- מדידות גוף מעבר למשקל.
- הקפאת תוכנית.
- היסטוריה עם לוח שנה ומסננים.
- סשנים מתוכננים או שדולגו.
- תיקון רשומות היסטוריות עם audit.
- מניפסט אנימציות עם סטטוס אימות.

---

## 2. Product architecture

השרשרת שהמפרט דורש כבר קיימת ב-FITAI, ונחזק כל חוליה בה:

```
Onboarding/Profile ──► Generator (rules engine, shared/training) ──► Plan (workout_plans/plan_workouts/plan_exercises)
        │                         ▲ exercise metadata + animation manifest
        ▼                         │
Exercise Library (exercises + shared/animation) ──► Live Session (workout_sessions/session_exercises/session_sets,
                                                     offline queue → idempotent API) ──► Records/XP (server-computed)
                                                                                         ──► History & Progress (charts from DB only)
Nutrition (foods+provenance → food_log_entries snapshot) ──► targets (shared/nutrition) ──► Meal Planner → Shopping List [new]
Coach (ai/llm.ts, server-only) ◄── read-only context builders over the same DB ── fallback: builtin data-grounded mode
```

**כללי ארכיטקטורה שנשמרים, מ-`fitai/AGENTS.md`:**
- כל שאילתה מסוננת לפי `user_id`. משאב של משתמש אחר מחזיר 404.
- zod על כל קלט.
- SQL פרמטרי בלבד.
- `HttpError` עם קודים יציבים.
- לא ממציאים נתונים.
- המפתח של ה-AI בשרת בלבד.
- מיגרציות forward-only.

---

## 3. Screen inventory

סימון: ✎ עיצוב מחדש, ★ חדש.

**קיימים, כולם ✎:**

| Route | Page |
|---|---|
| `/` | `pages/dashboard/DashboardPage.tsx` |
| `/workouts` | `pages/workouts/WorkoutsPage.tsx` |
| `/workouts/plans/:planId` | `PlanDetailPage.tsx` |
| `/workouts/session` | `pages/session/ActiveSessionPage.tsx` |
| `/workouts/sessions/:id` | `SessionSummaryPage.tsx` |
| `/workouts/history` | `SessionHistoryPage.tsx` |
| `/exercises` | `pages/exercises/ExerciseLibraryPage.tsx` |
| `/exercises/:id` | `ExerciseDetailPage.tsx` |
| `/nutrition` | `pages/nutrition/NutritionPage.tsx` |
| `/nutrition/log` | `FoodLogPage.tsx` |
| `/coach` | `pages/coach/CoachPage.tsx` |
| `/progress` | `pages/progress/ProgressPage.tsx` |
| `/notifications` | `NotificationsPage.tsx` |
| `/profile` | `pages/settings/ProfileSettingsPage.tsx` |
| `/onboarding` | `pages/onboarding/*` |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | `pages/auth/*` |
| `*` | `NotFoundPage` |

**חדשים:**
- ★ `/workouts/history`: מצב לוח שנה ומסננים (הרחבה של הדף הקיים).
- ★ `/nutrition/plan`: מתכנן ארוחות שבועי.
- ★ `/nutrition/shopping`: רשימת קניות.
- ★ `/exercises/favorites`: מסנן בתוך הספרייה, לא דף נפרד.
- ★ `/exercises/new`: תרגיל אישי, **בלי אנימציה**, ולכן מסומן "תרגיל אישי — ללא הדגמה" ולא נכלל ב"ספרייה המאומתת".
- ★ `/progress/measurements`: מדידות גוף.
- ★ `/about/data-sources`: מקורות נתונים, רישוי וייחוס.

**ניווט:**
- **מובייל:** שורה תחתונה עם 5 טאבים, כמו היום: בית, אימונים, תזונה, מאמן, התקדמות.
  - **הוספה:** active לפי משפחת routes. "אימונים" כולל את `/exercises`, ו"התקדמות" כולל את `/notifications`. כך יש תמיד טאב פעיל. ה-e2e מניח ש"Exercises" קיים רק בסרגל הצד, ולכן לא מוסיפים טאב.
  - **הספרייה:** נגישה מכפתור חיפוש בכותרת ומתוך "אימונים".
  - **פרופיל:** באווטאר, עם `aria-current`.
- **דסקטופ:** sidebar עם כל שבעת האזורים.
- **בזמן אימון:** מצב פוקוס. מתחת ל-900px הניווט התחתון מוסתר בעמוד הסשן בלבד (`body:has(.session-page)`), ורצועת האימון מחליפה אותו.

---

## 4. Design system: Orange × Black

### 4.1 טוקנים

השמות הקיימים נשמרים (`--bg`, `--surface`, `--primary` ...), כך שכל הרכיבים מתעדכנו ממקום אחד ב-`global.css`.

| טוקן | כהה (ברירת מחדל) | בהיר (חם) | הערה ויחס ניגודיות (מחושב) |
|---|---|---|---|
| `--bg` | `#0B0B0D` | `#F4F1EC` | |
| `--bg-elev` | `#121214` | `#FBF9F6` | |
| `--surface` | `#1A1A1D` | `#FFFFFF` | |
| `--surface-2` | `#222226` | `#EFEBE4` | |
| `--surface-3` (pressed) | `#2A2A2F` | `#E5E0D7` | |
| `--text` | `#F5F5F5` | `#141416` | 18.0 / 17.2 / 15.9 / 14.5 על ארבעת המשטחים |
| `--text-muted` | `#A3A3A8` | `#5E5E66` | 7.8 → 6.3 ✓ (בהיר 5.7) |
| `--divider` (`--border-subtle`) | `#303034` | `#DDD8D0` | **דקורטיבי בלבד** (1.3–1.5) |
| `--border` (גבול פקדים) | `#6B6B72` | `#8A857C` | **חדש**: 3.0–3.7 ✓ לפי WCAG 1.4.11 |
| `--primary` | `#FF6A00` | `#FF6A00` (רק כמילוי) | כטקסט בכהה: 5.5–6.9 ✓ |
| `--primary-text` | `#FF8533` | `#B33F00` | כתום כטקסט ואייקון. בבהיר 5.14 ✓ |
| `--primary-pressed` | `#E05A00` | `#CC5500` | |
| `--on-primary` | `#0B0B0D` | `#0B0B0D` | **שחור על כתום 6.85 ✓. לבן על כתום 2.87 ✗ ואסור** |
| `--success` | `#3DBE7A` | `#1F7A4C` | 6.7–8.3 ✓. **מופרד מ-primary** |
| `--warning` | `#F5C518` | `#8A6100` | צהוב ולא ענבר, כדי שלא ייקרא כתום. תמיד עם אייקון וטקסט |
| `--danger` | `#FF5C5C` | `#C42B2B` | 5.2–6.5 ✓ |
| `--focus` | `#FF8533` טבעת 2px + offset 2px | `#B33F00` | |
| `--chart-neutral` | `#8FA3B8` | `#5B6B7C` | סדרה משנית (פלדה) |
| `--chart-grid` | `#303034` | `#DDD8D0` | |

**נמחקים:**
- `--primary-gradient`, `--primary-glow`, `--page-glow`, `--card-highlight`.
- `--hero-bg`, `--accent-grad`, `--sess-glow`.
- צבעי הקשת של הארוחות.

**צל:** `--shadow-overlay` אחד בלבד, למודאל, sheet ו-toast.

### 4.2 טיפוגרפיה

הגופנים מאוחסנים עצמית, כי ה-CSP מגביל ל-`font-src 'self'`. כולם OFL ונכנסים ל-precache של ה-SW.

| שימוש | גופן | הערות |
|---|---|---|
| UI, גוף טקסט וכותרות | **Heebo Variable** | עברית ולטינית, subset |
| ספרות ו-wordmark | **Barlow Condensed** | 600/700. ספרות צרות שנכנסות ל-"142.5" בגודל 32px בתוך input של 120px במסך 360. נראה כמו מכשיר מדידה. אם אין `tnum`, משתמשים ב-Heebo עם `tabular-nums`. |

- כותרת אחת לשתי השפות: Heebo 800. אין לטינית צרה ליד עברית רחבה.
- טעינה: preload לקובץ העברי, ו-`@font-face` fallback עם `size-adjust` למניעת קפיצת פריסה.

- `font-variant-numeric: tabular-nums lining-nums` בכל `.num`.
- קנה מידה בטוקנים בלבד:

| טוקן | גודל |
|---|---|
| `--fs-xs` | 12 |
| `--fs-sm` | 14 |
| `--fs-base` | 16 |
| `--fs-lg` | 18 |
| `--fs-xl` | 22 |
| `--fs-2xl` | 28 |
| `--fs-num-l` (משקל וחזרות) | 40 |
| `--fs-num-xl` (טיימר) | 64 |

- גובה שורה 1.5 לגוף ו-1.15 למספרים.
- **אין letter-spacing שלילי בעברית.**
- יחידות: קק״ל ו-ק״ג עם גרשיים (״) אחידים. גרם מלא.

### 4.3 צורה, עומק ותנועה

- **רדיוס:**
  - `0` לשורות נתונים.
  - `4px` לכפתורים, inputs, chips ו-segmented.
  - `8px` לפאנלים, sheets ומודאל.
  - עיגול רק לאווטאר ולנקודת סטטוס.
  - **אין pills.** תגים הם טקסט קטן עם קו תחתון או מסגרת 1px ברדיוס 4.
- **אין מיכל מעוגל בתוך מיכל מעוגל.** בתוך פאנל משתמשים בשורות ובקווי הפרדה.
- **כרטיסים** רק כשהקבצה משפרת הבנה. ברירת המחדל היא **section פתוח**: כותרת section (14/600 muted) מעל קו 1px, ואחריה שורות.
- **אייקונים:** `vector-effect: non-scaling-stroke` עם stroke קבוע 1.75px בכל הגדלים (`Icon.tsx:71`).
  - האייקון חייב משמעות. אין אריחי-אייקון.
  - אימוג'י ההישגים מוחלפים בסט אייקונים.
- **תנועה:**

  | טוקן | ערך |
  |---|---|
  | `--dur-1` | 120ms |
  | `--dur-2` | 200ms |
  | `--dur-3` | 320ms |
  | `--ease` | `cubic-bezier(.2,0,0,1)` |

  - **נמחקים:** `resume-pulse`, `flame-flicker`, `set-pop` (overshoot), `confetti`, `medal-in` ו-`dash-rise`.
  - **נשאר:** press scale של 0.98, מעבר התקדמות של 320ms, ו-feedback לסט (ראו 4.5).
  - reduced-motion מבטל הכול חוץ משינויי צבע.

### 4.4 האלמנט החתימתי: ה-Tally (קווי ספירה של יומן אימון)

שורת קווים אנכיים קצרים, 3×14px או 4×20px, עם רווח 3px ורווח של 8px אחרי כל 5. הקווים מתמלאים מה-inline-start, כלומר מימין לשמאל בעברית.

**הצבעים:**
- הושלם: לבן.
- **עכשיו או הבא: כתום.** זה כלל המותג: "כתום = עכשיו".
- ממתין: אפור.

**למה זה עובד:**
- **זה נתון אמיתי, לא קישוט.** כל קו הוא סט, אימון בשבוע או שלב ב-onboarding. לכן הוא נשאר זהה במבחן no-effects.
- **הוא מחליף את 17 ה-`ProgressRing`:** טיימר, יעד שבועי, donuts של תזונה ועקביות. טבעות donut הן הקלישאה הכי גנרית של אפליקציות כושר.
- **ממנו נגזר הלוגו:** ארבעה קווים לבנים וקו אלכסוני כתום, ה"שער של חמש". מופיע ב-favicon, באייקון האפליקציה וב-wordmark "LUPU-FIT" ב-Barlow Condensed 700.

**הרכיב:** `components/ui/Tally.tsx` עם props `{total, done, current?, size}`.
- מעל 40 פריטים הוא מתחלף ל-meter של 4px.
- `aria-hidden` כשיש טקסט גלוי לצדו.

**סמן משני:** פס כתום של 2–3px ב-inline-start מסמן את הסט הנוכחי, את הפריט הפעיל בסרגל הצד ואת הטאב הפעיל.

### 4.5 חוקי שימוש בכתום

- **מותר:**
  - הכפתור הראשי היחיד במסך. בכל מסך יש לכל היותר פעולה כתומה מלאה אחת.
  - הטאב או הניווט הפעיל.
  - הקו הנוכחי ב-Tally ופס הסמן.
  - מילוי התקדמות המנוחה.
  - פקד נבחר (מסנן פעיל, speed נבחר).
  - הדגשת שריר המטרה באנימציה.
  - הסדרה הראשית בגרף ונקודת שיא.
- **אסור:**
  - רקע של section או כרטיס.
  - כותרות.
  - כל המספרים.
  - גבולות קבועים.
  - זוהר.
  - גרדיאנט.
  - מצב warning, כי צבע ה-warning הוא ענבר.
  - ציוד באנימציה. הגומייה עוברת לגוון פלדה כהה מקווקו.
- **Feedback להשלמת סט:**
  - ה-✓ נמשך פנימה ב-160ms.
  - השורה עוברת ממצב נוכחי למצב בוצע ב-240ms.
  - קו ה-Tally הנוכחי מתחלף מכתום ללבן, והקו הבא נהיה כתום.
  - `vibrate(10)` אם המשתמש הפעיל.
  - אין bounce.
- **פוקוס:** טבעת לבנה (שחורה בערכה הבהירה), לא כתומה.
- **Warning:** צהוב `#F5C518`, כדי שלא ייקרא כתום. שורת ה-warning בטבלת הטוקנים (4.1) מתעדכנת לערך הזה.
- **בדיקה מחייבת:** צילום מסך עם stylesheet "no-effects" (box-shadow, background-image, filter ו-animation כבויים) חייב להיראות זהה מבחינה פונקציונלית ומאוזן.

### 4.6 RTL ושפה

- **כבר טוב ונשמר:** אפס מאפיינים פיזיים (left/right), `icon-dir` לאייקונים כיווניים, ו-`bdi`/`.ltr` למספרים.
- **לתקן:**
  - גרדיאנטים בזווית פיזית: נמחקים בכל מקרה.
  - גרפים: ציר Y בצד ימין ב-RTL. נוסיף `axisSide` ל-`Charts.tsx`; המספרים יישארו LTR.
  - `MessageBubble`: `dir` לפי שפת השיחה ולא `auto`.
- **מדריך microcopy חדש** (`lupifit/docs/voice-he.md`):
  - פנייה ברבים: "בחרו", "השלימו". אין לוכסני מגדר.
  - מינוח אחיד: סט, חזרות, משקל עבודה, מנוחה.
  - RPE מוצג כ"מאמץ (RPE)" עם הסבר.
  - XP מוצג כ"נקודות".
  - בלי "כל הכבוד!" גנרי. משוב עובדתי: "5 אימונים ב-14 יום".
  - "ביטול" רק במשמעות cancel. "בטל" (undo) → "החזרה". "ביטול אימון" → "מחיקת האימון".
- **שמות תוכניות:** השרת יחזיר `nameKey` ופרמטרים (קודים) ולא טקסט קבוע. הלקוח מתרגם. שם שהמשתמש ערך ידנית נשמר כטקסט.

---

## 5. קומפוזיציות מסכים

כל המידות למטה הן ל-390×844 בעברית RTL. "נשמר" מציין שמות ומבנים שבדיקות ה-e2e תלויות בהם.

### 5.1 אימון חי: `pages/session/ActiveSessionPage.tsx`, `features/sessions/{ExerciseCard,SetRow,RestTimer,FinishDialog}.tsx`

```
SESSION STRIP (sticky ~92)  — חדש: features/sessions/SessionStrip.tsx (מחליף header.card.session-header)
│ h1 פלג גוף תחתון (18/700)                       34:12  ← role=timer "Elapsed time"  │
│ ▮▮▮▮▮▯▯▯▯▯ ▯▯▯▯▯ ▯▯▯▯▯ (Tally) 5/20 סטים      ✓ כל השינויים נשמרו (12 אפור)        │
│ [⏸ השהיה] [סיום] (ניטרלי, לא כתום)                        [✕ מחיקה] (טקסט אדום)  │
EXERCISE NAV (44)   ‹ הקודם   ≡ תרגיל 2 מתוך 6   הבא ›
EXERCISE HEADER (72)  h2 סקוואט עם מוט (24/800) · ארבע ראשי · ישבן   [פלטות][⇄][🗑] 40px
STAGE 16:10 (~358×224, ≤34vh)  ExerciseAnimation size="stage" controls="minimal"
│ figure; target muscles in orange; flat stage │ ⟲ מההתחלה · ⏸ · ───●─── ↓ ירידה (phase rail) │
PRESCRIPTION (36)  יעד 4 × 6–10 · מאמץ (RPE) 7.5 · ⏱ 2:00   (Barlow, .ltr)
CURRENT SET  li.set-row.set-row-current  (surface-2, radius 8, 2px orange inline-start bar)  ~196
│ סט 2        בפעם הקודמת 60 × 8           מאמץ ▾  🗑                        │
│ [ 62.5 ] ק״ג   ×   [ 8 ] חזרות     (inputs 64px, ספרות 32)                 │
│ [−][+] 44px          [−][+]                                                │
│ ██████ ✓ השלמת סט 2 ██████  ← זה ה-.set-check עצמו: כתום, 56px, טקסט שחור │
OTHER SETS (48 each)  1  60 × 8 ✓   ·   3  — × —  ○   ·   4 …
[+ הוספת סט] · מינוח ההתקדמות בשורה אחת · .exercise-previous · ▸ הגדרות תרגיל · [+ הוספת תרגיל] · ▸ הגדרות אימון
REST DOCK (fixed bottom ~72, only while a timer exists) — RestPanel variant="dock"
│ 1:43  במנוחה  ▮▮▮▮▮▮▮▯▯▯ (orange bar)   [−15] [⏸] [+15] [✕ דילוג] [⌃ אפשרויות] │
```

**תקציב גובה** ב-390×844, בלי ניווט תחתון: 52 + 92 + 44 + 72 + 224 + 36 + 196 = **716px**. כלומר שם התרגיל, האנימציה והכפתור הכתום נכנסים כולם במסך הראשון.
- במסכים בגובה עד 700px: stage עד 26vh, והרצועה מתקפלת לשורה אחת.

**הכפתור הכתום הוא ה-`.set-check` של השורה הנוכחית, ולא כפתור נוסף.**
- כפתור שני בשם "Complete set N" היה שובר 9 locators ב-e2e.
- טקסט גלוי `set-check-text` זהה ל-`aria-label`.
- בשורות שבוצעו: ✓ לבן קטן, וה-inputs נשארים ניתנים לעריכה.

**מנוחה:**
- `RestTimerCard` ו-`RestTimerBar` מתאחדים ל-`RestPanel({variant:'dock'|'panel'})` בתוך `RestTimer.tsx`. הוא משתמש באותו `useTimerModel`.
- **במובייל:** dock שבו ‎−15, השהיה, ‎+15 ודילוג גלויים. איפוס, presets, השתקה ו"מותאם" נמצאים באזור מתרחב (`aria-expanded`, **לא `role=dialog`**, אחרת קיצורי המקלדת מושבתים).
- **בדסקטופ:** `panel` מלא ב-aside הדביק, עם שעון 72px.
- **מה נמחק:** ה-slot של הטיימר מעל התרגיל (`ActiveSessionPage.tsx:510-515`), `timerRef`, הטבעת והזוהר.
- **נשמר:** `role=timer` יחיד עם הטקסט `/remaining/`, Resting/Paused/Ready, וכל תוויות ה-aria (Pause/Resume/Reset rest timer, Add 15 seconds). כל פקד חדש קורא ל-`primeAudio()`.

**הורדת דרגה:** השהיה, סיום ומחיקה עוברים לרצועה ככפתורים ניטרליים קומפקטיים. השמות "Finish" ו-"Discard" המדויקים נשמרים. כפתור "טיימר מנוחה" המושבת מוסתר כשיש טיימר.

**תיקוני לוגיקה במסך:**
- `formatSetTarget` מבטל את "יעד: 10" כשהטווח הוא 6–10.
- סט במוט בלי משקל: **סימון לא-חוסם**, "— ק״ג · הוספת משקל", ואזהרה ב-`FinishDialog`. חסימה אמיתית שוברת בדיקת e2e עברית שמשלימה סט בלי משקל.

**דסקטופ:** grid של `1fr 340px`. בעמודה הראשית ה-stage (44%) ליד רשימת הסטים. ב-aside: `RestPanel panel` ורשימת התרגילים.

**נשמר:**
- תרגיל אחד ברינדור.
- h1 יחיד, ושם התרגיל ב-h2.
- `.set-row-current .set-check` (קיצור `c`), `data-testid=set-row-N` ו-`set-row-done`.
- `undo-strip`, שמוצב מעל ה-dock; כאן גם מתקנים את `--bottom-nav-height` ל-`--bottomnav-h`.
- "Exercise 2 of 2".
- "All changes saved" גלוי.
- ה-`<details>` מכווצים.
- **קבצי הלוגיקה בלי diff:** `clock`, `queue`, `sync`, `storage`, `wakeLock`, `alarm`, `hooks`, `logic`, `shortcuts`, `prefs`.

### 5.2 בית: `DashboardPage.tsx` + `features/dashboard/*`

```
היום · יום ד׳ 28.10            (12, אפור — במקום "ערב טוב")
פלג גוף תחתון A                (28/700)
6 תרגילים · ~60 דק׳ · סקוואט, דדליפט רומני, לחיצת רגליים… (שורה)
[ התחלת אימון ] כתום מלא          ← או "חזרה לאימון" אם יש סשן (פעם אחת בלבד)
── השבוע ───────────────────────
א ב ג ▌ד ה ו ש   (פס ימים; ✓ רק לאימון שנספר; "1 מתוך 4")
── תזונה היום ────────────────── 1,092 / 2,340 קק״ל · חלבון 63/115 · [רישום]
── אחרון ─────────────────────── שורות: אימון אחרון · שיא אחרון · שינוי משקל
```

**יוצא:**
- הטבעות. שבוע ותזונה מוצגים ב-Tally וב-meter.
- אריחי הכרטיסים, `dash-rise`, ו-`--hero-bg` / `--gold`.
- ההודעה הכפולה על אימון פתוח. ה-pill בכותרת מוסתר ב-`/` כשה-Resume מוצג.

**מורד בדרגה ולא נמחק,** כי ה-e2e תלוי בו:
- "Level 1" עובר לשורת נתון אחת בתוך section השבוע.
- רשת 2×2 של פעולות מהירות הופכת לשורת קישורי טקסט: רישום משקל, שאלה למאמן, ספריית תרגילים.
- הברכה הופכת לשורת תאריך קטנה, ושם האימון הופך לכותרת.

**נשמר:**
- `week-outlook` ו-`today-reason`.
- ה-regions "Getting started" ו-"Workout in progress".
- הטקסט "0 of 4 workouts".
- אפס "Start workout" ו-"Resume workout" אחד בזמן סשן פתוח.

**דסקטופ:** עמודת עריכה עם האימון של היום. בצד ה-end שורות תזונה ואחרון. **בלי רשת כרטיסים.**

### 5.3 ספריית תרגילים: `ExerciseLibraryPage.tsx`, `features/exercises/{ExerciseCard,LibraryFilters,SearchBox}.tsx`

- **למעלה:** חיפוש ברוחב מלא, ומתחתיו פס קבוצות שרירים אופקי עם ספירה. הפריט הפעיל מסומן בקו תחתון כתום.
- **מסננים** (ציוד, רמה, דפוס, מיקום, "מתאים לציוד שלי", מועדפים) ב-sheet.
- **כרטיס תרגיל** הופך ל**שורה בגובה 72px:**
  - תמונה ממוזערת של האנימציה (64×64) בצד ה-start.
  - שם בעברית בגודל 16/600, ומתחתיו שם באנגלית בגודל 12 באפור.
  - שורת מטא: "חזה · מוט · בינוני".
  - ⭐ מועדף בצד ה-end.
  - בלי pills. אזהרת "חסר ציוד" מוצגת כאייקון עם טקסט.
- **קיבוץ** לפי קבוצת שריר, עם כותרת section.
- **נשמר:** `mark.ex-mark` ו-`.ux-no-results`.
- **דסקטופ:** פאנל מסננים קבוע בצד ה-start, ו-2 עמודות שורות.

**דף תרגיל** (`ExerciseDetailPage.tsx`):
- **פקדי הנגן:** Play/Pause, **"מההתחלה" (Restart)**, ו-¼× ½× 1×. לא משתמשים בשם "Replay", כי חיפוש ה-substring `{name:'Play'}` ב-e2e היה תופס גם אותו.
- **ראש הדף:** stage גדול בשליש העליון, עם שם ושורת מטא.
- **פעולה ראשית אחת:** "הוספה לאימון". "שאלה למאמן" הופך לקישור טקסט.
- **section-ים פתוחים** (בלי כרטיסים): עמידת פתיחה, ביצוע (רשימה ממוספרת בספרות ולא בעיגולים), נשימה, טעויות נפוצות (✕ אפור, בלי פס אדום), בטיחות, וריאציות קל/קשה, והיסטוריה שלך.
- **חלופות:** שורות, בלי כרטיס בתוך כרטיס.
- **נשמר:** `.anim`, ו-Play/Pause.
- **בלי באנר "יש לך ציוד".** במקומו ✓ קטן בשורת המטא.

### 5.4 התקדמות: `ProgressPage.tsx`, `sections/*`, `components/charts/Charts.tsx`

- **למעלה:** segmented של 7/30/90, ו**שורת סיכום** אחת: "4 אימונים · 48 סטים · 3,420 ק״ג נפח · 2 שיאים". זו שורה אחת, לא 6 אריחים.
  - **נשמר:** `.stat` ו-`.stat-value` בתוך region "Summary" כ-markup של שורה.
- **section-ים לפי סדר:**
  1. עקביות (פס שבועות)
  2. כוח: בחירת תרגיל, וגרף עם סדרה ראשית כתומה, סדרה משנית בפלדה ונקודת שיא כתומה עם תווית
  3. נפח לשרירים (bars אופקיים אפורים, עם כתום לחריגה)
  4. משקל גוף ומדידות ★
  5. תזונה
  6. שיאים
  7. הישגים: רשימה מקופלת, ולא רשת של 14 אריחים בעמוד הראשי. **נשמר:** `.achievement` ×14 ב-section המקופל, כלומר הבדיקה צריכה לפתוח אותו. אחרת משאירים פתוח.
- **גרפים:**
  - ציר Y בצד ימין ב-RTL, וצירים עם תוויות.
  - נשמרים: `dir=ltr` ל-SVG, טבלה מוסתרת לקורא מסך, ו-`role=img` עם title (ה-e2e תלוי ב-"Body weight (kg)").
  - אין חץ ↑ כשאין מספיק נתונים.
  - **נשמר:** `.progress-sparse-card`.

### 5.5 תזונה: `NutritionPage.tsx`, `features/nutrition/{DayOverview,MealSection,Macros,DateNavigator}.tsx`, `FoodLogPage.tsx`

- **ראש הדף:** תאריך בחצים בלבד; ה-input הנייטיב עובר לפופאובר. **נשמר:** `.nutri-date-title`.
- **שורת סיכום:** קק״ל גדול "1,092 / 2,340", ומתחתיו פס אחד כתום. אחריו 3 שורות מאקרו עם פס דק, אפור עם מילוי לבן-אפור. **בלי טבעות.** **נשמר:** `.macro-line`.
- **ארוחות:** section-ים פתוחים עם כותרת, סכום וכפתור "+". הרשומות כשורות. **בלי פסי קשת.**
- **מים ★:** שורה עם − / כוסות / +.
- **פעולה ראשית:** "רישום מזון". "מתכנן" ו"רשימת קניות" ★ כקישורים.
- **רישום מזון:**
  - segmented של חיפוש, אחרונים, שמורות וסריקה, ומתחת תפריט "עוד" לתמונה, הוספה מהירה, מזון חדש והצעות.
  - כפתור "+" בכל שורה הוא כפתור אייקון אפור. רק "סיום" כתום.
  - **נשמר:** כל 9 ה-`role=tab`, כי הבדיקות לוחצות על "Saved meals", "Quick add" ו-"Barcode". במובייל הם עוטפים לשתי שורות (5+4) ולא נחתכים. ה-segmented ו"עוד" הם רק אפשרות אם הבדיקות מתעדכנות.

### 5.6 אימונים ודף תוכנית: `WorkoutsPage.tsx`, `PlanDetailPage.tsx`, `features/workouts/*`

- **אימונים:** שורת התוכנית הפעילה (שם ותג "פעילה" טקסטואלי), שבוע ב-Tally, וה"אימון הבא" עם "התחלה" כתום יחיד. שאר התוכניות ברשימה.
- **דף תוכנית:**
  - ראש הדף: שם, מטרה ופיצול בשורה, בלי 4 אריחים.
  - שבוע.
  - "למה התוכנית נראית כך" ב-section מקופל.
  - ימי האימון כ-`article` (**נשמר:** 3 articles), עם שורות תרגילים קומפקטיות. כפתור "התחלה" מופיע רק ביום הבא, וכפתורי משנה עוברים לתפריט "⋯".
  - מחיקה עוברת לתפריט עם אישור.
  - תג "נוצרה ב-AI" מוסר.

### 5.7 מאמן, Onboarding, Auth, פרופיל, התראות, סיכום אימון

- **מאמן:** אזור ההודעות מקבל 75% מהמסך או יותר.
  - הודעה אחת על המצב (מובנה או AI) בכותרת.
  - בועת המשתמש: משטח `--surface-2` (לא כתום).
  - בלוקים מתויגים: "נתון / הערכה / המלצה".
  - **נשמר:** `.coach-msg*`.
- **Onboarding:**
  - כותרת אחת לכל שלב.
  - "אחורה" לא מופיע בשלב 1. "התנתקות" עובר לתפריט.
  - "הבא" כתום עם טקסט שחור.
  - **נשמר:** `[data-field]` ו-`dl` בסקירה.
- **Auth:**
  - wordmark של LUPU-FIT ממורכז-ימין, וטופס בלי כרטיס זוהר.
  - כלל סיסמה אחד בלבד.
  - **נשמר:** `.password-rules` ו-`.password-strength`.
- **פרופיל:**
  - ניווט section-ים כרשימה (מובייל) או סרגל (דסקטופ), ושמירה אחת בכל section.
  - **נשמר:** `#settings-*`.
- **התראות:**
  - שורות בלי אריחי גביע.
  - לא נקראו: טקסט מודגש ונקודה לבנה.
  - **נשמר:** `.notif-item`.
- **סיכום אימון:**
  - "האימון הושלם" (h1).
  - שורת נתונים: משך, סטים, חזרות ונפח.
  - **נשמר:** `.summary-stats .stat`.
  - טבלת תרגילים: מתוכנן מול בפועל.
  - שיאים מסומנים בסמן "PR" כתום.
  - **בלי confetti ומדליה.** פעולה הבאה אחת.

### 5.8 AppShell: `layout/AppShell.tsx`

- **כותרת מובייל:** wordmark "LUPU-FIT" (Barlow Condensed 700) עם סמל ה-Tally (קו אלכסוני כתום), חיפוש, מאמן, פעמון (נקודה כתומה במקום badge אדום) ואווטאר.
- **ה-session pill:** טקסט "אימון · 12:40" עם נקודה כתומה. **נשמר:** קיים בכל עמוד חוץ מעמוד האימון.
- **ניווט תחתון:** אייקון ותווית. במצב פעיל: אייקון כתום וקו עליון כתום של 2px.
- **סרגל צד בדסקטופ:** פריט פעיל עם פס כתום של 3px, בלי רקע ירוק-רך.
- **נשמר:** `ActiveSessionIndicator` mounted, ו-`useIsMobile(899)` מול ה-breakpoint של 900px.

---

## 6. ארכיטקטורת אנימציית התרגילים

**ההחלטה: לפתח את המנוע הקיים, לא להחליף אותו.**

המנוע הקיים (`shared/animation/engine.ts`) הוא שלד 2D מבוסס keyframes, עם IK דו-מפרקי, אביזרים ותצוגת צד או חזית. הוא מהיר, בלי תלויות, נפרד מהצבע, ולכל תרגיל יש בו keyframes משלו. האלטרנטיבות נבדקו ונדחו:
- **ספריות מסחריות** (GIF/וידאו של ExerciseDB/AscendAPI/MuscleWiki):
  - אנגלית בלבד.
  - איסור אחסון אופליין, או URL-ים שמתחלפים.
  - בלי שליטה במהירות.
- **free-exercise-db:** תמונות סטטיות ממקור לא ברור.
- **wger:** סטטי ברובו. CC-BY-SA, ורק 22 תרגילים בעברית.
- **מדיית NINJA:** המקור לא ידוע.

**מה מוסיפים:**

1. **מניפסט ומודל**
   - קובץ `shared/animation/manifest.ts` שממפה `exerciseId` לרשומה:
     - `{animationId, view: 'side'|'front'|'dual', status: 'verified'|'draft'|'blocked', reviewedBy, reviewedAt, qaVersion, tempo: {ecc, pauseBottom, con, pauseTop} | {holdSec}, phases:[{t,labelKey}]}`.
   - עמודה חדשה `exercises.demo_status`, נגזרת מהמניפסט בזמן ה-seed.
   - הספרייה ומחולל התוכניות מציגים **רק** תרגילים עם `verified`. השאר מוסתרים מאחורי דגל. מספר התרגילים הגלוי משתנה בהתאם, ולא מציגים "119" אם רק 100 מאומתים.

2. **QA ביומכני אוטומטי** (`scripts/animation-qa.ts`, נכנס ל-`npm run verify`). מעבירים את הבדיקות שכבר אבטיפסנו לסקריפט הזה:
   - **ROM:** ברך עד ~142°, ירך עד ~134°, כתף עד ~172°, מרפק עד ~150°, ובלי היפראקסטנציה מעבר ל-5°. עם חריגים מתועדים לכל תרגיל.
   - **IK reach:** שגיאת הגעה עד 1.5 יחידות כשיש מגע עם מוט, ידית או רצפה.
   - **pops:** קפיצת מפרק עד פי 4 מהצעד החציוני.
   - **penetration:** אין חדירה לספסל, לרצפה או לפלטה.
   - **uniqueness:** זוג תרגילים עם דמיון תנועה של 0.98 ומעלה נכשל, אלא אם הוא מסומן `sharedMotionWith` ואלמנט מבדיל נראה בבירור. למשל hammer מקבל תצוגת חזית עם אחיזה ניטרלית.
   - **coverage:** 100% מהתרגילים הגלויים הם `verified`.
   - דוח JSON/MD: `reports/animation-coverage.md`.

3. **תיקון התרגילים שסומנו**, בעדיפות לדוגמאות שבמפרט:
   - **ROM ו-IK:** `face_pull`, `barbell_back_squat`, `smith_machine_squat`, `lat_pulldown`, `leg_press`, `deadlift`, `muscle_up`.
   - **וריאציות curl:** אחיזה ונתיב משיכה נבדלים לכל וריאציה, למשל כבל עם קו משיכה ו-hammer בתצוגת חזית.
   - **תרגילי עומק:** flys, twists ו-woodchop מקבלים תצוגת `dual`, כלומר צד וחזית זה לצד זה.
   - **סקירה ויזואלית:** contact sheet לכל תרגיל, ש-`scripts/render-animations.ts` כבר יודע לייצר. כל תרגיל מסומן `verified` רק אחרי סקירה עם checklist כתוב: התחלה, מסלול, סוף, חזרה, ציוד ומגע.

4. **הנגן** (`features/animation/ExerciseAnimation.tsx`)
   - **מה נוסף:**
     - גודל `stage` למסך האימון.
     - "מההתחלה" (Restart, ולא "Replay"; ראו 5.3).
     - מהירויות 0.25×, 0.5× ו-1× (0.25× הוא "הילוך איטי ללמידה").
     - פס שלבים עם תווית שלב, למשל "ירידה" ו"דחיפה", מתוך `cues`.
     - חץ כיוון עדין בשלב התנועה.
     - טוגל צד וחזית כשהתצוגה היא `dual`.
     - מצב שגיאה ברור כשהאנימציה חסרה. כבר היום הנגן מחזיר `null`; נציג "הדגמה לא זמינה" ונחסום את הופעת התרגיל בספרייה.
   - **מה נמחק:** ה-`linearGradient` וה-`feGaussianBlur` (שורות 43-53).
   - **צבעים:** עוברים לטוקנים ב-`animation.css`. הגוף בגווני פחם ושנהב, שריר המטרה בכתום, הציוד בגווני פלדה.
   - **reduced-motion:** בלי autoplay. מוצגות תנוחת התחלה וסוף זו לצד זו, עם כפתור "הצג תנועה".
   - **נשמר בשביל הבדיקות:**
     - `.anim`, `role="img"`, ו-`direction="ltr"` על ה-SVG.
     - כפתורי Pause ו-Play עם טקסט.
     - IntersectionObserver.
     - ב-`main` של דף התרגיל אסור `<figure><img>` (יש e2e שבודק את זה).
   - **בדיקות חדשות** (Vitest/RTL ו-e2e): Restart, מהירויות, טוגל תצוגה, reduced-motion, מצב חסר.

5. **הרחבה**
   - **v1:** 100–119 תרגילים מאומתים.
   - **v1.x:** עוד 60. עורך keyframes פנימי ב-`/dev/animation-studio`, רק ב-development, עם onion-skin ובדיקות QA חיות.
   - **v2:** 300 ומעלה. לא מריצים pose-estimation על וידאו של צד שלישי. אם רוצים, מצלמים וידאו עצמי ברישיון מלא.

## 7. מנוע אימונים: תכנון, אימון חי, היסטוריה

**מחולל** (`server/src/modules/workouts/generator.ts`, `shared/training.ts`). נשמר, ומשפרים בו:
- **אזורי פגיעה עם חומרה**, מהרעיון של NINJA:
  - "כואב": מוציא תרגילים כבדים או פליומטריים ומקל על השאר.
  - "פצוע": מוציא כל תרגיל שמעמיס על האזור.
- **בדיקת מוכנות יומית** (עייף, רגיל, שיא) שמשנה את העומס של היום ומסבירה למה.
- **בלוקים של 4 שבועות** עם שבוע רביעי קל יותר.
- **תבניות calisthenics** וסביבת "outdoor".
- **שדות חדשים לכל אימון:** חימום, שחרור ומטרה.
- **הסבר "למה"** לכל תרגיל, מתוך קודי ה-generation_notes הקיימים.
- **החלפה חכמה:** דפוס תנועה + ציוד + מגבלות. קיים חלקית ב-`alternatives`, ויורחב.
- **הקפאה, החלפה ושכפול תוכנית:** מוסיפים `paused` למצבי התוכנית.
- **תרגילים אישיים:** טבלת `user_exercises`, בלי הדגמה.

**התקדמות:**
- נשאר מבוסס ביצוע. העלאה רק כשכל הסטים הושלמו בטווח החזרות העליון וה-RPE היה 8 ומטה.
- deload אחרי שני כישלונות.
- לקטינים: אין 1RM ואין עומס מקסימלי.

**אימון חי.** הלוגיקה נשמרת כמו שהיא:
- קבצים: `clock.ts`, `queue.ts`, `sync.ts`, `storage.ts`, `wakeLock.ts`, `alarm.ts`, `logic.ts`, `shortcuts.ts`, `shared/timer.ts`.
- החוזים שהקומפוזיציה החדשה חייבת להמשיך לקרוא להם:
  - `toggleComplete`
  - `setTimer`
  - `setIndex` דרך `session.currentExerciseIndex`
  - `sessionSync.settle`
  - `primeAudio()` בכל מחווה שמפעילה מנוחה

**תוספות לאימון החי:**
- **משקל חסר:** סט `weight_reps` בלי משקל מסומן "— ק״ג · הוספת משקל", ומופיעה אזהרה בסיום. **לא חוסמים**, כי בדיקת e2e עברית קיימת משלימה סט כזה.
- **יעד חזרות:** היעד של כל סט מוצג כטווח, "6–10".
- **דילוג על תרגיל:** סטטוס `skipped` ב-`session_exercises`.
- **מתוכנן מול בפועל:** היסטוריה שמראה את שניהם.
- **סשנים מתוכננים שלא בוצעו:** נגזרים מהתוכנית בזמן שאילתה (לא נשמרים) ומוצגים "לא בוצע" בלוח השנה.
- **תיקון סטים אחרי סיום:** הסט נערך ב-PATCH, ונוסף אליו `edited_at` ו-`audit` (הערך הקודם נשמר ב-`session_set_edits`). שיאים אישיים מחושבים מחדש בשרת.

## 8. תזונה, מתכנן ארוחות ורשימת קניות

**נשמר:**
- היעדים (`shared/nutrition.ts`).
- רישום, מזונות מותאמים, ארוחות שמורות, ברקוד ותמונה.
- **snapshot** של ערכי התזונה בכל רשומת לוג. זה כבר קיים, ושומר על יציבות ההיסטוריה.

**מקור הנתונים (Provenance).** נבדק מול המחקר: USDA FDC ברישיון CC0; Open Food Facts ברישיון ODbL; מאגר התזונה של משרד הבריאות (csv מ-2022). מוסיפים לטבלת `foods` את השדות:
- `source_dataset`, `source_version`, `license`, `attribution`
- `verification_status`: `gov_db` | `lab_db` | `label_verified` | `community` | `user` | `ai_estimate`
- `allergens_status`

**מה מוצג למשתמש:**
- תג "הערכה" על ערכים מ-AI או מהקהילה.
- דף מקורות נתונים.
- נתוני OFF לא מתערבבים עם seed אחר באותה רשומה.

**חדש:**
- מעקב מים: טבלת `water_log_entries` ומונה פשוט.
- **מתכנן ארוחות:**
  - טבלאות: `meal_plans`, `meal_plan_days`, `meal_plan_items`.
  - בנייה מתבניות קיימות ומארוחות שמורות.
  - סינון אלרגנים ותזונה דרך פונקציות ה-suggestions הקיימות.
  - עריכת מנות.
  - "רשום כארוחה" בלחיצה, שמייצר רשומות לוג אמיתיות.
- **רשימת קניות:**
  - טבלאות: `shopping_lists`, `shopping_list_items`.
  - נגזרת מארוחות נבחרות.
  - איחוד לפי `food_id` ויחידה.
  - סימון "נקנה".
  - פריטים ידניים.
  - יחידות: גרם לרכיבים, ו"יחידה" רק אם יש מידת הגשה ידועה.

**כללי בטיחות** (כבר בקוד, ומאשרים מול המחקר):
- גירעון של 750 קק״ל ביום לכל היותר.
- רצפות של 1,200 קק״ל לנשים ו-1,500 קק״ל לגברים.
- לקטינים: אין יעדי גירעון.
- סימני סיכון להפרעות אכילה משביתים את פיצ'רי הגירעון ומפנים לגורם מקצועי.

## 9. מאמן AI

**מה קיים:**
- `server/src/ai/llm.ts` עם `@anthropic-ai/sdk`, ברירת מחדל `claude-opus-5-5`, `effort=medium`.
- `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`).
- `output_config.format` לפלט JSON, ואימות zod.
- מכסות.
- מצב מובנה, מבוסס נתונים, שמסומן בבירור. **הוא לא צ'אטבוט מזויף.**

**שדרוגים:**
1. **SDK ל-1.x.** כולל `stop_reason: 'refusal'` ובדיקת `stop_details`.
2. **Streaming** לתשובות צ'אט, דרך SSE מהשרת.
3. **Prompt caching** ל-system prompt היציב.
4. **Tool use לקריאה בלבד** במקום לדחוס את כל ההקשר:
   - הכלים: `get_recent_sessions`, `get_plan`, `get_exercise`, `get_nutrition_summary`.
   - `tool_choice: auto`, כי כפיית כלי מחזירה 400 ב-Opus 5.5.
5. **"הצעת שינוי לתוכנית":** פלט מובנה שהמשתמש מאשר. המודל לא כותב ישירות.
6. **הבחנה בתשובה:** "נתון רשום" מול "הערכה" מול "המלצה", כבלוקים עם תוויות.

**תלות:** מפתח Anthropic. בלעדיו המצב המובנה ממשיך לעבוד. העלות לפי $4 ו-$20 למיליון טוקנים, עם מכסות יומיות.

## 10. מודל נתונים: שינויים

כל השינויים במיגרציות חדשות מ-`0090` והלאה, forward-only.

| שינוי | מהות |
|---|---|
| `exercises.demo_status` | הוספה |
| `exercise_favorites (user_id, exercise_id, PK)` | חדש |
| `user_exercises` | חדש |
| `workout_plans.status` | הוספת `paused` |
| `session_exercises.status` | `skipped` |
| `session_set_edits` | חדש, audit |
| `body_measurements (user_id, date, kind, value, unit)` | חדש. kind = waist, chest, hips, arm, thigh |
| `foods` | עמודות provenance |
| `water_log_entries` | חדש |
| `meal_plans` / `meal_plan_days` / `meal_plan_items` | חדש |
| `shopping_lists` / `shopping_list_items` | חדש |
| `workout_plans` / `plan_workouts` | `name_key`, `name_params jsonb`, `name_custom` |

**מה נשמר בכל שינוי:**
- `user_id NOT NULL` עם FK ו-CASCADE.
- סינון בשרת.
- CHECK constraints.
- zod ב-`shared/schemas/*`.

**מזהים קבועים** נשארים עם `fitai`:
- cookie `fitai_session`.
- מפתחות localStorage `fitai.*`.
- קידומת cache של ה-SW `fitai-shell-`.

שינוי שלהם רק בשלב נפרד, עם מיגרציה בצד הלקוח שקוראת קודם את הישן. אחרת תור הסטים שלא סונכרנו ילך לאיבוד.

## 11. File-level plan

**שלב 0: מבנה**
- ממזגים את `origin/claude/trusting-planck-p4zwmo` ל-branch.
  - בדקתי: ה-merge-base הוא `a9db60c` = HEAD, כלומר **fast-forward** של 73 commits.
  - כל 481 הקבצים נמצאים תחת `fitai/`. אין התנגשות עם LEVELUP.
- `git mv fitai lupifit`.
- `lupifit/package.json`: name, `engines >=22.13`, `@playwright/test 1.63.0`.

**מיתוג.** רק טקסט גלוי למשתמש:
- `client/index.html`
- `client/public/manifest.webmanifest`
- favicon ו-`scripts/make-icons.mjs`
- `i18n/locales/{he,en}/common.ts` (`appName`)
- `hooks/useDocumentTitle.ts`
- `server/src/modules/coach/{prompt,builtin,safety}.ts`
- `README.md` ו-`AGENTS.md`

הבדיקות שמאמתות "FITAI" מתעדכנות באותו commit:
- e2e: `workouts.spec.ts:12`
- לקוח: `progress/format.test.ts:99`
- שרת: `coach-*.test.ts`

**מערכת עיצוב:**
- `client/src/main.tsx`: מייבאים את `global.css` **ראשון**.
- `client/src/styles/global.css`:
  - הטוקנים של סעיף 4.
  - `@layer reset, tokens, base, components, screens, utilities`.
  - `@font-face`.
- חדש: `client/public/fonts/` עם `heebo-var.woff2`, `rubik-var.woff2` ו-`OFL.txt`.
- `scripts/build-sw-assets.mjs`: precache לגופנים.
- `components/ui/{Button,Display,Form,Icon,Overlay,States}.tsx`:
  - וריאנטים. `Badge` הופך לתג שטוח.
  - `Stat` עובר לשורת נתון.
  - `Card` מקבל `variant="section"` כברירת מחדל.
  - `Icon` מקבל `vector-effect`.
- חדש: `components/ui/Section.tsx` (כותרת, קו, שורות) ו-`components/ui/DataRow.tsx`.
- `features/gamification/AchievementsGrid.tsx` ו-`shared/gamification.ts`: אייקונים במקום אימוג'י.

**איחוד CSS.** מקפלים את קבצי `ux-*.css` ואת בלוקי ה-"Visual polish" למקור אחד לכל מסך. נשארים קבצים לכל מסך: `session`, `dashboard`, `workouts`, `exercises`, `nutrition`, `progress`, `coach`, `profile`.

**מסכים.** ראו סעיף 5. בכל מסך משנים את ה-page וה-features שלו. **אין שינוי ב-hooks, ב-api.ts ובלוגיקה.**

**אנימציה:**
- `features/animation/ExerciseAnimation.tsx`
- `features/animation/animation.css`
- `shared/animation/{types.ts,engine.ts}`: `dual`, phases ו-`tempo`. בלי לשנות keyframes קיימים, חוץ מהתיקונים.
- חדש: `shared/animation/manifest.ts`, `scripts/animation-qa.ts`
- `shared/animation/data/*.ts`: התיקונים מסעיף 6.

**שרת:**
- `server/src/db/migrations/0090_*.sql` והלאה.
- `modules/exercises/*`: favorites, `demo_status`, תרגילים אישיים.
- `modules/workouts/*`: paused, name keys.
- `modules/sessions/*`: skipped ו-edits.
- `modules/nutrition/*`: מים, מתכנן ורשימת קניות. אפשר מודול חדש `modules/mealplans/`.
- `modules/progress/*`: מדידות.
- `ai/llm.ts` ו-`modules/coach/*`: streaming, tools ו-caching.

**תיקוני באגים:**
- `features/coach/MessageBubble.tsx:49`
- `features/dashboard/WeeklyGoalCard.tsx`
- `features/progress/format.ts:39` (מאחדים עם `sessions/format.ts`)
- `features/workouts/PlanList.tsx` ו-`WorkoutDayCard.tsx`: בלי Start כשיש סשן פתוח.
- `layout/AppShell.tsx`: טאב פעיל, וניווט עם תרגילים.
- `pages/nutrition/FoodLogPage.tsx`: הטאבים הופכים ל-segmented עם 4 ראשיים ותפריט "עוד".
- ברירת מחדל לאזור זמן מהמכשיר בהרשמה: `modules/auth`.

## 12. תוכנית בדיקות

**נשמר וממשיך לעבור בכל שלב:**
- typecheck, lint, validate:content.
- 499 בדיקות שרת ו-151 בדיקות לקוח.
- 93 בדיקות E2E.
- mobile-audit: 13 routes × he/en × dark/light ב-360px.

**נוסף:**
- **Visual regression:** `e2e/tests/visual.spec.ts`. `toHaveScreenshot` לכל מסך, ב-he/en, dark/light ו-390/1440, עם mask לשעונים ולתאריכים. ה-baseline נלכד אחרי כל שלב עיצוב.
- **No-effects:** אותו מסך עם `e2e/fixtures/no-effects.css`. הבדיקה היא שאין חפיפה, חיתוך או גלילה אופקית, ושהפעולה הראשית עדיין גלויה.
- **ניגודיות:** `shared/design/contrast.test.ts` מחשב WCAG לכל זוג טוקנים בשתי ערכות הנושא. דרישות: 4.5 לטקסט ו-3 לפקדים.
- **axe:** `@axe-core/playwright` על 10 מסכים, עם אפס הפרות serious/critical.
- **אנימציה:** `animation-qa`, כלומר coverage, ROM, IK, pops, penetration ו-uniqueness. פלוס e2e לפקדים.
- **פיצ'רים חדשים:** אינטגרציה מול Postgres אמיתי ו-e2e למועדפים, מים, מתכנן ורשימת קניות, מדידות, skipped, תיקון סט עם audit, והקפאת תוכנית.
- **נעילת copy:** `scripts/e2e-strings.mjs` נכנס ל-`npm run lint`.
  - הוא מחלץ כל שם, label, text ו-testid שה-e2e מחפש.
  - אם אחד מהם כבר לא קיים בלוקאל `en` או בקוד, הבדיקה נכשלת.
  - שינוי מכוון מתעדכן ב-spec באותו PR.
- **בטיחות שמות נגישים:** כפתורים חדשים לא יכילו את המחרוזות Play, Pause, Finish, Complete set, Start workout, Resume workout או Undo.
  - בדיקת vitest-dom: כפתור `Complete set N` אחד לכל שורה.
  - `role=timer` יחיד בטיימר המנוחה.
- **`design-audit.spec.ts`:** מריצים computed-styles על כל ה-routes של mobile-audit, he/en × dark/light. אסור שיהיה:
  - גרדיאנט או backdrop-filter;
  - `box-shadow` מחוץ ל-overlays;
  - radius מעל 8px;
  - **יותר מכפתור כתום מלא אחד בכל viewport**;
  - Heebo שלא נטען;
  - גלילה אופקית.
- **Ratchet לעיצוב:** כללי CSS ב-`scripts/lint.mjs` (גרדיאנט, hex גולמי, font-size ב-px, pills, צל). הספירות נשמרות ב-`design-lint-baseline.json` ויכולות רק לרדת, עד 0.
- **זוגיות המפתחות he/en נשמרת.** פרויקט Playwright נפרד ל-`visual`, כדי שספירת ה-93 לא תשתנה.
- **לא מצהירים על "עובר"** בלי הרצה בפועל. הפלט נשמר כ-artifact.

## 13. סדר ביצוע: שלבים, תלויות וקריטריוני קבלה

| # | שלב | תלוי ב- | קריטריוני קבלה (מדידים) |
|---|---|---|---|
| 0 | **בסיס**: מיזוג FITAI ל-branch, `lupifit/`, מיתוג טקסטואלי, engines ו-Playwright 1.63, CI ב-GitHub Actions עם שירות Postgres 16 | — | כל השערים ירוקים ב-CI: typecheck, lint, content, 499+151, build, 93 E2E. אפס "FITAI" גלוי ב-UI, חוץ ממזהים קבועים מתועדים. |
| 1 | **מערכת עיצוב**: (1a) refactor CSS טהור: layers, סדר טעינה, איחוד ux-* ו-polish, הוצאת סגנונות ה-pill וה-bell מקבצי המסכים. Visual diff עד 0.5%, חוץ מ-3 תיקוני cascade מתועדים. (1b–e) טוקנים, גופנים, Tally, רכיבי UI, אייקונים, AppShell וניווט, וכלי השמירה (contrast, ratchet, e2e-strings, visual, design-audit, axe). | 0 | בדיקת ניגודיות עוברת. בדיקת grep: אפס `gradient` (חוץ מ-shimmer ו-fade פונקציונליים), אפס `box-shadow` צבעוני, אפס `backdrop-filter`, אפס ערכי `999px`, ו-radius רק מתוך טוקנים. כל הבדיקות הקיימות ירוקות. baseline ויזואלי נלכד. |
| 2 | **אימון חי** (המסך החשוב ביותר) + נגן `stage` | 1 | ב-390×844 בלי גלילה רואים: שם, אנימציה בגובה 300px לפחות, סט נוכחי עם משקל×חזרות, וכפתור כתום יחיד "השלמת סט N" בגובה 56px לפחות. לכל היותר 6 פקדים בתצוגה הראשונה. no-effects עובר. כל ה-e2e של session/gym-offline ירוקים. אי אפשר להשלים סט במוט בלי משקל. |
| 3 | **ספרייה, דף תרגיל ונגן מלא**: "מההתחלה" (Restart), 0.25/0.5/1, phase rail, dual, reduced-motion, thumbnail בתנוחת שיא. מועדפים. | 1 | e2e לפקדים. מועדפים נשמרים. אין יותר מתג אחד לכרטיס. מסנן פעיל בכתום. |
| 4 | **QA ותיקון אנימציות** + manifest + `demo_status` | 3 | `animation-qa` ירוק. coverage = 100% מהתרגילים הגלויים, כולם `verified` עם סקירה מתועדת. 15 התרגילים שסומנו תוקנו. ה-curls נבדלים. |
| 5 | **בית, אימונים ותוכנית** + באגי הסתירות | 1 | בית: הפעולה הראשית היחידה היא האימון של היום, או "חזרה לאימון" כשיש סשן פתוח. אין סתירות כמו ✓ מול 0/4. דף התוכנית קצר ב-60% לפחות. Start מופיע פעם אחת. |
| 6 | **התקדמות והיסטוריה**: ציר ימני ב-RTL, לוח שנה, מתוכנן מול בפועל, skipped, תיקון עם audit, מדידות | 1, 5 | כל גרף מגיע מה-DB, עם מצב ריק. פורמטר משך אחיד. דף ההתקדמות קצר ב-50% לפחות. |
| 7 | **תזונה**: עיצוב מחדש, provenance, מים, מתכנן ורשימת קניות | 1 | שינוי מנה מעדכן סכומים. רשימת הקניות מאחדת כפילויות. כל מזון מציג מקור. אין donut כפול. |
| 8 | **מאמן**: SDK 1.x, streaming, tools, caching, בלוקים מתויגים, תיקון `dir` | 0 | e2e מול fake LLM, כולל refusal ושגיאות. בדיקת key leak: אפס סודות ב-bundle. מצב מובנה עובד בלי מפתח. |
| 9 | **שאר המסכים** (Onboarding, Auth, פרופיל, התראות) + microcopy + שמות תוכנית מקודים | 1 | אחידות מגדרית ומינוחית לפי `voice-he.md`. החלפת שפה מתרגמת שמות תוכנית. mobile-audit עובר. |
| 10 | **הכנה לשחרור**: Dockerfile, deploy (Render או Fly + Postgres מנוהל), email, rate limit משותף, גיבויים, ביקורת אבטחה ופרטיות, Lighthouse | כל השלבים | ראו §14. |

**סדר ומקבילות:** אחרי שלב 1 אפשר להריץ במקביל את 2, 3 ו-4. אחר כך 5 ו-6. 7 ו-8 עצמאיים יחסית.

**אומדן גס:** 2–4 ימי עבודה לכל שלב עיצובי, ו-1–2 שבועות לשלב 4, שתלוי בכמות התיקונים.

## 14. Risk register ו-Release checklist

**סיכונים:**

| סיכון | פתרון |
|---|---|
| שבירת e2e משינוי טקסט או מבנה | רשימת ה-selectors הצמודים (`.set-row-current`, `data-testid` וכו') נשמרת. טקסט אנגלי משתנה רק עם עדכון הבדיקה באותו PR. |
| קיצור הדרך `c` שתלוי ב-`.set-row-current .set-check` | נשמר, או עובר ל-`data-` attribute. |
| כתום מול ענבר (warning) | אייקון וטקסט תמיד, לא צבע בלבד. |
| איכות האנימציות | QA אוטומטי + סקירה ידנית. ספרייה מצומצמת עדיפה על ספרייה "גדולה" עם תרגילים שגויים. |
| גופנים מכבידים על הטעינה | subset של עברית ולטינית, variable, precache. תקציב של עד 120KB. |
| ה-bundle הראשי 625KB | code-splitting לפי route. יעד: עד 250KB gzip לטעינה הראשונה. |
| עלויות AI | מכסות, caching, effort נמוך לשיחות פשוטות. |
| אין deployment לשרת + DB | Render או Fly + Postgres מנוהל. Supabase כ-Postgres בלבד דורש מקום פעיל (2 מתוך 2 תפוסים). **החלטת המשתמש.** |
| פרטיות (תיקון 13 לחוק הגנת הפרטיות) | נתוני בריאות הם מידע רגיש: מדיניות פרטיות, אבטחה וביקורת. **נדרש ייעוץ משפטי.** |

**Release checklist:**
- כל השערים ירוקים ב-CI, כולל visual, axe, contrast ו-animation-qa.
- Coverage של אנימציות 100% מהספרייה הגלויה.
- E2E של המסלולים העיקריים על בילד production: onboarding, תוכנית, אימון אופליין→סנכרון, סיכום, היסטוריה, תזונה ותכנון, מאמן.
- אפס סודות בצד הלקוח.
- גיבוי ושחזור נבדקו.
- email עובד.
- Lighthouse: PWA installable, ו-LCP עד 2.5s ב-Moto G Power מדומה.
- מדיניות פרטיות ודף מקורות נתונים.
- ביקורת אבטחה עצמאית.

## Verification

אחרי כל שלב, מתוך `lupifit/`:

```
npm run verify
npx playwright test
```

- Postgres 16 מקומי: `pg_ctlcluster 16 main start`. בסביבה הזו Playwright 1.63 מותקן מראש.
- בדיקות ייעודיות: `npm run qa:animation`, `visual.spec.ts`, `contrast.test.ts`, axe.
- בדיקה ידנית: מסך האימון ב-390×844 בעברית כהה, אופליין → סט → אונליין → סנכרון יחיד (בדיקה ב-DB).
