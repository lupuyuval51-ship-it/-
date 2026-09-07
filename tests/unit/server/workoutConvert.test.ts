import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeRequest, readJson, registerAccount, setupTestEnv } from "./helpers";
import { MANIFEST_EXERCISES } from "../fixtures/manifestExercises";
import type { Exercise, PhaseType, WorkoutRequest } from "@/lib/types";
import type { GenerateWorkoutResponse } from "@/lib/serverTypes";

const env = setupTestEnv("convert");

import { claudeWorkoutOutputSchema, type ClaudeWorkoutOutput } from "@/server/ai/schemas";
import { convertClaudeWorkout, inferMetricKey, metricTypeFor } from "@/server/ai/convert";
import { FALLBACK_NOTICE } from "@/server/ai/fallbacks";
import { setBuiltinCatalogForTests } from "@/server/catalog";
import { isEligible, validateWorkout } from "@/engine/workoutEngine";
import { phaseTemplatesFor } from "@/engine/phaseTemplates";
import { getDb, schema } from "@/server/db/client";
import { POST as generateWorkout } from "@/app/api/claude/generate-workout/route";
import { desc } from "drizzle-orm";

afterAll(() => env.teardown());

const request: WorkoutRequest = {
  durationMinutes: 90,
  role: "handler",
  secondaryRole: "cutter",
  primaryGoal: "accuracy",
  secondaryGoal: "forehand",
  intensity: "medium",
  participants: "solo",
  equipment: ["cones"],
  fieldSize: "medium",
  wind: "light",
  includeFitness: true,
  includeChallenge: true,
  excludedSkills: [],
  energy: 3,
  level: "intermediate",
  ageGroup: "adult",
  hand: "right",
};

const eligibility = { participants: request.participants, equipment: request.equipment, level: request.level, ageGroup: request.ageGroup, fieldSize: request.fieldSize, wind: request.wind, includeFitness: true, excludedSkills: [] as WorkoutRequest["excludedSkills"] };

function eligibleFor(phase: PhaseType, count: number, used: Set<string>): Exercise[] {
  const out: Exercise[] = [];
  for (const ex of MANIFEST_EXERCISES) {
    if (used.has(ex.id) || !ex.phases.includes(phase) || !isEligible(ex, eligibility)) continue;
    out.push(ex);
    used.add(ex.id);
    if (out.length >= count) break;
  }
  return out;
}

function claudeExercise(name: string, minutes: number, exerciseId = "", successMetric = "8 מתוך 10 זריקות למטרה"): ClaudeWorkoutOutput["phases"][number]["exercises"][number] {
  return {
    exerciseId,
    exerciseName: name,
    durationMinutes: minutes,
    sets: 3,
    repetitions: 10,
    restSeconds: 30,
    instructions: ["עמדו 8 מטר מהמטרה.", "זרקו 10 זריקות Backhand שטוחות."],
    coachingCues: ["מרפק קרוב לגוף"],
    commonMistakes: ["שחרור גבוה מדי"],
    successMetric,
    easierAlternative: "מרחק 5 מטר",
    harderAlternative: "מרחק 12 מטר",
    soloAlternative: "מול קיר",
    safetyNotes: ["חימום כתף לפני"],
  };
}

