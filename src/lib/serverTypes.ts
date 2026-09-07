/**
 * Request/response types shared by the API routes (src/app/api/**) and the client helpers (src/store/api.ts …).
 * Domain shapes come from ./types – nothing is redefined here.
 */
import type {
  AiAction, ChatAction, CoachContext, CompletedSession, Exercise, ExerciseResult, Locale, Skill, SyncRecord, Workout, WorkoutExercise,
  WorkoutRequest,
} from "./types";

/* ---------------- generic ---------------- */

export type ApiErrorCode =
  | "invalid_credentials" | "email_taken" | "invalid_email" | "weak_password" | "unauthorized" | "forbidden" | "rate_limited"
  | "csrf" | "validation" | "payload_too_large" | "not_found" | "internal" | "session_expired" | "maintenance" | "ai_unavailable"
  | "offline" | "timeout" | "bad_json";

export interface ApiErrorBody {
  ok: false;
  code: ApiErrorCode | string;
  /** Hebrew (or English when x-dc-locale: en) – safe to show as-is. */
  message: string;
  /** Present on 429 responses. */
  retryAfterSeconds?: number;
  /** Zod issue paths (validation errors only). */
  issues?: { path: string; message: string }[];
}

/* ---------------- auth ---------------- */

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  createdAt: string;
}

export interface RegisterRequest { email: string; password: string; name?: string }
export interface LoginRequest { email: string; password: string }
export interface AuthResponse { ok: true; user: PublicUser }
export interface MeResponse { ok: true; user: PublicUser | null }
export interface OkResponse { ok: true }

export interface ExportResponse {
  ok: true;
  exportedAt: string;
  user: PublicUser;
  profile: unknown;
  settings: unknown;
  activeSession: unknown;
  collections: Record<string, SyncRecord[]>;
}

/* ---------------- sync ---------------- */

export interface SyncPushRequest { records: SyncRecord[] }
export interface SyncPushResponse {
  ok: true;
  /** Keys `${collection}:${id}` that were stored. */
  accepted: string[];
  /** Server versions that were newer than what the client sent. */
  conflicts: SyncRecord[];
  /** Keys rejected as malformed (never retried by the client). */
  rejected: { key: string; reason: string }[];
  serverTime: string;
}
export interface SyncPullResponse {
  ok: true;
  records: SyncRecord[];
  nextCursor: string | null;
  serverTime: string;
}

/* ---------------- Claude ---------------- */

export type AiSource = "claude" | "template" | "cache" | "engine" | "fallback";

export interface ChatRequest {
  message: string;
  summary?: string;
  recent?: { role: "user" | "assistant"; content: string }[];
  context: CoachContext;
}
export interface ChatResponse {
  ok: true;
  reply: string;
  source: "claude" | "template" | "cache";
  actions: ChatAction[];
  summaryUpdate?: string;
}

export interface GenerateWorkoutRequest { request: WorkoutRequest; context: CoachContext }
export interface GenerateWorkoutResponse {
  ok: true;
  workout: Workout;
  source: "claude" | "cache" | "engine";
  /** Shown when the local engine had to step in. */
  notice?: string;
}

export interface AnalyzeSessionRequest {
  session: CompletedSession;
  results: ExerciseResult[];
  previous?: CompletedSession;
  context: CoachContext;
}
export interface AnalyzeSessionResponse { ok: true; summary: string; nextFocus: string[]; source: "claude" | "fallback" }

export interface GeneratePlanRequest { weeksCount: number; context: CoachContext; baselineSummary?: string }
export interface PlanWeekTheme { index: number; theme: string; goal: string; focusSkills: Skill[] }
export interface GeneratePlanResponse { ok: true; source: "claude" | "cache" | "engine"; weekThemes: PlanWeekTheme[]; coachMessage: string }

export interface WeeklyReviewRequest { weekSessions: CompletedSession[]; context: CoachContext }
export interface WeeklyAdjustment { kind: "intensity" | "rest" | "focus" | "volume"; note: string }
export interface WeeklyReviewResponse { ok: true; review: string; adjustments: WeeklyAdjustment[]; source: "claude" | "fallback" }

export interface ReplaceExerciseCandidate { id: string; name: string; skills: Skill[] }
export interface ReplaceExerciseRequest {
  exercise: WorkoutExercise;
  reason: string;
  context: CoachContext;
  candidates: ReplaceExerciseCandidate[];
}
export interface ReplaceExerciseResponse { ok: true; choiceId?: string; custom?: WorkoutExercise; rationale: string; source: "claude" | "cache" | "fallback" }

export interface AiRateLimitedBody extends ApiErrorBody { code: "rate_limited"; retryAfterSeconds: number }

/* ---------------- catalog / health ---------------- */

export interface CatalogOverridesResponse {
  ok: true;
  /** Admin-added exercises and admin-edited builtin exercises (full objects). */
  enabled: Exercise[];
  /** Builtin exercise ids an admin switched off. */
  disabledIds: string[];
  updatedAt: string;
}

export interface HealthResponse { ok: true; db: "pglite" | "postgres" | "error"; claudeConfigured: boolean; version: string; time: string }

/* ---------------- admin ---------------- */

export interface AdminActionStats {
  action: AiAction | string;
  calls: number;
  byStatus: Record<string, number>;
  avgLatencyMs: number;
  p95LatencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  jsonInvalid: number;
}
export interface AdminOverviewWindow {
  window: "24h" | "7d" | "30d";
  calls: number;
  byStatus: Record<string, number>;
  actions: AdminActionStats[];
  avgLatencyMs: number;
  p95LatencyMs: number;
  jsonInvalid: number;
  cacheHitRate: number;
  errorCodes: { code: string; count: number }[];
}
export interface AdminOverviewResponse {
  ok: true;
  windows: AdminOverviewWindow[];
  mostReplacedExercises: { exerciseId: string; name: string; count: number }[];
  activeUsers7d: number;
  usersTotal: number;
  claudeConfigured: boolean;
  model: string;
  generatedAt: string;
}

export interface AdminLogRow {
  id: string;
  at: string;
  action: string;
  userId: string | null;
  guestHash: string | null;
  status: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string | null;
  errorCode: string | null;
  jsonValid: boolean | null;
  cacheHit: boolean;
}
export interface AdminLogsResponse { ok: true; logs: AdminLogRow[]; nextCursor: string | null }

export interface AdminSettings {
  claude_model: string | null;
  ai_rate_limit_per_hour: number | null;
  ai_rate_limit_per_day: number | null;
  maintenance_notice: string | null;
}
export interface AdminSettingsResponse { ok: true; settings: AdminSettings; effective: { model: string; perHour: number; perDay: number; maintenanceNotice: string | null } }

export interface AdminExerciseRow { exercise: Exercise; source: "builtin" | "admin"; enabled: boolean; modified: boolean; updatedAt: string | null }
export interface AdminExercisesResponse { ok: true; exercises: AdminExerciseRow[] }

export interface AdminWorkoutsResponse { ok: true; workouts: Workout[] }

export interface AdminBlock { subject: string; reason: string | null; createdAt: string; until: string }
export interface AdminBlocksResponse { ok: true; blocks: AdminBlock[] }

export interface AdminUserRow { id: string; emailMasked: string; role: "user" | "admin"; createdAt: string; lastLoginAt: string | null; sessionsCount: number }
export interface AdminUsersResponse { ok: true; count: number; users: AdminUserRow[] }

export type { Locale };
