/**
 * Pure helpers for the workouts screens: bilingual preference parser, ready-workout filter flow,
 * finisher selection, session payload builder, plan editing and progression. No I/O, no React.
 */
import {
  ageBucket, BODYWEIGHT_APPARATUS, EQUIPMENT, defaultFinisherVariant, isExerciseAllowedForAge, FOCUS_MUSCLES, isExerciseSafe, isHighImpact, nextProgression, estimateMinutes,
  type Difficulty, type Equipment, type ExerciseDef, type FinisherContent, type FinisherVariant, type GeneratedPlan, type InjuryArea,
  type PersonProfile, type PlannedDay, type Place, type Prescription, type ReadinessState, type ReadyFilter, type ReadyWorkoutContent, type SessionPerformance,
  type Sport, type SwapContext, type WorkoutFocus, type WorkoutMode, LIMITS,
} from '@lupu-fit/shared';

/* ------------------------------------------------------------ dates */

/** Local calendar date YYYY-MM-DD (never UTC). */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ------------------------------------------------------- preference parser */

export type AvoidRule = 'no_jumping' | 'no_shoulders' | 'no_running';
export type FocusNote = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'glutes';
export interface ParsedPreferences {
  /** Exercise ids to avoid (deduplicated, rule-derived). */
  avoidIds: string[];
  rules: AvoidRule[];
  /** Recorded as a note only: the rules-based generator has no focus input. */
  focus: FocusNote[];
}

type Def = Pick<ExerciseDef, 'id' | 'category' | 'pattern' | 'primary'>;

const RULES: { rule: AvoidRule; re: RegExp; match: (e: Def) => boolean }[] = [
  {
    rule: 'no_jumping',
    re: /(?:בלי|ללא|בלא)\s+(?:קפיצות|קפיצה|פליאומטר\S*|פלאיומטר\S*|אימפקט)|\bno\s+(?:jump(?:s|ing)?|plyo(?:metrics?)?|impact|high[- ]impact)\b|\bwithout\s+jump(?:s|ing)?\b|\bavoid\s+(?:jump(?:s|ing)?|plyo(?:metrics?)?)\b/i,
    match: (e) => e.category === 'plyometric' || e.pattern === 'jump' || isHighImpact(e),
  },
  {
    rule: 'no_shoulders',
    re: /(?:בלי|ללא|בלא)\s+(?:עבודת\s+)?כתפ(?:יים|יה|ים)|\bno\s+shoulders?(?:\s+work)?\b|\bwithout\s+shoulders?\b|\bavoid\s+shoulders?\b|\bskip\s+shoulders?\b/i,
    match: (e) => e.primary.some((m) => FOCUS_MUSCLES.shoulders.includes(m)),
  },
  {
    rule: 'no_running',
    re: /(?:בלי|ללא|בלא)\s+(?:ריצה|ריצות|ספרינטים?|ג׳וגינג|גוגינג)|\bno\s+(?:running|runs?|sprints?|sprinting|jogging)\b|\bwithout\s+running\b|\bavoid\s+running\b/i,
    match: (e) => e.pattern === 'locomotion',
  },
];

const FOCUS_PATTERNS: { focus: FocusNote; re: RegExp }[] = [
  { focus: 'legs', re: /דגש\s+על\s+רגליים|\bfocus(?:\s+on)?\s+legs?\b|\bleg\s+focus\b|\bmore\s+legs\b/i },
  { focus: 'chest', re: /דגש\s+על\s+חזה|\bfocus(?:\s+on)?\s+chest\b/i },
  { focus: 'back', re: /דגש\s+על\s+גב(?!\S)|\bfocus(?:\s+on)?\s+back\b/i },
  { focus: 'shoulders', re: /דגש\s+על\s+כתפיים|\bfocus(?:\s+on)?\s+shoulders?\b/i },
  { focus: 'arms', re: /דגש\s+על\s+(?:ידיים|זרועות)|\bfocus(?:\s+on)?\s+arms?\b/i },
  { focus: 'core', re: /דגש\s+על\s+(?:בטן|ליבה)|\bfocus(?:\s+on)?\s+(?:core|abs)\b/i },
  { focus: 'glutes', re: /דגש\s+על\s+(?:ישבן|עכוז)|\bfocus(?:\s+on)?\s+glutes?\b/i },
];

