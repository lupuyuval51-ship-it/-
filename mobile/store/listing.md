# Google Play listing text (copy into Play Console)

## Hebrew (he-IL) — default
**App name (≤30):** LEVEL UP – לומדים במשחק
**Short description (≤80):** מדביקים סיכום – ומקבלים משחק תלת־ממדי שמלמד בדיוק אותו. בלי אינטרנט.
**Full description:**
LEVEL UP הופכת את מה שאתם לומדים להרפתקה תלת־ממדית.
• הדביקו סיכום, הגדרות (מושג: הסבר), שלבים ממוספרים או שאלות ותשובות – מנוע הלמידה בונה ממנו משחק עם אתגרים: שאלות בחירה, התאמה, סידור שלבים, השלמת משפטים ועוד.
• בלי חומר? בחרו אחד מאות הנושאים המוכנים בספריית הנושאים (תוכן שנכתב ונבדק מראש, בכל רמה), או עקבו אחרי מסלול הלמידה בשברים, עשרוניים ואחוזים.
• ניקוד, רמזים, כוכבים ומסך "החזרה על הטעויות" עם תרגול של מה שפספסתם.
• "חזרה על הטעויות שלי": כל השאלות שפספסתם בכל המשחקים חוזרות בזמן הנכון (חזרה מרווחת: 1, 3, 7, 16 ימים).
• עברית, אנגלית וספרדית, שליטה במגע, שלוש רמות גרפיקה לטלפונים חזקים וחלשים.
• אפשר להתחיל בחינם. התוכניות Plus ו-Pro הן מנוי חודשי דרך Google Play (אפשר לבטל בכל עת בהגדרות המנויים של Google Play) ופותחות עוד נושאים, רמות ומשחקים.
• אופציונלי, למי שמחובר לחשבון: LEVEL UP AI כותב משחק לפי הנושא וההערות שלכם, רק אחרי לחיצה על הכפתור.
• פרטיות: בלי חשבון הכול נשאר בטלפון ולא צריך אינטרנט (חוץ מרכישת מנוי, שנעשית ב-Google Play). חשבון אופציונלי מגבה ומסנכרן בין טלפונים. אין פרסומות ואין מעקב.
שימו לב: משחק מחומר שהדבקתם נבנה בטלפון על ידי מנוע מבוסס חוקים, ומשחק מספריית הנושאים נבנה מתוכן שנכתב מראש. שניהם בלי בינה מלאכותית. רק משחק שביקשתם מ-LEVEL UP AI נכתב על ידי בינה מלאכותית, והוא מסומן כך.

## English (en-US)
**App name:** LEVEL UP – Learn by Playing
**Short description:** Paste your notes, get a 3D game that teaches exactly that. Works offline.
**Full description:**
LEVEL UP turns what you study into a 3D adventure.
• Paste notes, definitions (term: meaning), numbered steps or Q&A — the study engine builds a game from them: multiple choice, matching, ordering steps, fill-in-the-blank and more.
• No notes? Pick one of hundreds of ready-made topics from the topic library (content written and fact-checked in advance, at every level), or follow the learning path on fractions, decimals and percentages.
• Score, hints, stars and a "review your mistakes" screen with practice for what you missed.
• "Review my mistakes": every question you missed, in every game, comes back at the right time (spaced repetition: 1, 3, 7, 16 days).
• Hebrew, English and Spanish, touch controls, three graphics levels for strong and older phones.
• Start free. Plus and Pro are monthly subscriptions through Google Play (cancel any time in Google Play's subscription settings) that open more topics, levels and games.
• Optional, for signed-in learners: LEVEL UP AI writes a game from your subject and notes, only after you tap the button.
• Private: without an account everything stays on your phone and no internet is needed (except buying a subscription, which happens in Google Play). An optional account backs up and syncs between phones. No ads, no tracking.
Note: a game from notes you paste is built on the phone by a rule-based engine, and a game from the topic library is built from content written in advance. Neither uses AI. Only a game you ask LEVEL UP AI for is written by AI, and it is labelled as such.

## Play Console answers (as built)
- Ads: **No**. In-app purchases: **Yes**: two monthly subscriptions through Google Play Billing (`levelup_plus`, `levelup_pro`), never Stripe; see "Subscriptions in the Play Console" in `docs/play-release.md`.
- Data safety (with the optional account; derivation and the full table in `docs/play-release.md`):
  - Data collected: **Personal info → Email address** and **User IDs** (account management), **Name** (only with Google sign-in),
    **App activity → Other user-generated content** (the games: title and generated content from the user's notes; and, only when
    the learner taps LEVEL UP AI, the subject, goal and notes sent to write that one game, processed ephemerally and not stored)
    and **Other actions** (play progress, review list) — app functionality, backup/sync. All **optional** (only with an account).
  - Shared with third parties: **No**. Processed by our backend provider Supabase on our behalf (that is not "sharing").
  - Encrypted in transit: **Yes**. Users can request deletion: **Yes** (in-app + web page `account-deletion.md`).
  - Without an account nothing is collected. The purchase itself is handled by Google Play; the app only keeps the plan Play reports, on the phone.
- Target audience: your decision. The optional account collects an e-mail address, so if under-13s are a target audience the Families policy (COPPA/GDPR, disclosure of personal information collected from children) applies — see `docs/play-release.md` §5. Simplest: 13+.
- Content rating questionnaire: educational, no violence/sexual content/gambling, no user-to-user communication.
- Privacy policy URL: host `privacy-policy.md` (e.g. GitHub Pages or Google Sites) and paste the link.
- Data deletion URL (required because the app lets people create accounts): host `account-deletion.md` and paste the link.
- App access for reviewers: no login is needed to use the app (the account is optional). Because the account is a visible feature, also give a ready, confirmed test account (e-mail + password, in English) in the App access instructions.
