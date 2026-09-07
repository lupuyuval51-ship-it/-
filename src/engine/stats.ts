/**
 * Statistics engine. Every number is derived from recorded sessions/results; when there is no data
 * the field is undefined (UI shows a "no data" state) – nothing is ever estimated or invented.
 */
import type { CompletedSession, ExerciseResult, Localized, MetricKey, PersonalBest, PlannedSession, Role, Skill, XpEvent } from "@/lib/types";
import { SKILLS } from "@/lib/types";
import { addDays, daysBetween, monthKey, startOfWeek, startOfWeekKey, toDateKey } from "@/lib/dates";
import { levelFromXp, type LevelInfo } from "@/content/levels";
import { totalXp } from "@/engine/xp";
import { computeStreak } from "@/engine/streak";
import { THROW_ACCURACY_KEYS, metricDirection, resultValue, weightedRatio } from "@/engine/personalBests";

export interface SkillStats {
  sessions: number;
  attempts: number;
  accuracyPct?: number;
  /** Percentage-point change: weighted accuracy of the last 3 sessions minus the 3 before them. */
  trend?: number;
}

export interface StatsSnapshot {
  /** False when nothing has been recorded yet. */
  hasData: boolean;
  sessions: number;
  totalMinutes: number;
  totalHours: number;
  totalThrows: number;
  totalCatches: number;
  accuracyPct?: number;
  accuracyAttempts: number;
  backhandAccuracy?: number;
  backhandAttempts: number;
  forehandAccuracy?: number;
  forehandAttempts: number;
  hammerAccuracy?: number;
  hammerAttempts: number;
  longestThrowM?: number;
  bestCatchStreak?: number;
  bestSprintTimeS?: number;
  bestCodTimeS?: number;
  longestSessionMinutes?: number;
  currentStreak: number;
  bestStreak: number;
  streakMessage: Localized;
  streakGraceDaysLeft: number;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  sessionsThisMonth: number;
  minutesThisMonth: number;
  plannedThisWeek: number;
  bySkill: Partial<Record<Skill, SkillStats>>;
  byRole: Partial<Record<Role, { sessions: number; minutes: number }>>;
  weakSkills: Skill[];
  strongSkills: Skill[];
  lastSession?: CompletedSession;
  xpTotal: number;
  level: LevelInfo;
}

export interface StatsInput {
  completedSessions: CompletedSession[];
  exerciseResults: ExerciseResult[];
  personalBests: PersonalBest[];
  plannedSessions?: PlannedSession[];
  xpEvents?: XpEvent[];
  now?: Date;
}

