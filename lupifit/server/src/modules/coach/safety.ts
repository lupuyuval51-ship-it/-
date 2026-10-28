/**
 * Safety pre-check that runs BEFORE any model call. Bilingual (EN + HE) pattern
 * checks short-circuit the conversation with a fixed, carefully worded reply for:
 *  - self-harm / suicidal ideation (compassion + crisis resources, no coaching),
 *  - acute medical red flags (stop exercising, seek medical care),
 *  - eating-disorder signals / extreme restriction (refuse, explain safe ranges),
 *  - requests for steroid / PED dosing (decline, medical supervision).
 * The system prompt repeats the same rules for the model (defense in depth).
 */
import type { Locale } from '@shared/constants';
import { containsAny, normalizeText } from './lang';

export type SafetyCategory = 'self_harm' | 'medical_red_flag' | 'eating_disorder' | 'ped_dosing';

export interface SafetyContext {
  lang: Locale;
  isMinor: boolean;
  /** Latest known body weight (kg), used to express the safe weekly loss range. */
  weightKg: number | null;
  /** The user's current calorie target and the app's safe minimum for them (if known). */
  calorieTarget: number | null;
  minimumCalories: number | null;
}

export interface SafetyResult {
  category: SafetyCategory;
  reply: string;
}

// ---------------------------------------------------------------------------- patterns

const SELF_HARM = [
  'suicide',
  'suicidal',
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'take my own life',
  'want to die',
  'wanna die',
  'wish i was dead',
  'wish i were dead',
  'better off dead',
  'self harm',
  'harm myself',
  'want to hurt myself',
  'thoughts of hurting myself',
  "don't want to live",
  'dont want to live',
  'do not want to live',
  "don't want to be alive",
  'no reason to live',
  'not worth living',
  'להתאבד',
  'התאבדות',
  'אתאבד',
  'מתאבד',
  'לשים קץ לחיי',
  'לשים קץ לחיים',
  'לסיים את החיים',
  'רוצה למות',
  'לא רוצה לחיות',
  'אין לי בשביל מה לחיות',
  'אין טעם לחיות',
  'רוצה לפגוע בעצמי',
  'מחשבות לפגוע בעצמי',
  'פגיעה עצמית',
  'לחתוך את עצמי',
  'הלוואי שאמות',
  'עדיף שאמות',
];

const MEDICAL_RED_FLAGS = [
  'chest pain',
  'pain in my chest',
  'chest tightness',
  'tightness in my chest',
  'chest pressure',
  'pressure in my chest',
  'fainted',
  'fainting',
  'passed out',
  'pass out',
  'blacked out',
  'lost consciousness',
  "can't breathe",
  'cant breathe',
  'cannot breathe',
  "couldn't breathe",
  'trouble breathing',
  'difficulty breathing',
  'severe pain',
  'sudden pain',
  'intense pain',
  'unbearable pain',
  'excruciating',
  'palpitations',
  'heart racing',
  'irregular heartbeat',
  'arm went numb',
  'numbness in my arm',
  'coughing blood',
  'coughing up blood',
  'heard a pop',
  'felt a pop',
  'dizzy',
  'dizziness',
  'lightheaded',
  'light headed',
  'כאב בחזה',
  'כאבים בחזה',
  'כאבי חזה',
  'לחץ בחזה',
  'לחץ על החזה',
  'התעלפתי',
  'התעלפות',
  'עילפון',
  'איבדתי הכרה',
  'אובדן הכרה',
  'קשיי נשימה',
  'קושי לנשום',
  'לא מצליח לנשום',
  'לא מצליחה לנשום',
  'לא יכול לנשום',
  'לא יכולה לנשום',
  'כאב עז',
  'כאבים עזים',
  'כאב חזק מאוד',
  'כאב פתאומי',
  'כאב בלתי נסבל',
  'דפיקות לב',
  'דופק לא סדיר',
  'סחרחורת',
  'סחרחורות',
  'נימול ביד',
  'משתעל דם',
  'משתעלת דם',
];

