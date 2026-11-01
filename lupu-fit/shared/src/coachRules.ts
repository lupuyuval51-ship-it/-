/**
 * Pre-LLM safety interceptor + deterministic rules coach.
 *
 * IMPORTANT: this is a deterministic first-line safety shield (regex/keyword rules in Hebrew and English),
 * NOT a clinical guarantee. It will miss phrasings and can over-trigger. It exists so that the most
 * serious categories never reach an external model unreviewed, and always get a human-resource response.
 */
import type { AgeBucket, Goal, Language, ReadinessState } from './enums.js';

export type SafetyCategory = 'self_harm' | 'medical_emergency' | 'eating_disorder' | 'ped_dosing';
export interface SafetyHit { category: SafetyCategory; matched: string }

function normalizeCoach(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳״]/g, '')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const NEGATION = /(?:^|[\s,.;:!?])(?:no|not|without|never|zero|free of|dont|don't|do not|doesnt|doesn't|ללא|בלי|אין|אינ[וי]|לא)\s+(?:\S+\s+){0,2}$/;

function negatedBefore(text: string, index: number): boolean {
  return NEGATION.test(text.slice(Math.max(0, index - 40), index));
}

interface Rule { category: SafetyCategory; re: RegExp }

const PED_EN = String.raw`steroids?|anabolics?|sarms?|ostarine|rad[- ]?140|lgd[- ]?4033|trenbolone|tren|clenbuterol|clen|hgh|growth hormone|testosterone|deca|dianabol|dbol|anavar|winstrol|insulin`;
const PED_INTENT_EN = String.raw`dos(?:e|es|age|ing)|how much|cycle|stack|inject|mg|protocol|should i (?:take|run|use)|how (?:long|often) (?:to|should)|pct`;
const PED_HE = String.raw`סטרואיד\S*|אנבולי\S*|סארמס|סרמס|טרנבולון|קלנבוטרול|הורמון גדילה|טסטוסטרון|דיאנבול|אנבר|וינסטרול`;
const PED_INTENT_HE = String.raw`מינון|מינונ\S*|כמה (?:מ"ג|מג|להזריק|לקחת|יחידות)|קורס|סייקל|לשלב|להזריק|זריק\S*|פרוטוקול|לקחת`;

