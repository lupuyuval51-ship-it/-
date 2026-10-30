/**
 * Built-in coach: a deterministic, bilingual (EN/HE) answer generator used when no AI
 * provider is configured or the provider fails. Every fact it states comes from the
 * user's stored data, LUPU-FIT's exercise library or the built-in food/meal content —
 * when data is missing it says so instead of guessing.
 */
import type { DietaryRestriction, DietType, Equipment, InjuryArea, Locale, MealType, Units } from '@shared/constants';
import { foodConflicts, type DietPreferences } from '@shared/nutrition';
import { kgToLb } from '@shared/training';
import { isExerciseSuitable, userContextFor, type ExerciseRecord } from '../exercises/repository';
import type { CoachData, SessionExerciseInfo } from './context';
import { findExercise, mentionedBodyAreas } from './exerciseMatch';
import type { FoodCatalog, FoodData, MealTemplateData } from './foodData';
import {
  ALLERGEN_LABELS,
  DIET_LABELS,
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  INJURY_LABELS,
  joinList,
  PR_TYPE_LABELS,
  RESTRICTION_LABELS,
} from './labels';
import { containsAny, countMatches, normalizeText } from './lang';

export type CoachIntent = 'technique' | 'alternatives' | 'progress' | 'nutrition' | 'meal_ideas' | 'principles' | 'plan' | 'fallback';
export type PrincipleTopic = 'progressive_overload' | 'rep_ranges' | 'rest' | 'deload' | 'warm_up' | 'recovery' | 'consistency';

export interface BuiltinInput {
  message: string;
  lang: Locale;
  data: CoachData;
  exercises: ExerciseRecord[];
  /** Lazily loads foods & meal templates (only nutrition answers need them). */
  loadFoods: () => Promise<FoodCatalog>;
}

export interface BuiltinResult {
  intent: CoachIntent;
  text: string;
}

const L = (lang: Locale, en: string, he: string) => (lang === 'he' ? he : en);

// ---------------------------------------------------------------------------- formatting

function fmtNum(n: number, lang: Locale, digits = 1): string {
  return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US', { maximumFractionDigits: digits }).format(n);
}

function fmtWeight(kg: number, units: Units, lang: Locale): string {
  return units === 'imperial' ? `${fmtNum(kgToLb(kg), lang)} ${L(lang, 'lb', 'ליב׳')}` : `${fmtNum(kg, lang)} ${L(lang, 'kg', 'ק"ג')}`;
}

function fmtDate(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

const pct = (value: number, target: number) => (target > 0 ? Math.round((value / target) * 100) : 0);

function equipmentText(equipment: Equipment[], lang: Locale): string {
  return equipment.length ? joinList(equipment.map((q) => EQUIPMENT_LABELS[lang][q]), lang) : L(lang, 'no equipment', 'ללא ציוד');
}

function setText(s: { reps: number | null; weightKg: number | null; durationSeconds: number | null }, units: Units, lang: Locale): string {
  if (s.durationSeconds != null && s.reps == null) return `${fmtNum(s.durationSeconds, lang)} ${L(lang, 's', 'שנ׳')}`;
  if (s.weightKg != null && s.weightKg > 0) return `${fmtWeight(s.weightKg, units, lang)} × ${s.reps ?? '?'}`;
  return `${s.reps ?? '?'} ${L(lang, 'reps', 'חזרות')}`;
}

// ---------------------------------------------------------------------------- intents

const KW = {
  technique: [
    'form', 'technique', 'how do i', 'how to', 'how should i', 'proper', 'correct way', 'cues', 'mistakes', 'perform', 'tips for', 'execute',
    'טכניקה', 'איך עושים', 'איך לעשות', 'איך לבצע', 'איך מבצעים', 'ביצוע נכון', 'בצורה נכונה', 'דגשים', 'טעויות', 'תנוחה נכונה',
  ],
  alternatives: [
    'replace', 'swap', 'instead', 'alternative', 'substitute', 'hurts', 'hurt', 'pain', 'painful', 'sore', "can't do", 'cannot do', "don't have",
    'without', 'other than', 'easier', 'harder', 'variation', 'progression', 'regression',
    'להחליף', 'החלפה', 'במקום', 'חלופה', 'חלופי', 'תחליף', 'כואב', 'כאב', 'אין לי', 'בלי', 'קל יותר', 'קשה יותר', 'וריאציה', 'גרסה',
  ],
  progress: [
    'progress', 'progressing', 'how am i doing', 'stats', 'statistics', 'results', 'improved', 'improving', 'records', 'personal record', 'pr',
    'how consistent', 'this month', 'last month', 'this week', 'volume', 'how many workouts', 'streak', 'my weight',
    'התקדמות', 'התקדמתי', 'מתקדם', 'מתקדמת', 'סטטיסטיקה', 'תוצאות', 'שיא', 'החודש', 'השבוע', 'נפח', 'כמה אימונים', 'רצף', 'המשקל שלי',
  ],
  nutrition: [
    'protein', 'calorie', 'kcal', 'macro', 'carbs', 'carbohydrate', 'fat intake', 'nutrition', 'eating enough', 'eat enough', 'diet', 'intake', 'fiber',
    'how much should i eat',
    'חלבון', 'קלוריות', 'מאקרו', 'פחמימות', 'שומן', 'תזונה', 'אוכל מספיק', 'אוכלת מספיק', 'לאכול מספיק', 'דיאטה', 'סיבים', 'כמה לאכול',
  ],
  meal: [
    'meal', 'recipe', 'breakfast', 'lunch', 'dinner', 'snack', 'what should i eat', 'what to eat', 'what can i eat', 'food ideas', 'cook', 'menu',
    'ארוחה', 'ארוחת', 'ארוחות', 'מתכון', 'מה לאכול', 'מה אפשר לאכול', 'נשנוש', 'חטיף', 'תפריט', 'לבשל',
  ],
  suggest: ['suggest', 'idea', 'recommend', 'give me', 'הצע', 'תציע', 'רעיון', 'רעיונות', 'המלצה', 'תמליץ'],
  plan: [
    'plan', 'program', 'programme', 'routine', 'split', 'schedule', 'change my', 'adjust', 'modify', 'should i change', 'more days', 'fewer days',
    'training days',
    'תוכנית', 'תכנית', 'שגרה', 'פיצול', 'לשנות', 'להתאים', 'לעדכן', 'ימי אימון', 'יותר ימים', 'פחות ימים',
  ],
} as const;

const PRINCIPLE_KW: Record<PrincipleTopic, string[]> = {
  progressive_overload: [
    'progressive overload', 'overload', 'increase the weight', 'add weight', 'go heavier', 'when to increase',
    'עומס הדרגתי', 'עומס פרוגרסיבי', 'עומס יתר', 'להעלות משקל', 'מתי להעלות', 'להוסיף משקל',
  ],
  rep_ranges: ['rep range', 'how many reps', 'sets and reps', 'how many sets', 'hypertrophy', 'טווח חזרות', 'טווחי חזרות', 'כמה חזרות', 'כמה סטים', 'היפרטרופיה'],
  rest: [
    'rest between', 'rest period', 'rest time', 'how long should i rest', 'how long to rest', 'rest day', 'rest days',
    'מנוחה בין', 'זמן מנוחה', 'כמה לנוח', 'כמה זמן לנוח', 'יום מנוחה', 'ימי מנוחה',
  ],
  deload: ['deload', 'דילואד', 'שבוע הקלה', 'שבוע פריקה', 'הורדת עומס'],
  warm_up: ['warm up', 'warmup', 'warming up', 'חימום', 'להתחמם'],
  recovery: ['recovery', 'recover', 'sleep', 'soreness', 'doms', 'overtraining', 'התאוששות', 'להתאושש', 'שינה', 'כאבי שרירים', 'אימון יתר'],
  consistency: ['consistency', 'motivation', 'motivated', 'stay consistent', 'habit', 'מוטיבציה', 'להתמיד', 'התמדה', 'הרגל', 'עקביות'],
};

export function principleTopics(message: string): PrincipleTopic[] {
  const text = normalizeText(message);
  return (Object.keys(PRINCIPLE_KW) as PrincipleTopic[]).filter((t) => containsAny(text, PRINCIPLE_KW[t]));
}

/** Picks what the user is asking about. `hasExercise` = a library exercise is mentioned. */
export function detectIntent(message: string, hasExercise: boolean): CoachIntent {
  const text = normalizeText(message);
  const score = {
    technique: countMatches(text, KW.technique),
    alternatives: countMatches(text, KW.alternatives),
    progress: countMatches(text, KW.progress),
    nutrition: countMatches(text, KW.nutrition),
    meal: countMatches(text, KW.meal),
    plan: countMatches(text, KW.plan),
    principles: principleTopics(message).length * 2,
  };
  if (hasExercise && score.alternatives > 0) return 'alternatives';
  if (hasExercise && score.technique > 0) return 'technique';
  if (score.meal > 0 && (score.meal >= score.nutrition || containsAny(text, KW.suggest))) return 'meal_ideas';
  const ranked: [CoachIntent, number][] = [
    ['principles', score.principles],
    ['progress', score.progress],
    ['nutrition', score.nutrition],
    ['plan', score.plan],
  ];
  const [topIntent, topScore] = ranked.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
  if (topScore > 0) return topIntent;
  if (hasExercise) return 'technique';
  if (score.alternatives > 0) return 'alternatives';
  return 'fallback';
}

// ---------------------------------------------------------------------------- helpers

function userExerciseIds(data: CoachData): Set<string> {
  const ids = new Set<string>();
  for (const w of data.plan?.workouts ?? []) for (const e of w.exercises) ids.add(e.exerciseId);
  for (const s of data.recentSessions) for (const e of s.exercises) ids.add(e.exerciseId);
  return ids;
}

function profileKnown(data: CoachData): boolean {
  return data.profile.onboardingCompletedAt != null;
}

function lastPerformance(data: CoachData, exerciseId: string): { date: string; exercise: SessionExerciseInfo } | null {
  for (const s of data.recentSessions) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
    if (ex) return { date: s.date, exercise: ex };
  }
  return null;
}