/** Deterministic keyword parser (Hebrew + English). Unknown text is ignored, never guessed at. */
export function parsePreferences(text: string, catalog: readonly Def[]): ParsedPreferences {
  const norm = text.normalize('NFKC').replace(/[֑-ׇ]/g, '').replace(/["'`]/g, (c) => (c === '"' ? '״' : c)).replace(/\s+/g, ' ');
  const rules: AvoidRule[] = [];
  const ids = new Set<string>();
  for (const r of RULES) {
    if (!r.re.test(norm)) continue;
    rules.push(r.rule);
    for (const e of catalog) if (r.match(e)) ids.add(e.id);
  }
  const focus = FOCUS_PATTERNS.filter((f) => f.re.test(norm)).map((f) => f.focus);
  return { avoidIds: [...ids].sort(), rules, focus };
}

/** Manual avoid list + parser output, capped at the server limit; rule-derived ids are kept first. */
export function mergeAvoidIds(manual: readonly string[], parsed: readonly string[], max = 60): { ids: string[]; truncated: boolean } {
  const all = [...new Set([...manual, ...parsed])];
  return { ids: all.slice(0, max), truncated: all.length > max };
}

/* ----------------------------------------------------- ready filter flow */

export const READY_FILTER_STORE = 'lf_ready_filter';
export const SPORT_STORE = 'lf_sport';

export interface ReadyFilterState {
  place: Place | null;
  /** Home/park only. Empty = bodyweight with no gear. */
  equipment: Equipment[];
  /** Step 2 confirmed (always true for the gym, which skips the step). */
  equipmentDone: boolean;
  mode: WorkoutMode | null;
  focus: WorkoutFocus | null;
  level: Difficulty | null;
  maxMinutes: number | null;
}
export const EMPTY_FILTER: ReadyFilterState = { place: null, equipment: [], equipmentDone: false, mode: null, focus: null, level: null, maxMinutes: null };

/** Highest step that is currently reachable: 1 place, 2 equipment (home/park), 3 mode, 4 muscle. */
export function filterStep(s: ReadyFilterState): 1 | 2 | 3 | 4 {
  if (!s.place) return 1;
  if (s.place !== 'gym' && !s.equipmentDone) return 2;
  if (!s.mode) return 3;
  return 4;
}
export const needsEquipmentStep = (place: Place | null): boolean => place === 'home' || place === 'park';

/** Filter passed to the shared engine. The muscle chip is applied separately so counts can ignore it. */
export function toReadyFilter(s: ReadyFilterState, withFocus: boolean): ReadyFilter {
  const f: ReadyFilter = {};
  if (s.place) f.place = s.place;
  if (s.mode) f.mode = s.mode;
  if (s.place && s.place !== 'gym') f.ownedEquipment = s.equipment; // empty array = no gear at all
  if (withFocus && s.focus) f.focus = s.focus;
  if (s.level) f.level = s.level;
  if (s.maxMinutes !== null) f.maxMinutes = s.maxMinutes;
  return f;
}

/** Equipment the person can use for this selection (gym = the facility has it). */
export function availableEquipment(s: ReadyFilterState): Equipment[] {
  return s.place === 'gym' ? [...EQUIPMENT] : [...s.equipment];
}

export function sanitizeFilter(raw: unknown, pickerEquipment: readonly Equipment[]): ReadyFilterState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const places: unknown[] = ['gym', 'home', 'park'];
  const modes: unknown[] = ['bodyweight', 'weights'];
  const levels: unknown[] = ['beginner', 'intermediate', 'advanced'];
  return {
    place: places.includes(r['place']) ? (r['place'] as Place) : null,
    equipmentDone: r['equipmentDone'] === true,
    equipment: Array.isArray(r['equipment']) ? (r['equipment'] as unknown[]).filter((x): x is Equipment => typeof x === 'string' && pickerEquipment.includes(x as Equipment)) : [],
    mode: modes.includes(r['mode']) ? (r['mode'] as WorkoutMode) : null,
    focus: typeof r['focus'] === 'string' ? (r['focus'] as WorkoutFocus) : null,
    level: levels.includes(r['level']) ? (r['level'] as Difficulty) : null,
    maxMinutes: typeof r['maxMinutes'] === 'number' && r['maxMinutes'] > 0 ? r['maxMinutes'] : null,
  };
}

/** Ready-workout names are used as session names; map the last sessions back to their focus for variety. */
export function recentFocusFromSessions(sessions: readonly { name: string }[], list: readonly ReadyWorkoutContent[], max = 3): WorkoutFocus[] {
  const byName = new Map<string, WorkoutFocus>();
  for (const w of list) { byName.set(w.nameHe, w.focus); byName.set(w.nameEn, w.focus); }
  const out: WorkoutFocus[] = [];
  for (const s of sessions) { const f = byName.get(s.name); if (f) out.push(f); if (out.length >= max) break; }
  return out;
}

export function personProfile(p: { age: number; goal: PersonProfile['goal']; experience: Difficulty; sessionMinutes: number; injuries: readonly InjuryArea[]; equipment: readonly Equipment[] }, equipment: readonly Equipment[]): PersonProfile {
  return { age: p.age, goal: p.goal, experience: p.experience, sessionMinutes: p.sessionMinutes, injuries: p.injuries, avoidIds: [], equipment };
}

/* ------------------------------------------------------------ finishers */

export const LOWER_BODY_INJURIES: readonly InjuryArea[] = ['knee', 'hip', 'ankle', 'lower_back'];

export function hasLowerBodyInjury(injuries: readonly InjuryArea[]): boolean {
  return injuries.some((i) => LOWER_BODY_INJURIES.includes(i));
}

/** Gear a finisher needs that the person does not own. */
export function missingFinisherGear(f: FinisherContent, catalog: ReadonlyMap<string, Pick<ExerciseDef, 'equipment'>>, owned: readonly Equipment[]): Equipment[] {
  const missing = new Set<Equipment>();
  for (const it of f.items) for (const q of catalog.get(it.exerciseId)?.equipment ?? []) if (q !== 'none' && !owned.includes(q)) missing.add(q);
  return [...missing];
}

export function pickFinisher(list: readonly FinisherContent[], sport: Sport, variant: FinisherVariant): FinisherContent | null {
  return list.find((f) => f.sport === sport && f.variant === variant) ?? null;
}

export function defaultVariant(age: number, injuries: readonly InjuryArea[]): FinisherVariant {
  return hasLowerBodyInjury(injuries) ? 'gentle' : defaultFinisherVariant(ageBucket(age));
}

/* --------------------------------------------------------- session payload */

export interface SessionExerciseBody { exerciseId: string; isFinisher: boolean; sport?: Sport | null; planned: Prescription }
export interface SessionStartBody {
  name: string; source: 'ready' | 'plan' | 'custom'; sourceId?: string; sport: Sport | null; localDate: string;
  readiness?: ReadinessState; exercises: SessionExerciseBody[];
}

export function finisherPlanned(rounds: number, item: { workSec: number; restSec: number }): Prescription {
  return { sets: rounds, repsMin: 1, repsMax: 1, rpe: 6, restSec: item.restSec, loadKg: null, durationSec: item.workSec };
}

export function buildSessionPayload(i: {
  name: string; source: 'ready' | 'plan'; sourceId: string; localDate: string; readiness?: ReadinessState | null;
  items: readonly { exerciseId: string; prescription: Prescription }[];
  finisher?: FinisherContent | null;
}): SessionStartBody {
  const sport: Sport | null = i.finisher ? i.finisher.sport : null;
  const main: SessionExerciseBody[] = i.items.map((it) => ({ exerciseId: it.exerciseId, isFinisher: false, planned: it.prescription }));
  const fin: SessionExerciseBody[] = i.finisher ? i.finisher.items.map((it) => ({ exerciseId: it.exerciseId, isFinisher: true, sport: i.finisher!.sport, planned: finisherPlanned(i.finisher!.rounds, it) })) : [];
  return {
    name: i.name, source: i.source, sourceId: i.sourceId, sport, localDate: i.localDate,
    ...(i.readiness ? { readiness: i.readiness } : {}), exercises: [...main, ...fin],
  };
}

export function planToSessionItems(day: PlannedDay): { exerciseId: string; prescription: Prescription }[] {
  return day.exercises.map((e) => ({ exerciseId: e.exerciseId, prescription: e.prescription }));
}

/* ----------------------------------------------------------- history utils */

export interface HistorySet { setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null }
export interface ExerciseHistory { sessionId: string; date: string; sets: HistorySet[] }

/** Last working weight: the heaviest weighted set of the newest session that has one. */
export function lastWorkingLoad(history: readonly ExerciseHistory[]): number | null {
  for (const h of history) {
    const w = h.sets.map((s) => s.weightKg ?? 0).filter((x) => x > 0);
    if (w.length) return Math.max(...w);
  }
  return null;
}

/* -------------------------------------------------------------- plan edit */

export const clonePlan = (p: GeneratedPlan): GeneratedPlan => structuredClone(p);

export function recomputeMinutes(day: PlannedDay): PlannedDay {
  return { ...day, estimatedMinutes: day.exercises.length ? estimateMinutes(day.exercises.map((e) => ({ sets: e.prescription.sets, repsMax: e.prescription.repsMax, durationSec: e.prescription.durationSec, restSec: e.prescription.restSec }))) : 0 };
}

function withDay(plan: GeneratedPlan, di: number, fn: (d: PlannedDay) => PlannedDay): GeneratedPlan {
  return { ...plan, days: plan.days.map((d, i) => (i === di ? recomputeMinutes(fn(d)) : d)) };
}

export function moveExercise(plan: GeneratedPlan, di: number, from: number, to: number): GeneratedPlan {
  return withDay(plan, di, (d) => {
    if (to < 0 || to >= d.exercises.length || from === to) return d;
    const ex = [...d.exercises]; const [m] = ex.splice(from, 1); ex.splice(to, 0, m!);
    return { ...d, exercises: ex };
  });
}
export function removeExercise(plan: GeneratedPlan, di: number, idx: number): GeneratedPlan {
  return withDay(plan, di, (d) => (d.exercises.length <= 1 ? d : { ...d, exercises: d.exercises.filter((_, i) => i !== idx) }));
}
export function addExercise(plan: GeneratedPlan, di: number, exerciseId: string, prescription: Prescription): GeneratedPlan {
  return withDay(plan, di, (d) => (d.exercises.length >= LIMITS.maxExercisesPerWorkout ? d : { ...d, exercises: [...d.exercises, { exerciseId, prescription }] }));
}
/** Swap keeps sets/rest and the rep scheme, but drops a load that belonged to the old exercise. */
export function swapExercise(plan: GeneratedPlan, di: number, idx: number, exerciseId: string, prescription: Prescription): GeneratedPlan {
  return withDay(plan, di, (d) => ({ ...d, exercises: d.exercises.map((e, i) => (i === idx ? { exerciseId, prescription } : e)) }));
}
export function editPrescription(plan: GeneratedPlan, di: number, idx: number, patch: Partial<Prescription>): GeneratedPlan {
  return withDay(plan, di, (d) => ({
    ...d,
    exercises: d.exercises.map((e, i) => {
      if (i !== idx) return e;
      const p = { ...e.prescription, ...patch };
      p.sets = Math.min(LIMITS.sets.max, Math.max(LIMITS.sets.min, Math.round(p.sets)));
      p.repsMin = Math.min(LIMITS.reps.max, Math.max(0, Math.round(p.repsMin)));
      p.repsMax = Math.min(LIMITS.reps.max, Math.max(p.repsMin, Math.round(p.repsMax)));
      return { ...e, prescription: p };
    }),
  }));
}

export type AltReason = 'injury' | 'age' | 'equipment' | 'difficulty' | 'avoid' | 'mode' | 'unknown';
export interface Alternative { id: string; safe: boolean; reason: AltReason | null }

/** Why an exercise is not safe for this person (null = safe). Mirrors shared `isExerciseSafe`, one reason at a time. */
export function unsafeReason(ex: ExerciseDef, ctx: SwapContext): AltReason | null {
  if (isExerciseSafe(ex, ctx)) return null;
  if (ctx.avoidIds.includes(ex.id)) return 'avoid';
  if (ex.contraindications.some((c) => ctx.injuries.includes(c))) return 'injury';
  if (!isExerciseAllowedForAge(ex, ctx.bucket)) return 'age';
  const rank = { beginner: 0, intermediate: 1, advanced: 2 };
  if (rank[ex.difficulty] > rank[ctx.maxDifficulty]) return 'difficulty';
  const needed = ex.equipment.filter((e) => e !== 'none');
  if (ctx.mode === 'bodyweight' && needed.some((e) => !BODYWEIGHT_APPARATUS.includes(e))) return 'mode';
  return 'equipment';
}

export function alternativesFor(ex: ExerciseDef, kind: 'easier' | 'harder', catalog: ReadonlyMap<string, ExerciseDef>, ctx: SwapContext): Alternative[] {
  const ids = kind === 'easier' ? ex.easierAlternatives : ex.harderAlternatives;
  return ids.map((id) => {
    const c = catalog.get(id);
    if (!c) return { id, safe: false, reason: 'unknown' as const };
    const reason = unsafeReason(c, ctx);
    return { id, safe: reason === null, reason };
  });
}

/** A swapped-in exercise keeps sets/rest/RPE; the rep scheme follows the new exercise (timed vs reps) and the old load is cleared. */
export function prescriptionForSwap(old: Prescription, to: ExerciseDef): Prescription {
  const timed = to.category === 'duration' || to.category === 'isometric' || to.category === 'mobility' || to.category === 'stretch';
  if (timed) return { ...old, repsMin: 1, repsMax: 1, loadKg: null, durationSec: old.durationSec ?? 30 };
  const reps = old.repsMax > 0 ? { repsMin: old.repsMin, repsMax: old.repsMax } : { repsMin: 8, repsMax: 12 };
  return { ...old, ...reps, loadKg: null, durationSec: null };
}

/* -------------------------------------------------------- progression */

export interface ProgressionChange { exerciseId: string; dayIndex: number; from: number | null; to: number; action: 'increase' | 'deload' }
export interface ProgressionOutcome { plan: GeneratedPlan; changes: ProgressionChange[]; withoutHistory: number }

/** history is newest-first (API order); shared `nextProgression` wants oldest-first, last 3 sessions. */
export function performanceOf(history: readonly ExerciseHistory[], repsMin: number, repsMax: number): SessionPerformance[] {
  const out: SessionPerformance[] = [];
  for (const h of [...history].reverse().slice(-3)) {
    const weights = h.sets.map((s) => s.weightKg ?? 0).filter((w) => w > 0);
    if (!weights.length) continue;
    const load = Math.max(...weights);
    out.push({ loadKg: load, repsPerSet: h.sets.filter((s) => (s.weightKg ?? 0) === load).map((s) => s.reps ?? 0), repsMin, repsMax });
  }
  return out;
}

export function applyProgression(plan: GeneratedPlan, histories: ReadonlyMap<string, readonly ExerciseHistory[]>, catalog: ReadonlyMap<string, Pick<ExerciseDef, 'externallyLoaded'>>, readiness: ReadinessState = 'normal'): ProgressionOutcome {
  const changes: ProgressionChange[] = [];
  let withoutHistory = 0;
  const next: GeneratedPlan = clonePlan(plan);
  next.days.forEach((d, di) => d.exercises.forEach((e) => {
    if (!catalog.get(e.exerciseId)?.externallyLoaded) return;
    const perf = performanceOf(histories.get(e.exerciseId) ?? [], e.prescription.repsMin, e.prescription.repsMax);
    if (perf.length === 0) { withoutHistory++; return; }
    const r = nextProgression(perf, readiness);
    if (r.action === 'hold' || r.loadKg === null || r.loadKg === e.prescription.loadKg) return;
    changes.push({ exerciseId: e.exerciseId, dayIndex: di, from: e.prescription.loadKg, to: r.loadKg, action: r.action });
    e.prescription = { ...e.prescription, loadKg: r.loadKg };
  }));
  return { plan: next, changes, withoutHistory };
}

/* ------------------------------------------------------------ session text */


