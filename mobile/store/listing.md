# Google Play listing text (copy into Play Console)

## Hebrew (he-IL) — default
**App name (≤30):** LEVEL UP – לומדים במשחק
**Short description (≤80):** מדביקים סיכום – ומקבלים משחק תלת־ממדי שמלמד בדיוק אותו. בלי אינטרנט.
**Full description:**
LEVEL UP הופכת את מה שאתם לומדים להרפתקה תלת־ממדית.
• הדביקו סיכום, הגדרות (מושג: הסבר), שלבים ממוספרים או שאלות ותשובות – מנוע הלמידה בונה ממנו משחק עם אתגרים: שאלות בחירה, התאמה, סידור שלבים, השלמת משפטים ועוד.
• בלי חומר? בחרו נושא ושחקו במשחק הדגמה מוכן.
• ניקוד, רמזים, כוכבים ומסך "החזרה על הטעויות" עם תרגול של מה שפספסתם.
• "חזרה על הטעויות שלי": כל השאלות שפספסתם בכל המשחקים חוזרות בזמן הנכון (חזרה מרווחת: 1, 3, 7, 16 ימים).
• עברית ואנגלית, שליטה במגע, שלוש רמות גרפיקה לטלפונים חזקים וחלשים.
• פרטיות: בלי חשבון הכול נשאר בטלפון ולא צריך אינטרנט. חשבון אופציונלי מגבה ומסנכרן בין טלפונים. אין פרסומות ואין מעקב.
שימו לב: המשחקים נבנים על ידי מנוע מבוסס חוקים או מגיעים מתבניות הדגמה – לא על ידי בינה מלאכותית.

## English (en-US)
**App name:** LEVEL UP – Learn by Playing
**Short description:** Paste your notes, get a 3D game that teaches exactly that. Works offline.
**Full description:**
LEVEL UP turns what you study into a 3D adventure.
• Paste notes, definitions (term: meaning), numbered steps or Q&A — the study engine builds a game from them: multiple choice, matching, ordering steps, fill-in-the-blank and more.
• No notes? Pick a subject and play a ready-made demo game.
• Score, hints, stars and a "review your mistakes" screen with practice for what you missed.
• "Review my mistakes": every question you missed, in every game, comes back at the right time (spaced repetition: 1, 3, 7, 16 days).
• Hebrew and English, touch controls, three graphics levels for strong and older phones.
• Private: without an account everything stays on your phone and no internet is needed. An optional account backs up and syncs between phones. No ads, no tracking.
Note: games are built by a rule-based engine or come from demo templates — not by AI.

## Play Console answers (as built)
- Ads: **No**. In-app purchases: **No** (version 1 is free).
- Data safety (with the optional account; derivation and the full table in `docs/play-release.md`):
  - Data collected: **Personal info → Email address** and **User IDs** (account management), **App activity → Other user-generated
    content** (the games: title and generated content from the user's notes) and **Other actions** (play progress, review list)
    — app functionality, backup/sync. All **optional** (only with an account).
  - Shared with third parties: **No**. Processed by our backend provider Supabase on our behalf (that is not "sharing").
  - Encrypted in transit: **Yes**. Users can request deletion: **Yes** (in-app + web page `account-deletion.md`).
  - Without an account nothing is collected.
- Target audience: your decision. The optional account collects an e-mail address, so if under-13s are a target audience the Families policy (COPPA/GDPR, disclosure of personal information collected from children) applies — see `docs/play-release.md` §5. Simplest: 13+.
- Content rating questionnaire: educational, no violence/sexual content/gambling, no user-to-user communication.
- Privacy policy URL: host `privacy-policy.md` (e.g. GitHub Pages or Google Sites) and paste the link.
- Data deletion URL (required because the app lets people create accounts): host `account-deletion.md` and paste the link.
- App access for reviewers: no login is needed to use the app (the account is optional). Because the account is a visible feature, also give a ready, confirmed test account (e-mail + password, in English) in the App access instructions.