export const METRIC_LABELS: Record<MetricKey, Localized> = {
  backhand_accuracy: { he: "דיוק Backhand", en: "Backhand accuracy" },
  forehand_accuracy: { he: "דיוק Forehand", en: "Forehand accuracy" },
  hammer_accuracy: { he: "דיוק Hammer", en: "Hammer accuracy" },
  throw_accuracy: { he: "דיוק זריקה", en: "Throw accuracy" },
  deep_throw_accuracy: { he: "דיוק זריקות עומק", en: "Deep-throw accuracy" },
  short_throw_accuracy: { he: "דיוק זריקות קצרות", en: "Short-throw accuracy" },
  break_throw_pct: { he: "הצלחת Break Throws", en: "Break-throw success" },
  swing_pass_pct: { he: "הצלחת Swing", en: "Swing-pass success" },
  quick_release_pct: { he: "שחרור מהיר", en: "Quick release" },
  catch_release_pct: { he: "תפיסה ושחרור", en: "Catch & release" },
  longest_throw_m: { he: "זריקה ארוכה ביותר", en: "Longest throw" },
  catch_streak: { he: "רצף תפיסות", en: "Catch streak" },
  catch_pct: { he: "אחוז תפיסות", en: "Catch rate" },
  catch_moving_pct: { he: "תפיסה בתנועה", en: "Catching on the move" },
  catch_pressure_pct: { he: "תפיסה בלחץ", en: "Catching under pressure" },
  one_hand_catch_pct: { he: "תפיסה ביד אחת", en: "One-hand catches" },
  sprint_time_s: { he: "ספרינט 20 מ׳", en: "20 m sprint" },
  cod_time_s: { he: "שינוי כיוון 5-10-5", en: "5-10-5 change of direction" },
  t_drill_time_s: { he: "T-Drill", en: "T-drill" },
  agility_time_s: { he: "זמן זריזות", en: "Agility time" },
  lateral_shuffle_time_s: { he: "Shuffle צידי", en: "Lateral shuffle" },
  recovery_sprint_time_s: { he: "ספרינט התאוששות", en: "Recovery sprint" },
  repeat_sprint_drop_pct: { he: "ירידה בספרינטים חוזרים", en: "Repeat-sprint drop" },
  course_time_s: { he: "זמן מסלול", en: "Course time" },
  endurance_score: { he: "סיבולת", en: "Endurance" },
  mirror_score: { he: "Mirror", en: "Mirror" },
  reaction_score: { he: "תגובה", en: "Reaction" },
  marking_score: { he: "Marking", en: "Marking" },
  pivot_score: { he: "Pivot", en: "Pivot" },
  decision_score: { he: "קבלת החלטות", en: "Decision making" },
  cut_timing_score: { he: "תזמון Cut", en: "Cut timing" },
  separation_score: { he: "יצירת מרווח", en: "Separation" },
  deep_run_success_pct: { he: "ריצות עומק", en: "Deep runs" },
  fake_score: { he: "Fakes", en: "Fakes" },
  throw_count: { he: "זריקות באימון", en: "Throws in a session" },
  catch_count: { he: "תפיסות באימון", en: "Catches in a session" },
  error_free_streak: { he: "רצף ללא טעויות", en: "Error-free streak" },
  confidence_rating: { he: "ביטחון", en: "Confidence" },
  wing_challenge_score: { he: "אתגר כנף", en: "Wing challenge" },
  runner_challenge_score: { he: "אתגר רץ", en: "Runner challenge" },
  defender_challenge_score: { he: "אתגר מגן", en: "Defender challenge" },
  handler_challenge_score: { he: "אתגר Handler", en: "Handler challenge" },
  cutter_challenge_score: { he: "אתגר Cutter", en: "Cutter challenge" },
  hybrid_challenge_score: { he: "אתגר היברידי", en: "Hybrid challenge" },
};

const SKILL_MIN_ATTEMPTS = 20;
const WEAK_THRESHOLD = 65;
const STRONG_THRESHOLD = 75;

function live<T extends { deletedAt?: string | null }>(items: T[] | undefined): T[] {
  return (items ?? []).filter((i) => !i.deletedAt);
}

export function sessionDateKey(s: Pick<CompletedSession, "completedAt" | "startedAt">): string {
  const d = new Date(s.completedAt || s.startedAt);
  return Number.isNaN(d.getTime()) ? "1970-01-01" : toDateKey(d);
}

function resultDateKey(r: ExerciseResult, sessionDates: Map<string, string>): string {
  const fromSession = sessionDates.get(r.sessionId);
  if (fromSession) return fromSession;
  const d = new Date(r.recordedAt);
  return Number.isNaN(d.getTime()) ? "1970-01-01" : toDateKey(d);
}

function sortSessions(sessions: CompletedSession[]): CompletedSession[] {
  return [...sessions].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function best(values: number[], direction: "higher" | "lower"): number | undefined {
  if (values.length === 0) return undefined;
  return direction === "higher" ? Math.max(...values) : Math.min(...values);
}

function keyValues(results: ExerciseResult[], key: MetricKey): number[] {
  const out: number[] = [];
  for (const r of results) {
    if (r.metricKey !== key) continue;
    const v = resultValue(r);
    if (v !== undefined) out.push(v);
  }
  return out;
}

function pbValue(pbs: PersonalBest[], key: MetricKey): number | undefined {
  const pb = pbs.find((p) => p.key === key);
  return pb && Number.isFinite(pb.value) ? pb.value : undefined;
}

function combineBest(a: number | undefined, b: number | undefined, direction: "higher" | "lower"): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return direction === "higher" ? Math.max(a, b) : Math.min(a, b);
}