/** A realistic Claude response for the 90-minute template: catalog ids where eligible, custom text elsewhere. */
function buildFixture(opts: { drift?: number } = {}): ClaudeWorkoutOutput {
  const used = new Set<string>();
  const templates = phaseTemplatesFor(90, true);
  const minutesOf = (type: PhaseType) => templates.find((t) => t.type === type)!.minutes;
  const drift = opts.drift ?? 0;
  const [wu1] = eligibleFor("warmup", 1, used);
  const [th1, th2] = eligibleFor("throwing", 2, used);
  const [mv1] = eligibleFor("movement", 1, used);
  const [ro1] = eligibleFor("role", 1, used);
  const throwing = minutesOf("throwing");
  const half = Math.floor(throwing / 2);
  return {
    workoutTitle: "אימון דיוק ל-Handler",
    workoutGoal: "דיוק Backhand ו-Forehand תחת לחץ זמן",
    targetRole: "handler",
    secondaryRole: "cutter",
    level: "intermediate",
    totalDurationMinutes: 90,
    intensity: "medium",
    participants: "solo",
    fieldSize: "medium",
    requiredEquipment: ["cones"],
    coachMessage: "עובדים בהדרגה, סופרים הצלחות.",
    phases: [
      { phaseName: "צ'ק-אין", phaseType: "checkin", durationMinutes: minutesOf("checkin"), goal: "איך מרגישים היום", exercises: [] },
      { phaseName: "חימום", phaseType: "warmup", durationMinutes: minutesOf("warmup"), goal: "הכנה", exercises: [claudeExercise(wu1.name.he, 6, wu1.id, "מוכנות 4 מתוך 5"), claudeExercise("סיבובי כתפיים ומוביליטי", minutesOf("warmup") - 6, "", "הרגשה 4/5")] },
      { phaseName: "זריקות", phaseType: "throwing", durationMinutes: throwing, goal: "דיוק", exercises: [claudeExercise(th1.name.he, half, th1.id), claudeExercise(th2.name.he, throwing - half + drift, th2.id, "Forehand 7 מתוך 10")] },
      { phaseName: "תנועה", phaseType: "movement", durationMinutes: minutesOf("movement"), goal: "זריזות", exercises: [claudeExercise(mv1.name.he, 8, mv1.id, "זמן בשניות"), claudeExercise("ספרינטים קצרים בין קונוסים", minutesOf("movement") - 8, "", "ספרינט 10 מטר בשניות")] },
      { phaseName: "תפקיד", phaseType: "role", durationMinutes: minutesOf("role"), goal: "Handler", exercises: [claudeExercise(ro1.name.he, 10, ro1.id, "Break throw 6 מתוך 10"), claudeExercise("Pivot ו-Fake מול קונוס", minutesOf("role") - 10, "unknown_drill_id", "Pivot ציון 0-100")] },
      { phaseName: "משחק", phaseType: "game", durationMinutes: minutesOf("game"), goal: "החלטות", exercises: [claudeExercise("מצב משחק: 3 מטרות בזמן", minutesOf("game"), "", "קבלת החלטות ציון")] },
    ],
    endChallenge: { name: "אתגר 10 זריקות", description: "10 זריקות למטרה במרחק 10 מטר, כמה נכנסות?", successMetric: "7 מתוך 10", durationMinutes: minutesOf("challenge") },
    cooldown: { durationMinutes: minutesOf("cooldown"), steps: ["הליכה קלה ונשימות", "מתיחת כתפיים 30 שניות לכל צד"] },
    expectedMetrics: ["backhand_accuracy", "forehand_accuracy"],
  };
}

