import { EQUIPMENT, EXERCISE_CATEGORIES, MUSCLES, DIFFICULTIES, isExerciseSafe, ageBucket, type Difficulty, type Equipment, type ExerciseCategory, type InjuryArea, type Muscle, type SwapContext } from '@lupu-fit/shared';
import { lookup } from '../../i18n/index.tsx';
import type { ExerciseContent } from '../../data/content.ts';

/** Lowercase, strip Hebrew niqqud/cantillation, fold final letters, drop quotes/geresh/hyphens, collapse spaces. */
export function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (c) => ({ 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' })[c] ?? c)
    .replace(/[׳״'"`’‘“”״׳]/g, '')
    .replace(/[-_/()+.,:;!?]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const PREFIXES = 'הוכלבמש';
/** Candidate stems of one query token: itself, without a one-letter Hebrew prefix, without a plural ending. */
export function tokenVariants(tok: string): string[] {
  const out = new Set<string>([tok]);
  const bases = [tok];
  if (tok.length >= 4 && PREFIXES.includes(tok[0] ?? '') && /[א-ת]/.test(tok[0] ?? '')) { out.add(tok.slice(1)); bases.push(tok.slice(1)); }
  for (const b of bases) {
    if (b.length >= 5 && (b.endsWith('ות') || b.endsWith('ימ'))) out.add(b.slice(0, -2));
    if (b.length >= 4 && b.endsWith('ה')) out.add(b.slice(0, -1));
    if (b.length >= 4 && b.endsWith('s') && /^[a-z]+$/.test(b)) out.add(b.slice(0, -1));
  }
  return [...out].filter((v) => v.length >= 2);
}

const haystackCache = new Map<string, string>();
export function haystackOf(e: ExerciseContent): string {
  const hit = haystackCache.get(e.id); if (hit) return hit;
  const muscles = e.primary.flatMap((m) => [lookup('he', `label.muscle.${m}`), lookup('en', `label.muscle.${m}`)]);
  const h = normalize([e.nameHe, e.nameEn, ...muscles].filter(Boolean).join(' '));
  haystackCache.set(e.id, h); return h;
}

/** Every query token must match (any variant) somewhere in name + primary muscle labels (both languages). */
export function matchesQuery(e: ExerciseContent, query: string): boolean {
  const q = normalize(query); if (!q) return true;
  const h = haystackOf(e);
  return q.split(' ').every((tok) => tokenVariants(tok).some((v) => h.includes(v)));
}

export interface ExerciseFilters { q: string; muscle: Muscle | ''; equipment: Equipment | ''; category: ExerciseCategory | ''; difficulty: Difficulty | ''; safe: boolean }
export const EMPTY_FILTERS: ExerciseFilters = { q: '', muscle: '', equipment: '', category: '', difficulty: '', safe: false };
export const MUSCLE_LIST = MUSCLES; export const EQUIPMENT_LIST = EQUIPMENT; export const CATEGORY_LIST = EXERCISE_CATEGORIES; export const DIFFICULTY_LIST = DIFFICULTIES;

export interface SafetyProfile { age: number; injuries: readonly InjuryArea[]; equipment: readonly Equipment[] }

/** Safety context: injuries + age + owned equipment. Difficulty is not gated here (it has its own filter). */
export function safetyContext(p: SafetyProfile, ownedEquipmentOnly = true): SwapContext {
  return { injuries: p.injuries, avoidIds: [], available: ownedEquipmentOnly ? p.equipment : EQUIPMENT, bucket: ageBucket(p.age), mode: 'weights', maxDifficulty: 'advanced' };
}

export function filterExercises(list: readonly ExerciseContent[], f: ExerciseFilters, profile: SafetyProfile | null): ExerciseContent[] {
  const ctx = f.safe && profile ? safetyContext(profile) : null;
  return list.filter((e) =>
    matchesQuery(e, f.q)
    && (!f.muscle || e.primary.includes(f.muscle))
    && (!f.equipment || e.equipment.includes(f.equipment))
    && (!f.category || e.category === f.category)
    && (!f.difficulty || e.difficulty === f.difficulty)
    && (!ctx || isExerciseSafe(e, ctx)));
}

export const hasActiveFilters = (f: ExerciseFilters): boolean => Object.entries(f).some(([k, v]) => (k === 'safe' ? v === true : v !== ''));