const EATING_DISORDER_TERMS = [
  'anorexia',
  'anorexic',
  'bulimia',
  'bulimic',
  'eating disorder',
  'binge and purge',
  'purge',
  'purging',
  'make myself throw up',
  'make myself vomit',
  'make myself sick',
  'throw up after eating',
  'throw up after meals',
  'throw up after i eat',
  'vomit after eating',
  'vomit after meals',
  'vomit after i eat',
  'laxative',
  'diuretics to lose',
  'diuretic to lose',
  'diuretics for weight',
  'water pills to lose',
  'starve myself',
  'starving myself',
  'water fast',
  'dry fast',
  'אנורקסיה',
  'בולימיה',
  'הפרעת אכילה',
  'הפרעות אכילה',
  'לגרום לעצמי להקיא',
  'להקיא אחרי האוכל',
  'להקיא אחרי ארוחה',
  'להקיא אחרי שאני אוכל',
  'מקיא אחרי האוכל',
  'מקיאה אחרי האוכל',
  'משלשלים',
  'להרעיב את עצמי',
  'לא לאכול בכלל',
];

const EAT_WORDS = [
  'eat',
  'eating',
  'consume',
  'consuming',
  'intake',
  'diet',
  'limit',
  'only have',
  'live on',
  'לאכול',
  'אוכל',
  'אוכלת',
  'לצרוך',
  'צריכה של',
  'דיאטה',
  'דיאטת',
  'להגביל',
  'להוריד ל',
  'לרדת ל',
];

const PED_TERMS = [
  'steroid',
  'anabolic',
  'trenbolone',
  'tren',
  'dianabol',
  'dbol',
  'anavar',
  'oxandrolone',
  'winstrol',
  'stanozolol',
  'deca',
  'nandrolone',
  'equipoise',
  'masteron',
  'primobolan',
  'turinabol',
  'superdrol',
  'sarm',
  'sarms',
  'ostarine',
  'rad 140',
  'ligandrol',
  'lgd 4033',
  'hgh',
  'growth hormone',
  'clenbuterol',
  'clen',
  'ped',
  'סטרואיד',
  'אנבולי',
  'הורמון גדילה',
  'קלנבוטרול',
  'סארמס',
  'טרנבולון',
  'דיאנבול',
  'אנאבר',
  'ווינסטרול',
];
/** Mentioned on their own these are often legitimate questions, so they need dosing intent. */
const HORMONE_TERMS = ['testosterone', 'test e', 'test cyp', 'trt', 'טסטוסטרון'];

const PED_INTENT = [
  'dose',
  'doses',
  'dosage',
  'dosing',
  'cycle',
  'stack',
  'mg',
  'how much',
  'how many',
  'inject',
  'injecting',
  'injection',
  'pin',
  'take',
  'taking',
  'run',
  'running',
  'start',
  'use',
  'using',
  'buy',
  'get some',
  'source',
  'pct',
  'per week',
  'מינון',
  'מחזור',
  'סייקל',
  'כמה',
  'להזריק',
  'זריקה',
  'זריקות',
  'לקחת',
  'לוקח',
  'לוקחת',
  'להתחיל',
  'להשתמש',
  'לקנות',
  'להשיג',
  'מ"ג',
  'בשבוע',
];
const HORMONE_INTENT = ['dose', 'doses', 'dosage', 'dosing', 'cycle', 'stack', 'mg', 'inject', 'injecting', 'injection', 'pin', 'pct', 'מינון', 'מחזור', 'סייקל', 'להזריק', 'זריקה', 'זריקות', 'מ"ג'];

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  couple: 2,
  three: 3,
  few: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  ten: 10,
  several: 3,
  multiple: 3,
};

const BURN_WORDS = ['burn', 'burned', 'burnt', 'burning', 'שורף', 'שורפת', 'לשרוף', 'שרפתי', 'שריפה'];

const DAILY_CONTEXT = /\b(a|per|each|every) day\b|\bdaily\b|\/day|ביום|ליום|ביממה|ליממה|יומי/;

/**
 * A calorie number that is a difference ("500 calories less", "a 300 kcal deficit") or a
 * single meal/snack ("a 300 calorie snack") is not a total daily intake.
 */
const RELATIVE_AFTER =
  /^\s*(?:less|fewer|more|below|under|above|over|extra|deficit|surplus|per meal|a meal|each meal|snack|meal|breakfast|lunch|dinner|shake|bar|פחות|יותר|מעל|מתחת|גירעון|גרעון|עודף|לארוחה|בארוחה|ארוחה|ארוחת|נשנוש|חטיף|שייק)/u;
