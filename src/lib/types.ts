/**
 * DiscCoach – shared domain types.
 * This file is the contract between content, engines, store, server and UI.
 * Keep it dependency-free (types + tiny constants only).
 */

export type Locale = "he" | "en";
/** Every user-facing string that lives in data is localized. */
export type Localized = { he: string; en: string };

/* ------------------------------------------------------------------ */
/* Enumerations                                                        */
/* ------------------------------------------------------------------ */

export const ROLES = ["wing", "runner", "defender", "handler", "cutter", "hybrid", "allround"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_INTENTS = ["current", "learning", "future", "temporary", "unsure"] as const;
export type RoleIntent = (typeof ROLE_INTENTS)[number];

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

/** kid: under 13, teen: 13–17, adult: 18–49, senior: 50+ */
export const AGE_GROUPS = ["kid", "teen", "adult", "senior"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const HANDS = ["right", "left", "both"] as const;
export type Hand = (typeof HANDS)[number];

export const YEARS_PLAYING = ["new", "under1", "1to3", "over3"] as const;
export type YearsPlaying = (typeof YEARS_PLAYING)[number];

export const PLAY_CONTEXTS = ["fun", "training", "team"] as const;
export type PlayContext = (typeof PLAY_CONTEXTS)[number];

export const PARTICIPANTS = ["solo", "pair", "group"] as const;
export type Participants = (typeof PARTICIPANTS)[number];

/** "no extra equipment" is represented by an empty array (a disc is always assumed). */
export const EQUIPMENT = ["disc", "discs", "cones", "target", "ladder", "stopwatch", "wall", "field_lines"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const FIELD_SIZES = ["small", "medium", "large", "indoor", "park", "beach", "yard"] as const;
export type FieldSize = (typeof FIELD_SIZES)[number];

export const WINDS = ["none", "light", "medium", "strong", "unknown"] as const;
export type Wind = (typeof WINDS)[number];

export const DURATIONS = [90, 105, 120] as const;
export type Duration = (typeof DURATIONS)[number];

export const INTENSITIES = ["low", "medium", "high"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const GOALS = [
  "backhand", "forehand", "hammer", "deep_throws", "short_throws", "accuracy", "distance", "release_speed",
  "catching", "one_hand_catch", "catch_running", "catch_pressure", "pivot_footwork", "change_of_direction",
  "speed", "acceleration", "agility", "endurance", "defense", "marking", "field_vision", "decision_making",
  "game_prep", "general",
] as const;
export type Goal = (typeof GOALS)[number];

/** Skill tags used on exercises, results, readiness and plans. */
export const SKILLS = [
  "backhand", "forehand", "hammer", "deep_throws", "short_throws", "accuracy", "distance", "release_speed",
  "catching", "catch_moving", "catch_pressure", "one_hand_catch", "pivot", "fakes", "break_throws", "footwork",
  "change_of_direction", "speed", "acceleration", "agility", "endurance", "defense", "marking", "mirror",
  "reaction", "cutting", "timing", "separation", "field_vision", "decision_making", "give_and_go", "width",
  "deep_runs", "transition", "communication", "warmup", "cooldown", "mobility", "strength", "wind",
] as const;
export type Skill = (typeof SKILLS)[number];

export const PHASE_TYPES = ["checkin", "warmup", "throwing", "movement", "role", "game", "challenge", "cooldown"] as const;
export type PhaseType = (typeof PHASE_TYPES)[number];

export const EXERCISE_CATEGORIES = ["warmup", "throwing", "catching", "movement", "defense", "position", "game", "challenge", "cooldown", "fitness"] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const OFFENSE_DEFENSE = ["offense", "defense", "both"] as const;
export type OffenseDefense = (typeof OFFENSE_DEFENSE)[number];

export const WIND_SUITABILITY = ["any", "calm_only", "wind_ok", "wind_focus"] as const;
export type WindSuitability = (typeof WIND_SUITABILITY)[number];

/** Keys under which measured results are stored. Readiness and PBs are computed from these. */
export const METRIC_KEYS = [
  "backhand_accuracy", "forehand_accuracy", "hammer_accuracy", "throw_accuracy", "deep_throw_accuracy",
  "short_throw_accuracy", "break_throw_pct", "swing_pass_pct", "quick_release_pct", "catch_release_pct",
  "longest_throw_m", "catch_streak", "catch_pct", "catch_moving_pct", "catch_pressure_pct", "one_hand_catch_pct",
  "sprint_time_s", "cod_time_s", "t_drill_time_s", "agility_time_s", "lateral_shuffle_time_s", "recovery_sprint_time_s",
  "repeat_sprint_drop_pct", "course_time_s", "endurance_score", "mirror_score", "reaction_score", "marking_score",
  "pivot_score", "decision_score", "cut_timing_score", "separation_score", "deep_run_success_pct", "fake_score",
  "throw_count", "catch_count", "error_free_streak", "confidence_rating",
  "wing_challenge_score", "runner_challenge_score", "defender_challenge_score", "handler_challenge_score",
  "cutter_challenge_score", "hybrid_challenge_score",
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

/**
 * ratio: successes/attempts → percent. time_s: seconds, lower is better. distance_m: higher is better.
 * count / streak: higher is better. rating: 1–5 self-rating. score: 0–100 computed from a drill's own rules.
 */
export type MetricType = "ratio" | "time_s" | "distance_m" | "count" | "streak" | "rating" | "score";

/* ------------------------------------------------------------------ */
/* Exercise catalog                                                    */
/* ------------------------------------------------------------------ */

export type DiagramItem =
  | { type: "cone" | "player" | "partner" | "defender" | "target" | "disc" | "gate" | "marker"; x: number; y: number; label?: string }
  | { type: "run" | "throw" | "shuffle"; from: [number, number]; to: [number, number]; curve?: boolean; dashed?: boolean; label?: string };

/** Coordinates are percentages (0–100) of the drawn area. */
export interface DiagramSpec {
  field: "lane" | "square" | "half" | "strip";
  items: DiagramItem[];
}

export interface SuccessMetric {
  type: MetricType;
  key: MetricKey;
  label: Localized;
  /** Target value that counts as "success" for this drill (percent for ratio, seconds for time, etc.). */
  target?: number;
  /** Default number of attempts for ratio metrics (e.g. 10 throws). */
  attempts?: number;
}

export interface Exercise {
  id: string;
  name: Localized;
  category: ExerciseCategory;
  /** Primary skill first. */
  skills: Skill[];
  /** Roles this drill serves best. Empty = suits everyone. */
  roles: Role[];
  /** Levels the drill is appropriate for. */
  levels: Level[];
  /** Which phases of a workout this drill can fill. */
  phases: PhaseType[];
  goal: Localized;
  /** Modes in which the drill can be run as written. */
  participants: Participants[];
  /** Required equipment beyond one disc. */
  equipment: Equipment[];
  optionalEquipment?: Equipment[];
  /** Smallest field sizes that work. */
  fieldSizes: FieldSize[];
  intensity: Intensity;
  offenseDefense: OffenseDefense;
  wind: WindSuitability;
  /** Age groups that may do this drill as written (kids get lower loads through the engine). */
  ageGroups: AgeGroup[];
  durationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  sets: number;
  reps: number;
  /** 0 when the drill is continuous. */
  restSeconds: number;
  /** Optional work interval for timed drills. */
  workSeconds?: number;
  setup: Localized;
  instructions: Localized[];
  cues: Localized[];
  commonMistakes: Localized[];
  successMetric: SuccessMetric;
  easierVersion: Localized;
  harderVersion: Localized;
  /** How to run it alone. Text is required even when an alternative drill id is given. */
  soloAlternative: Localized;
  soloAlternativeId?: string;
  partnerAlternative: Localized;
  safetyNotes: Localized[];
  diagram: DiagramSpec;
  /** Approximate throws / catches per set, used for totals in summaries. */
  throwsPerSet?: number;
  catchesPerSet?: number;
}

/* ------------------------------------------------------------------ */
/* Workouts                                                            */
/* ------------------------------------------------------------------ */

export type WorkoutSource = "library" | "engine" | "claude" | "custom";

export interface WorkoutExercise {
  /** Instance id (unique inside a workout). */
  id: string;
  /** Catalog reference. Optional for Claude-authored drills that do not map to the catalog. */
  exerciseId?: string;
  name: Localized;
  durationMinutes: number;
  sets: number;
  reps: number;
  restSeconds: number;
  workSeconds?: number;
  instructions: Localized[];
  cues: Localized[];
  commonMistakes: Localized[];
  successMetric: SuccessMetric;
  easierAlternative: Localized;
  harderAlternative: Localized;
  soloAlternative: Localized;
  safetyNotes: Localized[];
  skills: Skill[];
  equipment: Equipment[];
  participants: Participants[];
  diagram?: DiagramSpec;
  throwsPerSet?: number;
  catchesPerSet?: number;
}

export interface WorkoutPhase {
  id: string;
  type: PhaseType;
  name: Localized;
  durationMinutes: number;
  goal: Localized;
  exercises: WorkoutExercise[];
}

export interface Workout {
  id: string;
  source: WorkoutSource;
  title: Localized;
  goal: Localized;
  targetRole: Role;
  secondaryRole?: Role;
  level: Level;
  totalDurationMinutes: number;
  intensity: Intensity;
  participants: Participants;
  fieldSize: FieldSize;
  requiredEquipment: Equipment[];
  coachMessage: Localized;
  /** Free-form tags used by the library filters (e.g. "wind", "pre_game", "solo"). */
  tags: string[];
  phases: WorkoutPhase[];
  expectedMetrics: MetricKey[];
  includesFitness: boolean;
  includesChallenge: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** Inputs for both the local engine and the Claude generator. */
export interface WorkoutRequest {
  durationMinutes: Duration;
  role: Role;
  secondaryRole?: Role;
  primaryGoal: Goal;
  secondaryGoal?: Goal;
  intensity: Intensity;
  participants: Participants;
  equipment: Equipment[];
  fieldSize: FieldSize;
  wind: Wind;
  includeFitness: boolean;
  includeChallenge: boolean;
  excludedSkills: Skill[];
  energy: 1 | 2 | 3 | 4 | 5;
  level: Level;
  ageGroup: AgeGroup;
  hand: Hand;
  /** Exercise ids used recently; the engine avoids repeating them when alternatives exist. */
  recentExerciseIds?: string[];
  /** Skills the stats engine flagged as weak; get extra weight. */
  weakSkills?: Skill[];
  /** Optional seed for deterministic generation. */
  seed?: string;
  /** Template of the session inside a plan week. */
  templateType?: SessionTemplateType;
}

export type SessionTemplateType = "technique" | "movement_role" | "game_challenge" | "recovery" | "mixed";

/* ------------------------------------------------------------------ */
/* Training plan                                                       */
/* ------------------------------------------------------------------ */

export type PlannedSessionStatus = "planned" | "started" | "completed" | "postponed" | "cancelled" | "replaced";

export interface PlannedSession {
  id: string;
  planId: string;
  weekId: string;
  weekIndex: number;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** HH:mm */
  time: string;
  durationMinutes: number;
  workoutId: string;
  title: Localized;
  role: Role;
  intensity: Intensity;
  goals: Skill[];
  templateType: SessionTemplateType;
  status: PlannedSessionStatus;
  completedSessionId?: string;
  /** Marked by the user as a rest day (no session). */
  restDay?: boolean;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TrainingWeek {
  id: string;
  planId: string;
  index: number;
  startDate: string;
  goal: Localized;
  theme: Localized;
  focusSkills: Skill[];
  improvementMetric: MetricKey;
  challengeId: string;
  /** Suggested recovery day (0–6). */
  restDay: number;
  sessionIds: string[];
  totalMinutes: number;
  /** Volume multiplier relative to week 1 (progressive overload / deload). */
  loadFactor: number;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TrainingPlan {
  id: string;
  title: Localized;
  summary: Localized;
  role: Role;
  secondaryRole?: Role;
  level: Level;
  weeksCount: number;
  sessionsPerWeek: number;
  durationMinutes: Duration;
  startDate: string;
  status: "active" | "completed" | "archived";
  weekIds: string[];
  /** Human-readable notes about how the plan was adapted (role change, results…). */
  adaptationNotes: { at: string; note: Localized }[];
  source: "engine" | "claude";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/* ------------------------------------------------------------------ */
/* Sessions & results                                                  */
/* ------------------------------------------------------------------ */

export interface PreSessionCheckin {
  feeling: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  pain: "none" | "mild" | "sharp";
  painNote?: string;
  surface: "dry" | "wet";
  wind: Wind;
  participants: Participants;
  equipmentAvailable: boolean;
  missingEquipment?: Equipment[];
  recordedAt: string;
}

export interface ExerciseResult {
  id: string;
  sessionId: string;
  workoutId: string;
  /** Instance id inside the workout. */
  workoutExerciseId: string;
  exerciseId?: string;
  exerciseName: Localized;
  phaseType: PhaseType;
  metricKey: MetricKey;
  metricType: MetricType;
  successes?: number;
  attempts?: number;
  /** Derived: successes/attempts*100 (stored for fast stats). */
  accuracyPct?: number;
  timeSeconds?: number;
  distanceMeters?: number;
  count?: number;
  streak?: number;
  rating?: number;
  score?: number;
  errors?: number;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  windy?: boolean;
  tired?: boolean;
  throws?: number;
  catches?: number;
  skills: Skill[];
  role?: Role;
  recordedAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SessionMode = "checkin" | "work" | "rest" | "paused" | "results" | "finished";

export interface TimerState {
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  /** ISO timestamp of the last tick applied to remainingSeconds. */
  lastTickAt: string | null;
}

export interface ReplacementLog {
  at: string;
  phaseId: string;
  fromExerciseId?: string;
  fromName: Localized;
  toExerciseId?: string;
  toName: Localized;
  reason: "too_easy" | "too_hard" | "no_equipment" | "alone" | "pain" | "other";
}

export interface ActiveSession {
  id: string;
  workoutId: string;
  /** Snapshot: replacements and edits apply here without changing the source workout. */
  workout: Workout;
  plannedSessionId?: string;
  planId?: string;
  startedAt: string;
  phaseIndex: number;
  exerciseIndex: number;
  setIndex: number;
  mode: SessionMode;
  timer: TimerState;
  /** Seconds of active (non-paused) time so far. */
  elapsedSeconds: number;
  checkin?: PreSessionCheckin;
  results: ExerciseResult[];
  replacements: ReplacementLog[];
  skippedExerciseIds: string[];
  completedExerciseIds: string[];
  updatedAt: string;
}

export interface CompletedSession {
  id: string;
  workoutId: string;
  workoutTitle: Localized;
  source: WorkoutSource;
  plannedSessionId?: string;
  planId?: string;
  role: Role;
  secondaryRole?: Role;
  startedAt: string;
  completedAt: string;
  plannedMinutes: number;
  actualMinutes: number;
  phasesCount: number;
  exercisesCount: number;
  exercisesCompleted: number;
  throws: number;
  catches: number;
  accuracyPct?: number;
  backhandAccuracy?: number;
  forehandAccuracy?: number;
  hammerAccuracy?: number;
  roleMetrics: Partial<Record<MetricKey, number>>;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  feeling?: 1 | 2 | 3 | 4 | 5;
  note?: string;
  xpEarned: number;
  newAchievementIds: string[];
  newPersonalBestKeys: MetricKey[];
  checkin?: PreSessionCheckin;
  replacements: ReplacementLog[];
  skillsTrained: Skill[];
  aiSummary?: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PersonalBest {
  /** id === key */
  id: MetricKey;
  key: MetricKey;
  value: number;
  metricType: MetricType;
  sessionId: string;
  achievedAt: string;
  previousValue?: number;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BaselineTest {
  id: string;
  takenAt: string;
  results: Partial<Record<MetricKey, number>>;
  /** 1–5 self-confidence per throw type. */
  confidence: Partial<Record<"backhand" | "forehand" | "hammer" | "deep" | "short", number>>;
  role: Role;
  participants: Participants;
  summary: Localized;
  updatedAt: string;
  deletedAt?: string | null;
}

/* ------------------------------------------------------------------ */
/* Gamification                                                        */
/* ------------------------------------------------------------------ */

export interface XpEvent {
  id: string;
  amount: number;
  reason: "session" | "exercise_result" | "challenge" | "achievement" | "personal_best" | "baseline" | "onboarding";
  refId?: string;
  at: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ChallengePeriod = "daily" | "weekly";

export interface ChallengeDefinition {
  id: string;
  period: ChallengePeriod;
  title: Localized;
  description: Localized;
  /** What the challenge tracks. */
  metric:
    | { kind: "metric"; key: MetricKey; target: number; comparison: "gte" | "lte" }
    | { kind: "throws"; skill?: Skill; target: number }
    | { kind: "catch_streak"; target: number }
    | { kind: "sessions"; target: number; minMinutes?: number }
    | { kind: "exercise"; exerciseId: string }
    | { kind: "personal_best"; key: MetricKey }
    | { kind: "role_challenge"; role: Role };
  xp: number;
  badge: string;
  roles?: Role[];
  encouragement: Localized;
}

export interface UserChallenge {
  /** `${definitionId}:${periodKey}` */
  id: string;
  definitionId: string;
  period: ChallengePeriod;
  /** YYYY-MM-DD for daily, YYYY-Www for weekly */
  periodKey: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AchievementDefinition {
  id: string;
  title: Localized;
  description: Localized;
  icon: string;
  xp: number;
  condition:
    | { kind: "sessions"; count: number }
    | { kind: "throws"; count: number }
    | { kind: "catches"; count: number }
    | { kind: "hours"; count: number }
    | { kind: "streak_days"; count: number }
    | { kind: "accuracy"; key: MetricKey; pct: number; minAttempts: number }
    | { kind: "role_challenge"; role: Role }
    | { kind: "personal_best"; key: MetricKey }
    | { kind: "first_session" };
}

export interface UserAchievement {
  /** id === definition id */
  id: string;
  unlockedAt: string;
  sessionId?: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/* ------------------------------------------------------------------ */
/* Profile & settings                                                  */
/* ------------------------------------------------------------------ */

export interface GoalPriority {
  goal: Goal;
  /** 1 = most important */
  priority: number;
}

export interface RoleChange {
  at: string;
  fromRole?: Role;
  toRole: Role;
  fromSecondary?: Role;
  toSecondary?: Role;
  explanation: Localized;
}

export interface Profile {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  hand: Hand;
  heightCm?: number;
  level: Level;
  yearsPlaying: YearsPlaying;
  playContext: PlayContext;
  ultimateExperience: boolean;
  primaryRole: Role;
  secondaryRole?: Role;
  roleIntent: RoleIntent;
  goals: GoalPriority[];
  sessionsPerWeek: number;
  /** 0–6 */
  trainingDays: number[];
  /** HH:mm */
  preferredTime: string;
  durationMinutes: Duration;
  reminders: boolean;
  includeFitness: boolean;
  participants: Participants;
  equipment: Equipment[];
  fieldSize: FieldSize;
  wind: Wind;
  onboardingCompleted: boolean;
  baselineTestId?: string;
  /** Small data-URL avatar (optional). */
  avatar?: string;
  roleHistory: RoleChange[];
  createdAt: string;
  updatedAt: string;
}

export interface AiDataSharing {
  profile: boolean;
  results: boolean;
  history: boolean;
  notes: boolean;
}

export interface ReminderSettings {
  plannedSession: boolean;
  postponedSession: boolean;
  weeklySummary: boolean;
  weeklyChallenge: boolean;
  comebackAfterBreak: boolean;
  /** Minutes before the session. */
  leadMinutes: number;
}

export interface Settings {
  locale: Locale;
  theme: "system" | "light" | "dark";
  /** 1 = default, up to 1.3 */
  textScale: number;
  sound: boolean;
  vibration: boolean;
  voiceCount: boolean;
  keepAwake: boolean;
  highContrastSession: boolean;
  aiDataSharing: AiDataSharing;
  reminders: ReminderSettings;
  updatedAt: string;
}

export interface AuthState {
  mode: "guest" | "account";
  userId?: string;
  email?: string;
  role?: "user" | "admin";
  /** Random id for guests (rate limiting only; never personal). */
  guestId: string;
  lastSyncAt?: string;
}

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  /** Where the answer came from. */
  source?: "claude" | "template" | "cache" | "fallback";
  /** Structured actions the UI can offer after this answer. */
  actions?: ChatAction[];
}

export type ChatAction =
  | { type: "generate_workout"; label: Localized; request?: Partial<WorkoutRequest> }
  | { type: "start_workout"; label: Localized; workoutId: string }
  | { type: "add_to_plan"; label: Localized; workoutId: string }
  | { type: "save_exercise"; label: Localized; exerciseId: string }
  | { type: "replace_exercise"; label: Localized }
  | { type: "ask_more"; label: Localized; prompt: string };

export interface AiConversation {
  id: "coach";
  /** Rolling summary of older messages (kept short; sent to Claude instead of full history). */
  summary: string;
  /** Recent messages kept locally (bounded). */
  messages: ChatMessage[];
  updatedAt: string;
  deletedAt?: string | null;
}

export type AiAction = "chat" | "generate-workout" | "analyze-session" | "generate-plan" | "weekly-review" | "replace-exercise";

/** Compact, privacy-filtered context the client sends with every coach call. */
export interface CoachContext {
  locale: Locale;
  profile?: {
    name?: string;
    ageGroup: AgeGroup;
    hand: Hand;
    level: Level;
    yearsPlaying: YearsPlaying;
    primaryRole: Role;
    secondaryRole?: Role;
    roleIntent: RoleIntent;
    goals: Goal[];
    participants: Participants;
    equipment: Equipment[];
    fieldSize: FieldSize;
    wind: Wind;
    durationMinutes: Duration;
    sessionsPerWeek: number;
    includeFitness: boolean;
  };
  stats?: {
    sessionsCompleted: number;
    totalMinutes: number;
    totalThrows: number;
    totalCatches: number;
    streakDays: number;
    level: number;
    backhandAccuracy?: number;
    forehandAccuracy?: number;
    hammerAccuracy?: number;
    longestThrowM?: number;
    catchStreak?: number;
    sprintTimeS?: number;
    codTimeS?: number;
    weakSkills: Skill[];
    strongSkills: Skill[];
    readiness: Partial<Record<Role, number>>;
  };
  recentSessions?: {
    date: string;
    title: string;
    minutes: number;
    role: Role;
    accuracyPct?: number;
    backhandAccuracy?: number;
    forehandAccuracy?: number;
    difficulty?: number;
    feeling?: number;
    note?: string;
    keyMetrics: Partial<Record<MetricKey, number>>;
  }[];
  weeklyLoad?: { sessionsThisWeek: number; minutesThisWeek: number; plannedThisWeek: number };
  personalBests?: Partial<Record<MetricKey, number>>;
  currentPlan?: { weekIndex: number; weeksCount: number; weekTheme: string; role: Role };
  /** Today's check-in, when a session is active. */
  checkin?: Pick<PreSessionCheckin, "feeling" | "energy" | "pain" | "surface" | "wind">;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export interface AppNotification {
  id: string;
  kind: "planned_session" | "postponed_session" | "weekly_summary" | "weekly_challenge" | "comeback" | "achievement" | "personal_best" | "info";
  title: Localized;
  body: Localized;
  at: string;
  read: boolean;
  link?: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/* ------------------------------------------------------------------ */
/* Sync                                                                */
/* ------------------------------------------------------------------ */

/** Collections that are synced record-by-record to the server for account users. */
export const SYNCED_COLLECTIONS = [
  "workouts", "plannedSessions", "trainingWeeks", "trainingPlans", "completedSessions", "exerciseResults",
  "personalBests", "baselineTests", "xpEvents", "userChallenges", "userAchievements", "savedWorkouts",
  "favoriteExercises", "notifications", "aiConversations",
] as const;
export type SyncedCollection = (typeof SYNCED_COLLECTIONS)[number];

/** Singletons synced as a whole document. */
export const SYNCED_SINGLETONS = ["profile", "settings", "activeSession"] as const;
export type SyncedSingleton = (typeof SYNCED_SINGLETONS)[number];

export interface SyncRecord {
  collection: SyncedCollection | SyncedSingleton;
  id: string;
  updatedAt: string;
  deletedAt?: string | null;
  data: unknown;
}

export interface SavedWorkout {
  id: string;
  workoutId: string;
  savedAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FavoriteExercise {
  /** id === exerciseId */
  id: string;
  savedAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Build a Localized value from a single text (used for Claude-authored content). */
export function L(text: string, en?: string): Localized {
  return { he: text, en: en ?? text };
}

export const ROLE_LABELS: Record<Role, Localized> = {
  wing: { he: "כנף", en: "Wing" },
  runner: { he: "רץ", en: "Runner" },
  defender: { he: "מגן", en: "Defender" },
  handler: { he: "Handler", en: "Handler" },
  cutter: { he: "Cutter", en: "Cutter" },
  hybrid: { he: "היברידי", en: "Hybrid" },
  allround: { he: "כללי", en: "All-Around" },
};

export const LEVEL_TITLES: { level: number; title: Localized }[] = [
  { level: 1, title: { he: "Rookie", en: "Rookie" } },
  { level: 5, title: { he: "Disc Learner", en: "Disc Learner" } },
  { level: 10, title: { he: "Skilled Thrower", en: "Skilled Thrower" } },
  { level: 15, title: { he: "Field Player", en: "Field Player" } },
  { level: 20, title: { he: "Disc Master", en: "Disc Master" } },
  { level: 30, title: { he: "Elite Player", en: "Elite Player" } },
  { level: 40, title: { he: "Ultimate Expert", en: "Ultimate Expert" } },
  { level: 50, title: { he: "Frisbee Legend", en: "Frisbee Legend" } },
];