/** Trend for a set of ratio results grouped by session: last 3 sessions vs the previous 3. */
function trendFor(results: ExerciseResult[], sessionOrder: Map<string, string>): number | undefined {
  const groups = new Map<string, ExerciseResult[]>();
  for (const r of results) {
    if (!(typeof r.attempts === "number" && r.attempts > 0)) continue;
    const list = groups.get(r.sessionId) ?? [];
    list.push(r);
    groups.set(r.sessionId, list);
  }
  const ordered = Array.from(groups.entries()).sort((a, b) => {
    const ka = sessionOrder.get(a[0]) ?? a[1][0].recordedAt;
    const kb = sessionOrder.get(b[0]) ?? b[1][0].recordedAt;
    return ka.localeCompare(kb);
  });
  if (ordered.length < 2) return undefined;
  const recent = ordered.slice(-3);
  const previous = ordered.slice(Math.max(0, ordered.length - 6), ordered.length - 3);
  if (previous.length === 0) return undefined;
  const recentPct = weightedRatio(recent.flatMap((g) => g[1])).pct;
  const previousPct = weightedRatio(previous.flatMap((g) => g[1])).pct;
  if (recentPct === undefined || previousPct === undefined) return undefined;
  return round1(recentPct - previousPct);
}

export function computeStats(input: StatsInput): StatsSnapshot {
  const now = input.now ?? new Date();
  const sessions = sortSessions(live(input.completedSessions));
  const results = live(input.exerciseResults);
  const pbs = live(input.personalBests);
  const planned = live(input.plannedSessions);

  const sessionDates = new Map<string, string>();
  const sessionOrder = new Map<string, string>();
  for (const s of sessions) {
    sessionDates.set(s.id, sessionDateKey(s));
    sessionOrder.set(s.id, s.completedAt);
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + Math.max(0, s.actualMinutes || 0), 0);
  const totalThrows = sessions.reduce((sum, s) => sum + Math.max(0, s.throws || 0), 0);
  const totalCatches = sessions.reduce((sum, s) => sum + Math.max(0, s.catches || 0), 0);

  const overall = weightedRatio(results.filter((r) => r.metricType === "ratio" && THROW_ACCURACY_KEYS.includes(r.metricKey)));
  const bh = weightedRatio(results.filter((r) => r.metricKey === "backhand_accuracy"));
  const fh = weightedRatio(results.filter((r) => r.metricKey === "forehand_accuracy"));
  const hm = weightedRatio(results.filter((r) => r.metricKey === "hammer_accuracy"));

  const longestThrowM = combineBest(best(keyValues(results, "longest_throw_m"), "higher"), pbValue(pbs, "longest_throw_m"), "higher");
  const bestCatchStreak = combineBest(best(keyValues(results, "catch_streak"), "higher"), pbValue(pbs, "catch_streak"), "higher");
  const bestSprintTimeS = combineBest(best(keyValues(results, "sprint_time_s"), "lower"), pbValue(pbs, "sprint_time_s"), "lower");
  const bestCodTimeS = combineBest(best(keyValues(results, "cod_time_s"), "lower"), pbValue(pbs, "cod_time_s"), "lower");
  const longestSessionMinutes = best(sessions.map((s) => s.actualMinutes).filter((m) => Number.isFinite(m) && m > 0), "higher");

  const streak = computeStreak(sessions, planned, now);

  const weekStart = startOfWeekKey(now);
  const weekEnd = toDateKey(addDays(startOfWeek(now), 6));
  const thisMonth = monthKey(now);
  let sessionsThisWeek = 0;
  let minutesThisWeek = 0;
  let sessionsThisMonth = 0;
  let minutesThisMonth = 0;
  for (const s of sessions) {
    const d = sessionDates.get(s.id)!;
    if (d >= weekStart && d <= weekEnd) {
      sessionsThisWeek += 1;
      minutesThisWeek += Math.max(0, s.actualMinutes || 0);
    }
    if (d.slice(0, 7) === thisMonth) {
      sessionsThisMonth += 1;
      minutesThisMonth += Math.max(0, s.actualMinutes || 0);
    }
  }
  const plannedThisWeek = planned.filter(
    (p) => !p.restDay && p.status !== "cancelled" && p.status !== "replaced" && p.date >= weekStart && p.date <= weekEnd,
  ).length;

  // Per-skill: sessions that trained the skill, attempts/accuracy from ratio results tagged with it.
  const bySkill: Partial<Record<Skill, SkillStats>> = {};
  const sessionSkills = new Map<string, Set<Skill>>();
  for (const s of sessions) sessionSkills.set(s.id, new Set(s.skillsTrained ?? []));
  for (const r of results) {
    const set = sessionSkills.get(r.sessionId) ?? new Set<Skill>();
    for (const sk of r.skills ?? []) set.add(sk);
    sessionSkills.set(r.sessionId, set);
  }
  for (const skill of SKILLS) {
    let count = 0;
    for (const set of sessionSkills.values()) if (set.has(skill)) count += 1;
    const skillResults = results.filter((r) => r.metricType === "ratio" && (r.skills ?? []).includes(skill));
    const w = weightedRatio(skillResults);
    if (count === 0 && w.attempts === 0) continue;
    const entry: SkillStats = { sessions: count, attempts: w.attempts };
    if (w.pct !== undefined) entry.accuracyPct = w.pct;
    const trend = trendFor(skillResults, sessionOrder);
    if (trend !== undefined) entry.trend = trend;
    bySkill[skill] = entry;
  }

  const byRole: Partial<Record<Role, { sessions: number; minutes: number }>> = {};
  for (const s of sessions) {
    const entry = byRole[s.role] ?? { sessions: 0, minutes: 0 };
    entry.sessions += 1;
    entry.minutes += Math.max(0, s.actualMinutes || 0);
    byRole[s.role] = entry;
  }

  const eligible = (Object.entries(bySkill) as [Skill, SkillStats][])
    .filter(([, v]) => v.attempts >= SKILL_MIN_ATTEMPTS && v.accuracyPct !== undefined)
    .sort((a, b) => a[1].accuracyPct! - b[1].accuracyPct!);
  let weakSkills = eligible.filter(([, v]) => v.accuracyPct! < WEAK_THRESHOLD).slice(0, 3).map(([k]) => k);
  let strongSkills = eligible
    .filter(([, v]) => v.accuracyPct! >= STRONG_THRESHOLD)
    .slice(-3)
    .reverse()
    .map(([k]) => k);
  if (eligible.length >= 2 && weakSkills.length === 0 && strongSkills.length === 0) {
    const lowest = eligible[0];
    const highest = eligible[eligible.length - 1];
    if (highest[1].accuracyPct! - lowest[1].accuracyPct! >= 15) {
      weakSkills = [lowest[0]];
      strongSkills = [highest[0]];
    }
  }

  const xpTotal = input.xpEvents ? totalXp(input.xpEvents) : sessions.reduce((sum, s) => sum + Math.max(0, s.xpEarned || 0), 0);

  const snapshot: StatsSnapshot = {
    hasData: sessions.length > 0 || results.length > 0,
    sessions: sessions.length,
    totalMinutes,
    totalHours: round1(totalMinutes / 60),
    totalThrows,
    totalCatches,
    accuracyAttempts: overall.attempts,
    backhandAttempts: bh.attempts,
    forehandAttempts: fh.attempts,
    hammerAttempts: hm.attempts,
    currentStreak: streak.current,
    bestStreak: streak.best,
    streakMessage: streak.message,
    streakGraceDaysLeft: streak.graceDaysLeft,
    sessionsThisWeek,
    minutesThisWeek,
    sessionsThisMonth,
    minutesThisMonth,
    plannedThisWeek,
    bySkill,
    byRole,
    weakSkills,
    strongSkills,
    xpTotal,
    level: levelFromXp(xpTotal),
  };
  if (overall.pct !== undefined) snapshot.accuracyPct = overall.pct;
  if (bh.pct !== undefined) snapshot.backhandAccuracy = bh.pct;
  if (fh.pct !== undefined) snapshot.forehandAccuracy = fh.pct;
  if (hm.pct !== undefined) snapshot.hammerAccuracy = hm.pct;
  if (longestThrowM !== undefined) snapshot.longestThrowM = longestThrowM;
  if (bestCatchStreak !== undefined) snapshot.bestCatchStreak = bestCatchStreak;
  if (bestSprintTimeS !== undefined) snapshot.bestSprintTimeS = bestSprintTimeS;
  if (bestCodTimeS !== undefined) snapshot.bestCodTimeS = bestCodTimeS;
  if (longestSessionMinutes !== undefined) snapshot.longestSessionMinutes = longestSessionMinutes;
  if (sessions.length > 0) snapshot.lastSession = sessions[sessions.length - 1];
  return snapshot;
}

