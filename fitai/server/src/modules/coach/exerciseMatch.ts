/**
 * Finds the exercise a message is about (EN + HE) using the library names plus a
 * curated table of common short names ("squat", "bench press", "עליות מתח"…), and
 * detects body areas mentioned as hurting.
 */
import type { Equipment, InjuryArea } from '@shared/constants';
import type { ExerciseRecord } from '../exercises/repository';
import { normalizeText, phraseIndex } from './lang';

/**
 * Short name → library ids, canonical meaning first. Names marked `*` are generic
 * movement names ("squat", "rows"): for those the variant the user can actually do
 * with their equipment is preferred. Specific lift names ("bench press") always mean
 * the canonical exercise unless the user's own plan/history says otherwise.
 */
const ALIAS_TABLE: [string, string[]][] = [
  ['*squat', ['barbell_back_squat', 'goblet_squat', 'bodyweight_squat']],
  ['back squat', ['barbell_back_squat']],
  ['bench press', ['barbell_bench_press', 'dumbbell_bench_press', 'machine_chest_press', 'push_up']],
  ['benching', ['barbell_bench_press', 'dumbbell_bench_press']],
  ['chest press', ['barbell_bench_press', 'dumbbell_bench_press', 'machine_chest_press', 'band_chest_press']],
  ['incline bench', ['incline_barbell_bench_press', 'incline_dumbbell_press']],
  ['incline press', ['incline_barbell_bench_press', 'incline_dumbbell_press']],
  ['deadlift', ['deadlift', 'dumbbell_romanian_deadlift']],
  ['deadlifting', ['deadlift', 'dumbbell_romanian_deadlift']],
  ['rdl', ['romanian_deadlift', 'dumbbell_romanian_deadlift', 'single_leg_romanian_deadlift']],
  ['stiff leg deadlift', ['romanian_deadlift', 'dumbbell_romanian_deadlift']],
  ['overhead press', ['barbell_overhead_press', 'dumbbell_shoulder_press', 'kettlebell_overhead_press', 'pike_push_up']],
  ['ohp', ['barbell_overhead_press', 'dumbbell_shoulder_press']],
  ['military press', ['barbell_overhead_press', 'dumbbell_shoulder_press']],
  ['*shoulder press', ['barbell_overhead_press', 'dumbbell_shoulder_press', 'kettlebell_overhead_press', 'pike_push_up']],
  ['*pull up', ['pull_up', 'band_assisted_pull_up', 'negative_pull_up', 'lat_pulldown']],
  ['*pullup', ['pull_up', 'band_assisted_pull_up', 'negative_pull_up', 'lat_pulldown']],
  ['chin up', ['chin_up', 'band_assisted_pull_up']],
  ['chinup', ['chin_up', 'band_assisted_pull_up']],
  ['*push up', ['push_up', 'knee_push_up', 'incline_push_up']],
  ['*pushup', ['push_up', 'knee_push_up', 'incline_push_up']],
  ['*press up', ['push_up', 'knee_push_up', 'incline_push_up']],
  ['*rows', ['barbell_bent_over_row', 'one_arm_dumbbell_row', 'seated_cable_row', 'inverted_row', 'band_row']],
  ['barbell row', ['barbell_bent_over_row']],
  ['bent over row', ['barbell_bent_over_row', 'one_arm_dumbbell_row']],
  ['dumbbell row', ['one_arm_dumbbell_row']],
  ['cable row', ['seated_cable_row']],
  ['seated row', ['seated_cable_row']],
  ['*lunge', ['walking_lunge', 'reverse_lunge', 'dumbbell_reverse_lunge']],
  ['split squat', ['bulgarian_split_squat']],
  ['leg curl', ['lying_leg_curl', 'nordic_hamstring_curl']],
  ['hamstring curl', ['lying_leg_curl', 'nordic_hamstring_curl']],
  ['*curl', ['dumbbell_curl', 'barbell_curl', 'cable_biceps_curl', 'band_biceps_curl']],
  ['*bicep curl', ['dumbbell_curl', 'barbell_curl', 'cable_biceps_curl', 'band_biceps_curl']],
  ['*biceps curl', ['dumbbell_curl', 'barbell_curl', 'cable_biceps_curl', 'band_biceps_curl']],
  ['*dips', ['parallel_bar_dip', 'band_assisted_dip']],
  ['bar dip', ['parallel_bar_dip', 'band_assisted_dip']],
  ['tricep dip', ['parallel_bar_dip', 'band_assisted_dip']],
  ['triceps dip', ['parallel_bar_dip', 'band_assisted_dip']],
  ['hip thrust', ['barbell_hip_thrust', 'glute_bridge']],
  ['*lateral raise', ['dumbbell_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise']],
  ['*side raise', ['dumbbell_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise']],
  ['pulldown', ['lat_pulldown']],
  ['pull down', ['lat_pulldown']],
  ['sit up', ['crunch']],
  ['situp', ['crunch']],
  ['*calf raise', ['standing_calf_raise', 'single_leg_calf_raise']],
  ['*triceps extension', ['triceps_pushdown', 'overhead_dumbbell_triceps_extension', 'band_triceps_extension']],
  ['*tricep extension', ['triceps_pushdown', 'overhead_dumbbell_triceps_extension', 'band_triceps_extension']],
  ['pushdown', ['triceps_pushdown', 'band_triceps_extension']],
  ['pressdown', ['triceps_pushdown', 'band_triceps_extension']],
  ['skull crusher', ['ez_bar_skull_crusher']],
  ['rear delt fly', ['rear_delt_fly']],
  ['reverse fly', ['rear_delt_fly']],
  ['*chest fly', ['dumbbell_fly', 'cable_chest_fly']],
  ['*pec fly', ['dumbbell_fly', 'cable_chest_fly']],
  ['*flye', ['dumbbell_fly', 'cable_chest_fly']],
  ['*fly', ['dumbbell_fly', 'cable_chest_fly']],
  ['kb swing', ['kettlebell_swing']],
  ['shrug', ['dumbbell_shrug']],
  ['farmer walk', ['farmer_carry']],
  ['farmers walk', ['farmer_carry']],
  ["farmer's walk", ['farmer_carry']],
  ['farmer carry', ['farmer_carry']],
  ['handstand push up', ['wall_handstand_push_up']],
  ['pistol', ['pistol_squat']],
  ['*leg raise', ['lying_leg_raise', 'hanging_leg_raise', 'hanging_knee_raise']],
  ['knee raise', ['hanging_knee_raise']],
  ['skipping', ['jump_rope_skipping']],
  ['sprint', ['sprint_intervals']],
  ['jogging', ['brisk_walk_jog']],
  // Hebrew (substring match: prefixes attach to the word)
  ['*סקוואט', ['barbell_back_squat', 'goblet_squat', 'bodyweight_squat']],
  ['*סקווט', ['barbell_back_squat', 'goblet_squat', 'bodyweight_squat']],
  ['לחיצת חזה', ['barbell_bench_press', 'dumbbell_bench_press', 'machine_chest_press', 'push_up']],
  ['לחיצות חזה', ['barbell_bench_press', 'dumbbell_bench_press', 'machine_chest_press', 'push_up']],
  ['בנץ', ['barbell_bench_press', 'dumbbell_bench_press']],
  ['דדליפט', ['deadlift', 'dumbbell_romanian_deadlift']],
  ['*לחיצת כתפיים', ['barbell_overhead_press', 'dumbbell_shoulder_press', 'kettlebell_overhead_press', 'pike_push_up']],
  ['*לחיצות כתפיים', ['barbell_overhead_press', 'dumbbell_shoulder_press', 'kettlebell_overhead_press', 'pike_push_up']],
  ['*עליות מתח', ['pull_up', 'band_assisted_pull_up', 'negative_pull_up', 'lat_pulldown']],
  ['*שכיבות סמיכה', ['push_up', 'knee_push_up', 'incline_push_up']],
  ['*שכיבת סמיכה', ['push_up', 'knee_push_up', 'incline_push_up']],
  ['*חתירה', ['barbell_bent_over_row', 'one_arm_dumbbell_row', 'seated_cable_row', 'inverted_row', 'band_row']],
  ['*מכרע', ['walking_lunge', 'reverse_lunge', 'dumbbell_reverse_lunge']],
  ["*לאנג'", ['walking_lunge', 'reverse_lunge', 'dumbbell_reverse_lunge']],
  ['*כפיפת מרפקים', ['dumbbell_curl', 'barbell_curl', 'cable_biceps_curl', 'band_biceps_curl']],
  ['*כפיפות מרפקים', ['dumbbell_curl', 'barbell_curl', 'cable_biceps_curl', 'band_biceps_curl']],
  ['*בייספס', ['dumbbell_curl', 'barbell_curl', 'cable_biceps_curl', 'band_biceps_curl']],
  ['היפ טראסט', ['barbell_hip_thrust', 'glute_bridge']],
  ['*הרחקה לצדדים', ['dumbbell_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise']],
  ['*הרחקות לצדדים', ['dumbbell_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise']],
  ['*הרחקה לצד', ['dumbbell_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise']],
  ['*פשיטת מרפקים', ['triceps_pushdown', 'overhead_dumbbell_triceps_extension', 'band_triceps_extension']],
  ['*טרייספס', ['triceps_pushdown', 'overhead_dumbbell_triceps_extension', 'band_triceps_extension']],
  ['פרפר הפוך', ['rear_delt_fly']],
  ['*פרפר', ['dumbbell_fly', 'cable_chest_fly']],
  ['סווינג', ['kettlebell_swing']],
  ['שראגס', ['dumbbell_shrug']],
  ['הליכת חקלאי', ['farmer_carry']],
  ['*הרמות רגליים', ['lying_leg_raise', 'hanging_leg_raise', 'hanging_knee_raise']],
  ['כפיפת ברכיים', ['lying_leg_curl', 'nordic_hamstring_curl']],
  ['ספרינט', ['sprint_intervals']],
  ['פיסטול', ['pistol_squat']],
];

