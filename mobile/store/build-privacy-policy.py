"""Writes the privacy policy in all its forms from one source (the lists below):
   mobile/store/privacy-policy.md, mobile/store/privacy-policy.html (to publish) and src/lib/legal/privacy-policy.ts (shown inside the app
   and on the website). Run from the repo root:  python3 mobile/store/build-privacy-policy.py"""
import json, re
DATE = "2026-10-21"
EN = [
("Who we are and what this covers", "This policy covers the LEVEL UP Android app (package <code>app.levelup.learn3d</code>), including its optional LUPU ID account and LEVEL UP AI feature. LEVEL UP (LUPU) makes educational 3D games that a learner builds from a library topic or from their own notes."),
("Without an account, we receive nothing", "LEVEL UP works fully on your phone without an account. If you do not sign in, the games you create, the notes you paste and your progress are stored only in the app's storage on your phone, and we receive nothing. The app contains no ads, no analytics and no tracking, and it asks for no permissions such as location, contacts, camera or microphone.<br>The app takes part in Android's own backup: if Android backup is switched on in your phone settings, Android (Google) keeps an encrypted copy of the app's data in your Google account, so it is still there after a reinstall or on a new phone. You can switch this off in Android settings. We never see that copy. Data goes elsewhere only if you choose it (the optional account below, LEVEL UP AI, or a backup file you export and save yourself)."),
("Optional LUPU ID and cloud backup", "LUPU ID is the name of the optional LEVEL UP account. If you create one, we store in our cloud database (Supabase, servers in the EU, Frankfurt):<ul><li>your email address and a securely hashed password, used only to sign you in. If you choose \"Continue with Google\", Google tells us your email address, your name and your Google account ID instead of a password. We use them only to sign you in and receive nothing else from your Google account (no contacts, calendar or files). We never see your Google password;</li><li>the games you created, your play progress and your \"review my mistakes\" list, used only to back them up and sync them between your devices.</li></ul>This data is sent encrypted (HTTPS), is readable only by your own account (row-level security), is never sold or shared with third parties, and is not used for advertising or profiling."),
("LEVEL UP AI (optional, only if you sign in and choose it)", "When you create a game with \"LEVEL UP AI\", the subject, goal, difficulty, language and any notes you typed for that game are sent over HTTPS to our AI service (a separate Supabase project in the EU, Frankfurt) together with your sign-in token, which is used only to check who is asking. The service passes them to an AI model provider, which writes the game, and sends the game back. We keep only a counter of your requests (your account ID, a time and whether it succeeded) to apply a daily limit. We do not store your subject, notes or the game. Nothing is sent unless you tap the button, and the app works fully without it."),
("Plus and Pro subscriptions (Google Play)", "Plus and Pro are monthly subscriptions bought and managed in Google Play. Google handles the payment under Google's own privacy policy, and we never receive your card or payment details. The app asks Google Play which subscription you have and keeps only that plan on your phone (it is part of Android's backup described above). It is not sent to our cloud, and no purchase data is stored in a LUPU ID. You can cancel at any time in Google Play's subscription settings."),
("How long we keep data", "Data on your phone stays until you delete it or uninstall the app. Cloud data of a LUPU ID stays until you delete the game, or the LUPU ID. The request counter of LEVEL UP AI is kept for a short period only to enforce the daily limit."),
("Your choices and your rights", "You can use the app without any account; sign out at any time; switch off Android backup; export a backup file; and delete your data. You may ask to see, correct or delete your data, or object to its processing, under the law that applies to you (for example the GDPR in the EU or the Protection of Privacy Law in Israel) by writing to the contact below. We answer within 30 days."),
("Deleting your data", "In the app: <i>Settings → LUPU ID and cloud backup → Delete my LUPU ID and cloud data</i> permanently deletes your LUPU ID and everything stored in the cloud (games on your phone stay until you delete them or uninstall the app). You can also request deletion by email at the address below; we act within 30 days. Signing out keeps your cloud data. Deleting a game in the app also deletes it from the cloud the next time the app syncs."),
("Security", "Everything sent to our servers goes over HTTPS. Access to cloud data is limited to your own account by row-level security rules. No secret keys are stored in the app."),
("Children", "The app is suitable for learners of all ages and a LUPU ID is never required. We do not knowingly collect more than the data listed above from anyone, and if a child creates a LUPU ID, only that data is stored. A parent or guardian can ask us to delete it at any time."),
("Changes to this policy", "If we change how data is handled we will update this page and its date, and ask again in the app where the law requires it."),
]
HE = [
("מי אנחנו ומה המדיניות הזו מכסה", "המדיניות חלה על אפליקציית האנדרואיד LEVEL UP (חבילה <code>app.levelup.learn3d</code>), כולל חשבון ה-LUPU ID האופציונלי ותכונת LEVEL UP AI. LEVEL UP (LUPU) יוצרת משחקי תלת-ממד לימודיים שהלומד בונה מנושא בספרייה או מהחומר שלו."),
("בלי חשבון, אנחנו לא מקבלים שום דבר", "LEVEL UP עובדת במלואה בטלפון גם בלי חשבון. אם לא מתחברים, המשחקים שיוצרים, החומר שמדביקים וההתקדמות נשמרים רק באחסון של האפליקציה בטלפון, ואנחנו לא מקבלים דבר. באפליקציה אין פרסומות, אין מדידה ואין מעקב, והיא לא מבקשת הרשאות כמו מיקום, אנשי קשר, מצלמה או מיקרופון.<br>האפליקציה משתתפת בגיבוי של אנדרואיד עצמו: אם הגיבוי מופעל בהגדרות הטלפון, אנדרואיד (גוגל) שומר עותק מוצפן של נתוני האפליקציה בחשבון ה-Google שלכם, כדי שיישארו אחרי התקנה מחדש או בטלפון חדש. אפשר לכבות זאת בהגדרות אנדרואיד. אנחנו לא רואים את העותק הזה. מידע עובר למקום אחר רק אם בחרתם בכך (החשבון האופציונלי שלמטה, LEVEL UP AI, או קובץ גיבוי שאתם מייצאים ושומרים בעצמכם)."),
("LUPU ID וגיבוי בענן (אופציונלי)", "LUPU ID הוא שם החשבון האופציונלי של LEVEL UP. אם יוצרים אותו, נשמרים במסד הנתונים שלנו בענן (Supabase, שרתים באיחוד האירופי, פרנקפורט):<ul><li>כתובת האימייל וסיסמה מוצפנת, לצורך התחברות בלבד. אם בוחרים ב\"המשך עם Google\", Google מעבירה אלינו את כתובת האימייל, את השם ואת מזהה חשבון ה-Google במקום סיסמה. אנחנו משתמשים בהם רק כדי להתחבר, ולא מקבלים דבר נוסף מחשבון ה-Google (לא אנשי קשר, יומן או קבצים). אנחנו לא רואים את הסיסמה שלכם ל-Google;</li><li>המשחקים שיצרתם, ההתקדמות ורשימת \"חזרה על טעויות\", לצורך גיבוי וסנכרון בין המכשירים שלכם בלבד.</li></ul>המידע נשלח מוצפן (HTTPS), נגיש רק לחשבון שלכם (אבטחה ברמת שורה), לא נמכר, לא מועבר לצד שלישי ולא משמש לפרסום או לפרופיילינג."),
("LEVEL UP AI (אופציונלי, רק אם התחברתם ובחרתם בו)", "כשיוצרים משחק עם \"LEVEL UP AI\", הנושא, המטרה, רמת הקושי, השפה והפתקים שהקלדתם למשחק הזה נשלחים ב-HTTPS לשירות ה-AI שלנו (פרויקט Supabase נפרד באיחוד האירופי, פרנקפורט) יחד עם אסימון ההתחברות שלכם, ששימושו היחיד הוא לבדוק מי מבקש. השירות מעביר אותם לספק מודל AI שכותב את המשחק, ומחזיר את המשחק. אנחנו שומרים רק מונה של הבקשות שלכם (מזהה החשבון, זמן והאם הצליחה) כדי להחיל מגבלה יומית. לא נשמרים הנושא, הפתקים או המשחק. שום דבר לא נשלח אלא אם לחצתם על הכפתור, והאפליקציה פועלת במלואה גם בלעדיו."),
("מנויי Plus ו-Pro (Google Play)", "Plus ו-Pro הם מנויים חודשיים שנרכשים ומנוהלים ב-Google Play. התשלום מטופל על ידי Google, לפי מדיניות הפרטיות של Google, ואנחנו לא מקבלים את פרטי הכרטיס או התשלום שלכם. האפליקציה שואלת את Google Play איזה מנוי יש לכם ושומרת בטלפון רק את התוכנית (היא חלק מהגיבוי של אנדרואיד שתואר למעלה). היא לא נשלחת לענן שלנו, ולא נשמר ב-LUPU ID שום מידע על רכישה. אפשר לבטל בכל עת בהגדרות המנויים של Google Play."),
("כמה זמן אנחנו שומרים מידע", "המידע בטלפון נשאר עד שתמחקו אותו או תסירו את האפליקציה. המידע בענן של LUPU ID נשאר עד שתמחקו את המשחק או את ה-LUPU ID. מונה הבקשות של LEVEL UP AI נשמר זמן קצר בלבד, כדי להחיל את המגבלה היומית."),
("הבחירות והזכויות שלכם", "אפשר להשתמש באפליקציה בלי חשבון; להתנתק בכל עת; לכבות את הגיבוי של אנדרואיד; לייצא קובץ גיבוי; ולמחוק את המידע. אפשר לבקש לעיין במידע, לתקן אותו, למחוק אותו או להתנגד לעיבודו, לפי הדין החל עליכם (למשל GDPR באיחוד האירופי או חוק הגנת הפרטיות בישראל), בפנייה לכתובת שלמטה. נענה תוך 30 יום."),
("מחיקת המידע", "באפליקציה: <i>הגדרות ← LUPU ID וגיבוי בענן ← מחיקת ה-LUPU ID והנתונים בענן</i> מוחקת לצמיתות את ה-LUPU ID ואת כל מה ששמור בענן (המשחקים בטלפון נשארים עד שתמחקו אותם או תסירו את האפליקציה). אפשר גם לבקש מחיקה באימייל לכתובת שלמטה, ונטפל תוך 30 יום. התנתקות משאירה את המידע בענן. מחיקת משחק באפליקציה מוחקת אותו גם מהענן בסנכרון הבא."),
("אבטחה", "כל מה שנשלח לשרתים שלנו עובר ב-HTTPS. הגישה למידע בענן מוגבלת לחשבון שלכם בלבד בכללי אבטחה ברמת שורה. באפליקציה לא נשמרים מפתחות סודיים."),
("ילדים", "האפליקציה מתאימה ללומדים בכל גיל, ואין חובה ליצור LUPU ID. אנחנו לא אוספים ביודעין יותר מהמידע שמפורט למעלה, ואם ילד יוצר LUPU ID נשמר רק מידע זה. הורה או אפוטרופוס יכולים לבקש מאיתנו למחוק אותו בכל עת."),
("שינויים במדיניות", "אם נשנה את אופן הטיפול במידע נעדכן את הדף ואת התאריך שלו, ונבקש הסכמה מחדש באפליקציה כשהחוק מחייב."),
]
CONTACT_EN = "Contact: <b>ADD YOUR SUPPORT EMAIL HERE</b>"
CONTACT_HE = "יצירת קשר: <b>הוסיפו כאן את כתובת הדוא\"ל לתמיכה</b>"
def md(s):
    for a, b in [("<b>", "**"), ("</b>", "**"), ("<code>", "`"), ("</code>", "`"), ("<i>", "*"), ("</i>", "*"), ("<br>", "\n\n"), ("<ul>", "\n\n"), ("</ul>", "\n\n"), ("</li>", "\n"), ("<li>", "- ")]:
        s = s.replace(a, b)
    return s
