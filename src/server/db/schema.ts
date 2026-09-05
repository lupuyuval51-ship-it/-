/**
 * DiscCoach – Drizzle (pg-core) schema. Works on PostgreSQL/Supabase and on embedded PGlite.
 *
 * Conventions
 * - snake_case table + column names, camelCase TS properties.
 * - Every user-owned synced table has: id, user_id, updated_at, deleted_at (soft delete), data (jsonb)
 *   and a composite primary key (user_id, id) because some ids are deterministic (metric keys, definition ids).
 * - Derived tables (role_preferences, goals, equipment, workout_phases, workout_exercises, progress_metrics)
 *   are recomputed server-side on sync; they are never the source of truth.
 *
 * This file must stay free of "@/…" imports so `drizzle-kit generate` can load it.
 */
import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

const tz = (name: string) => timestamp(name, { withTimezone: true });

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    /** Always stored lowercase + trimmed. */
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    role: text("role").$type<"user" | "admin">().notNull().default("user"),
    createdAt: tz("created_at").notNull().defaultNow(),
    lastLoginAt: tz("last_login_at"),
    deletedAt: tz("deleted_at"),
  },
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    /** sha256(token) – the raw token only ever lives in the cookie. */
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: tz("created_at").notNull().defaultNow(),
    expiresAt: tz("expires_at").notNull(),
    userAgent: text("user_agent"),
  },
  (t) => [index("auth_sessions_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Singletons (one document per user)                                  */
/* ------------------------------------------------------------------ */

const singletonColumns = () => ({
  userId: text("user_id").primaryKey(),
  data: jsonb("data"),
  updatedAt: tz("updated_at").notNull(),
  deletedAt: tz("deleted_at"),
});

export const profiles = pgTable("profiles", singletonColumns());
/** Maps to the "settings" singleton. */
export const appSettingsUser = pgTable("app_settings_user", singletonColumns());
export const activeSessions = pgTable("active_sessions", singletonColumns());
/** Maps to the "aiConversations" collection (one doc, id "coach"). */
export const aiConversationSummaries = pgTable("ai_conversation_summaries", singletonColumns());

/* ------------------------------------------------------------------ */
/* Derived from profile                                                */
/* ------------------------------------------------------------------ */

export const rolePreferences = pgTable("role_preferences", {
  userId: text("user_id").primaryKey(),
  primaryRole: text("primary_role").notNull(),
  secondaryRole: text("secondary_role"),
  intent: text("intent"),
  updatedAt: tz("updated_at").notNull(),
});

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    goal: text("goal").notNull(),
    priority: integer("priority").notNull(),
    updatedAt: tz("updated_at").notNull(),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const equipment = pgTable(
  "equipment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    item: text("item").notNull(),
    updatedAt: tz("updated_at").notNull(),
  },
  (t) => [index("equipment_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Synced collections                                                  */
/* ------------------------------------------------------------------ */

const syncedColumns = () => ({
  id: text("id").notNull(),
  userId: text("user_id").notNull(),
  updatedAt: tz("updated_at").notNull(),
  deletedAt: tz("deleted_at"),
  data: jsonb("data").notNull(),
});

function synced(name: string) {
  return pgTable(name, syncedColumns(), (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index(`${name}_user_updated_idx`).on(t.userId, t.updatedAt),
  ]);
}

export const trainingPlans = synced("training_plans");
export const trainingWeeks = synced("training_weeks");
export const plannedSessions = synced("planned_sessions");
/** Library additions by admins live here too, with user_id "library". */
export const workouts = synced("workouts");
export const personalBests = synced("personal_bests");
export const baselineTests = synced("baseline_tests");
export const xpEvents = synced("xp_events");
export const userChallenges = synced("user_challenges");
export const userAchievements = synced("user_achievements");
export const savedWorkouts = synced("saved_workouts");
export const favoriteExercises = synced("favorite_exercises");
export const notifications = synced("notifications");

export const completedSessions = pgTable(
  "completed_sessions",
  {
    ...syncedColumns(),
    completedAt: tz("completed_at"),
    minutes: integer("minutes"),
    role: text("role"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("completed_sessions_user_updated_idx").on(t.userId, t.updatedAt),
    index("completed_sessions_user_completed_idx").on(t.userId, t.completedAt),
  ],
);

export const exerciseResults = pgTable(
  "exercise_results",
  {
    ...syncedColumns(),
    sessionId: text("session_id"),
    metricKey: text("metric_key"),
    recordedAt: tz("recorded_at"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("exercise_results_user_updated_idx").on(t.userId, t.updatedAt),
    index("exercise_results_user_session_idx").on(t.userId, t.sessionId),
  ],
);

/* ------------------------------------------------------------------ */
/* Derived from workouts                                               */
/* ------------------------------------------------------------------ */

export const workoutPhases = pgTable(
  "workout_phases",
  {
    id: text("id").notNull(),
    workoutId: text("workout_id").notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.workoutId, t.id] }), index("workout_phases_workout_idx").on(t.userId, t.workoutId)],
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: text("id").notNull(),
    workoutId: text("workout_id").notNull(),
    phaseId: text("phase_id").notNull(),
    userId: text("user_id").notNull(),
    exerciseId: text("exercise_id"),
    durationMinutes: integer("duration_minutes").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.workoutId, t.id] }), index("workout_exercises_workout_idx").on(t.userId, t.workoutId)],
);