const ALIASES = ALIAS_TABLE.map(([phrase, ids]) => ({ phrase: phrase.replace(/^\*/, ''), ids, generic: phrase.startsWith('*') }));

/** Name variants: the full name, plus parts split on "/" or parentheses ("Brisk Walk / Jog"). */
function nameVariants(name: string): string[] {
  const out = new Set<string>([name]);
  const noParens = name.replace(/\([^)]*\)/g, ' ').trim();
  if (noParens) out.add(noParens);
  for (const m of name.matchAll(/\(([^)]*)\)/g)) if (m[1]?.trim()) out.add(m[1].trim());
  for (const part of noParens.split('/')) if (part.trim().length >= 3) out.add(part.trim());
  return [...out].map(normalizeText).filter((s) => s.length >= 3);
}

interface IndexedExercise {
  record: ExerciseRecord;
  variants: string[];
}

let indexCache: { source: ExerciseRecord[]; items: IndexedExercise[] } | null = null;

function indexFor(exercises: ExerciseRecord[]): IndexedExercise[] {
  if (indexCache?.source === exercises) return indexCache.items;
  const items = exercises.map((record) => ({ record, variants: [...nameVariants(record.name.en), ...nameVariants(record.name.he)] }));
  indexCache = { source: exercises, items };
  return items;
}