const RELATIVE_BEFORE =
  /(?:deficit of|surplus of|extra|additional|another|cut|cutting|reduce by|add|adding|minus|plus|גירעון של|גרעון של|עודף של|תוספת של|עוד|להוסיף|להפחית|להוריד)\s*(?:about|around|like|כ\s*)?$/u;

/** "eat 500 calories a day", "דיאטה של 800 קלוריות", "800 calorie diet". */
function extremeCalorieRestriction(text: string): boolean {
  const re = /(\d{2,4})\s*(?:k?cals?\b|calories\b|calorie\b|kcal\b|קלוריות|קק"ל)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    if (!(n > 0 && n < 1000)) continue;
    const before = text.slice(Math.max(0, m.index - 45), m.index);
    if (containsAny(before, BURN_WORDS)) continue;
    if (RELATIVE_AFTER.test(text.slice(m.index + m[0].length)) || RELATIVE_BEFORE.test(before.trimEnd())) continue;
    const after = text.slice(m.index, m.index + m[0].length + 25);
    const eating = containsAny(before, EAT_WORDS) || /\bdiet\b|דיאט/.test(after);
    if (eating && (DAILY_CONTEXT.test(text) || /\bdiet\b|דיאט/.test(before + after) || /\bonly\b|\bjust\b|רק\b/.test(before))) return true;
  }
  return false;
}

