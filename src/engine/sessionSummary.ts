/**
 * Session finalisation: turns an ActiveSession into a CompletedSession and derives everything the summary
 * screen shows – results, XP events, personal bests, achievements, challenge progress, comparison with the
 * previous session, a rule-based recommendation and the refreshed StatsSnapshot.
 *
 * Every number comes from recorded data. Throw/catch totals use logged results first and fall back to the
 * workout snapshot's throwsPerSet × sets only for exercises that were completed without a logged result.
 * The exercise catalog is a parameter (tests inject fixtures); the default is loaded lazily with
 * `loadExerciseCatalog()` – the workout snapshot already carries throwsPerSet, so the catalog is only a
 * second-tier fallback.
 */
import type {
  AchievementDefinition, ActiveSession, ChallengeDefinition, CompletedSession, Exercise, ExerciseResult, Localized, MetricKey,
  PersonalBest, PlannedSession, Profile, Skill, UserAchievement, UserChallenge, WorkoutExercise, XpEvent,
} from "@/lib/types";
import { nowIso } from "@/lib/dates";
import { ACHIEVEMENTS } from "@/content/achievements";
import { CHALLENGES } from "@/content/challenges";
import { CATCH_RATIO_KEYS, THROW_ACCURACY_KEYS, isBetter, metricDirection, resultPct, resultValue, updatePersonalBests, weightedRatio } from "@/engine/personalBests";
import { xpEventsForSession, xpForCompletedSession, type SessionXpBreakdown } from "@/engine/xp";
import { compareToPrevious, computeStats, type SessionComparison, type StatsSnapshot } from "@/engine/stats";
import { evaluateAchievements } from "@/engine/achievements";
import { activeChallenges, applySessionToChallenges } from "@/engine/challenges";

/* ------------------------------------------------------------------ */
/* Catalog access (injectable)                                         */
/* ------------------------------------------------------------------ */

export type ExerciseLookup = (id: string) => Exercise | undefined;
export type ExerciseCatalog = Exercise[] | Record<string, Exercise> | ExerciseLookup;

export function toLookup(catalog: ExerciseCatalog | undefined): ExerciseLookup {
  if (!catalog) return () => undefined;
  if (typeof catalog === "function") return catalog;
  if (Array.isArray(catalog)) {
    const map = new Map(catalog.map((e) => [e.id, e]));
    return (id) => map.get(id);
  }
  return (id) => catalog[id];
}

type CatalogModule = { getExercise?: (id: string) => Exercise | undefined; EXERCISE_MAP?: Record<string, Exercise>; EXERCISES?: Exercise[] };

let defaultLookup: ExerciseLookup | undefined;
let defaultLoading: Promise<ExerciseLookup> | undefined;

/** Lazily load the authored catalog (src/content/exercises). Safe to call repeatedly; cached after the first load. */
export function loadExerciseCatalog(): Promise<ExerciseLookup> {
  if (defaultLookup) return Promise.resolve(defaultLookup);
  if (!defaultLoading) {
    defaultLoading = (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – the catalog index is authored separately and resolved at bundle time.
      import("@/content/exercises") as Promise<unknown>
    )
      .then((raw) => {
        const mod = raw as CatalogModule;
        const lookup: ExerciseLookup = mod.getExercise
          ? (id) => mod.getExercise!(id)
          : mod.EXERCISE_MAP
            ? (id) => mod.EXERCISE_MAP![id]
            : toLookup(mod.EXERCISES ?? []);
        defaultLookup = lookup;
        return lookup;
      })
      .catch(() => {
        defaultLoading = undefined;
        return (() => undefined) as ExerciseLookup;
      });
  }
  return defaultLoading;
}

/** Register a catalog to be used when none is passed explicitly (also what `loadExerciseCatalog` fills). */
export function setDefaultExerciseCatalog(catalog: ExerciseCatalog | undefined): void {
  defaultLookup = catalog ? toLookup(catalog) : undefined;
}