const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

// ---------------------------------------------------------------------------- technique

function techniqueAnswer(e: ExerciseRecord, data: CoachData, lang: Locale, exercises: ExerciseRecord[]): string {
  const lines: string[] = [`**${e.name[lang]}**`, e.description[lang], '', `**${L(lang, 'How to do it', 'איך מבצעים')}**`];
  e.instructions[lang].forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  lines.push('', `**${L(lang, 'Common mistakes', 'טעויות נפוצות')}**`, ...e.mistakes[lang].map((m) => `- ${m}`));
  lines.push('', `**${L(lang, 'Safety', 'בטיחות')}**`, ...e.safety[lang].map((m) => `- ${m}`));

  const notes: string[] = [];
  if (profileKnown(data)) {
    const ctx = userContextFor(e, data.profile.equipment, data.profile.injuries);
    if (ctx.injuryConflicts.length) {
      const areas = joinList(ctx.injuryConflicts.map((a) => INJURY_LABELS[lang][a]), lang);
      notes.push(
        L(
          lang,
          `You reported a ${areas} issue, and this exercise can load that area. Use a pain-free range and light weights, stop if it hurts, and ask me for alternatives if needed.`,
          `דיווחת על בעיה ב${areas}, והתרגיל הזה עלול להעמיס על האזור. כדאי לעבוד בטווח ללא כאב ובמשקל קל, לעצור אם כואב, ואפשר לבקש ממני חלופות.`,
        ),
      );
    }
    if (!ctx.hasRequiredEquipment) {
      const alt = [...e.easierAlternatives, ...e.harderAlternatives]
        .map((id) => exercises.find((x) => x.id === id))
        .find((x): x is ExerciseRecord => x != null && isExerciseSuitable(x, data.profile.equipment, data.profile.injuries));
      notes.push(
        L(
          lang,
          `Your profile doesn't list ${equipmentText(ctx.missingEquipment, lang)}${alt ? ` — **${alt.name[lang]}** is a library alternative you can do with your equipment` : ''}.`,
          `בפרופיל שלך לא מופיע הציוד הדרוש (${equipmentText(ctx.missingEquipment, lang)})${alt ? ` – **${alt.name[lang]}** היא חלופה מהספרייה שמתאימה לציוד שלך` : ''}.`,
        ),
      );
    }
  }
  const last = lastPerformance(data, e.id);
  if (last) {
    notes.push(
      L(lang, `Last time (${fmtDate(last.date, lang)}): `, `בפעם האחרונה (${fmtDate(last.date, lang)}): `) +
        last.exercise.sets.map((s) => setText(s, data.units, lang)).join(', ') +
        '.',
    );
  }
  if (notes.length) lines.push('', `**${L(lang, 'For you', 'בשבילך')}**`, ...notes.map((n) => `- ${n}`));
  return lines.join('\n');
}

// ---------------------------------------------------------------------------- alternatives

