/**
 * Bilingual (Hebrew / English) relevance search for the exercise library.
 *
 * - Normalization: case, Latin diacritics, Hebrew niqqud, Hebrew final letters
 *   (ם→מ …), apostrophes/geresh ("צ'ין" = "צין") and punctuation are unified on both
 *   the query and the indexed text.
 * - Partial words: every query term is matched as a substring ("squ", "סקוו").
 * - Light morphology: English plurals ("squats", "presses") and common Hebrew prefixes
 *   and suffixes ("הסקוואטים", "לחיצה" ↔ "לחיצת", "משקולת" ↔ "משקולות").
 * - Beyond names, each exercise is indexed with bilingual labels and common synonyms of
 *   its muscles, muscle groups, equipment, category and movement pattern, so "חזה",
 *   "quads", "גומייה" or "no equipment" work.
 * - Every term must match (AND). Name matches rank above muscle/equipment matches.
 * - When nothing matches exactly, a spelling-tolerant pass (edit distance 1–2) is used
 *   and the caller reports the results as approximate.
 */
import {
  MUSCLE_TO_GROUP,
  type Equipment,
  type ExerciseCategory,
  type MovementPattern,
  type Muscle,
  type MuscleGroup,
} from '@shared/constants';
import type { ExerciseRecord } from './repository';

