/**
 * Deterministic generator for the READY_WORKOUTS catalog. Run via `npm run gen:workouts`.
 * Ready workouts store only an exercise selection + structure; prescriptions are personalised at runtime.
 */
import type { Difficulty, Equipment, Place, WorkoutMode } from '../enums.js';
import { MUSCLE_TO_GROUP } from '../enums.js';
import { BODYWEIGHT_APPARATUS, estimateMinutes, seededRandom } from '../training.js';
import { FOCUS_LABEL, FOCUS_MUSCLES } from './focus.js';
import type { ExerciseContent, ReadyWorkoutContent, WorkoutFocus, WorkoutStyle } from './types.js';

export interface Tier {
  id: string; place: Place; mode: WorkoutMode; equipment: readonly Equipment[]; labelEn: string; labelHe: string;
}

export const TIERS: readonly Tier[] = [
  { id: 'gym', place: 'gym', mode: 'weights', equipment: ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'bench', 'squat_rack', 'pullup_bar', 'dip_station', 'resistance_band', 'trx', 'medicine_ball', 'swiss_ball', 'ab_wheel', 'jump_rope', 'box', 'rings', 'parallettes', 'sled', 'landmine', 'ez_bar', 'foam_roller'], labelEn: 'Gym', labelHe: 'חדר כושר' },
  { id: 'gym_bw', place: 'gym', mode: 'bodyweight', equipment: ['pullup_bar', 'dip_station'], labelEn: 'Gym, Bodyweight', labelHe: 'חדר כושר, משקל גוף' },
  { id: 'home_bw', place: 'home', mode: 'bodyweight', equipment: [], labelEn: 'Home, No Gear', labelHe: 'בית, בלי ציוד' },
  { id: 'home_db', place: 'home', mode: 'weights', equipment: ['dumbbell'], labelEn: 'Home, Dumbbells', labelHe: 'בית, משקולות יד' },
  { id: 'home_db_bench', place: 'home', mode: 'weights', equipment: ['dumbbell', 'bench'], labelEn: 'Home, Dumbbells and Bench', labelHe: 'בית, משקולות יד ובנץ׳' },
  { id: 'home_band', place: 'home', mode: 'weights', equipment: ['resistance_band'], labelEn: 'Home, Resistance Bands', labelHe: 'בית, גומיות התנגדות' },
  { id: 'home_kb', place: 'home', mode: 'weights', equipment: ['kettlebell'], labelEn: 'Home, Kettlebell', labelHe: 'בית, קטלבל' },
  { id: 'home_mix', place: 'home', mode: 'weights', equipment: ['dumbbell', 'resistance_band', 'pullup_bar', 'bench'], labelEn: 'Home, Mixed Gear', labelHe: 'בית, ציוד משולב' },
  { id: 'park_bw', place: 'park', mode: 'bodyweight', equipment: ['pullup_bar', 'dip_station'], labelEn: 'Park, Bars', labelHe: 'פארק, מתחים ומקבילים' },
  { id: 'park_band', place: 'park', mode: 'weights', equipment: ['resistance_band', 'pullup_bar', 'dip_station'], labelEn: 'Park, Bands and Bars', labelHe: 'פארק, גומיות ומתחים' },
  { id: 'park_kb', place: 'park', mode: 'weights', equipment: ['kettlebell', 'pullup_bar', 'dip_station'], labelEn: 'Park, Kettlebell and Bars', labelHe: 'פארק, קטלבל ומתחים' },
];