function currentLookup(explicit?: ExerciseCatalog): ExerciseLookup {
  if (explicit) return toLookup(explicit);
  return defaultLookup ?? (() => undefined);
}

/* ------------------------------------------------------------------ */
/* Input / output                                                      */
/* ------------------------------------------------------------------ */

export interface FinalizeSessionInput {
  active: ActiveSession;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  feeling?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  previousSessions: CompletedSession[];
  /** Results of previous sessions – needed for history-wide accuracies, trends and achievements. */
  previousResults?: ExerciseResult[];
  plannedSessions?: PlannedSession[];
  personalBests: PersonalBest[];
  unlockedAchievements: UserAchievement[];
  xpEvents: XpEvent[];
  userChallenges: UserChallenge[];
  profile: Profile;
  now?: string;
}

export interface FinalizeSessionOptions {
  catalog?: ExerciseCatalog;
  challengeDefs?: ChallengeDefinition[];
  achievementDefs?: AchievementDefinition[];
}

export interface FinalizeSessionResult {
  completed: CompletedSession;
  results: ExerciseResult[];
  /** New XP events for this session (session, results, PBs, challenges, achievements). */
  xpEvents: XpEvent[];
  xpBreakdown: SessionXpBreakdown;
  /** Full PB list after the session. */
  personalBests: PersonalBest[];
  newPersonalBestKeys: MetricKey[];
  newAchievements: UserAchievement[];
  /** Challenge records to upsert (newly created for the period and/or progressed by this session). */
  challengeUpdates: UserChallenge[];
  challengesCompleted: UserChallenge[];
  comparison: SessionComparison[];
  recommendation: Localized;
  stats: StatsSnapshot;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const THROW_SKILLS = new Set<Skill>(["backhand", "forehand", "hammer", "deep_throws", "short_throws", "accuracy", "distance", "release_speed", "break_throws"]);
const CATCH_SKILLS = new Set<Skill>(["catching", "catch_moving", "catch_pressure", "one_hand_catch"]);
const THROW_RATIO_KEYS = new Set<MetricKey>([...THROW_ACCURACY_KEYS, "break_throw_pct", "swing_pass_pct", "quick_release_pct"]);

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function flattenExercises(active: Pick<ActiveSession, "workout">): { exercise: WorkoutExercise; phaseIndex: number; phaseType: CompletedSession["skillsTrained"] extends never ? never : ActiveSession["workout"]["phases"][number]["type"] }[] {
  const out: { exercise: WorkoutExercise; phaseIndex: number; phaseType: ActiveSession["workout"]["phases"][number]["type"] }[] = [];
  active.workout.phases.forEach((phase, phaseIndex) => {
    for (const exercise of phase.exercises) out.push({ exercise, phaseIndex, phaseType: phase.type });
  });
  return out;
}

/** Throws recorded in a result (explicit field first, then attempts of a throwing metric). */
export function throwsOfResult(r: ExerciseResult): number {
  if (isNum(r.throws) && r.throws >= 0) return r.throws;
  if (r.metricKey === "throw_count" && isNum(r.count)) return Math.max(0, r.count);
  const throwing = THROW_RATIO_KEYS.has(r.metricKey) || (r.skills ?? []).some((s) => THROW_SKILLS.has(s));
  if (throwing && r.metricType === "ratio" && isNum(r.attempts)) return Math.max(0, r.attempts);
  return 0;
}

/** Catches recorded in a result (explicit field first, then attempts of a catching metric / streak length). */
export function catchesOfResult(r: ExerciseResult): number {
  if (isNum(r.catches) && r.catches >= 0) return r.catches;
  if (r.metricKey === "catch_count" && isNum(r.count)) return Math.max(0, r.count);
  if (r.metricKey === "catch_streak" && isNum(r.streak)) return Math.max(0, r.streak);
  const catching = CATCH_RATIO_KEYS.includes(r.metricKey) || (r.skills ?? []).some((s) => CATCH_SKILLS.has(s));
  if (catching && r.metricType === "ratio") {
    if (isNum(r.successes)) return Math.max(0, r.successes);
    if (isNum(r.attempts)) return Math.max(0, r.attempts);
  }
  return 0;
}

/** Normalise a raw result: session/workout ids, derived accuracy, timestamps. */
function normaliseResult(r: ExerciseResult, active: ActiveSession, now: string): ExerciseResult {
  const out: ExerciseResult = { ...r, sessionId: active.id, workoutId: r.workoutId || active.workoutId, updatedAt: now };
  if (!out.recordedAt) out.recordedAt = now;
  if (out.metricType === "ratio") {
    const pct = resultPct(out);
    if (pct !== undefined) out.accuracyPct = pct;
  }
  if (out.deletedAt === undefined) out.deletedAt = null;
  return out;
}

/** Best/aggregate value per metric key in this session (ratios Σ/Σ, times min, others max). */
export function sessionRoleMetrics(results: ExerciseResult[]): Partial<Record<MetricKey, number>> {
  const byKey = new Map<MetricKey, ExerciseResult[]>();
  for (const r of results) {
    if (r.deletedAt) continue;
    const list = byKey.get(r.metricKey) ?? [];
    list.push(r);
    byKey.set(r.metricKey, list);
  }
  const out: Partial<Record<MetricKey, number>> = {};
  for (const [key, list] of byKey) {
    const ratios = list.filter((r) => r.metricType === "ratio");
    if (ratios.length > 0) {
      const w = weightedRatio(ratios);
      if (w.pct !== undefined) out[key] = w.pct;
      continue;
    }
    const direction = metricDirection(key, list[0].metricType);
    let best: number | undefined;
    for (const r of list) {
      const v = resultValue(r);
      if (v === undefined) continue;
      if (best === undefined || isBetter(v, best, direction)) best = v;
    }
    if (best !== undefined) out[key] = best;
  }
  return out;
}

function actualMinutesOf(active: ActiveSession, now: string): number {
  if (isNum(active.elapsedSeconds) && active.elapsedSeconds > 0) return Math.max(1, Math.round(active.elapsedSeconds / 60));
  // No ticks recorded (e.g. the timer never ran): fall back to wall-clock time, bounded by the planned duration.
  const start = new Date(active.startedAt).getTime();
  const end = new Date(now).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(active.workout.totalDurationMinutes, Math.round((end - start) / 60_000));
}

/* ------------------------------------------------------------------ */
/* Recommendation                                                      */
/* ------------------------------------------------------------------ */

interface RecommendationContext {
  completed: CompletedSession;
  results: ExerciseResult[];
  active: ActiveSession;
  feeling?: number;
  difficulty?: number;
  stats: StatsSnapshot;
}

/** Ratio accuracy of the last phase that logged ratio results vs the phases before it. */
function lateFatigueDrop(active: ActiveSession, results: ExerciseResult[]): number | undefined {
  const order = new Map<string, number>();
  active.workout.phases.forEach((p, i) => order.set(p.type, i));
  const ratio = results.filter((r) => r.metricType === "ratio" && isNum(r.attempts) && r.attempts > 0);
  if (ratio.length === 0) return undefined;
  const indices = ratio.map((r) => order.get(r.phaseType) ?? -1);
  const last = Math.max(...indices);
  const late = ratio.filter((r) => (order.get(r.phaseType) ?? -1) === last);
  const early = ratio.filter((r) => (order.get(r.phaseType) ?? -1) < last);
  const wLate = weightedRatio(late);
  const wEarly = weightedRatio(early);
  if (wLate.pct === undefined || wEarly.pct === undefined || wLate.attempts < 10 || wEarly.attempts < 10) return undefined;
  return round1(wEarly.pct - wLate.pct);
}

/** Rule-based recommendation for the next session (never judgemental, always actionable). */
export function buildRecommendation(ctx: RecommendationContext): Localized {
  const { completed, results, active, feeling, difficulty } = ctx;
  const lines: Localized[] = [];

  if (feeling !== undefined && feeling <= 2) {
    lines.push({ he: "ההרגשה הייתה נמוכה היום – באימון הבא נוריד עצימות ונשים דגש על טכניקה ומנוחה מלאה בין סטים.", en: "You felt low today – next workout we'll lower the intensity and focus on technique with full rest between sets." });
  }
  if (difficulty !== undefined && difficulty >= 5) {
    lines.push({ he: "האימון הרגיש קשה מאוד – נקצר סטים ונאריך מנוחה באימון הבא.", en: "That felt very hard – next time we'll shorten the sets and lengthen the rest." });
  } else if (difficulty !== undefined && difficulty <= 1 && lines.length === 0) {
    lines.push({ he: "האימון הרגיש קל – נעלה מדרגה: מרחקים גדולים יותר ומנוחה קצרה יותר.", en: "That felt easy – we'll step it up: longer distances and shorter rests." });
  }

  const drop = lateFatigueDrop(active, results);
  if (drop !== undefined && drop >= 10) {
    lines.push({ he: `הדיוק ירד ב-${drop} נקודות לקראת סוף האימון – נעבוד עם סטים קצרים יותר ויותר מנוחה כדי לשמור על איכות עד הסוף.`, en: `Accuracy dropped ${drop} points towards the end – we'll use shorter sets with more rest to keep the quality up to the finish.` });
  }

  const bh = completed.backhandAccuracy;
  const fh = completed.forehandAccuracy;
  if (bh !== undefined && fh !== undefined) {
    if (bh - fh >= 15) {
      lines.push({ he: `ה-Forehand (${Math.round(fh)}%) עדיין מאחורי ה-Backhand (${Math.round(bh)}%) – באימון הבא נוסיף עוד עבודת Forehand קצרה.`, en: `Forehand (${Math.round(fh)}%) is still behind backhand (${Math.round(bh)}%) – next workout adds more short forehand work.` });
    } else if (fh - bh >= 15) {
      lines.push({ he: `ה-Backhand (${Math.round(bh)}%) עדיין מאחורי ה-Forehand (${Math.round(fh)}%) – באימון הבא נוסיף עוד עבודת Backhand קצרה.`, en: `Backhand (${Math.round(bh)}%) is still behind forehand (${Math.round(fh)}%) – next workout adds more short backhand work.` });
    }
  }

  const ratio = completed.exercisesCount > 0 ? completed.exercisesCompleted / completed.exercisesCount : 1;
  if (ratio < 0.6 && lines.length === 0) {
    lines.push({ he: "הושלמו פחות מ-60% מהתרגילים – באימון הבא נבחר גרסה קצרה יותר כדי לסיים אותה בשלמות.", en: "Fewer than 60% of the exercises were completed – next time we'll pick a shorter version so you can finish it fully." });
  }

  if (lines.length === 0) {
    if (completed.newPersonalBestKeys.length > 0) {
      lines.push({ he: "שיא אישי חדש היום – נשמור על אותו מבנה באימון הבא ונעלה את המרחק או הקצב בקצת.", en: "A new personal best today – we'll keep the same structure next time and nudge the distance or pace up a little." });
    } else if (ctx.stats.weakSkills.length > 0) {
      lines.push({ he: "אימון טוב. באימון הבא נשלב יותר תרגילים במיומנויות שעדיין מאחור לפי הנתונים שלכם.", en: "Good workout. Next time we'll weave in more drills for the skills your data shows are still behind." });
    } else {
      lines.push({ he: "אימון טוב. באימון הבא נמשיך באותו מבנה ונוסיף מדידה אחת כדי לעקוב אחרי ההתקדמות.", en: "Good workout. Next time we'll keep the same structure and add one measurement to track progress." });
    }
  }

  return { he: lines.slice(0, 2).map((l) => l.he).join(" "), en: lines.slice(0, 2).map((l) => l.en).join(" ") };
}

/* ------------------------------------------------------------------ */
/* Finalise                                                            */
/* ------------------------------------------------------------------ */

export function finalizeSession(input: FinalizeSessionInput, opts: FinalizeSessionOptions = {}): FinalizeSessionResult {
  const now = input.now ?? nowIso();
  const active = input.active;
  const lookup = currentLookup(opts.catalog);
  const challengeDefs = opts.challengeDefs ?? CHALLENGES;
  const achievementDefs = opts.achievementDefs ?? ACHIEVEMENTS;

  const results = (active.results ?? []).filter((r) => !r.deletedAt).map((r) => normaliseResult(r, active, now));
  const all = flattenExercises(active);
  const exercisesCount = all.length;

  const withResult = new Set(results.map((r) => r.workoutExerciseId));
  const completedIds = new Set<string>(active.completedExerciseIds ?? []);
  for (const id of withResult) completedIds.add(id);
  const exercisesCompleted = all.filter((x) => completedIds.has(x.exercise.id)).length;

  // Throws / catches: logged results first, then the snapshot estimate for completed exercises without a result.
  let throws = 0;
  let catches = 0;
  for (const r of results) {
    throws += throwsOfResult(r);
    catches += catchesOfResult(r);
  }
  const skills = new Set<Skill>();
  for (const { exercise } of all) {
    if (!completedIds.has(exercise.id)) continue;
    for (const s of exercise.skills ?? []) skills.add(s);
    if (withResult.has(exercise.id)) continue;
    const catalogEntry = exercise.exerciseId ? lookup(exercise.exerciseId) : undefined;
    const sets = Math.max(1, exercise.sets || catalogEntry?.sets || 1);
    const tps = isNum(exercise.throwsPerSet) ? exercise.throwsPerSet : catalogEntry?.throwsPerSet;
    const cps = isNum(exercise.catchesPerSet) ? exercise.catchesPerSet : catalogEntry?.catchesPerSet;
    if (isNum(tps)) throws += Math.max(0, tps) * sets;
    if (isNum(cps)) catches += Math.max(0, cps) * sets;
  }
  for (const r of results) for (const s of r.skills ?? []) skills.add(s);

  const actualMinutes = actualMinutesOf(active, now);
  const overall = weightedRatio(results.filter((r) => r.metricType === "ratio" && THROW_ACCURACY_KEYS.includes(r.metricKey)));
  const bh = weightedRatio(results.filter((r) => r.metricKey === "backhand_accuracy"));
  const fh = weightedRatio(results.filter((r) => r.metricKey === "forehand_accuracy"));
  const hm = weightedRatio(results.filter((r) => r.metricKey === "hammer_accuracy"));

  const pbUpdate = updatePersonalBests(input.personalBests, results, { id: active.id, actualMinutes, throws }, now);

  const completed: CompletedSession = {
    id: active.id,
    workoutId: active.workoutId,
    workoutTitle: active.workout.title,
    source: active.workout.source,
    role: active.workout.targetRole,
    startedAt: active.startedAt,
    completedAt: now,
    plannedMinutes: active.workout.totalDurationMinutes,
    actualMinutes,
    phasesCount: active.workout.phases.length,
    exercisesCount,
    exercisesCompleted,
    throws,
    catches,
    roleMetrics: sessionRoleMetrics(results),
    xpEarned: 0,
    newAchievementIds: [],
    newPersonalBestKeys: pbUpdate.newKeys,
    replacements: active.replacements ?? [],
    skillsTrained: Array.from(skills),
    updatedAt: now,
    deletedAt: null,
  };
  if (active.plannedSessionId) completed.plannedSessionId = active.plannedSessionId;
  if (active.planId) completed.planId = active.planId;
  if (active.workout.secondaryRole) completed.secondaryRole = active.workout.secondaryRole;
  if (overall.pct !== undefined) completed.accuracyPct = overall.pct;
  if (bh.pct !== undefined) completed.backhandAccuracy = bh.pct;
  if (fh.pct !== undefined) completed.forehandAccuracy = fh.pct;
  if (hm.pct !== undefined) completed.hammerAccuracy = hm.pct;
  if (input.difficulty !== undefined) completed.difficulty = input.difficulty;
  if (input.feeling !== undefined) completed.feeling = input.feeling;
  if (input.note && input.note.trim()) completed.note = input.note.trim();
  if (active.checkin) completed.checkin = active.checkin;

  // Challenges: current period records (creating missing ones) progressed by this session.
  const active_ = activeChallenges(challengeDefs, input.userChallenges, input.profile, new Date(now));
  const currentRecords = [active_.daily, ...active_.weekly].map(({ def: _def, ...uc }) => uc);
  const applied = applySessionToChallenges(currentRecords, challengeDefs, completed, results, now);
  const updatedIds = new Set(applied.updated.map((u) => u.id));
  const challengeUpdates: UserChallenge[] = [...applied.updated, ...active_.created.filter((c) => !updatedIds.has(c.id))];
  const defById = new Map(challengeDefs.map((d) => [d.id, d]));

  // Stats before XP (achievements need history-wide totals including this session).
  const previousSessions = input.previousSessions.filter((s) => !s.deletedAt && s.id !== active.id);
  const allSessions = [...previousSessions, completed];
  const allResults = [...(input.previousResults ?? []).filter((r) => !r.deletedAt && r.sessionId !== active.id), ...results];
  const statsBase = { completedSessions: allSessions, exerciseResults: allResults, personalBests: pbUpdate.all, plannedSessions: input.plannedSessions, now: new Date(now) };
  const preStats = computeStats({ ...statsBase, xpEvents: input.xpEvents });
  const newAchievements = evaluateAchievements(preStats, allResults, input.unlockedAchievements, now, active.id, achievementDefs);
  const achById = new Map(achievementDefs.map((a) => [a.id, a]));

  // XP.
  const challengePhaseDone = all.some((x) => x.phaseType === "challenge" && completedIds.has(x.exercise.id));
  const xpBreakdown = xpForCompletedSession({
    actualMinutes,
    plannedMinutes: active.workout.totalDurationMinutes,
    exercisesCompleted,
    exercisesCount,
    resultsLogged: results.length,
    newPersonalBests: pbUpdate.newKeys.length,
    challengeCompleted: challengePhaseDone || applied.completedNow.length > 0,
  });
  const xpEvents = xpEventsForSession({
    sessionId: active.id,
    at: now,
    breakdown: xpBreakdown,
    newPersonalBestKeys: pbUpdate.newKeys,
    completedChallenges: applied.completedNow.map((c) => ({ id: c.id, xp: defById.get(c.definitionId)?.xp ?? 0 })),
    unlockedAchievements: newAchievements.map((a) => ({ id: a.id, xp: achById.get(a.id)?.xp ?? 0 })),
  });
  completed.xpEarned = xpEvents.reduce((sum, e) => sum + e.amount, 0);
  completed.newAchievementIds = newAchievements.map((a) => a.id);

  const stats = computeStats({ ...statsBase, completedSessions: [...previousSessions, completed], xpEvents: [...input.xpEvents.filter((e) => !e.deletedAt), ...xpEvents] });

  const previous = previousSessions.slice().sort((a, b) => a.completedAt.localeCompare(b.completedAt)).pop();
  const comparison = compareToPrevious(completed, previous);
  const recommendation = buildRecommendation({ completed, results, active, feeling: input.feeling, difficulty: input.difficulty, stats });

  return {
    completed,
    results,
    xpEvents,
    xpBreakdown,
    personalBests: pbUpdate.all,
    newPersonalBestKeys: pbUpdate.newKeys,
    newAchievements,
    challengeUpdates,
    challengesCompleted: applied.completedNow,
    comparison,
    recommendation,
    stats,
  };
}

/** Same as `finalizeSession` but loads the authored catalog first when none is injected. */
export async function finalizeSessionAsync(input: FinalizeSessionInput, opts: FinalizeSessionOptions = {}): Promise<FinalizeSessionResult> {
  if (!opts.catalog && !defaultLookup) await loadExerciseCatalog();
  return finalizeSession(input, opts);
}