describe("convertClaudeWorkout", () => {
  it("builds a valid Workout from a fixture response (catalog ids resolved, custom drills kept, phases synthesized)", () => {
    const fixture = buildFixture();
    expect(claudeWorkoutOutputSchema.safeParse(fixture).success).toBe(true);
    const result = convertClaudeWorkout(fixture, { request, catalog: MANIFEST_EXERCISES, now: "2026-09-06T08:00:00.000Z", id: "wk_test" });
    expect(result.drift).toBe(0);
    expect(result.repaired).toBe(false);
    expect(result.unknownIds).toEqual(["unknown_drill_id"]);
    const w = result.workout;
    expect(w.source).toBe("claude");
    expect(w.totalDurationMinutes).toBe(90);
    expect(w.phases.map((p) => p.type)).toEqual(["checkin", "warmup", "throwing", "movement", "role", "game", "challenge", "cooldown"]);
    expect(w.phases.every((p) => p.exercises.length > 0)).toBe(true);
    const catalogInstances = w.phases.flatMap((p) => p.exercises).filter((e) => e.exerciseId);
    expect(catalogInstances.length).toBeGreaterThanOrEqual(4);
    expect(catalogInstances.every((e) => e.participants.includes("solo"))).toBe(true);
    const custom = w.phases.find((p) => p.type === "game")!.exercises[0];
    expect(custom.exerciseId).toBeUndefined();
    expect(custom.successMetric.key).toBe("decision_score");
    expect(custom.successMetric.type).toBe("score");
    const validation = validateWorkout(w, { participants: "solo", equipment: ["cones"], level: "intermediate", ageGroup: "adult", expectedDuration: 90, catalog: MANIFEST_EXERCISES });
    expect(validation.errors).toEqual([]);
    expect(validation.ok).toBe(true);
  });

  it("repairs durations that drift by at most 10 % and leaves bigger drift for validation to reject", () => {
    const small = convertClaudeWorkout(buildFixture({ drift: 1 }), { request, catalog: MANIFEST_EXERCISES });
    expect(small.drift).toBeGreaterThan(0);
    expect(small.repaired).toBe(true);
    expect(validateWorkout(small.workout, { expectedDuration: 90, participants: "solo", equipment: ["cones"] }).ok).toBe(true);

    const big = convertClaudeWorkout(buildFixture({ drift: 9 }), { request, catalog: MANIFEST_EXERCISES });
    expect(big.repaired).toBe(false);
    expect(validateWorkout(big.workout, { expectedDuration: 90 }).ok).toBe(false);
  });

  it("infers metric keys and types from free text", () => {
    expect(inferMetricKey("8 מתוך 10 זריקות Backhand", "throwing")).toBe("backhand_accuracy");
    expect(inferMetricKey("time in seconds for the 5-10-5", "movement")).toBe("cod_time_s");
    expect(inferMetricKey("", "throwing")).toBe("throw_accuracy");
    expect(inferMetricKey("", "cooldown")).toBe("confidence_rating");
    expect(metricTypeFor("sprint_time_s")).toBe("time_s");
    expect(metricTypeFor("longest_throw_m")).toBe("distance_m");
    expect(metricTypeFor("catch_streak")).toBe("streak");
    expect(metricTypeFor("backhand_accuracy")).toBe("ratio");
  });
});

describe("POST /api/claude/generate-workout without an API key", () => {
  beforeAll(() => setBuiltinCatalogForTests(MANIFEST_EXERCISES));

  it("falls back to the local engine with the exact Hebrew notice and logs the call", async () => {
    const res = await generateWorkout(makeRequest("/api/claude/generate-workout", { body: { request, context: { locale: "he" } }, guest: "guest_test_1" }));
    expect(res.status).toBe(200);
    const body = await readJson<GenerateWorkoutResponse>(res);
    expect(body.ok).toBe(true);
    expect(body.source).toBe("engine");
    expect(body.notice).toBe("המאמן החכם אינו זמין כרגע, לכן הכנו לך אימון מתאים מתוך ספריית האימונים. כל ההתקדמות שלך תמשיך להישמר.");
    expect(body.notice).toBe(FALLBACK_NOTICE.he);
    expect(body.workout.totalDurationMinutes).toBe(90);
    expect(body.workout.source).toBe("engine");
    expect(validateWorkout(body.workout, { participants: "solo", equipment: ["cones"], expectedDuration: 90 }).ok).toBe(true);

    const db = await getDb();
    const logs = await db.select().from(schema.aiRequestLogs).orderBy(desc(schema.aiRequestLogs.at)).limit(1);
    expect(logs[0]).toMatchObject({ action: "generate-workout", status: "fallback", errorCode: "no_key", userId: null });
    expect(logs[0].guestHash).toMatch(/^[0-9a-f]{32}$/);
    expect(logs[0].ipHash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("uses the English notice for en, works for account users, and validates input", async () => {
    const acc = await registerAccount("coach@example.com");
    const res = await generateWorkout(makeRequest("/api/claude/generate-workout", { body: { request, context: { locale: "en" } }, cookie: acc.cookie }));
    const body = await readJson<GenerateWorkoutResponse>(res);
    expect(body.source).toBe("engine");
    expect(body.notice).toBe(FALLBACK_NOTICE.en);
    expect(body.notice).toMatch(/^The AI coach isn't available right now/);

    const bad = await generateWorkout(makeRequest("/api/claude/generate-workout", { body: { request: { ...request, durationMinutes: 45 }, context: { locale: "he" } } }));
    expect(bad.status).toBe(400);
    expect((await readJson(bad)).code).toBe("validation");
    const noCsrf = await generateWorkout(makeRequest("/api/claude/generate-workout", { body: { request, context: { locale: "he" } }, csrf: false }));
    expect(noCsrf.status).toBe(403);
  });
});