const ALL_FOCUS: WorkoutFocus[] = ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'glutes', 'quads', 'hamstrings', 'core', 'full_body', 'upper', 'lower', 'push', 'pull'];
const PLAN: Record<string, { focuses: WorkoutFocus[]; per: number }> = {
  gym: { focuses: ALL_FOCUS, per: 5 },
  gym_bw: { focuses: ['chest', 'back', 'shoulders', 'arms', 'core', 'legs', 'full_body', 'upper', 'lower', 'push', 'pull'], per: 3 },
  home_bw: { focuses: ['chest', 'back', 'shoulders', 'arms', 'triceps', 'core', 'legs', 'glutes', 'full_body', 'upper', 'lower', 'push'], per: 5 },
  home_db: { focuses: ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full_body', 'upper', 'lower'], per: 3 },
  home_db_bench: { focuses: ['chest', 'back', 'shoulders', 'arms', 'legs', 'full_body', 'upper', 'push', 'pull'], per: 3 },
  home_band: { focuses: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'full_body', 'upper'], per: 3 },
  home_kb: { focuses: ['legs', 'glutes', 'full_body', 'upper', 'core', 'shoulders'], per: 3 },
  home_mix: { focuses: ['chest', 'back', 'legs', 'full_body', 'upper', 'lower', 'push', 'pull', 'shoulders', 'arms'], per: 3 },
  park_bw: { focuses: ['chest', 'back', 'shoulders', 'arms', 'core', 'legs', 'full_body', 'upper', 'push', 'pull'], per: 4 },
  park_band: { focuses: ['back', 'chest', 'legs', 'full_body', 'upper', 'arms'], per: 3 },
  park_kb: { focuses: ['legs', 'full_body', 'core', 'upper'], per: 3 },
};

const LEVELS: Difficulty[] = ['intermediate', 'beginner', 'advanced', 'intermediate', 'beginner'];
const STYLES: WorkoutStyle[] = ['straight', 'superset', 'circuit', 'pyramid', 'density'];
const RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

const STYLE_LABEL: Record<WorkoutStyle, { en: string; he: string }> = {
  straight: { en: 'Strength', he: 'כוח' },
  superset: { en: 'Superset', he: 'סופר-סט' },
  circuit: { en: 'Circuit', he: 'מעגל' },
  pyramid: { en: 'Pyramid', he: 'פירמידה' },
  density: { en: 'Density', he: 'צפיפות' },
};
const LEVEL_LABEL: Record<Difficulty, { en: string; he: string }> = {
  beginner: { en: 'Foundations', he: 'בסיס' },
  intermediate: { en: 'Builder', he: 'בנייה' },
  advanced: { en: 'Max', he: 'מתקדמים' },
};

/** Generic per-style prescription used ONLY for nominal duration; the real one is personalised per user. */
export const STYLE_NOMINAL: Record<WorkoutStyle, { sets: number; reps: number; rest: number }> = {
  straight: { sets: 3, reps: 10, rest: 75 },
  superset: { sets: 3, reps: 10, rest: 45 },
  circuit: { sets: 3, reps: 12, rest: 30 },
  pyramid: { sets: 4, reps: 10, rest: 90 },
  density: { sets: 4, reps: 8, rest: 45 },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const isTimed = (e: ExerciseContent) => e.category === 'duration' || e.category === 'isometric';
const isMain = (e: ExerciseContent) => e.category !== 'mobility' && e.category !== 'stretch';

function nominalMinutes(ex: readonly ExerciseContent[], style: WorkoutStyle): number {
  const n = STYLE_NOMINAL[style];
  return estimateMinutes(ex.map((e) => ({ sets: n.sets, repsMax: n.reps, durationSec: isTimed(e) ? 30 : null, restSec: n.rest })));
}

function targetCount(level: Difficulty, style: WorkoutStyle, rand: () => number): number {
  const base = level === 'beginner' ? 4 : level === 'intermediate' ? 5 : 6;
  let n = base + (rand() < 0.5 ? 0 : 1);
  if (style === 'superset') n = n % 2 === 0 ? n : n + 1;
  if (style === 'circuit') n = Math.max(5, n);
  if (style === 'pyramid' || style === 'density') n = Math.min(n, 5);
  return Math.min(9, Math.max(4, n));
}

function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j] as T, a[i] as T]; }
  return a;
}