export interface MatchPreferences {
  /** Exercises in the user's plan or recent workouts are the most likely meaning. */
  userExerciseIds?: Set<string>;
  /** User equipment (null = unknown). */
  equipment?: Equipment[] | null;
}

/**
 * The exercise the message is about, or null. The earliest mention wins; at the same
 * position an exact library name beats a generic short name.
 */
export function findExercise(message: string, exercises: ExerciseRecord[], prefs: MatchPreferences = {}): ExerciseRecord | null {
  const text = normalizeText(message);
  if (!text) return null;
  const byId = new Map(exercises.map((e) => [e.id, e]));
  let best: { record: ExerciseRecord; index: number; strength: number } | null = null;
  const consider = (record: ExerciseRecord, index: number, strength: number) => {
    if (!best || index < best.index || (index === best.index && strength > best.strength)) best = { record, index, strength };
  };
  for (const item of indexFor(exercises)) {
    for (const v of item.variants) {
      const idx = phraseIndex(text, v);
      if (idx >= 0) consider(item.record, idx, 1000 + v.length);
    }
  }
  for (const { phrase, ids, generic } of ALIASES) {
    const idx = phraseIndex(text, phrase);
    if (idx < 0) continue;
    const candidates = ids.map((id) => byId.get(id)).filter((e): e is ExerciseRecord => e != null);
    if (!candidates.length) continue;
    const chosen =
      candidates.find((e) => prefs.userExerciseIds?.has(e.id)) ??
      (generic && prefs.equipment ? candidates.find((e) => e.equipment.every((q) => prefs.equipment!.includes(q))) : undefined) ??
      candidates[0]!;
    consider(chosen, idx, 100 + normalizeText(phrase).length);
  }
  return best ? (best as { record: ExerciseRecord }).record : null;
}