/* ------------------------------------------------------------------ */
/* Time series                                                         */
/* ------------------------------------------------------------------ */

export type TimeSeriesMetric = "accuracy" | "backhand" | "forehand" | "hammer" | "catches" | "distance" | "minutes" | "sessions" | "throws" | "sprint";
export type TimeSeriesRange = "week" | "month" | "3months" | "all";

export interface TimeSeriesPoint {
  /** Bucket start (YYYY-MM-DD): the day, or the Sunday of the week. */
  date: string;
  /** null = no measurement in that bucket. Count metrics use 0 for "no training". */
  value: number | null;
  label: string;
}

export interface TimeSeriesOptions {
  metric: TimeSeriesMetric;
  range: TimeSeriesRange;
  role?: Role;
  now?: Date;
}

const MAX_WEEK_BUCKETS = 260;

function shortLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${d}/${m}`;
}

function buildBuckets(range: TimeSeriesRange, now: Date, firstSessionDate?: string): { keys: string[]; weekly: boolean } {
  if (range === "week" || range === "month") {
    const days = range === "week" ? 7 : 30;
    const keys: string[] = [];
    for (let i = days - 1; i >= 0; i -= 1) keys.push(toDateKey(addDays(now, -i)));
    return { keys, weekly: false };
  }
  const thisWeek = startOfWeek(now);
  let weeks = 13;
  if (range === "all") {
    if (!firstSessionDate) return { keys: [], weekly: true };
    const firstWeek = startOfWeekKey(new Date(firstSessionDate + "T12:00:00"));
    weeks = Math.min(MAX_WEEK_BUCKETS, Math.floor(daysBetween(firstWeek, toDateKey(thisWeek)) / 7) + 1);
  }
  const keys: string[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) keys.push(toDateKey(addDays(thisWeek, -7 * i)));
  return { keys, weekly: true };
}

function bucketKeyFor(dateKey: string, weekly: boolean): string {
  return weekly ? startOfWeekKey(new Date(dateKey + "T12:00:00")) : dateKey;
}

export function timeSeries(input: Pick<StatsInput, "completedSessions" | "exerciseResults">, opts: TimeSeriesOptions): TimeSeriesPoint[] {
  const now = opts.now ?? new Date();
  let sessions = sortSessions(live(input.completedSessions));
  if (opts.role) sessions = sessions.filter((s) => s.role === opts.role || s.secondaryRole === opts.role);
  const sessionDates = new Map<string, string>();
  for (const s of sessions) sessionDates.set(s.id, sessionDateKey(s));

  let results = live(input.exerciseResults);
  if (opts.role) results = results.filter((r) => sessionDates.has(r.sessionId) || r.role === opts.role);

  const firstDate = sessions.length > 0 ? sessionDates.get(sessions[0].id) : undefined;
  const firstResultDate = results.length > 0 ? results.map((r) => resultDateKey(r, sessionDates)).sort()[0] : undefined;
  const first = [firstDate, firstResultDate].filter((d): d is string => !!d).sort()[0];
  const { keys, weekly } = buildBuckets(opts.range, now, first);
  if (keys.length === 0) return [];
  const index = new Map<string, number>();
  keys.forEach((k, i) => index.set(k, i));

  const sessionBuckets: CompletedSession[][] = keys.map(() => []);
  const resultBuckets: ExerciseResult[][] = keys.map(() => []);
  for (const s of sessions) {
    const i = index.get(bucketKeyFor(sessionDates.get(s.id)!, weekly));
    if (i !== undefined) sessionBuckets[i].push(s);
  }
  for (const r of results) {
    const i = index.get(bucketKeyFor(resultDateKey(r, sessionDates), weekly));
    if (i !== undefined) resultBuckets[i].push(r);
  }

  const countMetric = opts.metric === "sessions" || opts.metric === "minutes" || opts.metric === "throws" || opts.metric === "catches";
  return keys.map((date, i) => {
    const ss = sessionBuckets[i];
    const rs = resultBuckets[i];
    let value: number | null = null;
    switch (opts.metric) {
      case "sessions":
        value = ss.length;
        break;
      case "minutes":
        value = ss.reduce((sum, s) => sum + Math.max(0, s.actualMinutes || 0), 0);
        break;
      case "throws":
        value = ss.reduce((sum, s) => sum + Math.max(0, s.throws || 0), 0);
        break;
      case "catches":
        value = ss.reduce((sum, s) => sum + Math.max(0, s.catches || 0), 0);
        break;
      case "accuracy":
        value = weightedRatio(rs.filter((r) => r.metricType === "ratio" && THROW_ACCURACY_KEYS.includes(r.metricKey))).pct ?? null;
        break;
      case "backhand":
        value = weightedRatio(rs.filter((r) => r.metricKey === "backhand_accuracy")).pct ?? null;
        break;
      case "forehand":
        value = weightedRatio(rs.filter((r) => r.metricKey === "forehand_accuracy")).pct ?? null;
        break;
      case "hammer":
        value = weightedRatio(rs.filter((r) => r.metricKey === "hammer_accuracy")).pct ?? null;
        break;
      case "distance":
        value = best(keyValues(rs, "longest_throw_m"), "higher") ?? null;
        break;
      case "sprint":
        value = best(keyValues(rs, "sprint_time_s"), "lower") ?? null;
        break;
    }
    if (countMetric && value === null) value = 0;
    return { date, value, label: shortLabel(date) };
  });
}

/* ------------------------------------------------------------------ */
/* Session comparison                                                  */
/* ------------------------------------------------------------------ */

export interface SessionComparison {
  key: string;
  label: Localized;
  current?: number;
  previous?: number;
  delta?: number;
  /** true/false when a direction applies and the values differ; undefined when equal, neutral or missing. */
  better?: boolean;
}

const SESSION_FIELDS: { key: keyof CompletedSession; label: Localized; direction?: "higher" | "lower" }[] = [
  { key: "actualMinutes", label: { he: "דקות אימון", en: "Training minutes" } },
  { key: "exercisesCompleted", label: { he: "תרגילים שהושלמו", en: "Exercises completed" }, direction: "higher" },
  { key: "throws", label: { he: "זריקות", en: "Throws" }, direction: "higher" },
  { key: "catches", label: { he: "תפיסות", en: "Catches" }, direction: "higher" },
  { key: "accuracyPct", label: { he: "דיוק כללי", en: "Overall accuracy" }, direction: "higher" },
  { key: "backhandAccuracy", label: { he: "דיוק Backhand", en: "Backhand accuracy" }, direction: "higher" },
  { key: "forehandAccuracy", label: { he: "דיוק Forehand", en: "Forehand accuracy" }, direction: "higher" },
  { key: "hammerAccuracy", label: { he: "דיוק Hammer", en: "Hammer accuracy" }, direction: "higher" },
];

function numOrUndefined(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function compareValues(key: string, label: Localized, current?: number, previous?: number, direction?: "higher" | "lower"): SessionComparison | null {
  if (current === undefined && previous === undefined) return null;
  const item: SessionComparison = { key, label };
  if (current !== undefined) item.current = current;
  if (previous !== undefined) item.previous = previous;
  if (current !== undefined && previous !== undefined) {
    item.delta = round1(current - previous);
    if (direction && item.delta !== 0) item.better = direction === "higher" ? item.delta > 0 : item.delta < 0;
  }
  return item;
}

export function compareToPrevious(current: CompletedSession, previous?: CompletedSession): SessionComparison[] {
  const out: SessionComparison[] = [];
  for (const f of SESSION_FIELDS) {
    const item = compareValues(f.key, f.label, numOrUndefined(current[f.key]), previous ? numOrUndefined(previous[f.key]) : undefined, f.direction);
    if (item) out.push(item);
  }
  const keys = new Set<MetricKey>([
    ...(Object.keys(current.roleMetrics ?? {}) as MetricKey[]),
    ...(Object.keys(previous?.roleMetrics ?? {}) as MetricKey[]),
  ]);
  for (const key of keys) {
    const item = compareValues(key, METRIC_LABELS[key] ?? { he: key, en: key }, numOrUndefined(current.roleMetrics?.[key]), numOrUndefined(previous?.roleMetrics?.[key]), metricDirection(key));
    if (item) out.push(item);
  }
  return out;
}