function select(pool: readonly ExerciseContent[], focus: WorkoutFocus, n: number, rand: () => number): ExerciseContent[] | null {
  const chosen: ExerciseContent[] = [];
  const patternCount = new Map<string, number>();
  const covered = new Set<string>();
  const fm = FOCUS_MUSCLES[focus];
  const take = (e: ExerciseContent) => { chosen.push(e); patternCount.set(e.pattern, (patternCount.get(e.pattern) ?? 0) + 1); e.primary.forEach((m) => covered.add(m)); };

  if (focus === 'full_body') {
    const slots: ((e: ExerciseContent) => boolean)[] = [
      (e) => e.pattern === 'squat' || e.pattern === 'lunge',
      (e) => e.pattern === 'hinge',
      (e) => e.pattern === 'horizontal_push' || e.pattern === 'vertical_push',
      (e) => e.pattern === 'horizontal_pull' || e.pattern === 'vertical_pull',
      (e) => e.primary.some((m) => m === 'abs' || m === 'obliques'),
      (e) => e.category === 'carry' || e.category === 'cardio' || e.pattern === 'locomotion',
      (e) => e.pattern === 'lunge' || e.pattern === 'elbow_flexion' || e.pattern === 'shoulder_raise',
    ];
    for (const ok of slots) {
      if (chosen.length >= n) break;
      const c = shuffle(pool.filter((e) => ok(e) && !chosen.includes(e)), rand)[0];
      if (c) take(c);
    }
    for (const e of shuffle(pool, rand)) { if (chosen.length >= n) break; if (!chosen.includes(e) && (patternCount.get(e.pattern) ?? 0) < 2) take(e); }
  } else {
    const onFocus = pool.filter((e) => e.primary.some((m) => fm.includes(m)));
    if (onFocus.length < n) return null;
    // Lead with a compound movement (most muscles involved), randomised among the top few.
    const compounds = [...onFocus].sort((a, b) => b.primary.length + b.secondary.length - (a.primary.length + a.secondary.length));
    const lead = shuffle(compounds.slice(0, Math.min(6, compounds.length)), rand)[0];
    if (!lead) return null;
    take(lead);
    while (chosen.length < n) {
      const cands = shuffle(onFocus.filter((e) => !chosen.includes(e) && (patternCount.get(e.pattern) ?? 0) < 2), rand);
      if (cands.length === 0) return null;
      // prefer exercises that hit focus muscles not yet covered, so the session is balanced
      const fresh = cands.filter((e) => e.primary.some((m) => fm.includes(m) && !covered.has(m)));
      take((fresh[0] ?? cands[0]) as ExerciseContent);
    }
  }
  if (chosen.length < Math.min(n, 4)) return null;
  // order: compounds first, core and isolation later
  const order = (e: ExerciseContent) => (e.primary.some((m) => m === 'abs' || m === 'obliques') && focus !== 'core' ? 3 : e.primary.length + e.secondary.length >= 4 ? 0 : e.category === 'cardio' ? 4 : 1);
  return chosen.map((e, i) => ({ e, i })).sort((a, b) => order(a.e) - order(b.e) || a.i - b.i).map((x) => x.e);
}

function groupsFor(style: WorkoutStyle, n: number): number[][] {
  if (style === 'circuit') return [Array.from({ length: n }, (_, i) => i)];
  if (style === 'superset') { const g: number[][] = []; for (let i = 0; i + 1 < n; i += 2) g.push([i, i + 1]); return g; }
  return [];
}

export interface GenerationReport { workouts: ReadyWorkoutContent[]; skipped: string[] }

