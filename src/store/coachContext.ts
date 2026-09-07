/**
 * Builds the compact, privacy-filtered CoachContext the client sends with every coach call.
 * Honours settings.aiDataSharing:
 *   profile  false → no profile block (only a role/level hint so advice stays relevant), never the name
 *   results  false → no stats numbers, no personal bests, no weekly load
 *   history  false → no recent sessions
 *   notes    false → session notes stripped
 * Bounded: at most 5 recent sessions, notes truncated to 140 chars, at most 8 key metrics per session.
 * Pure: no React, no browser APIs.
 */
import type { CoachContext, CompletedSession, MetricKey, TrainingPlan, TrainingWeek } from "@/lib/types";
import type { AppState, CollectionName, CollectionTypes } from "@/store/appStore";
import { pick } from "@/lib/localized";
import { toDateKey } from "@/lib/dates";
import { computeStats } from "@/engine/stats";
import { computeReadiness, readinessScores } from "@/engine/readiness";

export const COACH_CONTEXT_MAX_SESSIONS = 5;
export const COACH_CONTEXT_NOTE_MAX = 140;
export const COACH_CONTEXT_MAX_KEY_METRICS = 8;

export type CoachContextState = Pick<AppState, "profile" | "settings" | "collections" | "activeSession">;

export interface CoachContextOptions {
  now?: Date;
  /** Upper bound for recent sessions (capped at COACH_CONTEXT_MAX_SESSIONS). */
  maxSessions?: number;
}

function records<K extends CollectionName>(state: CoachContextState, name: K): CollectionTypes[K][] {
  const col = state.collections?.[name] ?? {};
  return Object.values(col).filter((r) => !(r as { deletedAt?: string | null }).deletedAt) as CollectionTypes[K][];
}