out = [f"# LEVEL UP — Privacy Policy (Android app)\n\n_Last updated: {DATE}_\n\n**English.**\n"]
for t, b in EN: out.append(f"### {t}\n\n{md(b)}\n")
out.append(md(CONTACT_EN) + "\n\n**עברית.**\n")
for t, b in HE: out.append(f"### {t}\n\n{md(b)}\n")
out.append(md(CONTACT_HE) + "\n")
open("mobile/store/privacy-policy.md","w").write("\n".join(out))
def sect(items): return "".join(f"<h2>{t}</h2><p>{b}</p>" for t, b in items).replace("<p><ul>","<ul>").replace("</ul></p>","</ul>").replace("</ul>","</ul>")
page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LEVEL UP — Privacy Policy / מדיניות פרטיות</title>
<style>
:root{{color-scheme:dark light;--bg:#0e1b17;--card:#182d27;--line:#2f4c41;--text:#f3f0e4;--muted:#a8b9ae;--accent:#ffd23f}}
@media (prefers-color-scheme:light){{:root{{--bg:#f6f1e7;--card:#fffefa;--line:#dcd2bf;--text:#1b2a24;--muted:#4f5c55;--accent:#1b5e44}}}}
body{{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 Rubik,system-ui,-apple-system,"Segoe UI","Noto Sans Hebrew",Arial,sans-serif}}
main{{max-width:46rem;margin:0 auto;padding:1.5rem 1rem 4rem}}
h1{{font-size:1.9rem;line-height:1.2;margin:.2rem 0 .3rem}} h2{{font-size:1.15rem;margin:1.6rem 0 .3rem;color:var(--accent)}}
p,li{{margin:.4rem 0}} .muted{{color:var(--muted)}} code{{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:0 .3em}}
section{{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:.6rem 1.2rem 1.2rem;margin:1.2rem 0}}
nav a{{color:var(--accent);font-weight:600;margin-inline-end:1rem}}
</style></head><body><main>
<h1>LEVEL UP</h1><p class="muted">Privacy Policy · מדיניות פרטיות · Last updated {DATE}</p>
<nav><a href="#en">English</a><a href="#he">עברית</a></nav>
<section id="en" lang="en" dir="ltr"><h1>Privacy Policy</h1>{sect(EN)}<p>{CONTACT_EN}</p></section>
<section id="he" lang="he" dir="rtl"><h1>מדיניות פרטיות</h1>{sect(HE)}<p>{CONTACT_HE}</p></section>
</main></body></html>
"""
open("mobile/store/privacy-policy.html","w").write(page)

# --- the data module the app and the website render (plain text, no markup) ---
def plain(t):
    for a, b in [("<code>", ""), ("</code>", ""), ("<i>", ""), ("</i>", ""), ("<b>", ""), ("</b>", "")]:
        t = t.replace(a, b)
    return t
def blocks(body):
    out = []
    parts = re.split(r"(<ul>.*?</ul>)", body, flags=re.S)
    for part in parts:
        if part.startswith("<ul>"):
            out.append({"ul": [plain(x) for x in re.findall(r"<li>(.*?)</li>", part, flags=re.S)]})
        else:
            out.extend({"p": plain(x).strip()} for x in part.split("<br>") if x.strip())
    return out
def doc(items, title):
    return {"title": title, "sections": [{"heading": plain(t), "blocks": blocks(b)} for t, b in items]}
data = {"en": doc(EN, "Privacy Policy"), "he": doc(HE, "מדיניות פרטיות")}
ts = ("// Generated by mobile/store/build-privacy-policy.py: edit the lists there, not this file.\n"
      "// The privacy policy as data, shown inside the app (Settings) and on the website (/privacy). Plain text only; Hebrew has no angle brackets.\n"
      "export type PolicyBlock = { p: string } | { ul: string[] };\n"
      "export interface PolicyDoc { title: string; sections: { heading: string; blocks: PolicyBlock[] }[] }\n"
      f'export const PRIVACY_UPDATED = "{DATE}";\n'
      f"export const PRIVACY_POLICY: Record<\"en\" | \"he\", PolicyDoc> = {json.dumps(data, ensure_ascii=False, indent=2)};\n")
open("src/lib/legal/privacy-policy.ts", "w").write(ts)