export function generateReadyWorkouts(exercises: readonly ExerciseContent[]): GenerationReport {
  const out: ReadyWorkoutContent[] = [];
  const skipped: string[] = [];
  const byFocus = new Map<WorkoutFocus, ReadyWorkoutContent[]>();
  const names = new Set<string>();

  const overlapOk = (focus: WorkoutFocus, ids: readonly string[]): boolean => {
    const a = new Set(ids);
    for (const w of byFocus.get(focus) ?? []) {
      const b = new Set(w.exerciseIds);
      const inter = [...a].filter((x) => b.has(x)).length;
      if (inter / (a.size + b.size - inter) >= 0.6) return false; // 0.6 < 0.7 required: safety margin
    }
    return true;
  };

  TIERS.forEach((tier, ti) => {
    const plan = PLAN[tier.id];
    if (!plan) return;
    const tierPool = exercises.filter((e) => isMain(e) && e.equipment.every((q) => q === 'none' || tier.equipment.includes(q)));
    plan.focuses.forEach((focus, fi) => {
      for (let k = 0; k < plan.per; k++) {
        const specKey = `${tier.id}:${focus}:${k}`;
        const tries: { level: Difficulty; style: WorkoutStyle }[] = [];
        const lv0 = LEVELS[(k + fi) % LEVELS.length] as Difficulty;
        const st0 = (k * 2 + fi + ti) % STYLES.length;
        for (let a = 0; a < STYLES.length; a++) tries.push({ level: lv0, style: STYLES[(st0 + a) % STYLES.length] as WorkoutStyle });
        for (const lv of ['intermediate', 'advanced', 'beginner'] as Difficulty[]) if (lv !== lv0) tries.push({ level: lv, style: STYLES[st0] as WorkoutStyle });
        let made: ReadyWorkoutContent | null = null;
        for (let t = 0; t < tries.length && !made; t++) {
          const { level, style } = tries[t] as { level: Difficulty; style: WorkoutStyle };
          const pool = tierPool.filter((e) => RANK[e.difficulty] <= RANK[level] && (tier.mode !== 'bodyweight' || e.equipment.every((q) => q === 'none' || (BODYWEIGHT_APPARATUS as readonly string[]).includes(q))));
          if (tier.mode === 'bodyweight' && pool.some((e) => e.externallyLoaded)) continue;
          for (let attempt = 0; attempt < 40 && !made; attempt++) {
            const rand = seededRandom(hash(`${specKey}:${t}:${attempt}`));
            const n = targetCount(level, style, rand);
            const sel = select(pool, focus, n, rand);
            if (!sel) break;
            if (tier.mode === 'weights' && !sel.some((e) => e.equipment.some((q) => q !== 'none' && !(BODYWEIGHT_APPARATUS as readonly string[]).includes(q)))) continue;
            // never label a workout beginner-level unless its hardest exercise is beginner: level = hardest actually used
            const hardest = Math.max(...sel.map((e) => RANK[e.difficulty]));
            if (hardest > RANK[level]) continue;
            const actual = (['beginner', 'intermediate', 'advanced'] as const)[hardest] as Difficulty; // label honestly by hardest exercise
            const ids = sel.map((e) => e.id);
            if (!overlapOk(focus, ids)) continue;
            const minutes = nominalMinutes(sel, style);
            if (minutes < 20 || minutes > 75) continue;
            const need = [...new Set(sel.flatMap((e) => e.equipment.filter((q) => q !== 'none')))].sort() as Equipment[];
            const lead = sel[0] as ExerciseContent;
            const f = FOCUS_LABEL[focus]; const s = STYLE_LABEL[style]; const lv = LEVEL_LABEL[actual];
            let nameEn = `${f.en} ${s.en} ${lv.en}: ${lead.nameEn} (${tier.labelEn})`;
            let nameHe = `${f.he} ${s.he} ${lv.he}: ${lead.nameHe} (${tier.labelHe})`;
            if (names.has(nameEn.toLowerCase())) { nameEn = `${nameEn} ${k + 1}`; nameHe = `${nameHe} ${k + 1}`; }
            names.add(nameEn.toLowerCase());
            made = {
              id: `rw_${tier.id}_${focus}_${style}_${actual}_${k + 1}`,
              nameHe, nameEn, place: tier.place, mode: tier.mode, focus, level: actual, style,
              equipment: need, exerciseIds: ids, groups: groupsFor(style, ids.length), nominalMinutes: minutes,
            };
          }
        }
        if (made) { out.push(made); byFocus.set(focus, [...(byFocus.get(focus) ?? []), made]); } else skipped.push(specKey);
      }
    });
  });
  void MUSCLE_TO_GROUP;
  return { workouts: out, skipped };
}
