/**
 * Achievement evaluation. Only recorded data unlocks an achievement; nothing is estimated.
 * `evaluateAchievements` returns only the achievements that are newly unlocked.
 */
import type { AchievementDefinition, ExerciseResult, MetricKey, Role, UserAchievement } from "@/lib/types";
import { ACHIEVEMENTS } from "@/content/achievements";
import type { StatsSnapshot } from "@/engine/stats";
import { resultValue, weightedRatio } from "@/engine/personalBests";

export interface AchievementProgress {
  /** Current measured value towards the target (same unit as `target`). */
  value: number;
  target: number;
  /** 0–100. */
  pct: number;
  /** False when nothing has been measured for this achievement yet. */
  hasData: boolean;
}

export function roleChallengeKey(role: Role): MetricKey {
  return role === "allround" ? "hybrid_challenge_score" : (`${role}_challenge_score` as MetricKey);
}

function live(results: ExerciseResult[]): ExerciseResult[] {
  return results.filter((r) => !r.deletedAt);
}

/** Weighted accuracy + attempts for an accuracy condition key (uses the snapshot's history-wide numbers when present). */
function accuracyFor(key: MetricKey, stats: StatsSnapshot, results: ExerciseResult[]): { pct?: number; attempts: number } {
  switch (key) {
    case "throw_accuracy":
      return { pct: stats.accuracyPct, attempts: stats.accuracyAttempts };
    case "backhand_accuracy":
      return { pct: stats.backhandAccuracy, attempts: stats.backhandAttempts };
    case "forehand_accuracy":
      return { pct: stats.forehandAccuracy, attempts: stats.forehandAttempts };
    case "hammer_accuracy":
      return { pct: stats.hammerAccuracy, attempts: stats.hammerAttempts };
    default: {
      const w = weightedRatio(live(results).filter((r) => r.metricType === "ratio" && r.metricKey === key));
      return { pct: w.pct, attempts: w.attempts };
    }
  }
}

function roleChallengeDone(role: Role, results: ExerciseResult[]): boolean {
  const key = roleChallengeKey(role);
  const exerciseId = `ch-role-${role}`;
  return live(results).some((r) => (r.metricKey === key && resultValue(r) !== undefined) || r.exerciseId === exerciseId);
}

/**
 * A "personal best" achievement is unlocked when the player improved on their own earlier measurement:
 * the best value recorded after the first measurement beats the first one (direction-aware).
 */
function personalBestImproved(key: MetricKey, results: ExerciseResult[]): { first?: number; best?: number; improved: boolean } {
  const measured = live(results)
    .filter((r) => r.metricKey === key)
    .map((r) => ({ at: r.recordedAt, value: resultValue(r) }))
    .filter((m): m is { at: string; value: number } => m.value !== undefined)
    .sort((a, b) => a.at.localeCompare(b.at));
  if (measured.length === 0) return { improved: false };
  const lower = key.endsWith("_time_s");
  const first = measured[0].value;
  let best = first;
  for (const m of measured.slice(1)) best = lower ? Math.min(best, m.value) : Math.max(best, m.value);
  const improved = measured.length > 1 && (lower ? best < first : best > first);
  return { first, best, improved };
}

function progressOf(value: number, target: number, hasData = true): AchievementProgress {
  const safeTarget = target > 0 ? target : 1;
  return { value, target, pct: Math.min(100, Math.max(0, Math.round((value / safeTarget) * 100))), hasData };
}

/** Progress towards an achievement from recorded data (for progress bars). */
export function achievementProgress(def: AchievementDefinition, stats: StatsSnapshot, results: ExerciseResult[]): AchievementProgress {
  const c = def.condition;
  switch (c.kind) {
    case "first_session":
      return progressOf(Math.min(1, stats.sessions), 1, stats.sessions > 0);
    case "sessions":
      return progressOf(stats.sessions, c.count, stats.sessions > 0);
    case "throws":
      return progressOf(stats.totalThrows, c.count, stats.totalThrows > 0);
    case "catches":
      return progressOf(stats.totalCatches, c.count, stats.totalCatches > 0);
    case "hours":
      return progressOf(Math.round((stats.totalMinutes / 60) * 10) / 10, c.count, stats.totalMinutes > 0);
    case "streak_days":
      return progressOf(Math.max(stats.currentStreak, stats.bestStreak), c.count, stats.sessions > 0);
    case "accuracy": {
      const a = accuracyFor(c.key, stats, results);
      if (a.pct === undefined || a.attempts === 0) return progressOf(0, c.minAttempts, false);
      // Progress is attempts towards the minimum; the percentage gate is checked separately.
      return progressOf(Math.min(a.attempts, c.minAttempts), c.minAttempts, true);
    }
    case "role_challenge":
      return progressOf(roleChallengeDone(c.role, results) ? 1 : 0, 1, roleChallengeDone(c.role, results));
    case "personal_best": {
      const pb = personalBestImproved(c.key, results);
      return progressOf(pb.improved ? 1 : 0, 1, pb.first !== undefined);
    }
    default:
      return progressOf(0, 1, false);
  }
}

/** True when the achievement's condition is met by the recorded data. */
export function achievementMet(def: AchievementDefinition, stats: StatsSnapshot, results: ExerciseResult[]): boolean {
  const c = def.condition;
  switch (c.kind) {
    case "first_session":
      return stats.sessions >= 1;
    case "sessions":
      return stats.sessions >= c.count;
    case "throws":
      return stats.totalThrows >= c.count;
    case "catches":
      return stats.totalCatches >= c.count;
    case "hours":
      return stats.totalMinutes / 60 >= c.count;
    case "streak_days":
      return Math.max(stats.currentStreak, stats.bestStreak) >= c.count;
    case "accuracy": {
      const a = accuracyFor(c.key, stats, results);
      return a.pct !== undefined && a.attempts >= c.minAttempts && a.pct >= c.pct;
    }
    case "role_challenge":
      return roleChallengeDone(c.role, results);
    case "personal_best":
      return personalBestImproved(c.key, results).improved;
    default:
      return false;
  }
}

/**
 * Evaluate all definitions against the snapshot and return the newly unlocked ones (not in `unlocked`).
 * `sessionId` is attached to the new records when the evaluation follows a session.
 */
export function evaluateAchievements(
  stats: StatsSnapshot,
  results: ExerciseResult[],
  unlocked: UserAchievement[],
  now: string,
  sessionId?: string,
  defs: AchievementDefinition[] = ACHIEVEMENTS,
): UserAchievement[] {
  const have = new Set(unlocked.filter((u) => !u.deletedAt).map((u) => u.id));
  const out: UserAchievement[] = [];
  for (const def of defs) {
    if (have.has(def.id)) continue;
    if (!achievementMet(def, stats, results)) continue;
    const record: UserAchievement = { id: def.id, unlockedAt: now, updatedAt: now, deletedAt: null };
    if (sessionId) record.sessionId = sessionId;
    out.push(record);
  }
  return out;
}