const HEBREW_LETTERS = '\\u05D0-\\u05EA';

/** Whole Hebrew word (allowing up to three one-letter prefixes such as ו/ה/ב/ל/מ/ש/כ). */
function hasHebrewWord(text: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`(?:^|[^${HEBREW_LETTERS}])[והבלמשכ]{0,3}${w}(?=$|[^${HEBREW_LETTERS}])`, 'u').test(text));
}

const AREA_WORDS: Record<InjuryArea, { en: RegExp; he: string[] }> = {
  shoulder: { en: /\bshoulders?\b|\brotator cuff\b/, he: ['כתף', 'כתפיים', 'הכתף', 'כתפי'] },
  knee: { en: /\bknees?\b|\bmeniscus\b|\bacl\b/, he: ['ברך', 'ברכיים', 'ברכי', 'מניסקוס'] },
  lower_back: { en: /\blower back\b|\bmy back\b|\bback pain\b|\bback hurts\b|\bback is\b|\bsciatica\b|\bdisc\b/, he: ['גב', 'גב תחתון', 'גבי', 'פריצת דיסק', 'דיסק', 'סיאטיקה'] },
  wrist: { en: /\bwrists?\b/, he: ['שורש כף היד', 'פרק כף היד', 'פרק היד', 'שורש היד'] },
  elbow: { en: /\belbows?\b|\btennis elbow\b|\bgolfer'?s elbow\b/, he: ['מרפק', 'מרפקים', 'מרפקי'] },
  hip: { en: /\bhips?\b/, he: ['מפרק הירך', 'מפרקי הירכיים', 'אגן'] },
  ankle: { en: /\bankles?\b|\bachilles\b/, he: ['קרסול', 'קרסוליים', 'אכילס'] },
  neck: { en: /\bneck\b/, he: ['צוואר', 'צווארי'] },
};

/** Body areas the message mentions (used together with words like "hurts"/"כואב"). */
export function mentionedBodyAreas(message: string): InjuryArea[] {
  const text = normalizeText(message);
  return (Object.keys(AREA_WORDS) as InjuryArea[]).filter((area) => {
    const w = AREA_WORDS[area];
    return w.en.test(text) || hasHebrewWord(text, w.he.map((x) => normalizeText(x)));
  });
}