function alternativesAnswer(e: ExerciseRecord | null, message: string, data: CoachData, lang: Locale, exercises: ExerciseRecord[]): string {
  const areas = mentionedBodyAreas(message);
  const text = normalizeText(message);
  const pain = areas.length > 0 || containsAny(text, ['hurt', 'hurts', 'pain', 'painful', 'sore', 'כואב', 'כאב']);
  const known = profileKnown(data);
  const injuries = Array.from(new Set<InjuryArea>([...data.profile.injuries, ...areas]));
  const lines: string[] = [];
  if (pain) {
    lines.push(
      L(
        lang,
        "**If an exercise hurts, stop doing it for now.** Work only in a pain-free range with lighter loads, and if the pain is sharp, keeps coming back or doesn't settle within a few days, see a physiotherapist or doctor.",
        '**אם תרגיל כואב, כדאי להפסיק אותו בינתיים.** אפשר לעבוד רק בטווח ללא כאב ובמשקל קל יותר, ואם הכאב חד, חוזר או לא חולף תוך כמה ימים – כדאי לפנות לפיזיותרפיסט/ית או לרופא/ה.',
      ),
      '',
    );
  }
  if (!e) {
    lines.push(
      L(
        lang,
        "Which exercise would you like to replace? Tell me its name (for example: \"What can I do instead of bench press?\") and I'll suggest options from the LUPU-FIT library that fit your equipment and injuries.",
        'איזה תרגיל תרצו להחליף? אפשר לכתוב את שמו (למשל: "מה אפשר לעשות במקום לחיצת חזה?") ואציע חלופות מספריית LUPU-FIT שמתאימות לציוד ולפציעות שלך.',
      ),
    );
    return lines.join('\n');
  }

  const equipment = known ? data.profile.equipment : null;
  const suitable = (x: ExerciseRecord) => x.id !== e.id && (equipment ? isExerciseSuitable(x, equipment, injuries) : x.contraindications.every((c) => !injuries.includes(c)));
  const byId = new Map(exercises.map((x) => [x.id, x]));
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((x): x is ExerciseRecord => x != null && suitable(x));
  const easier = pick(e.easierAlternatives).slice(0, 3);
  const harder = pain ? [] : pick(e.harderAlternatives).slice(0, 2);
  const used = new Set([e.id, ...easier.map((x) => x.id), ...harder.map((x) => x.id)]);
  const similar = exercises
    .filter((x) => !used.has(x.id) && x.movementPattern === e.movementPattern && suitable(x))
    .map((x) => ({
      x,
      overlap: x.primaryMuscles.filter((m) => e.primaryMuscles.includes(m)).length,
      distance: Math.abs(DIFFICULTY_RANK[x.difficulty] - DIFFICULTY_RANK[e.difficulty]),
    }))
    .sort((a, b) => b.overlap - a.overlap || a.distance - b.distance || a.x.name.en.localeCompare(b.x.name.en))
    .slice(0, 3)
    .map((s) => s.x);

  const avoid = areas.length ? areas : injuries.filter((i) => e.contraindications.includes(i));
  const header = L(
    lang,
    `**Alternatives to ${e.name.en}** from the LUPU-FIT library${equipment ? ' that fit your equipment' : ''}${avoid.length ? ` and avoid loading your ${joinList(avoid.map((a) => INJURY_LABELS.en[a]), 'en')}` : ''}:`,
    `**חלופות ל${e.name.he}** מספריית LUPU-FIT${equipment ? ' שמתאימות לציוד שלך' : ''}${avoid.length ? ` ולא מעמיסות על ה${joinList(avoid.map((a) => INJURY_LABELS.he[a]), 'he')}` : ''}:`,
  );
  const item = (x: ExerciseRecord, kind: string) => `- **${x.name[lang]}** — ${kind} · ${equipmentText(x.equipment, lang)}`;
  const options = [
    ...easier.map((x) => item(x, L(lang, 'easier', 'קל יותר'))),
    ...similar.map((x) => item(x, L(lang, 'similar movement', 'תנועה דומה'))),
    ...harder.map((x) => item(x, L(lang, 'harder', 'מאתגר יותר'))),
  ];
  if (!options.length) {
    lines.push(
      L(
        lang,
        `I couldn't find an alternative to **${e.name.en}** in the LUPU-FIT library that fits your equipment${injuries.length ? ' and injuries' : ''}. A physiotherapist or trainer can suggest an individual option.`,
        `לא מצאתי בספריית LUPU-FIT חלופה ל**${e.name.he}** שמתאימה לציוד${injuries.length ? ' ולפציעות' : ''} שלך. פיזיותרפיסט/ית או מאמן/ת יוכלו להציע אפשרות מותאמת אישית.`,
      ),
    );
  } else {
    lines.push(header, ...options);
  }
  if (!known) {
    lines.push(
      '',
      L(
        lang,
        'Tip: complete your profile (equipment and injuries) so I can filter suggestions for you.',
        'טיפ: כדאי להשלים את הפרופיל (ציוד ופציעות) כדי שאוכל לסנן את ההצעות במיוחד בשבילך.',
      ),
    );
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------- progress

function progressAnswer(data: CoachData, lang: Locale): string {
  const s = data.stats;
  const lines: string[] = [];
  const goal = data.profile.weeklyWorkoutGoal;
  if (s.completedTotal === 0) {
    lines.push(
      L(
        lang,
        "I don't see any completed workouts yet, so there is no training progress to analyze — and I won't guess. Once you finish workouts in LUPU-FIT, I can show your workouts per week, training volume and personal records.",
        'עדיין אין אימונים שהושלמו, ולכן אין התקדמות באימונים לנתח – ואני לא אנחש. אחרי שיושלמו אימונים ב-LUPU-FIT, אוכל להציג אימונים בשבוע, נפח אימון ושיאים אישיים.',
      ),
    );
  } else {
    const weeks = s.firstWorkoutDate ? Math.min(4, Math.max(1, Math.ceil((Date.parse(`${data.today}T00:00:00Z`) - Date.parse(`${s.firstWorkoutDate}T00:00:00Z`) + 86_400_000) / (7 * 86_400_000)))) : 4;
    const perWeek = s.last28 / weeks;
    lines.push(`**${L(lang, 'Your training', 'האימונים שלך')}**`);
    lines.push(
      L(
        lang,
        `- Workouts: **${s.last7}** in the last 7 days, **${s.last30}** in the last 30 days (${s.completedTotal} in total).`,
        `- אימונים: **${s.last7}** ב-7 הימים האחרונים, **${s.last30}** ב-30 הימים האחרונים (${s.completedTotal} בסך הכול).`,
      ),
    );
    if (goal) {
      lines.push(
        L(
          lang,
          `- Consistency: about **${fmtNum(perWeek, lang)} workouts per week** over the last ${weeks === 1 ? 'week' : `${weeks} weeks`}, vs. your goal of ${goal} (${pct(perWeek, goal)}%).`,
          `- עקביות: בממוצע כ-**${fmtNum(perWeek, lang)} אימונים בשבוע** ב${weeks === 1 ? 'שבוע האחרון' : `-${weeks} השבועות האחרונים`}, לעומת יעד של ${goal} (${pct(perWeek, goal)}%).`,
        ),
      );
    }
    if (s.volume30Kg > 0) {
      lines.push(
        L(
          lang,
          `- Training volume in the last 30 days: **${fmtWeight(s.volume30Kg, data.units, lang)}** lifted (weight × reps).`,
          `- נפח אימון ב-30 הימים האחרונים: **${fmtWeight(s.volume30Kg, data.units, lang)}** (משקל × חזרות).`,
        ),
      );
    }
    lines.push('', `**${L(lang, 'Recent personal records', 'שיאים אישיים אחרונים')}**`);
    if (!data.prs.length) {
      lines.push(L(lang, '- No personal records in the last 90 days yet.', '- עדיין אין שיאים אישיים ב-90 הימים האחרונים.'));
    } else {
      for (const r of data.prs.slice(0, 5)) {
        const value =
          r.type === 'max_duration'
            ? `${fmtNum(r.value, lang)} ${L(lang, 's', 'שנ׳')}`
            : r.type === 'max_reps'
              ? `${fmtNum(r.value, lang)} ${L(lang, 'reps', 'חזרות')}`
              : fmtWeight(r.value, data.units, lang);
        lines.push(`- ${fmtDate(r.date, lang)}: **${r.name[lang]}** — ${PR_TYPE_LABELS[lang][r.type]} ${value}`);
      }
    }
    if (goal) {
      const ratio = perWeek / goal;
      lines.push(
        '',
        ratio >= 0.9
          ? L(lang, 'Great consistency — keep progressing gradually and the results will follow.', 'עקביות מצוינת – להמשיך להתקדם בהדרגה, והתוצאות יגיעו.')
          : ratio < 0.6
            ? L(
                lang,
                'Consistency is your biggest lever right now: a schedule with fewer or shorter sessions that you can keep every week will move you forward faster.',
                'העקביות היא המנוף הגדול ביותר כרגע: לוח זמנים עם פחות אימונים או אימונים קצרים יותר, שאפשר לעמוד בו כל שבוע, יקדם אותך מהר יותר.',
              )
            : L(lang, "You're close to your weekly goal — fixed training days can help you hit it every week.", 'זה קרוב ליעד השבועי – קביעת ימי אימון קבועים יכולה לעזור לעמוד בו בכל שבוע.'),
      );
    }
  }
  const tr = data.weight.trend;
  if (tr) {
    const change = `${tr.changeKg > 0 ? '+' : ''}${fmtWeight(tr.changeKg, data.units, lang)}`;
    lines.push(
      '',
      `**${L(lang, 'Body weight', 'משקל גוף')}**`,
      L(
        lang,
        `- ${fmtWeight(tr.from.kg, data.units, lang)} on ${fmtDate(tr.from.date, lang)} → ${fmtWeight(tr.to.kg, data.units, lang)} on ${fmtDate(tr.to.date, lang)} (${change}).`,
        `- ${fmtWeight(tr.from.kg, data.units, lang)} ב-${fmtDate(tr.from.date, lang)} ← ${fmtWeight(tr.to.kg, data.units, lang)} ב-${fmtDate(tr.to.date, lang)} (${change}).`,
      ),
    );
  } else if (data.weight.latest) {
    lines.push(
      '',
      L(
        lang,
        `Latest body weight: ${fmtWeight(data.weight.latest.kg, data.units, lang)} (${fmtDate(data.weight.latest.date, lang)}). Log it regularly to see a trend.`,
        `משקל הגוף האחרון: ${fmtWeight(data.weight.latest.kg, data.units, lang)} (${fmtDate(data.weight.latest.date, lang)}). שקילה קבועה תאפשר לראות מגמה.`,
      ),
    );
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------- nutrition

function prefsFromMessage(message: string): DietPreferences {
  const text = normalizeText(message);
  let dietType: DietType | null = null;
  if (containsAny(text, ['vegan', 'plant based', 'טבעוני', 'טבעונית', 'טבעונית'])) dietType = 'vegan';
  else if (containsAny(text, ['vegetarian', 'veggie', 'צמחוני', 'צמחונית'])) dietType = 'vegetarian';
  else if (containsAny(text, ['pescatarian', 'פסקטריאני', 'פסקטריאנית'])) dietType = 'pescatarian';
  const restrictions: DietaryRestriction[] = [];
  if (containsAny(text, ['gluten free', 'ללא גלוטן', 'בלי גלוטן'])) restrictions.push('gluten_free');
  if (containsAny(text, ['dairy free', 'lactose free', 'no dairy', 'ללא לקטוז', 'בלי לקטוז', 'ללא חלב', 'בלי חלב'])) restrictions.push('lactose_free');
  return { dietType, allergies: [], restrictions };
}

function profilePrefs(data: CoachData): DietPreferences {
  return { dietType: data.profile.dietType, allergies: data.profile.allergies, restrictions: data.profile.dietaryRestrictions };
}

function dislikedWords(data: CoachData): string[] {
  return data.profile.dislikedFoods
    .split(/[,;\n،]+/)
    .map((w) => normalizeText(w))
    .filter((w) => w.length >= 3);
}

function foodAllowed(food: FoodData, prefs: DietPreferences[], disliked: string[]): boolean {
  if (prefs.some((p) => foodConflicts(food, p).length > 0)) return false;
  const names = normalizeText(`${food.name.en} ${food.name.he}`);
  return !disliked.some((w) => names.includes(w));
}

/** High-protein foods that fit the user's diet, allergies, restrictions and dislikes. */
export function proteinFoods(foods: FoodData[], prefs: DietPreferences[], disliked: string[], limit = 4): FoodData[] {
  return foods
    .filter((f) => foodAllowed(f, prefs, disliked) && f.category !== 'supplements')
    .map((f) => ({ f, perServing: (f.per100g.protein * f.servingGrams) / 100, density: f.per100g.kcal > 0 ? f.per100g.protein / f.per100g.kcal : 0 }))
    .filter((x) => x.perServing >= 8 && x.density >= 0.06)
    .sort((a, b) => b.density - a.density || b.perServing - a.perServing)
    .slice(0, limit)
    .map((x) => x.f);
}

function foodLine(f: FoodData, lang: Locale): string {
  const protein = Math.round((f.per100g.protein * f.servingGrams) / 100);
  const kcal = Math.round((f.per100g.kcal * f.servingGrams) / 100);
  return L(
    lang,
    `- **${f.name.en}** — ${protein} g protein, ${kcal} kcal per ${f.servingLabel.en}`,
    `- **${f.name.he}** — ${protein} גר׳ חלבון, ${kcal} קק"ל ל${f.servingLabel.he}`,
  );
}

async function nutritionAnswer(data: CoachData, lang: Locale, loadFoods: () => Promise<FoodCatalog>): Promise<string> {
  const t = data.profile.targets;
  const lines: string[] = [];
  if (!t) {
    return L(
      lang,
      "Your nutrition targets aren't available yet. Complete your profile (age, sex, height, weight, activity level and goal) so LUPU-FIT can calculate them — then I can compare your food log with them.",
      'יעדי התזונה שלך עדיין לא זמינים. כדאי להשלים את הפרופיל (גיל, מין, גובה, משקל, רמת פעילות ומטרה) כדי ש-LUPU-FIT תחשב אותם – ואז אוכל להשוות אליהם את יומן האכילה.',
    );
  }
  lines.push(
    L(
      lang,
      `**Your daily targets:** ${fmtNum(t.calories, lang, 0)} kcal · protein ${t.proteinG} g · carbs ${t.carbsG} g · fat ${t.fatG} g`,
      `**היעדים היומיים שלך:** ${fmtNum(t.calories, lang, 0)} קק"ל · חלבון ${t.proteinG} גר׳ · פחמימות ${t.carbsG} גר׳ · שומן ${t.fatG} גר׳`,
    ),
  );
  const today = data.nutrition.today;
  if (today) {
    lines.push(
      L(
        lang,
        `**Today so far:** ${fmtNum(today.kcal, lang, 0)} kcal and ${fmtNum(today.proteinG, lang, 0)} g protein (${pct(today.proteinG, t.proteinG)}% of your protein target).`,
        `**היום עד עכשיו:** ${fmtNum(today.kcal, lang, 0)} קק"ל ו-${fmtNum(today.proteinG, lang, 0)} גר׳ חלבון (${pct(today.proteinG, t.proteinG)}% מיעד החלבון).`,
      ),
    );
  }
  const avg = data.nutrition.average;
  let proteinGap = 0;
  if (!avg) {
    lines.push(
      '',
      L(
        lang,
        `You haven't logged food in the previous ${data.nutrition.windowDays} days, so I can't judge your intake yet. Log your meals in Nutrition for a few days and ask again.`,
        `לא נרשם אוכל ב-${data.nutrition.windowDays} הימים הקודמים, ולכן עדיין אין לי אפשרות להעריך את הצריכה שלך. כדאי לתעד ארוחות במסך התזונה במשך כמה ימים ולשאול שוב.`,
      ),
    );
  } else {
    lines.push(
      L(
        lang,
        `**Previous ${data.nutrition.windowDays} days** (average of ${data.nutrition.daysLogged} logged ${data.nutrition.daysLogged === 1 ? 'day' : 'days'}): ${fmtNum(avg.kcal, lang, 0)} kcal (${pct(avg.kcal, t.calories)}%) · protein ${avg.proteinG} g (${pct(avg.proteinG, t.proteinG)}%) · carbs ${avg.carbsG} g · fat ${avg.fatG} g.`,
        `**${data.nutrition.windowDays} הימים הקודמים** (ממוצע של ${data.nutrition.daysLogged === 1 ? 'יום מתועד אחד' : `${data.nutrition.daysLogged} ימים מתועדים`}): ${fmtNum(avg.kcal, lang, 0)} קק"ל (${pct(avg.kcal, t.calories)}%) · חלבון ${avg.proteinG} גר׳ (${pct(avg.proteinG, t.proteinG)}%) · פחמימות ${avg.carbsG} גר׳ · שומן ${avg.fatG} גר׳.`,
      ),
      '',
    );
    proteinGap = Math.round(t.proteinG - avg.proteinG);
    lines.push(
      avg.proteinG >= t.proteinG * 0.9
        ? L(lang, "- **Protein:** you're meeting your target — nice work.", '- **חלבון:** היעד מושג – כל הכבוד.')
        : L(
            lang,
            `- **Protein:** you're averaging about **${proteinGap} g below** your target. Adding 20–30 g of protein to one or two meals would close the gap.`,
            `- **חלבון:** הממוצע נמוך בכ-**${proteinGap} גר׳** מהיעד. תוספת של 20–30 גר׳ חלבון לארוחה אחת או שתיים תסגור את הפער.`,
          ),
    );
    const min = data.minimumCalories;
    if (min && avg.kcal < min) {
      lines.push(
        L(
          lang,
          `- **Calories:** your average is below the safe minimum LUPU-FIT uses for you (${fmtNum(min, lang, 0)} kcal). Eating this little can cost muscle, energy and recovery — please bring it up toward your target, and talk to a professional if eating enough feels hard.`,
          `- **קלוריות:** הממוצע נמוך מהמינימום הבטוח ש-LUPU-FIT מגדירה עבורך (${fmtNum(min, lang, 0)} קק"ל). אכילה מועטה כל כך עלולה לפגוע בשריר, באנרגיה ובהתאוששות – כדאי להתקרב ליעד, ולהתייעץ עם איש/אשת מקצוע אם קשה לאכול מספיק.`,
        ),
      );
    } else if (avg.kcal < t.calories * 0.85) {
      lines.push(
        L(
          lang,
          `- **Calories:** you're eating noticeably below your target${data.profile.goal === 'fat_loss' ? ' — the target already includes a safe deficit, so going lower mostly costs energy and muscle' : ', which can slow progress and recovery'}.`,
          `- **קלוריות:** הצריכה נמוכה באופן ניכר מהיעד${data.profile.goal === 'fat_loss' ? ' – היעד כבר כולל גירעון בטוח, וירידה נוספת פוגעת בעיקר באנרגיה ובשריר' : ', וזה עלול להאט את ההתקדמות וההתאוששות'}.`,
        ),
      );
    } else if (avg.kcal > t.calories * 1.15) {
      lines.push(
        L(
          lang,
          "- **Calories:** you're above your target on average. If that isn't intentional, look at portion sizes, drinks and snacks first.",
          '- **קלוריות:** הממוצע גבוה מהיעד. אם זה לא מכוון, כדאי לבדוק קודם גדלי מנות, משקאות ונשנושים.',
        ),
      );
    } else {
      lines.push(L(lang, "- **Calories:** you're close to your target.", '- **קלוריות:** הצריכה קרובה ליעד.'));
    }
  }
  if (data.profile.isMinor) {
    lines.push(
      '',
      L(
        lang,
        "Because you're under 18, the focus is on eating enough to fuel growth and training — LUPU-FIT never sets a calorie deficit for you.",
        'מתחת לגיל 18 ההתמקדות היא באכילה מספקת שתומכת בגדילה ובאימונים – LUPU-FIT לא מגדירה עבורך גירעון קלורי.',
      ),
    );
  }
  if (!avg || proteinGap > t.proteinG * 0.1) {
    const { foods } = await loadFoods();
    const picks = proteinFoods(foods, [profilePrefs(data)], dislikedWords(data));
    if (picks.length) lines.push('', `**${L(lang, 'Protein-rich foods that fit your diet', 'מזונות עשירים בחלבון שמתאימים לתזונה שלך')}**`, ...picks.map((f) => foodLine(f, lang)));
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------- meal ideas

function mealTypeFromMessage(message: string): MealType | null {
  const text = normalizeText(message);
  if (containsAny(text, ['breakfast', 'ארוחת בוקר', 'בבוקר'])) return 'breakfast';
  if (containsAny(text, ['lunch', 'ארוחת צהריים', 'ארוחת צהרים', 'בצהריים'])) return 'lunch';
  if (containsAny(text, ['dinner', 'supper', 'ארוחת ערב', 'בערב'])) return 'dinner';
  if (containsAny(text, ['snack', 'נשנוש', 'חטיף', 'ביניים'])) return 'snack';
  return null;
}

function prefsSummary(prefs: DietPreferences[], lang: Locale): string {
  const parts: string[] = [];
  const diets = prefs.map((p) => p.dietType).filter((d): d is DietType => d != null && d !== 'omnivore');
  for (const d of Array.from(new Set(diets))) parts.push(DIET_LABELS[lang][d]);
  const allergies = Array.from(new Set(prefs.flatMap((p) => p.allergies)));
  if (allergies.length) parts.push(L(lang, `without ${joinList(allergies.map((a) => ALLERGEN_LABELS.en[a]), 'en')}`, `ללא ${joinList(allergies.map((a) => ALLERGEN_LABELS.he[a]), 'he')}`));
  for (const r of Array.from(new Set(prefs.flatMap((p) => p.restrictions)))) parts.push(RESTRICTION_LABELS[lang][r]);
  return parts.join(', ');
}

/** Meal templates compatible with every preference set (and the user's dislikes). */
export function compatibleTemplates(templates: MealTemplateData[], prefs: DietPreferences[], disliked: string[]): MealTemplateData[] {
  return templates.filter((t) => t.items.every((i) => foodAllowed(i.food, prefs, disliked)));
}

async function mealIdeasAnswer(message: string, data: CoachData, lang: Locale, loadFoods: () => Promise<FoodCatalog>): Promise<string> {
  const { foods, templates } = await loadFoods();
  const prefs = [profilePrefs(data), prefsFromMessage(message)];
  const disliked = dislikedWords(data);
  const text = normalizeText(message);
  const highProtein = containsAny(text, ['protein', 'חלבון']);
  const mealType = mealTypeFromMessage(message);
  const summary = prefsSummary(prefs, lang);
  const lines: string[] = [];

  let matches = compatibleTemplates(templates, prefs, disliked);
  let typeNote = '';
  if (mealType) {
    const typed = matches.filter((t) => t.mealTypes.includes(mealType));
    if (typed.length) matches = typed;
    else if (matches.length) typeNote = L(lang, `I don't have a matching ${mealType} template, so here are other options:`, 'אין לי תבנית מתאימה לסוג הארוחה הזה, אז הנה אפשרויות אחרות:');
  }
  const perMeal = data.profile.targets ? data.profile.targets.calories / Math.max(1, data.profile.mealsPerDay ?? 3) : null;
  matches = [...matches].sort((a, b) =>
    highProtein || !perMeal ? b.macros.proteinG - a.macros.proteinG : Math.abs(a.macros.kcal - perMeal) - Math.abs(b.macros.kcal - perMeal),
  );

  if (matches.length) {
    lines.push(
      L(
        lang,
        `**Meal ideas from LUPU-FIT's meal library**${summary ? ` (${summary})` : ''}:`,
        `**רעיונות לארוחות מספריית הארוחות של LUPU-FIT**${summary ? ` (${summary})` : ''}:`,
      ),
    );
    if (typeNote) lines.push(typeNote);
    for (const t of matches.slice(0, 3)) {
      const m = t.macros;
      lines.push(
        `- **${t.name[lang]}** — ${t.description[lang]}`,
        L(
          lang,
          `  ${fmtNum(m.kcal, lang, 0)} kcal · protein ${fmtNum(m.proteinG, lang, 0)} g · carbs ${fmtNum(m.carbsG, lang, 0)} g · fat ${fmtNum(m.fatG, lang, 0)} g · ${t.prepMinutes} min`,
          `  ${fmtNum(m.kcal, lang, 0)} קק"ל · חלבון ${fmtNum(m.proteinG, lang, 0)} גר׳ · פחמימות ${fmtNum(m.carbsG, lang, 0)} גר׳ · שומן ${fmtNum(m.fatG, lang, 0)} גר׳ · ${t.prepMinutes} דק׳`,
        ),
      );
    }
    if (perMeal) {
      lines.push(
        '',
        L(
          lang,
          `For reference, your targets work out to about ${fmtNum(Math.round(perMeal / 10) * 10, lang, 0)} kcal per meal across ${data.profile.mealsPerDay ?? 3} meals.`,
          `לשם השוואה, היעדים שלך הם בערך ${fmtNum(Math.round(perMeal / 10) * 10, lang, 0)} קק"ל לארוחה, ב-${data.profile.mealsPerDay ?? 3} ארוחות ביום.`,
        ),
      );
    }
    return lines.join('\n');
  }

  const picks = proteinFoods(foods, prefs, disliked, 5);
  if (picks.length) {
    lines.push(
      L(
        lang,
        `I don't have a meal template that fits your preferences${summary ? ` (${summary})` : ''}, but these protein-rich foods from the LUPU-FIT food database do — combine one with a whole-grain or starchy side and vegetables:`,
        `אין לי תבנית ארוחה שמתאימה להעדפות שלך${summary ? ` (${summary})` : ''}, אבל המזונות העשירים בחלבון האלה ממאגר המזון של LUPU-FIT מתאימים – אפשר לשלב אחד מהם עם תוספת פחמימה מלאה וירקות:`,
      ),
      ...picks.map((f) => foodLine(f, lang)),
    );
    return lines.join('\n');
  }
  return L(
    lang,
    "I couldn't find meals or foods in LUPU-FIT's database that fit your preferences, so I won't make something up. You can add your own foods and saved meals in Nutrition.",
    'לא מצאתי במאגר של LUPU-FIT ארוחות או מזונות שמתאימים להעדפות שלך, ולכן לא אמציא. אפשר להוסיף מזונות וארוחות שמורות משלך במסך התזונה.',
  );
}

// ---------------------------------------------------------------------------- principles

function principleText(topic: PrincipleTopic, data: CoachData, lang: Locale): string {
  const p = data.profile;
  switch (topic) {
    case 'progressive_overload':
      return L(
        lang,
        [
          '**Progressive overload** means gradually asking a little more of your muscles over time, so they keep adapting.',
          '- Add a small amount of weight once you reach the top of your rep range on every set with good form (about 1–2.5 kg for upper-body lifts, 2.5–5 kg for lower-body lifts).',
          '- You can also add a rep or a set, slow the tempo or use a harder variation — change one thing at a time.',
          "- Progress isn't linear: some weeks you'll repeat the same numbers, and that's fine.",
          '- Never add load at the expense of technique.',
        ].join('\n'),
        [
          '**עומס הדרגתי (Progressive overload)** פירושו לדרוש מהשרירים קצת יותר לאורך זמן, כדי שימשיכו להסתגל.',
          '- מוסיפים מעט משקל כשמגיעים לקצה העליון של טווח החזרות בכל הסטים בטכניקה טובה (בערך 1–2.5 ק"ג בתרגילי פלג גוף עליון, 2.5–5 ק"ג בתרגילי רגליים).',
          '- אפשר גם להוסיף חזרה או סט, להאט את הקצב או לעבור לווריאציה קשה יותר – שינוי אחד בכל פעם.',
          '- ההתקדמות לא ליניארית: יש שבועות שבהם חוזרים על אותם מספרים, וזה בסדר.',
          '- אף פעם לא מוסיפים משקל על חשבון הטכניקה.',
        ].join('\n'),
      );
    case 'rep_ranges': {
      const goalLine =
        p.goal === 'strength'
          ? L(lang, 'For your goal (strength), build most of your main lifts around 3–6 reps, with accessories at 8–12.', 'למטרה שלך (כוח), כדאי לבנות את רוב התרגילים המרכזיים סביב 3–6 חזרות, ותרגילי עזר ב-8–12.')
          : p.goal === 'muscle_gain'
            ? L(lang, 'For your goal (building muscle), most sets in the 6–12 range work best.', 'למטרה שלך (בניית שריר), רוב הסטים בטווח 6–12 חזרות עובדים הכי טוב.')
            : p.goal
              ? L(lang, `For your goal (${GOAL_LABELS.en[p.goal]}), a mix of 6–15 reps is a great default.`, `למטרה שלך (${GOAL_LABELS.he[p.goal]}), שילוב של 6–15 חזרות הוא ברירת מחדל מצוינת.`)
              : '';
      const lines = [
        L(lang, '**Rep ranges** — all of them build muscle when sets end close to failure; the range shifts the emphasis:', '**טווחי חזרות** – כולם בונים שריר כשהסטים מסתיימים קרוב לכשל; הטווח משנה את הדגש:'),
        L(lang, '- **Strength:** 3–6 reps with heavier loads and longer rest.', '- **כוח:** 3–6 חזרות עם משקלים כבדים ומנוחה ארוכה יותר.'),
        L(lang, '- **Muscle growth:** about 6–12 (up to 15–20) reps, finishing with 1–3 reps in reserve.', '- **בניית שריר:** בערך 6–12 חזרות (עד 15–20), ולסיים עם 1–3 חזרות ברזרבה.'),
        L(lang, '- **Muscular endurance:** 15+ reps with lighter loads.', '- **סיבולת שרירית:** 15 חזרות ומעלה עם משקלים קלים יותר.'),
        L(lang, '- Most people progress well with about 10–20 hard sets per muscle group per week.', '- רוב המתאמנים מתקדמים היטב עם כ-10–20 סטים מאומצים לכל קבוצת שרירים בשבוע.'),
      ];
      if (goalLine) lines.push(goalLine);
      if (p.isMinor) lines.push(L(lang, 'Under 18: stay around 8–15 reps with good technique and avoid max-effort single reps.', 'מתחת לגיל 18: כדאי להישאר בטווח של כ-8–15 חזרות עם טכניקה טובה ולהימנע מחזרה מקסימלית בודדת.'));
      return lines.join('\n');
    }
    case 'rest':
      return L(
        lang,
        [
          '**Rest periods**',
          '- Heavy compound lifts (squats, presses, deadlifts, rows): 2–3 minutes, up to 3–5 for very heavy strength sets.',
          '- Isolation and machine exercises: 60–90 seconds.',
          '- Circuits and conditioning: 30–60 seconds.',
          '- Rest long enough to repeat the quality of the previous set — cutting rest too short usually costs reps.',
          '- **Rest days:** train each muscle group about twice a week, leave ~48 hours between hard sessions for the same muscles, and keep at least one full rest day a week.',
        ].join('\n'),
        [
          '**זמני מנוחה**',
          '- תרגילים מורכבים כבדים (סקוואט, לחיצות, דדליפט, חתירות): 2–3 דקות, ועד 3–5 דקות בסטים כבדים מאוד של כוח.',
          '- תרגילי בידוד ומכונות: 60–90 שניות.',
          '- מעגלים ואימוני סיבולת: 30–60 שניות.',
          '- כדאי לנוח מספיק כדי לחזור על איכות הסט הקודם – מנוחה קצרה מדי בדרך כלל עולה בחזרות.',
          '- **ימי מנוחה:** לאמן כל קבוצת שרירים בערך פעמיים בשבוע, להשאיר כ-48 שעות בין אימונים קשים לאותם שרירים, ולשמור לפחות יום מנוחה מלא בשבוע.',
        ].join('\n'),
      );
    case 'deload':
      return L(
        lang,
        [
          '**Deload** = a planned, easier week that lets accumulated fatigue fade.',
          '- Use one every 4–8 weeks of hard training, or when performance stalls for 2+ weeks, sleep gets worse or joints ache.',
          '- Keep the same exercises but cut volume by about 40–50% (fewer sets) and/or use ~10% lighter loads.',
          '- Afterwards, return to normal training — often a little stronger.',
        ].join('\n'),
        [
          '**דילואד (שבוע הקלה)** = שבוע קל ומתוכנן שמאפשר לעייפות המצטברת לרדת.',
          '- מתאים אחרי 4–8 שבועות של אימונים קשים, או כשהביצועים תקועים שבועיים ויותר, השינה נפגעת או שהמפרקים כואבים.',
          '- שומרים על אותם תרגילים, אבל מורידים את הנפח בכ-40%–50% (פחות סטים) ו/או עובדים עם משקלים קלים בכ-10%.',
          '- אחר כך חוזרים לאימונים הרגילים – ולעיתים קרובות קצת חזקים יותר.',
        ].join('\n'),
      );
    case 'warm_up':
      return L(
        lang,
        [
          '**Warm-up (5–10 minutes)**',
          '1. 3–5 minutes of light cardio to raise your body temperature.',
          "2. Dynamic mobility for the joints you'll train (leg swings, arm circles, cat-cow, World's Greatest Stretch).",
          '3. 2–4 ramp-up sets of your first exercise: start light (or with the empty bar) and build toward your working weight with fewer reps each set.',
          'Save long static stretching for after the workout.',
        ].join('\n'),
        [
          '**חימום (5–10 דקות)**',
          '1. 3–5 דקות של פעילות אירובית קלה כדי להעלות את חום הגוף.',
          '2. מוביליטי דינמי למפרקים שיעבדו באימון (הנפות רגליים, סיבובי ידיים, חתול-פרה, "המתיחה הטובה בעולם").',
          '3. 2–4 סטי הכנה בתרגיל הראשון: מתחילים קל (או עם מוט ריק) ומתקדמים למשקל העבודה, עם פחות חזרות בכל סט.',
          'מתיחות סטטיות ארוכות עדיף להשאיר לסוף האימון.',
        ].join('\n'),
      );
    case 'recovery': {
      const sleep =
        p.sleepHours != null
          ? p.sleepHours < 7
            ? L(lang, ` You reported about ${fmtNum(p.sleepHours, lang)} hours a night — getting closer to 7–9 would help.`, ` דיווחת על כ-${fmtNum(p.sleepHours, lang)} שעות שינה בלילה – התקרבות ל-7–9 שעות תעזור.`)
            : L(lang, ` You reported about ${fmtNum(p.sleepHours, lang)} hours a night — good.`, ` דיווחת על כ-${fmtNum(p.sleepHours, lang)} שעות שינה בלילה – מצוין.`)
          : '';
      const lines = [
        L(lang, '**Recovery** is when you actually get stronger.', '**התאוששות** היא השלב שבו באמת מתחזקים.'),
        L(lang, `- **Sleep:** aim for 7–9 hours; poor sleep lowers strength, recovery and appetite control.${sleep}`, `- **שינה:** לשאוף ל-7–9 שעות; שינה לא מספקת פוגעת בכוח, בהתאוששות ובשליטה בתיאבון.${sleep}`),
        L(lang, '- **Food:** eat enough overall and spread protein over 3–4 meals.', '- **תזונה:** לאכול מספיק ולפזר את החלבון על פני 3–4 ארוחות.'),
        L(
          lang,
          "- **Soreness (DOMS)** is normal after new or harder training and fades within 2–3 days; light movement helps. It isn't a measure of a good workout.",
          '- **כאבי שרירים מאוחרים** הם נורמליים אחרי אימון חדש או קשה יותר וחולפים תוך 2–3 ימים; תנועה קלה עוזרת. הם לא מדד לאימון טוב.',
        ),
        L(
          lang,
          '- Persistent fatigue, falling performance and poor sleep are signs to reduce the load or take a deload week.',
          '- עייפות מתמשכת, ירידה בביצועים ושינה גרועה הם סימנים להפחית עומס או לקחת שבוע הקלה.',
        ),
      ];
      if (p.stressLevel === 'high') lines.push(L(lang, 'High stress also slows recovery — on stressful weeks, slightly lower volume is smart.', 'גם לחץ גבוה מאט את ההתאוששות – בשבועות לחוצים כדאי להוריד מעט את הנפח.'));
      return lines.join('\n');
    }
    case 'consistency': {
      const lines = [
        L(lang, '**Consistency beats intensity.**', '**עקביות מנצחת עצימות.**'),
        L(
          lang,
          '- Choose a schedule you can keep even in a busy week — three solid sessions every week beat six one week and none the next.',
          '- כדאי לבחור לוח זמנים שאפשר לעמוד בו גם בשבוע עמוס – שלושה אימונים טובים בכל שבוע עדיפים על שישה בשבוע אחד ואף אחד בשבוע שאחריו.',
        ),
        L(lang, '- Put training days and times in your calendar like appointments; LUPU-FIT reminders can help.', '- לקבוע ימים ושעות לאימון ביומן כמו פגישות; התזכורות של LUPU-FIT יכולות לעזור.'),
        L(lang, '- On a bad day, do a shorter version instead of skipping — showing up keeps the habit alive.', '- ביום קשה, עדיף אימון מקוצר על פני ויתור – ההגעה עצמה שומרת על ההרגל.'),
      ];
      const goal = p.weeklyWorkoutGoal;
      if (goal && data.stats.completedTotal > 0) {
        lines.push(
          L(
            lang,
            `Your data: ${data.stats.last28} workouts in the last 4 weeks vs. a goal of ${goal} per week (${goal * 4} in 4 weeks).`,
            `הנתונים שלך: ${data.stats.last28} אימונים ב-4 השבועות האחרונים, לעומת יעד של ${goal} בשבוע (${goal * 4} בארבעה שבועות).`,
          ),
        );
      }
      return lines.join('\n');
    }
  }
}

function principlesAnswer(message: string, data: CoachData, lang: Locale): string {
  const topics = principleTopics(message).slice(0, 2);
  return topics.map((t) => principleText(t, data, lang)).join('\n\n');
}

// ---------------------------------------------------------------------------- plan

function planAnswer(data: CoachData, lang: Locale, exercises: ExerciseRecord[]): string {
  const plan = data.plan;
  if (!plan) {
    return L(
      lang,
      "You don't have an active workout plan yet. Create one in Workouts — LUPU-FIT can generate a plan from your profile — and once you've trained with it for a couple of weeks, I can suggest data-based adjustments.",
      'עדיין אין לך תוכנית אימונים פעילה. אפשר ליצור תוכנית במסך האימונים – LUPU-FIT יכולה לבנות תוכנית לפי הפרופיל שלך – ואחרי שבועיים של אימונים לפיה אוכל להציע התאמות על סמך הנתונים.',
    );
  }
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const lines: string[] = [
    L(lang, `**${plan.name}** — ${plan.daysPerWeek ?? '?'} days a week.`, `**${plan.name}** – ${plan.daysPerWeek ?? '?'} ימים בשבוע.`),
    '',
  ];
  const suggestions: string[] = [];
  const s = data.stats;

  if (s.completedTotal === 0) {
    suggestions.push(
      L(
        lang,
        "There isn't any workout data yet, so I can't judge whether the plan needs changes. Complete about 2–3 weeks of it, then ask again.",
        'עדיין אין נתוני אימונים, ולכן אין לי אפשרות להעריך אם התוכנית צריכה שינוי. כדאי להשלים לפיה כ-2–3 שבועות ואז לשאול שוב.',
      ),
    );
  } else if (plan.daysPerWeek) {
    const weeks = s.firstWorkoutDate ? Math.min(4, Math.max(1, Math.ceil((Date.parse(`${data.today}T00:00:00Z`) - Date.parse(`${s.firstWorkoutDate}T00:00:00Z`) + 86_400_000) / (7 * 86_400_000)))) : 4;
    const perWeek = s.last28 / weeks;
    const ratio = perWeek / plan.daysPerWeek;
    if (ratio < 0.6 && plan.daysPerWeek > 2) {
      suggestions.push(
        L(
          lang,
          `**Consistency:** you've averaged ${fmtNum(perWeek, lang)} workouts a week vs. ${plan.daysPerWeek} planned. A ${plan.daysPerWeek - 1}-day plan (or shorter sessions) that you can keep will beat a plan you often skip.`,
          `**עקביות:** בממוצע ${fmtNum(perWeek, lang)} אימונים בשבוע לעומת ${plan.daysPerWeek} מתוכננים. תוכנית של ${plan.daysPerWeek - 1} ימים (או אימונים קצרים יותר) שאפשר לעמוד בה עדיפה על תוכנית שמדלגים עליה לעיתים קרובות.`,
        ),
      );
    } else if (ratio >= 1) {
      suggestions.push(L(lang, "**Consistency:** you're completing every planned session — excellent.", '**עקביות:** כל האימונים המתוכננים מושלמים – מצוין.'));
    }
  }

  // Exercises where every set reached the top of the rep range at the same load.
  const seen = new Set<string>();
  const ready: string[] = [];
  for (const sess of data.recentSessions) {
    for (const ex of sess.exercises) {
      if (seen.has(ex.exerciseId)) continue;
      seen.add(ex.exerciseId);
      const loads = ex.sets.map((x) => x.weightKg ?? 0);
      if (ex.repMax == null || ex.sets.length === 0 || loads.some((w) => w <= 0) || new Set(loads).size !== 1) continue;
      if (ex.sets.every((x) => (x.reps ?? 0) >= ex.repMax!)) {
        const inc = byId.get(ex.exerciseId)?.loadIncrementKg ?? 2.5;
        ready.push(
          L(
            lang,
            `**${ex.name.en}:** you hit the top of the rep range (${ex.repMax}) on every set at ${fmtWeight(loads[0]!, data.units, lang)} — add about ${fmtWeight(inc, data.units, lang)} next time.`,
            `**${ex.name.he}:** הגעת לקצה העליון של טווח החזרות (${ex.repMax}) בכל הסטים עם ${fmtWeight(loads[0]!, data.units, lang)} – בפעם הבאה אפשר להוסיף כ-${fmtWeight(inc, data.units, lang)}.`,
          ),
        );
      }
    }
  }
  suggestions.push(...ready.slice(0, 3));

  if (profileKnown(data)) {
    const flagged = new Set<string>();
    for (const w of plan.workouts) {
      for (const pe of w.exercises) {
        const e = byId.get(pe.exerciseId);
        if (!e || flagged.has(e.id)) continue;
        const ctx = userContextFor(e, data.profile.equipment, data.profile.injuries);
        if (!ctx.injuryConflicts.length && ctx.hasRequiredEquipment) continue;
        flagged.add(e.id);
        const alt = e.easierAlternatives
          .map((id) => byId.get(id))
          .find((x): x is ExerciseRecord => x != null && isExerciseSuitable(x, data.profile.equipment, data.profile.injuries));
        const altText = alt ? L(lang, ` Consider swapping it for **${alt.name.en}**.`, ` אפשר לשקול להחליף אותו ב**${alt.name.he}**.`) : '';
        if (ctx.injuryConflicts.length) {
          suggestions.push(
            L(
              lang,
              `**${e.name.en}** can load your ${joinList(ctx.injuryConflicts.map((a) => INJURY_LABELS.en[a]), 'en')}.${altText}`,
              `**${e.name.he}** עלול להעמיס על ה${joinList(ctx.injuryConflicts.map((a) => INJURY_LABELS.he[a]), 'he')}.${altText}`,
            ),
          );
        } else {
          suggestions.push(
            L(
              lang,
              `**${e.name.en}** needs ${equipmentText(ctx.missingEquipment, 'en')}, which isn't in your profile.${altText}`,
              `**${e.name.he}** דורש ${equipmentText(ctx.missingEquipment, 'he')}, שלא מופיע בפרופיל שלך.${altText}`,
            ),
          );
        }
        if (flagged.size >= 3) break;
      }
    }
  }

  if (!suggestions.length) {
    suggestions.push(
      L(
        lang,
        'Your plan matches your recent data well — keep following it and progress gradually.',
        'התוכנית מתאימה היטב לנתונים האחרונים שלך – כדאי להמשיך לפיה ולהתקדם בהדרגה.',
      ),
    );
  }
  lines.push(...suggestions.map((x) => `- ${x}`), '', L(lang, 'You can edit the plan in Workouts.', 'אפשר לערוך את התוכנית במסך האימונים.'));
  return lines.join('\n');
}

// ---------------------------------------------------------------------------- fallback

function fallbackAnswer(lang: Locale): string {
  return L(
    lang,
    [
      "I'm LUPU-FIT's built-in coach: I answer from your own data and LUPU-FIT's exercise and food libraries. Try asking:",
      '- How do I squat with good form?',
      '- My shoulder hurts on bench press — what can I do instead?',
      '- Explain my progress this month',
      '- Am I eating enough protein?',
      '- Suggest a high-protein vegetarian dinner',
      '- What is progressive overload?',
      '- Should I change my plan?',
    ].join('\n'),
    [
      'אני המאמן המובנה של LUPU-FIT: התשובות שלי מבוססות על הנתונים שלך ועל ספריות התרגילים והמזון של LUPU-FIT. אפשר לשאול למשל:',
      '- איך עושים סקוואט בטכניקה נכונה?',
      '- הכתף כואבת לי בלחיצת חזה – מה אפשר לעשות במקום?',
      '- תסביר לי את ההתקדמות שלי החודש',
      '- האם צריכת החלבון שלי מספיקה?',
      '- תציע ארוחת ערב צמחונית עשירה בחלבון',
      '- מה זה עומס הדרגתי?',
      '- כדאי לי לשנות את התוכנית?',
    ].join('\n'),
  );
}

// ---------------------------------------------------------------------------- entry point

/** Deterministic reply grounded in the user's data and LUPU-FIT's libraries. */
export async function builtinReply(input: BuiltinInput): Promise<BuiltinResult> {
  const { message, lang, data, exercises, loadFoods } = input;
  const exercise = findExercise(message, exercises, {
    userExerciseIds: userExerciseIds(data),
    equipment: profileKnown(data) ? data.profile.equipment : null,
  });
  const intent = detectIntent(message, exercise != null);
  let text: string;
  switch (intent) {
    case 'technique':
      text = exercise ? techniqueAnswer(exercise, data, lang, exercises) : fallbackAnswer(lang);
      break;
    case 'alternatives':
      text = alternativesAnswer(exercise, message, data, lang, exercises);
      break;
    case 'progress':
      text = progressAnswer(data, lang);
      break;
    case 'nutrition':
      text = await nutritionAnswer(data, lang, loadFoods);
      break;
    case 'meal_ideas':
      text = await mealIdeasAnswer(message, data, lang, loadFoods);
      break;
    case 'principles':
      text = principlesAnswer(message, data, lang);
      break;
    case 'plan':
      text = planAnswer(data, lang, exercises);
      break;
    default:
      text = fallbackAnswer(lang);
  }
  return { intent, text };
}

/** Short note prepended to built-in answers when the AI provider failed. */
export function aiUnavailableNote(lang: Locale): string {
  return L(
    lang,
    "*The AI service is temporarily unavailable, so this answer comes from LUPU-FIT's built-in coach.*",
    '*שירות ה-AI אינו זמין כרגע, ולכן התשובה הזו מגיעה מהמאמן המובנה של LUPU-FIT.*',
  );
}

/** Reply stored with status 'refused' when the model declines a request. */
export function refusalText(lang: Locale): string {
  return L(
    lang,
    "I can't help with that request. I'm happy to help with training, technique, exercise alternatives, your progress, nutrition and meal ideas — try asking in a different way.",
    'אין באפשרותי לעזור בבקשה הזו. אשמח לעזור באימונים, בטכניקה, בחלופות לתרגילים, בהתקדמות, בתזונה וברעיונות לארוחות – אפשר לנסח את השאלה אחרת.',
  );
}

/** Reply stored with status 'error' if an answer could not be produced at all. */
export function errorText(lang: Locale): string {
  return L(lang, 'Sorry, something went wrong while preparing an answer. Please try again.', 'מצטערים, משהו השתבש בהכנת התשובה. אפשר לנסות שוב.');
}