const FINAL_FORMS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/** Lower-cases and strips everything that should not affect matching. */
export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[־׀׃׆]/g, ' ') // Hebrew punctuation (maqaf, paseq…)
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '') // Hebrew cantillation marks & niqqud
    .replace(/[̀-ͯ]/g, '') // Latin diacritics
    .replace(/['"`´‘’‚“”„׳״]/g, '') // apostrophes, quotes, geresh, gershayim
    .replace(/[ךםןףץ]/g, (c) => FINAL_FORMS[c] ?? c)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Splits a raw query into normalized terms (deduplicated, max 8). */
export function queryTerms(query: string): string[] {
  return Array.from(new Set(normalizeSearchText(query).split(' ').filter(Boolean))).slice(0, 8);
}

const HEBREW_LETTER = /[א-ת]/;
// One-letter Hebrew prefixes: ו (and), ה (the), ב (in/with), ל (to), מ (from), ש (that), כ (as).
const HE_PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'];
// Plural / construct-state / feminine endings, in normalized form (ים → ימ). Longest first.
const HE_SUFFIXES = ['יות', 'יה', 'ימ', 'ות', 'ה', 'ת'];
const EN_SUFFIXES = ['es', 's'];
const MIN_VARIANT_LENGTH = 3;

/**
 * Alternative forms of a normalized term, original first. Stripped forms keep at
 * least three letters so they stay specific.
 */
export function termVariants(term: string): string[] {
  const out = new Set<string>([term]);
  if (HEBREW_LETTER.test(term)) {
    const bases = [term];
    if (term.length > MIN_VARIANT_LENGTH && HE_PREFIXES.includes(term[0]!)) bases.push(term.slice(1));
    for (const base of bases) {
      out.add(base);
      for (const s of HE_SUFFIXES) {
        if (base.endsWith(s) && base.length - s.length >= MIN_VARIANT_LENGTH) out.add(base.slice(0, -s.length));
      }
    }
  } else {
    for (const s of EN_SUFFIXES) {
      if (term.endsWith(s) && term.length - s.length >= MIN_VARIANT_LENGTH) out.add(term.slice(0, -s.length));
    }
  }
  return [...out];
}

/** Optimal-string-alignment distance (Damerau–Levenshtein with adjacent transpositions), capped at `max + 1`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(0);
    row[0] = i;
    rows.push(row);
  }
  for (let j = 0; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2]![j - 2]! + 1);
      rows[i]![j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
  }
  return rows[a.length]![b.length]!;
}

/** Typos tolerated for a term of this length in the fallback pass (short terms need exact matches). */
export function allowedTypos(term: string): number {
  if (term.length >= 7) return 2;
  if (term.length >= 4) return 1;
  return 0;
}

// ---------------------------------------------------------------- Bilingual lexicon

const GROUP_TERMS: Record<MuscleGroup, string[]> = {
  chest: ['chest', 'חזה'],
  back: ['back', 'גב'],
  shoulders: ['shoulders', 'כתפיים'],
  arms: ['arms', 'ידיים'],
  core: ['core', 'ליבה'],
  legs: ['legs', 'lower body', 'רגליים', 'פלג גוף תחתון'],
};

const MUSCLE_TERMS: Record<Muscle, string[]> = {
  chest: ['chest', 'pecs', 'pectorals', 'חזה'],
  lats: ['lats', 'latissimus', 'רחב גבי', 'גב'],
  upper_back: ['upper back', 'rhomboids', 'גב עליון'],
  traps: ['traps', 'trapezius', 'טרפזים', 'טרפז'],
  lower_back: ['lower back', 'erectors', 'גב תחתון'],
  shoulders: ['shoulders', 'delts', 'deltoids', 'כתפיים', 'כתף'],
  rear_delts: ['rear delts', 'rear deltoids', 'כתף אחורית'],
  biceps: ['biceps', 'bicep', 'יד קדמית', 'ביספס', 'דו ראשי'],
  triceps: ['triceps', 'tricep', 'יד אחורית', 'טרייספס', 'תלת ראשי'],
  forearms: ['forearms', 'grip', 'אמות', 'אמה', 'אחיזה'],
  abs: ['abs', 'abdominals', 'six pack', 'בטן', 'קוביות'],
  obliques: ['obliques', 'side abs', 'אלכסונים', 'בטן צידית'],
  glutes: ['glutes', 'butt', 'booty', 'ישבן'],
  quadriceps: ['quadriceps', 'quads', 'thighs', 'ארבע ראשי', 'ירך קדמית'],
  hamstrings: ['hamstrings', 'hams', 'ירך אחורית', 'המסטרינג'],
  adductors: ['adductors', 'inner thighs', 'מקרבים', 'ירך פנימית'],
  calves: ['calves', 'calf', 'תאומים', 'שוקיים'],
  hip_flexors: ['hip flexors', 'מכופפי ירך'],
};

const EQUIPMENT_TERMS: Record<Equipment, string[]> = {
  barbell: ['barbell', 'מוט'],
  dumbbells: ['dumbbells', 'dumbbell', 'משקולות יד', 'משקולת', 'דאמבל'],
  kettlebell: ['kettlebell', 'קטלבל'],
  ez_bar: ['ez bar', 'מוט ez'],
  squat_rack: ['squat rack', 'power rack', 'מתקן סקוואט', 'כלוב'],
  bench: ['bench', 'ספסל'],
  cable_machine: ['cable machine', 'cables', 'pulley', 'מכונת כבלים', 'כבל', 'פולי'],
  lat_pulldown_machine: ['lat pulldown machine', 'מכונת פולי עליון'],
  leg_press_machine: ['leg press machine', 'מכונת לחיצת רגליים'],
  leg_curl_machine: ['leg curl machine', 'מכונת כפיפת ברכיים'],
  leg_extension_machine: ['leg extension machine', 'מכונת פשיטת ברכיים'],
  chest_press_machine: ['chest press machine', 'מכונת לחיצת חזה'],
  smith_machine: ['smith machine', 'מכונת סמית'],
  pull_up_bar: ['pull up bar', 'chin up bar', 'מתח'],
  dip_bars: ['dip bars', 'parallel bars', 'dip station', 'מקבילים'],
  resistance_bands: ['resistance bands', 'band', 'גומיות התנגדות', 'גומייה', 'גומיה'],
  suspension_trainer: ['suspension trainer', 'trx', 'רצועות'],
  gymnastic_rings: ['gymnastic rings', 'rings', 'טבעות'],
  medicine_ball: ['medicine ball', 'med ball', 'כדור כוח'],
  plyo_box: ['plyo box', 'box', 'קופסת קפיצה', 'ארגז'],
  jump_rope: ['jump rope', 'skipping rope', 'חבל קפיצה', 'חבל'],
  cardio_machine: ['cardio machine', 'treadmill', 'bike', 'rower', 'elliptical', 'מכשיר אירובי', 'הליכון', 'אופניים'],
  ab_wheel: ['ab wheel', 'ab roller', 'גלגל בטן', 'גלגלת'],
};

const NO_EQUIPMENT_TERMS = ['no equipment', 'equipment free', 'bodyweight', 'ללא ציוד', 'בלי ציוד', 'משקל גוף'];

const CATEGORY_TERMS: Record<ExerciseCategory, string[]> = {
  free_weight: ['free weights', 'משקולות חופשיות'],
  machine: ['machines', 'מכונה', 'מכונות', 'מכשיר'],
  cable: ['cables', 'כבלים'],
  bodyweight: ['bodyweight', 'body weight', 'משקל גוף'],
  calisthenics: ['calisthenics', 'street workout', 'קליסתניקס'],
  band: ['resistance bands', 'bands', 'גומיות'],
  plyometric: ['plyometrics', 'plyo', 'explosive', 'פליאומטריקה', 'קפיצות'],
  cardio: ['cardio', 'aerobic', 'אירובי', 'קרדיו'],
  mobility: ['mobility', 'stretching', 'flexibility', 'מוביליטי', 'מתיחות', 'גמישות'],
};

const MOVEMENT_TERMS: Record<MovementPattern, string[]> = {
  squat: ['squat', 'סקוואט'],
  hinge: ['hip hinge', 'כפיפת ירך'],
  lunge: ['lunge', 'single leg', 'מכרע', 'לאנג', 'רגל אחת'],
  hip_thrust: ['hip thrust', 'bridge', 'גשר', 'דחיקת אגן'],
  horizontal_push: ['push', 'press', 'דחיקה', 'לחיצה'],
  vertical_push: ['overhead press', 'push', 'דחיקה', 'לחיצה'],
  horizontal_pull: ['row', 'pull', 'חתירה', 'משיכה'],
  vertical_pull: ['pull', 'pulldown', 'משיכה'],
  chest_fly: ['fly', 'flye', 'פרפר'],
  shoulder_raise: ['raise', 'הרחקה'],
  elbow_flexion: ['curl', 'כפיפת מרפק'],
  elbow_extension: ['extension', 'פשיטת מרפק'],
  knee_extension: ['extension', 'פשיטת ברך'],
  knee_flexion: ['curl', 'כפיפת ברך'],
  calf_raise: ['calf raise', 'הרמות עקבים'],
  core: ['core', 'ליבה'],
  rotation: ['rotation', 'anti rotation', 'twist', 'רוטציה'],
  carry: ['carry', 'נשיאה'],
  jump: ['jump', 'קפיצה'],
  conditioning: ['conditioning', 'hiit', 'intervals', 'סיבולת', 'אינטרוולים'],
  mobility: ['mobility', 'stretch', 'מוביליטי', 'מתיחה'],
};

// ---------------------------------------------------------------- Index & scoring

interface SearchField {
  /** Normalized text. */
  text: string;
  /** Normalized text without spaces ("pullup" finds "pull up"). */
  compact: string;
  words: string[];
  weight: number;
  isName: boolean;
}

interface SearchIndex {
  names: string[];
  fields: SearchField[];
}

const WEIGHT = { name: 4, id: 3, primary: 2, pattern: 1.5, secondary: 1 } as const;
const VARIANT_FACTOR = 0.8;
const FUZZY_FACTOR = 0.5;
/** A match inside a word ("quat" in "squat") counts less than one at a word start. */
const INNER_FACTOR = 0.5;
/** A match across a word boundary ("pullup" in "pull up"). */
const COMPACT_FACTOR = 0.75;
/** Terms this short only match at the start of a word ("גב" must not match "מוגבהות"). */
const SHORT_TERM = 2;

function field(parts: string[], weight: number, isName = false): SearchField {
  const text = normalizeSearchText(parts.join(' | '));
  return { text, compact: text.replace(/ /g, ''), words: text.split(' ').filter(Boolean), weight, isName };
}

/** True when a word of the field starts with `variant` (Hebrew words also without a one-letter prefix: "במוט" → "מוט"). */
function matchesWordStart(f: SearchField, variant: string): boolean {
  return f.words.some(
    (w) => w.startsWith(variant) || (w.length > variant.length && HE_PREFIXES.includes(w[0]!) && w.startsWith(variant, 1)),
  );
}

const indexCache = new WeakMap<ExerciseRecord, SearchIndex>();

function indexFor(e: ExerciseRecord): SearchIndex {
  const cached = indexCache.get(e);
  if (cached) return cached;
  const groups = Array.from(new Set(e.primaryMuscles.map((m) => MUSCLE_TO_GROUP[m])));
  const names = [normalizeSearchText(e.name.en), normalizeSearchText(e.name.he)];
  const index: SearchIndex = {
    names,
    fields: [
      field([e.name.en], WEIGHT.name, true),
      field([e.name.he], WEIGHT.name, true),
      field([e.id], WEIGHT.id),
      field(
        [
          ...e.primaryMuscles.flatMap((m) => [m, ...MUSCLE_TERMS[m]]),
          ...groups.flatMap((g) => GROUP_TERMS[g]),
          ...e.equipment.flatMap((q) => [q, ...EQUIPMENT_TERMS[q]]),
          ...(e.equipment.length === 0 ? NO_EQUIPMENT_TERMS : []),
          e.category,
          ...CATEGORY_TERMS[e.category],
        ],
        WEIGHT.primary,
      ),
      field([e.movementPattern, ...MOVEMENT_TERMS[e.movementPattern]], WEIGHT.pattern),
      field(e.secondaryMuscles.flatMap((m) => [m, ...MUSCLE_TERMS[m]]), WEIGHT.secondary),
    ],
  };
  indexCache.set(e, index);
  return index;
}

/**
 * Score of one field for one form of a term. Stripped forms (`wordStartOnly`) must
 * match at a word start: "יספס" (from "ביספס") must not match inside "טרייספס".
 */
function exactFieldScore(f: SearchField, variant: string, wordStartOnly: boolean): number {
  if (!f.compact.includes(variant)) return 0;
  if (matchesWordStart(f, variant)) {
    if (!f.isName) return f.weight;
    return f.text.startsWith(variant) ? f.weight + 2 : f.weight + 1;
  }
  if (wordStartOnly || variant.length <= SHORT_TERM) return 0;
  if (f.text.includes(variant)) return f.weight * INNER_FACTOR;
  return f.weight * COMPACT_FACTOR;
}

function fuzzyFieldScore(f: SearchField, term: string): number {
  const max = allowedTypos(term);
  if (max === 0) return 0;
  for (const w of f.words) {
    // Whole word ("sqaut" → "squat") or a typo in a partially typed word ("benhc" → "bench…").
    if (editDistance(term, w, max) <= max) return f.weight;
    if (w.length > term.length && editDistance(term, w.slice(0, term.length), max) <= max) return f.weight;
  }
  return 0;
}

function termScore(index: SearchIndex, term: string, fuzzy: boolean): number {
  let best = 0;
  const variants = termVariants(term);
  for (const f of index.fields) {
    for (let i = 0; i < variants.length; i++) {
      const s = i === 0 ? exactFieldScore(f, variants[i]!, false) : exactFieldScore(f, variants[i]!, true) * VARIANT_FACTOR;
      if (s > best) best = s;
    }
    if (fuzzy && best === 0) {
      const s = fuzzyFieldScore(f, term) * FUZZY_FACTOR;
      if (s > best) best = s;
    }
  }
  return best;
}

/**
 * Relevance of an exercise for the query terms (0 = no match). Every term must match.
 * `fuzzy` enables the spelling-tolerant fallback.
 */
export function scoreExercise(e: ExerciseRecord, terms: string[], fuzzy = false): number {
  if (terms.length === 0) return 1;
  const index = indexFor(e);
  const phrase = terms.join(' ');
  if (terms.length > 1) {
    // A contiguous multi-word phrase ("bench press", "no equipment") is scored as one unit
    // in its best field, so scattered single-word hits ("no" in "Nordic") do not win.
    let phraseScore = 0;
    for (const f of index.fields) {
      if (!f.text.includes(phrase)) continue;
      const bonus = f.isName && f.text === phrase ? 6 : 3;
      phraseScore = Math.max(phraseScore, f.weight * terms.length + bonus);
    }
    if (phraseScore > 0) return phraseScore;
  }
  let total = 0;
  for (const term of terms) {
    const s = termScore(index, term, fuzzy);
    if (s === 0) return 0;
    total += s;
  }
  if (index.names.includes(phrase)) total += 6;
  return total;
}

export interface SearchResult<T> {
  matches: { item: T; score: number }[];
  approximate: boolean;
}

/**
 * Scores every exercise; when the query has no exact match anywhere in `items`, the
 * spelling-tolerant pass is used instead (`approximate: true`).
 */
export function searchExercises<T extends ExerciseRecord>(items: T[], query: string | undefined): SearchResult<T> {
  const terms = queryTerms(query ?? '');
  if (terms.length === 0) return { matches: items.map((item) => ({ item, score: 1 })), approximate: false };
  const exact = items.map((item) => ({ item, score: scoreExercise(item, terms) })).filter((m) => m.score > 0);
  if (exact.length > 0) return { matches: exact, approximate: false };
  const fuzzy = items.map((item) => ({ item, score: scoreExercise(item, terms, true) })).filter((m) => m.score > 0);
  return { matches: fuzzy, approximate: fuzzy.length > 0 };
}