const KG_UNIT = /^(kg|kgs|kilo|kilos|kilogram|kilograms|ק"ג|קילו|קילוגרם)$/;
const LB_UNIT = /^(lb|lbs|pound|pounds)$/;

function weeksFor(countWord: string | undefined, unit: string): number | null {
  let count = 1;
  if (countWord) {
    const n = Number(countWord);
    count = Number.isFinite(n) ? n : NUMBER_WORDS[countWord] ?? 1;
  }
  if (/^(day|days|יום|ימים)$/.test(unit)) return count / 7;
  if (unit === 'יומיים') return 2 / 7;
  if (/^(week|weeks|שבוע|שבועות)$/.test(unit)) return count;
  if (unit === 'שבועיים') return 2;
  if (/^(month|months|חודש|חודשים)$/.test(unit)) return count * 4.35;
  if (unit === 'חודשיים') return 8.7;
  return null;
}

/** "lose 10 kg in a week", "להוריד 5 קילו תוך שבועיים" faster than the safe weekly rate. */
function rapidWeightLoss(text: string, weightKg: number | null): boolean {
  const re =
    /(?:lose|losing|drop|dropping|shed|shedding|cut|להוריד|לרדת|לאבד|ירידה של|להשיל)\s+(?:like\s+|about\s+|around\s+|כ\s*)?(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilos?|kilograms?|lbs?|pounds?|ק"ג|קילוגרם|קילו)(?:\s+\S+){0,3}?\s+(?:in|within|over|by|תוך|בתוך|ב|במשך)\s*(?:(\d+|a|an|one|two|three|four|five|six|seven|ten|couple|few|several)\s+(?:of\s+)?)?(days?|weeks?|months?|יום|ימים|יומיים|שבועות|שבועיים|שבוע|חודשים|חודשיים|חודש)/u;
  const m = re.exec(text);
  if (!m) return false;
  const amount = Number(m[1]!.replace(',', '.'));
  const unit = m[2]!;
  const kg = KG_UNIT.test(unit) ? amount : LB_UNIT.test(unit) ? amount * 0.4536 : amount;
  const weeks = weeksFor(m[3], m[4]!);
  if (!weeks || weeks <= 0) return false;
  const safeWeekly = Math.max(1, weightKg ? weightKg * 0.01 : 1);
  return kg / weeks > safeWeekly;
}

/** "fast for 3 days", "not eat for a week", "לצום שלושה ימים", "צום של 5 ימים". */
function multiDayFast(text: string): boolean {
  if (/intermittent|16[:/]8|18[:/]6|צום לסירוגין/.test(text)) return false;
  const en = /\b(?:fast|fasting|not eat|not eating|without eating|without food|no food)\s+(?:for\s+)?(?:like\s+|about\s+)?(\d+|two|three|four|five|six|seven|ten|couple|few|several|multiple|a|an|one)\s+(?:of\s+)?(days?|weeks?)/u.exec(text);
  if (en) {
    const weeks = weeksFor(en[1], en[2]!.replace(/s$/, '') === 'day' ? 'days' : 'weeks');
    if (weeks != null && weeks * 7 >= 2) return true;
  }
  const he = /(?:לצום|צום של|צום|לא לאכול|בלי לאכול|בלי אוכל)\s+(?:במשך\s+)?(\d+\s+)?(ימים|יומיים|שבוע|שבועות|שבועיים|שלושה ימים|ארבעה ימים|חמישה ימים|כמה ימים)/u.exec(text);
  if (he) {
    if (he[2] === 'ימים' && he[1] && Number(he[1]) < 2) return false;
    return true;
  }
  return false;
}

/** Training terms that contain PED/self-harm words but are not about them. */
const ANABOLIC_WINDOW = /anabolic windows?|חלון (?:ה)?אנבולי|החלון האנבולי/gu;
const SUICIDE_DRILLS = /suicide (?:sprints?|runs?|drills?|shuttles?|lines?)|(?:sprint|shuttle|court|line) suicides?|ספרינט(?:י|ים)? (?:ה)?התאבדות/gu;

function pedDosing(raw: string): boolean {
  const text = raw.replace(ANABOLIC_WINDOW, ' ');
  if (containsAny(text, PED_TERMS) && containsAny(text, PED_INTENT)) return true;
  return containsAny(text, HORMONE_TERMS) && containsAny(text, HORMONE_INTENT);
}

/** Which safety category (if any) the message falls into. Most serious first. */
export function detectSafetyCategory(message: string, weightKg: number | null = null): SafetyCategory | null {
  const text = normalizeText(message);
  if (!text) return null;
  if (containsAny(text.replace(SUICIDE_DRILLS, ' '), SELF_HARM)) return 'self_harm';
  if (containsAny(text, MEDICAL_RED_FLAGS)) return 'medical_red_flag';
  if (containsAny(text, EATING_DISORDER_TERMS) || extremeCalorieRestriction(text) || rapidWeightLoss(text, weightKg) || multiDayFast(text)) {
    return 'eating_disorder';
  }
  if (pedDosing(text)) return 'ped_dosing';
  return null;
}

// ---------------------------------------------------------------------------- replies

const fmt = (n: number, locale: Locale) => new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', { maximumFractionDigits: 1 }).format(n);

function selfHarmReply(lang: Locale): string {
  if (lang === 'he') {
    return [
      'צר לי מאוד שקשה לך כל כך עכשיו. מגיעה לך תמיכה, ואין צורך להתמודד עם זה לבד.',
      '',
      '- אם יש סכנה מיידית או חשש לפעול לפי המחשבות האלה, **יש להתקשר מיד למספר החירום** (מד״א 101, משטרה 100).',
      '- כדאי לפנות לאדם קרוב שסומכים עליו – חבר או חברה, בן או בת משפחה, רופא או רופאה – ולספר מה עובר עליך.',
      '- **ער״ן – עזרה ראשונה נפשית: 1201**, זמין בכל שעה (יש גם צ׳אט באתר ער״ן). מחוץ לישראל אפשר לפנות לקו סיוע מקומי.',
      '',
      'אני מאמן כושר, ולכן אעצור כאן את ייעוץ האימונים. הבריאות והביטחון שלך חשובים יותר מכל אימון.',
    ].join('\n');
  }
  return [
    "I'm really sorry you're feeling this way. You deserve support right now, and you don't have to go through this alone.",
    '',
    '- If you might act on these thoughts or you are in danger, **call your local emergency number now** (in Israel: 101 for Magen David Adom, 100 for police).',
    "- Reach out to someone you trust — a friend, a family member or a doctor — and tell them how you're feeling.",
    '- In Israel you can contact **ERAN (emotional first aid) at 1201**, any time of day. Elsewhere, contact a local crisis line.',
    '',
    "I'm a fitness coach, so I'll pause training advice here. Your safety and wellbeing matter more than any workout.",
  ].join('\n');
}

function medicalReply(lang: Locale): string {
  if (lang === 'he') {
    return [
      '**יש להפסיק את האימון עכשיו.** מה שתיארת עלול להיות סימן אזהרה שמחייב בדיקה רפואית.',
      '',
      '- **כאב או לחץ בחזה, התעלפות או סחרחורת, קושי לנשום, או כאב עז או פתאומי** – יש לפנות לטיפול רפואי בהקדם. אם התסמינים חמורים או לא חולפים במנוחה, יש להתקשר מיד למד״א 101.',
      '- לא כדאי "לעבור את זה" או לבדוק שוב עם סט נוסף.',
      '- כדאי לחזור להתאמן רק אחרי בדיקה ואישור של רופא או רופאה (או פיזיותרפיסט/ית במקרה של פציעה).',
      '',
      'אין לי אפשרות לאבחן מה קרה, אבל אחרי הבדיקה אשמח לעזור לחזור לאימונים בצורה בטוחה.',
    ].join('\n');
  }
  return [
    '**Please stop exercising now.** What you describe can be a warning sign that needs medical attention.',
    '',
    "- **Chest pain or pressure, fainting or dizziness, trouble breathing, or severe or sudden pain** → get medical care promptly. If symptoms are severe or don't ease with rest, call emergency services right away (in Israel: 101 for Magen David Adom).",
    '- Don\'t try to push through it or "test" it with another set.',
    '- Resume training only after a doctor (or a physiotherapist, for an injury) has checked you and cleared you to train.',
    '',
    "I can't diagnose what's happening, but once you've been checked I'm happy to help you return to training safely.",
  ].join('\n');
}

function eatingDisorderReply(ctx: SafetyContext): string {
  const { lang, isMinor, weightKg, calorieTarget, minimumCalories } = ctx;
  const lo = weightKg ? Math.round(weightKg * 0.005 * 10) / 10 : null;
  const hi = weightKg ? Math.round(weightKg * 0.01 * 10) / 10 : null;
  if (lang === 'he') {
    const lines = [
      'אין באפשרותי לעזור עם זה: אכילה מועטה מאוד, ירידה מהירה מאוד במשקל, צום של כמה ימים או הקאות עלולים לפגוע בבריאות באופן חמור, ובדרך כלל מובילים לאיבוד שריר ולעלייה חוזרת במשקל.',
      '',
      'כך נראית התקדמות בטוחה:',
    ];
    if (isMinor) {
      lines.push('- **מתחת לגיל 18** הגוף עדיין גדל, ולכן LUPIFIT לא מגדירה גירעון קלורי. ההתמקדות היא בארוחות סדירות, חלבון מספק, אימונים עקביים ושינה טובה.');
    } else {
      lines.push(
        `- **ירידה בשומן אצל מבוגרים:** לכל היותר כ-**0.5%–1% ממשקל הגוף בשבוע**${lo && hi ? ` (במקרה שלך, בערך ${fmt(lo, lang)}–${fmt(hi, lang)} ק״ג בשבוע)` : ''}.`,
        `- **קלוריות:** גירעון מתון בלבד (עד כ-20%, ולא יותר מכ-500 קק״ל ביום)${calorieTarget && minimumCalories ? ` – היעד הנוכחי שלך ב-LUPIFIT הוא ${fmt(calorieTarget, lang)} קק״ל, והאפליקציה לא מגדירה עבורך יעד נמוך מ-${fmt(minimumCalories, lang)} קק״ל` : ''}.`,
      );
    }
    lines.push(
      '- חלבון מספק, ארוחות סדירות, אימוני כוח ושינה טובה שומרים על השריר ועל האנרגיה.',
      '',
      isMinor
        ? 'אם קשה לשלוט באוכל, במשקל או בתחושות כלפי הגוף, חשוב לשתף הורה או מבוגר שסומכים עליו ולפנות לרופא/ת המשפחה. יש עזרה מקצועית להפרעות אכילה, והיא דיסקרטית.'
        : 'אם קשה לשלוט באוכל, במשקל או בתחושות כלפי הגוף, או אם יש הגבלה קיצונית, התקפי אכילה או הקאות – כדאי מאוד לפנות לרופא/ה או לדיאטן/ית קליני/ת. יש עזרה מקצועית להפרעות אכילה, והיא דיסקרטית.',
      'אשמח לעזור לבנות תוכנית בטוחה ובת-קיימא.',
    );
    return lines.join('\n');
  }
  const lines = [
    "I can't help with that: eating very little, losing weight very fast, fasting for days or purging can seriously harm your health, and it usually leads to muscle loss and regaining the weight.",
    '',
    'What safe progress looks like:',
  ];
  if (isMinor) {
    lines.push("- **Under 18**, your body is still growing, so LUPIFIT never sets a calorie deficit for you. Focus on regular meals, enough protein, consistent training and good sleep.");
  } else {
    lines.push(
      `- **Fat loss for adults:** at most about **0.5–1% of body weight per week**${lo && hi ? ` (for you, roughly ${fmt(lo, lang)}–${fmt(hi, lang)} kg per week)` : ''}.`,
      `- **Calories:** only a moderate deficit (up to ~20%, no more than ~500 kcal a day)${calorieTarget && minimumCalories ? ` — your current LUPIFIT target is ${fmt(calorieTarget, lang)} kcal, and the app never sets a target below ${fmt(minimumCalories, lang)} kcal for you` : ''}.`,
    );
  }
  lines.push(
    '- Enough protein, regular meals, strength training and good sleep protect your muscle and energy.',
    '',
    isMinor
      ? 'If food, weight or how you feel about your body seem hard to control, please talk to a parent or another adult you trust and see your doctor. Eating-disorder support helps, and it is confidential.'
      : "If food, weight or how you feel about your body seem hard to control, or you've been restricting, bingeing or purging, please talk to a doctor or a registered dietitian. Eating-disorder support helps, and it is confidential.",
    "I'm happy to help you build a safe, sustainable plan.",
  );
  return lines.join('\n');
}

function pedReply(ctx: SafetyContext): string {
  if (ctx.lang === 'he') {
    return [
      'אין באפשרותי לתת מינונים, מחזורים או דרכים להשגה של סטרואידים, SARMs, הורמון גדילה או חומרים אחרים לשיפור ביצועים. יש להם סיכונים משמעותיים ללב, לכבד, למערכת ההורמונלית ולבריאות הנפשית, רבים מהם אינם חוקיים ללא מרשם, ומוצרים רבים אינם מכילים את מה שכתוב על התווית.',
      '',
      `אם עולה מחשבה על נטילת הורמון או תרופה כלשהי, חשוב להתייעץ עם רופא או רופאה – טיפול כמו TRT צריך להיעשות רק בהשגחה רפואית ועם בדיקות דם קבועות.${ctx.isMinor ? ' זה חשוב במיוחד מתחת לגיל 18, כשהמערכת ההורמונלית עדיין מתפתחת.' : ''}`,
      '',
      'במה אפשר לעזור: עומס הדרגתי, נפח אימון, חלבון וקלוריות במידה מספקת, שינה והתאוששות – אלה מה שמניעים את רוב ההתקדמות באופן טבעי.',
    ].join('\n');
  }
  return [
    "I can't give dosing, cycle or sourcing advice for steroids, SARMs, growth hormone or other performance-enhancing drugs. They carry serious risks to the heart, liver, hormones and mental health, many are illegal without a prescription, and products are often mislabelled.",
    '',
    `If you're considering any hormone or medication, please discuss it with a doctor — something like TRT should only happen under medical supervision with regular blood tests.${ctx.isMinor ? ' This matters even more under 18, while your hormones are still developing.' : ''}`,
    '',
    'What I can help with: progressive overload, training volume, enough protein and calories, sleep and recovery — these drive most of your progress naturally.',
  ].join('\n');
}

export function safetyReply(category: SafetyCategory, ctx: SafetyContext): string {
  switch (category) {
    case 'self_harm':
      return selfHarmReply(ctx.lang);
    case 'medical_red_flag':
      return medicalReply(ctx.lang);
    case 'eating_disorder':
      return eatingDisorderReply(ctx);
    case 'ped_dosing':
      return pedReply(ctx);
  }
}

/** Runs the pre-check; returns the fixed reply when the message must not reach the model. */
export function checkSafety(message: string, ctx: SafetyContext): SafetyResult | null {
  const category = detectSafetyCategory(message, ctx.weightKg);
  return category ? { category, reply: safetyReply(category, ctx) } : null;
}