const RULES: Rule[] = [
  /* ---- self-harm (EN) */
  { category: 'self_harm', re: /\b(?:kill(?:ing)? myself|end(?:ing)? (?:my own|my) life|take my own life|suicid(?:e|al)|want to die|wanna die|(?:dont|don't) want to (?:live|be alive|exist)|better off dead|no reason to live|(?:hurt|harm|cut)(?:ting)? myself|self[- ]?harm)\b/ },
  /* ---- self-harm (HE) */
  { category: 'self_harm', re: /(?:להתאבד|מתאבד|מחשבות אובדניות|אובדני|רוצה למות|לא רוצה לחיות|אין טעם לחיות|לפגוע בעצמי|פגיעה עצמית|לחתוך את עצמי|להרוג את עצמי|לסיים את החיים)/ },

  /* ---- medical emergency (EN) */
  { category: 'medical_emergency', re: /\b(?:chest (?:pain|pressure|tightness)|pain in (?:my )?chest|(?:pain|numbness) (?:radiating|spreading|shooting|going) (?:down |in |to |into )?(?:my )?(?:left )?(?:arm|jaw|shoulder)|(?:fainted|fainting|passed out|blacked out|syncope|lost consciousness)|(?:cant|can't|cannot|unable to) (?:breathe|catch my breath)|(?:severe|extreme|sudden) (?:shortness of breath|difficulty breathing|breathlessness)|short of breath (?:at rest|while resting)|i (?:tore|ruptured|snapped|dislocated|broke) (?:my )?\w+|heard a (?:loud )?(?:pop|snap) (?:and|then) (?:can't|cannot|couldn't))\b/ },
  /* ---- medical emergency (HE) */
  { category: 'medical_emergency', re: /(?:כאב(?:ים)? בחזה|לחץ בחזה|הידוק בחזה|כאב שמקרין|מקרין (?:ל|אל )?(?:זרוע|לסת|יד שמאל|כתף שמאל)|התעלפתי|התעלפות|איבדתי הכרה|לא מצליח לנשום|קוצר נשימה (?:חמור|פתאומי|במנוחה)|שמעתי (?:קראק|פצפוץ חזק)|קרעתי|שברתי)/ },

  /* ---- eating disorder (EN) */
  { category: 'eating_disorder', re: /\b(?:make myself (?:throw up|vomit|puke)|induce (?:vomiting|purging)|purg(?:e|ing) (?:after|to|my)|throw(?:ing)? up (?:after (?:eating|meals)|what i (?:ate|eat))|laxatives? (?:to|for) (?:lose|burn|weight)|starv(?:e|ing) myself|binge and purge|pro[- ]?ana|thinspo|anorexi(?:a|c) tips|i hate my body so much)\b/ },
  /* ---- eating disorder (HE) */
  { category: 'eating_disorder', re: /(?:גורם לעצמי להקיא|להקיא אחרי|מקיא אחרי|מרעיב את עצמי|להרעיב את עצמי|משלשל\S* כדי לרדת|כדורי משלשל|שונא את הגוף שלי כל כך|בולימיה שלי|האנורקסיה שלי)/ },
];

/** Crash-calorie detector: "eating 600 calories a day" → eating disorder category when < 800 kcal/day. */
const CRASH_EN = /(?:eat(?:ing)?|consum(?:e|ing)|live on|living on|diet(?:ing)? on)\s+(?:only\s+|just\s+|about\s+|around\s+)?(\d{2,4})\s*(?:kcal|cal(?:ories)?)\s*(?:a day|per day|daily|each day|\/day|today)/;
const CRASH_HE = /(?:אוכל|אוכלת|לאכול|צורך)\s+(?:רק\s+|בערך\s+)?(\d{2,4})\s*(?:קק?ל|קלוריות|קילוקלוריות)\s*(?:ביום|ליום|כל יום|היום)/;

const BENIGN_STEROID = /\b(?:cortisone|corticosteroid|prednisone|inhaler|nasal spray|steroid (?:cream|injection into|shot in)|topical)\b|קורטיזון|בשאיפה|משאף|קרם סטרואידים/;

export function classifySafety(input: string): SafetyHit | null {
  const text = normalizeCoach(input);
  if (!text) return null;

  for (const r of RULES) {
    const m = r.re.exec(text);
    if (m && !negatedBefore(text, m.index)) return { category: r.category, matched: m[0] };
  }

  for (const re of [CRASH_EN, CRASH_HE]) {
    const m = re.exec(text);
    if (m?.[1] && Number(m[1]) < 800 && !negatedBefore(text, m.index)) return { category: 'eating_disorder', matched: m[0] };
  }

  if (!BENIGN_STEROID.test(text)) {
    const en = new RegExp(String.raw`\b(?:${PED_EN})\b`).exec(text);
    const enIntent = new RegExp(String.raw`\b(?:${PED_INTENT_EN})\b`).test(text);
    if (en && enIntent) return { category: 'ped_dosing', matched: en[0] };
    const he = new RegExp(`(?:${PED_HE})`).exec(text);
    const heIntent = new RegExp(`(?:${PED_INTENT_HE})`).test(text);
    if (he && heIntent) return { category: 'ped_dosing', matched: he[0] };
  }
  return null;
}

const RESPONSES: Record<SafetyCategory, Record<Language, string>> = {
  self_harm: {
    he: 'מה שנכתב כאן חשוב לי, ואין סיבה להישאר לבד. אם יש סכנה מיידית, חייגו עכשיו 101 (מד״א) או 100 (משטרה). אפשר לדבר גם עם ער״ן בטלפון 1201 (24/7, אנונימי), או בווטסאפ בחיפוש "ער״ן". מחוץ לישראל: 988 (ארה״ב) או שירותי החירום המקומיים. כדאי לפנות עכשיו לאדם קרוב ולא להישאר לבד. אני מערכת אימון ממוחשבת ולא תחליף לאיש מקצוע, אבל אני כאן.',
    en: 'What you wrote matters, and you are not alone. If you are in immediate danger, call your local emergency number now (101 in Israel, 911 in the US, 112 in the EU). You can also reach ERAN in Israel at 1201 (24/7, anonymous) or call/text 988 in the US. Please reach out to someone close to you right now rather than staying alone. I am an automated fitness coach, not a replacement for a professional, but I am here.',
  },
  medical_emergency: {
    he: 'עצרו את האימון עכשיו. תסמינים כמו כאב בחזה, כאב שמקרין לזרוע או ללסת, התעלפות, קוצר נשימה חמור או פגיעה חדה דורשים בדיקה רפואית דחופה. חייגו 101 (מד״א) או פנו למיון. אל תמשיכו להתאמן ואל תנהגו לבד אם אתם לא חשים בטוב. המערכת אינה יכולה לאבחן, ואין תחליף לאיש רפואה.',
    en: 'Stop training now. Symptoms like chest pain, pain radiating to the arm or jaw, fainting, severe shortness of breath or an acute injury need urgent medical evaluation. Call your local emergency number (101 in Israel, 911 in the US) or go to the ER. Do not keep exercising, and do not drive yourself if you feel unwell. I cannot diagnose, and I am no substitute for medical care.',
  },
  eating_disorder: {
    he: 'תודה על השיתוף, וזה לא קל לכתוב. מה שתיארת עלול לפגוע בגוף ובנפש, ואין בזה בושה לבקש עזרה. לא אספק תוכנית שמרחיקה מאוכל מספק. כדאי לפנות לרופאת משפחה, לרופא משפחה או לאיש מקצוע בתחום הפרעות אכילה. בישראל: ער״ן 1201, או קו התמיכה של אנוריקסיה ובולימיה (ע״ר). אפשר לדבר איתי על הרגלים בריאים, אבל לא על הרעבה או הקאה.',
    en: 'Thank you for sharing, that is not easy to write. What you described can seriously harm body and mind, and there is no shame in asking for help. I will not give a plan that moves you away from adequate food. Please consider talking to your doctor or an eating-disorder professional. In Israel you can call ERAN at 1201; in the US, the NEDA-affiliated helplines or 988. I am happy to talk about healthy habits, but not about starving or purging.',
  },
  ped_dosing: {
    he: 'לא אספק מינונים, קורסים או הנחיות לשימוש בסטרואידים אנבוליים, SARMs, הורמון גדילה או חומרים דומים. הם עלולים לפגוע בלב, בכבד, בהורמונים ובמצב הנפשי, ושימוש ללא פיקוח רפואי מסוכן, במיוחד מתחת לגיל 18. אשמח לעזור באימון, בתזונה, בשינה ובהתאוששות כדי להתקדם בצורה בטוחה, ואם יש שאלה רפואית כדאי לפנות לרפואת ספורט.',
    en: 'I will not give doses, cycles or usage guidance for anabolic steroids, SARMs, growth hormone or similar substances. They can harm the heart, liver, hormones and mental health, and unsupervised use is dangerous, especially under 18. I am glad to help with training, nutrition, sleep and recovery to progress safely, and for medical questions please see a sports physician.',
  },
};

export function safetyResponse(category: SafetyCategory, lang: Language): string {
  return RESPONSES[category][lang];
}

/* ===================================================== rules-based coach */

export interface CoachSnapshot {
  ageBucket: AgeBucket;
  goal: Goal;
  todayWorkout: { name: string; exerciseCount: number } | null;
  recentWorkouts: { date: string; sets: number }[];
  prs: { exerciseName: string; est1rmKg: number }[];
  nutrition7d: { loggedDays: number; avgKcal: number | null; avgProteinG: number | null };
  targets: { kcal: number; proteinG: number } | null;
  weightTrendKg: { deltaKg: number; days: number } | null;
  readiness: ReadinessState | null;
}

type Intent = 'workout' | 'protein' | 'calories' | 'weight' | 'pr' | 'recovery' | 'general';

function detectIntent(q: string): Intent {
  const t = normalizeCoach(q);
  if (/(protein|חלבונ?)/.test(t)) return 'protein';
  if (/(calor|kcal|קלורי|קק"?ל|קקל)/.test(t)) return 'calories';
  if (/(weight|scale|משקל|שקילה|לרדת|להרזות)/.test(t)) return 'weight';
  if (/(\bpr\b|record|1rm|שיא|שיאים)/.test(t)) return 'pr';
  if (/(rest|recover|sore|tired|sleep|התאוש|מנוחה|עייף|שינה|כאב שרירים)/.test(t)) return 'recovery';
  if (/(workout|train|exercise|today|אימון|להתאמן|תרגיל|היום)/.test(t)) return 'workout';
  return 'general';
}

const NO_DATA: Record<Language, string> = {
  he: 'אין מספיק נתונים עדיין כדי לענות על זה בצורה אמינה.',
  en: 'There is not enough data yet to answer that reliably.',
};

/** Deterministic, data-driven answer. Only states numbers that exist in the snapshot. */
export function rulesCoachReply(question: string, s: CoachSnapshot, lang: Language): string {
  const he = lang === 'he';
  const intent = detectIntent(question);
  switch (intent) {
    case 'workout': {
      const lead = s.readiness === 'rest' ? (he ? 'לפי הצ׳ק-אין שלך כדאי יום מנוחה או תנועה קלה. ' : 'Your check-in suggests a rest day or light movement. ') : s.readiness === 'easier' ? (he ? 'לפי הצ׳ק-אין שלך כדאי אימון קל יותר היום. ' : 'Your check-in suggests an easier session today. ') : '';
      if (!s.todayWorkout) return `${lead}${he ? 'אין אימון מתוכנן להיום בתוכנית הפעילה. אפשר לבחור אימון מוכן בלשונית האימונים.' : 'There is no workout scheduled for today in your active plan. You can pick a ready workout in the Workouts tab.'}`;
      return `${lead}${he ? `האימון של היום: ${s.todayWorkout.name} (${s.todayWorkout.exerciseCount} תרגילים).` : `Today's workout: ${s.todayWorkout.name} (${s.todayWorkout.exerciseCount} exercises).`}`;
    }
    case 'protein': {
      const { avgProteinG, loggedDays } = s.nutrition7d;
      if (avgProteinG === null || loggedDays === 0 || !s.targets) return NO_DATA[lang];
      const pct = Math.round((avgProteinG / s.targets.proteinG) * 100);
      return he ? `ב-${loggedDays} ימים שתועדו בשבוע האחרון, ממוצע החלבון הוא ${Math.round(avgProteinG)} ג׳ ביום, ${pct}% מהיעד (${s.targets.proteinG} ג׳).` : `Over ${loggedDays} logged days this week you averaged ${Math.round(avgProteinG)} g protein per day, ${pct}% of your ${s.targets.proteinG} g target.`;
    }
    case 'calories': {
      const { avgKcal, loggedDays } = s.nutrition7d;
      if (avgKcal === null || loggedDays === 0 || !s.targets) return NO_DATA[lang];
      return he ? `ממוצע הקלוריות ב-${loggedDays} ימים שתועדו: ${Math.round(avgKcal)} קק״ל ביום, מול יעד של ${s.targets.kcal}.` : `Across ${loggedDays} logged days your average is ${Math.round(avgKcal)} kcal per day against a ${s.targets.kcal} kcal target.`;
    }
    case 'weight': {
      if (!s.weightTrendKg || s.weightTrendKg.days < 14) return NO_DATA[lang];
      const d = s.weightTrendKg.deltaKg;
      const sign = d > 0 ? '+' : '';
      return he ? `מגמת המשקל המוחלקת ב-${s.weightTrendKg.days} הימים האחרונים: ${sign}${d.toFixed(1)} ק״ג.` : `Your smoothed weight trend over the last ${s.weightTrendKg.days} days is ${sign}${d.toFixed(1)} kg.`;
    }
    case 'pr': {
      if (s.prs.length === 0) return NO_DATA[lang];
      const top = s.prs[0];
      if (!top) return NO_DATA[lang];
      return he ? `השיא המוערך האחרון שלך: ${top.exerciseName}, 1RM מוערך ${top.est1rmKg.toFixed(1)} ק״ג.` : `Your latest estimated PR: ${top.exerciseName}, estimated 1RM ${top.est1rmKg.toFixed(1)} kg.`;
    }
    case 'recovery':
      return he ? 'להתאוששות: שינה של 7–9 שעות, חלבון מספק, והפחתת עצימות כשהצ׳ק-אין מראה עייפות. כאב חד או כאב מפרק מחייב עצירה ובדיקה.' : 'For recovery: 7–9 hours of sleep, enough protein, and lower intensity when your check-in shows fatigue. Sharp or joint pain means stop and get it checked.';
    case 'general': {
      const n = s.recentWorkouts.length;
      if (n === 0) return NO_DATA[lang];
      return he ? `תועדו ${n} אימונים לאחרונה. אפשר לשאול אותי על אימון היום, חלבון, קלוריות, משקל או שיאים.` : `${n} recent workouts are logged. You can ask me about today's workout, protein, calories, weight or PRs.`;
    }
  }
}