export function truncateNote(note: string | undefined, max = COACH_CONTEXT_NOTE_MAX): string | undefined {
  if (!note) return undefined;
  const clean = note.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function sessionDate(s: CompletedSession): string {
  const d = new Date(s.completedAt || s.startedAt);
  return Number.isNaN(d.getTime()) ? "1970-01-01" : toDateKey(d);
}

function keyMetrics(s: CompletedSession): Partial<Record<MetricKey, number>> {
  const out: Partial<Record<MetricKey, number>> = {};
  let n = 0;
  for (const [k, v] of Object.entries(s.roleMetrics ?? {}) as [MetricKey, number][]) {
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    out[k] = Math.round(v * 10) / 10;
    n += 1;
    if (n >= COACH_CONTEXT_MAX_KEY_METRICS) break;
  }
  return out;
}

function currentPlan(state: CoachContextState, now: Date): CoachContext["currentPlan"] | undefined {
  const plans = records(state, "trainingPlans").filter((p) => p.status === "active");
  if (plans.length === 0) return undefined;
  const plan: TrainingPlan = plans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const weeks = records(state, "trainingWeeks").filter((w) => w.planId === plan.id).sort((a, b) => a.index - b.index);
  const today = toDateKey(now);
  let week: TrainingWeek | undefined;
  for (const w of weeks) if (w.startDate <= today) week = w;
  if (!week) week = weeks[0];
  return {
    weekIndex: week ? week.index : 0,
    weeksCount: plan.weeksCount,
    weekTheme: week ? pick(week.theme, state.settings.locale) : pick(plan.title, state.settings.locale),
    role: plan.role,
  };
}

export function buildCoachContext(state: CoachContextState, opts: CoachContextOptions = {}): CoachContext {
  const now = opts.now ?? new Date();
  const settings = state.settings;
  const sharing = settings.aiDataSharing ?? { profile: true, results: true, history: true, notes: true };
  const locale = settings.locale ?? "he";
  const profile = state.profile;
  const ctx: CoachContext = { locale };

  if (profile) {
    if (sharing.profile) {
      const p: NonNullable<CoachContext["profile"]> = {
        ageGroup: profile.ageGroup,
        hand: profile.hand,
        level: profile.level,
        yearsPlaying: profile.yearsPlaying,
        primaryRole: profile.primaryRole,
        roleIntent: profile.roleIntent,
        goals: [...(profile.goals ?? [])].sort((a, b) => a.priority - b.priority).map((g) => g.goal).slice(0, 5),
        participants: profile.participants,
        equipment: profile.equipment ?? [],
        fieldSize: profile.fieldSize,
        wind: profile.wind,
        durationMinutes: profile.durationMinutes,
        sessionsPerWeek: profile.sessionsPerWeek,
        includeFitness: profile.includeFitness,
      };
      const name = (profile.name ?? "").trim();
      if (name) p.name = name.slice(0, 40);
      if (profile.secondaryRole) p.secondaryRole = profile.secondaryRole;
      ctx.profile = p;
    } else {
      ctx.roleHint = profile.secondaryRole
        ? { primaryRole: profile.primaryRole, secondaryRole: profile.secondaryRole, level: profile.level }
        : { primaryRole: profile.primaryRole, level: profile.level };
    }
  }

  const completedSessions = records(state, "completedSessions").sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const exerciseResults = records(state, "exerciseResults");
  const personalBests = records(state, "personalBests");
  const plannedSessions = records(state, "plannedSessions");

  if (sharing.results) {
    const stats = computeStats({ completedSessions, exerciseResults, personalBests, plannedSessions, xpEvents: records(state, "xpEvents"), now });
    const readiness = computeReadiness({ results: exerciseResults, completedSessions, personalBests, profile: profile ? { level: profile.level, ageGroup: profile.ageGroup } : undefined });
    const s: NonNullable<CoachContext["stats"]> = {
      sessionsCompleted: stats.sessions,
      totalMinutes: stats.totalMinutes,
      totalThrows: stats.totalThrows,
      totalCatches: stats.totalCatches,
      streakDays: stats.currentStreak,
      level: stats.level.level,
      weakSkills: stats.weakSkills,
      strongSkills: stats.strongSkills,
      readiness: readinessScores(readiness),
    };
    if (stats.backhandAccuracy !== undefined) s.backhandAccuracy = stats.backhandAccuracy;
    if (stats.forehandAccuracy !== undefined) s.forehandAccuracy = stats.forehandAccuracy;
    if (stats.hammerAccuracy !== undefined) s.hammerAccuracy = stats.hammerAccuracy;
    if (stats.longestThrowM !== undefined) s.longestThrowM = stats.longestThrowM;
    if (stats.bestCatchStreak !== undefined) s.catchStreak = stats.bestCatchStreak;
    if (stats.bestSprintTimeS !== undefined) s.sprintTimeS = stats.bestSprintTimeS;
    if (stats.bestCodTimeS !== undefined) s.codTimeS = stats.bestCodTimeS;
    ctx.stats = s;
    ctx.weeklyLoad = { sessionsThisWeek: stats.sessionsThisWeek, minutesThisWeek: stats.minutesThisWeek, plannedThisWeek: stats.plannedThisWeek };
    if (personalBests.length > 0) {
      const pbs: Partial<Record<MetricKey, number>> = {};
      for (const pb of personalBests) if (Number.isFinite(pb.value)) pbs[pb.key] = pb.value;
      ctx.personalBests = pbs;
    }
  }

  if (sharing.history) {
    const max = Math.max(0, Math.min(COACH_CONTEXT_MAX_SESSIONS, opts.maxSessions ?? COACH_CONTEXT_MAX_SESSIONS));
    ctx.recentSessions = completedSessions.slice(0, max).map((s) => {
      const item: NonNullable<CoachContext["recentSessions"]>[number] = {
        date: sessionDate(s),
        title: pick(s.workoutTitle, locale).slice(0, 80),
        minutes: Math.max(0, Math.round(s.actualMinutes || 0)),
        role: s.role,
        keyMetrics: sharing.results ? keyMetrics(s) : {},
      };
      if (sharing.results) {
        if (s.accuracyPct !== undefined) item.accuracyPct = s.accuracyPct;
        if (s.backhandAccuracy !== undefined) item.backhandAccuracy = s.backhandAccuracy;
        if (s.forehandAccuracy !== undefined) item.forehandAccuracy = s.forehandAccuracy;
      }
      if (s.difficulty !== undefined) item.difficulty = s.difficulty;
      if (s.feeling !== undefined) item.feeling = s.feeling;
      if (sharing.notes) {
        const note = truncateNote(s.note);
        if (note) item.note = note;
      }
      return item;
    });
  }

  const plan = currentPlan(state, now);
  if (plan) ctx.currentPlan = plan;

  const checkin = state.activeSession?.checkin;
  if (checkin) {
    ctx.checkin = { feeling: checkin.feeling, energy: checkin.energy, pain: checkin.pain, surface: checkin.surface, wind: checkin.wind };
  }

  return ctx;
}
