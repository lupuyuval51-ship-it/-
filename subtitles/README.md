# כתוביות חינם · Free Subtitles

העלו סרטון — קבלו כתוביות מדויקות, בכל שפה, על כל אורך הסרטון. **בחינם לגמרי, בלי הרשמה, בלי
מפתח API, בלי מגבלת דקות.** הכל רץ בתוך הדפדפן שלכם; הקובץ לא נשלח לשום שרת.

> Upload a video, get accurate subtitles in any language, for the whole video.
> 100% free, no sign-up, no API key, no minute limits — everything runs locally
> in your browser and no file ever leaves your device.

---

## איך זה עובד

| שלב | מה קורה | איפה |
| --- | --- | --- |
| 1 | חילוץ פס הקול והמרה ל‑16kHz מונו | Web Audio, ואם הדפדפן לא מכיר את הפורמט — `ffmpeg.wasm` |
| 2 | תמלול עם **Whisper** (`transformers.js`) | Web Worker, על WebGPU ואם אין — WASM |
| 3 | זיהוי שפת הדיבור | ה‑API המובנה של הדפדפן, ואם אין — זיהוי לפי כתב ומילות פונקציה |
| 4 | תרגום לכל שפה שנבחרה | המתרגם המובנה של Chrome, ואם אין — **NLLB‑200** מקומי |
| 5 | עריכה, תצוגה מקדימה מסונכרנת והורדה | SRT · WebVTT · טקסט |

הסרטון מחולק לבלוקים של שתי דקות עם חפיפה, כך שגם סרטון של שעתיים מתומלל במלואו בלי
לתפוס זיכרון מיותר, והתוצאות מופיעות תוך כדי העבודה.

## הפעלה מקומית

```bash
cd subtitles
node serve.js          # http://localhost:8080
```

מודולי ES ו‑Web Workers דורשים מקור `http` אמיתי, לכן פתיחת `index.html` ישירות מהדיסק
לא תעבוד. כל שרת סטטי מתאים (`npx serve`, `python3 -m http.server`, nginx).

`COI=1 node serve.js` מוסיף את הכותרות `Cross-Origin-Opener-Policy` ו‑`Cross-Origin-Embedder-Policy`,
שמפעילות WASM בריבוי תהליכונים. זה כבוי כברירת מחדל משתי סיבות: אחסון סטטי חינמי בדרך כלל
לא מאפשר לקבוע כותרות בכלל, ובחלק מהדפדפנים טעינת מודל בריבוי תהליכונים בתוך Web Worker
נתקעת. הפעילו את זה רק אם מדדתם שיפור אצלכם.

## אירוח (חינם)

התיקייה כולה סטטית. אפשר להעלות אותה כמו שהיא ל‑GitHub Pages, Netlify, Cloudflare Pages
או כל אחסון סטטי אחר:

```bash
# GitHub Pages: Settings → Pages → Deploy from a branch → בחרו את הענף ואת התיקייה /subtitles
```

## שימוש אופליין או מאחורי חומת אש

ברירת המחדל מושכת את הספריות מ‑jsDelivr ואת המודלים מ‑Hugging Face (פעם אחת; אחר כך הם
נשמרים ב‑Cache של הדפדפן ואפשר לעבוד גם בלי אינטרנט). מי שרוצה לארח הכול בעצמו יכול
להעביר את הכתובות בפרמטרים:

```
index.html?cdn=/vendor&models=/models/
```

* `cdn` — בסיס שמשקף את מבנה ה‑npm: `<cdn>/@huggingface/transformers@<version>/dist/transformers.min.js`
  (משמש גם ל‑`onnxruntime-web` ול‑`ffmpeg.wasm`).
* `models` — בסיס במבנה Hugging Face: `<models><repo>/resolve/main/<file>`.

## מודלים

| מודל | גודל הורדה | מתי לבחור |
| --- | --- | --- |
| `whisper-tiny` | ‎~45MB | טיוטה מהירה מאוד |
| `whisper-base` | ‎~85MB | ברירת מחדל טובה למחשב בלי WebGPU |
| `whisper-small` | ‎~250MB | האיזון המומלץ בין דיוק למהירות |
| `whisper-large-v3-turbo` | ‎~800MB | הדיוק הגבוה ביותר; מומלץ עם WebGPU |

התרגום מנסה קודם את המתרגם המובנה של הדפדפן (Chrome) — הוא מיידי ולא דורש הורדה. אם הוא
לא זמין, או לא מספיק להתכונן תוך 25 שניות (למשל כשהדפדפן צריך למשוך חבילת שפה משלו),
האפליקציה עוברת ל‑`Xenova/nllb-200-distilled-600M` שרץ מקומית (‎~850MB, הורדה חד‑פעמית).

## שפות

80 שפות, כל צירוף ביניהן: עברית, ערבית, אנגלית, רוסית, ספרדית, צרפתית, גרמנית, סינית,
יפנית, הינדי, פרסית, אמהרית, תאילנדית ועוד. הרשימה המלאה נמצאת ב‑`src/languages.js`,
עם קוד Whisper לתמלול וקוד FLORES‑200 לתרגום.

## בדיקות

```bash
npm test        # node --test — עיצוב זמנים, מיזוג בלוקים, SRT/VTT, זיהוי שפה
```

בדיקת קצה‑לקצה בדפדפן אמיתי (דורשת Playwright מותקן):

```bash
node tests/e2e.mjs <path-to-video-or-audio>
```

## מבנה הקוד

```
subtitles/
├── index.html          שלד הממשק (עברית/RTL כברירת מחדל, אנגלית/LTR מלאה)
├── assets/styles.css
├── serve.js            שרת סטטי לפיתוח, בלי תלויות
└── src/
    ├── app.js          תזמור הצינור, מצב, רינדור התוצאות
    ├── worker.js       Whisper + NLLB ב‑Web Worker
    ├── audio.js        Web Audio ← ffmpeg.wasm
    ├── subtitles.js    ניקוי מקטעים, מיזוג בלוקים, SRT/VTT/TXT
    ├── detect.js       זיהוי שפה מהתמלול
    ├── translate.js    המתרגם המובנה של הדפדפן
    ├── languages.js    טבלת השפות
    ├── config.js       כתובות ה‑CDN והמודלים
    └── i18n.js         מחרוזות הממשק
```

## מגבלות ידועות

* התמלול רץ על המעבד/כרטיס המסך של המשתמש: WebGPU מהיר בערך פי 5–10 מ‑WASM.
* התצוגה המקדימה בנגן עובדת רק לפורמטים שהדפדפן יודע לנגן; קובץ MKV או AVI יתומלל
  דרך `ffmpeg.wasm` אבל לא יוצג בנגן.
* דפדפן ללא WebGPU יעבוד, אבל סרטון ארוך עם המודל הגדול ייקח זמן רב.
* קובץ נטען לזיכרון בשלמותו לצורך חילוץ האודיו; קבצים מעל ‎~2GB עלולים להיכשל.
* התרגום מתבצע שורה‑שורה, כך שההקשר בין משפטים שמור חלקית בלבד.