/* ------------------------------------------------------------------ */
/* Catalog overrides (admin)                                           */
/* ------------------------------------------------------------------ */

export const exerciseCatalog = pgTable("exercise_catalog", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  source: text("source").$type<"builtin" | "admin">().notNull().default("admin"),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: tz("updated_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Server-side rollups                                                 */
/* ------------------------------------------------------------------ */

export const progressMetrics = pgTable("progress_metrics", {
  userId: text("user_id").primaryKey(),
  sessions: integer("sessions").notNull().default(0),
  minutes: integer("minutes").notNull().default(0),
  throws: integer("throws").notNull().default(0),
  catches: integer("catches").notNull().default(0),
  lastSessionAt: tz("last_session_at"),
  updatedAt: tz("updated_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

export const aiGeneratedWorkouts = pgTable(
  "ai_generated_workouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    requestHash: text("request_hash").notNull(),
    data: jsonb("data").notNull(),
    createdAt: tz("created_at").notNull().defaultNow(),
  },
  (t) => [index("ai_generated_workouts_user_idx").on(t.userId, t.createdAt)],
);

export type AiRequestStatus = "ok" | "cached" | "template" | "fallback" | "error" | "rate_limited";

/** One row per coach call. Never stores prompt or response content. */
export const aiRequestLogs = pgTable(
  "ai_request_logs",
  {
    id: text("id").primaryKey(),
    at: tz("at").notNull().defaultNow(),
    action: text("action").notNull(),
    userId: text("user_id"),
    guestHash: text("guest_hash"),
    ipHash: text("ip_hash"),
    status: text("status").$type<AiRequestStatus>().notNull(),
    latencyMs: integer("latency_ms").notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    model: text("model"),
    errorCode: text("error_code"),
    jsonValid: boolean("json_valid"),
    cacheHit: boolean("cache_hit").notNull().default(false),
  },
  (t) => [index("ai_request_logs_at_idx").on(t.at), index("ai_request_logs_action_idx").on(t.action, t.at)],
);

export const aiCache = pgTable(
  "ai_cache",
  {
    key: text("key").primaryKey(),
    action: text("action").notNull(),
    response: jsonb("response").notNull(),
    createdAt: tz("created_at").notNull().defaultNow(),
    expiresAt: tz("expires_at").notNull(),
    hits: integer("hits").notNull().default(0),
  },
  (t) => [index("ai_cache_expires_idx").on(t.expiresAt)],
);

export const aiAbuseBlocks = pgTable("ai_abuse_blocks", {
  subject: text("subject").primaryKey(),
  reason: text("reason"),
  createdAt: tz("created_at").notNull().defaultNow(),
  until: tz("until").notNull(),
});

/** Runtime settings edited by admins (override env at runtime). */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: tz("updated_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export type SyncedTable = typeof workouts | typeof completedSessions | typeof exerciseResults;
export type SingletonTable = typeof profiles;

export type CollectionTableEntry =
  | { kind: "collection"; table: SyncedTable }
  /** One row per user; `fixedId` is the record id the client uses for it. */
  | { kind: "singleton"; table: SingletonTable; fixedId: string };

/** Maps every SyncedCollection / SyncedSingleton name (src/lib/types.ts) to its table. */
export const COLLECTION_TABLES = {
  workouts: { kind: "collection", table: workouts },
  plannedSessions: { kind: "collection", table: plannedSessions },
  trainingWeeks: { kind: "collection", table: trainingWeeks },
  trainingPlans: { kind: "collection", table: trainingPlans },
  completedSessions: { kind: "collection", table: completedSessions },
  exerciseResults: { kind: "collection", table: exerciseResults },
  personalBests: { kind: "collection", table: personalBests },
  baselineTests: { kind: "collection", table: baselineTests },
  xpEvents: { kind: "collection", table: xpEvents },
  userChallenges: { kind: "collection", table: userChallenges },
  userAchievements: { kind: "collection", table: userAchievements },
  savedWorkouts: { kind: "collection", table: savedWorkouts },
  favoriteExercises: { kind: "collection", table: favoriteExercises },
  notifications: { kind: "collection", table: notifications },
  aiConversations: { kind: "singleton", table: aiConversationSummaries, fixedId: "coach" },
  profile: { kind: "singleton", table: profiles, fixedId: "profile" },
  settings: { kind: "singleton", table: appSettingsUser, fixedId: "settings" },
  activeSession: { kind: "singleton", table: activeSessions, fixedId: "activeSession" },
} as const satisfies Record<string, CollectionTableEntry>;

export type CollectionKey = keyof typeof COLLECTION_TABLES;
export const COLLECTION_KEYS = Object.keys(COLLECTION_TABLES) as CollectionKey[];

/** Tables wiped on account deletion (everything keyed by user_id). */
export const USER_OWNED_TABLES = [
  authSessions, profiles, appSettingsUser, activeSessions, aiConversationSummaries, rolePreferences, goals, equipment,
  trainingPlans, trainingWeeks, plannedSessions, workouts, completedSessions, exerciseResults, personalBests, baselineTests,
  xpEvents, userChallenges, userAchievements, savedWorkouts, favoriteExercises, notifications, workoutPhases, workoutExercises,
  progressMetrics, aiGeneratedWorkouts,
] as const;
