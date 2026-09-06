import { afterEach, describe, expect, it } from "vitest";
import type { Equipment, Exercise, Level, Participants, Role, Workout, WorkoutRequest } from "@/lib/types";
import { DURATIONS, ROLES } from "@/lib/types";
import { MANIFEST_EXERCISES, MANIFEST_EXERCISE_MAP } from "../fixtures/manifestExercises";
import {
  CHECKIN_EXERCISE_ID, describeWorkoutFocus, findAlternatives, fitDurations, generateWorkout, getDefaultCatalog,
  isDefaultCatalogLoaded, repairWorkoutDurations, replaceExercise, setDefaultCatalog, toWorkoutExercise, validateWorkout,
  workoutTotals,
} from "@/engine/workoutEngine";
import { PHASE_ORDER } from "@/engine/phaseTemplates";

const NOW = "2026-09-06T08:00:00.000Z";
const FULL_EQUIPMENT: Equipment[] = ["discs", "cones", "target", "ladder", "stopwatch", "wall", "field_lines"];
const CATALOG = MANIFEST_EXERCISES;

function baseRequest(overrides: Partial<WorkoutRequest> = {}): WorkoutRequest {
  return {
    durationMinutes: 90,
    role: "handler",
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
    seed: "test-seed",
    ...overrides,
  };
}

function gen(overrides: Partial<WorkoutRequest> = {}, catalog: Exercise[] = CATALOG): Workout {
  return generateWorkout(baseRequest(overrides), { catalog, now: NOW });
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function realExercises(w: Workout) {
  return w.phases.flatMap((p) => p.exercises).filter((e) => e.id !== CHECKIN_EXERCISE_ID);
}

function catalogOf(w: Workout): Exercise[] {
  return realExercises(w)
    .map((e) => (e.exerciseId ? MANIFEST_EXERCISE_MAP[e.exerciseId] : undefined))
    .filter((e): e is Exercise => !!e);
}

function expectExactSums(w: Workout) {
  expect(sum(w.phases.map((p) => p.durationMinutes))).toBe(w.totalDurationMinutes);
  for (const phase of w.phases) {
    expect(phase.exercises.length).toBeGreaterThan(0);
    expect(sum(phase.exercises.map((e) => e.durationMinutes))).toBe(phase.durationMinutes);
    for (const e of phase.exercises) expect(e.durationMinutes).toBeGreaterThanOrEqual(1);
  }
}

describe("generateWorkout – structure", () => {
  it("sums exactly for every duration × role × participants × minimal/full equipment and validates", () => {
    const failures: string[] = [];
    for (const durationMinutes of DURATIONS) {
      for (const role of ROLES) {
        for (const participants of ["solo", "pair", "group"] as Participants[]) {
          for (const equipment of [[], FULL_EQUIPMENT] as Equipment[][]) {
            const req = baseRequest({ durationMinutes, role, participants, equipment, seed: `${durationMinutes}-${role}-${participants}-${equipment.length}` });
            const w = generateWorkout(req, { catalog: CATALOG, now: NOW });
            expectExactSums(w);
            expect(w.totalDurationMinutes).toBe(durationMinutes);
            expect(w.phases.map((p) => p.type)).toEqual(PHASE_ORDER);
            const v = validateWorkout(w, { participants, equipment, level: req.level, ageGroup: req.ageGroup, expectedDuration: durationMinutes, catalog: CATALOG });
            if (!v.ok) failures.push(`${durationMinutes}/${role}/${participants}/${equipment.length}: ${v.errors.join("; ")}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("starts with a single check-in pseudo exercise listing the check-in questions", () => {
    const w = gen();
    const checkin = w.phases[0];
    expect(checkin.type).toBe("checkin");
    expect(checkin.exercises).toHaveLength(1);
    const ex = checkin.exercises[0];
    expect(ex.id).toBe("checkin");
    expect(ex.exerciseId).toBeUndefined();
    expect(ex.name).toEqual({ he: "בדיקת מצב לפני אימון", en: "Pre-session check-in" });
    expect(ex.instructions.length).toBeGreaterThanOrEqual(5);
    expect(ex.instructions.some((i) => i.he.includes("אנרגיה"))).toBe(true);
    expect(ex.instructions.some((i) => i.en.toLowerCase().includes("pain"))).toBe(true);
  });

  it("uses 3–5 warm-up items, 2–3 cool-down items and 1–4 items elsewhere", () => {
    for (const durationMinutes of DURATIONS) {
      const w = gen({ durationMinutes, equipment: FULL_EQUIPMENT });
      for (const phase of w.phases) {
        const n = phase.exercises.length;
        if (phase.type === "checkin") expect(n).toBe(1);
        else if (phase.type === "warmup") expect(n >= 3 && n <= 5).toBe(true);
        else if (phase.type === "cooldown") expect(n >= 2 && n <= 3).toBe(true);
        else expect(n >= 1 && n <= 4).toBe(true);
      }
    }
  });

  it("never schedules the same exercise twice in one workout", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      const w = gen({ seed, equipment: FULL_EQUIPMENT, participants: "group" });
      const ids = realExercises(w).map((e) => e.exerciseId).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
      const instanceIds = w.phases.flatMap((p) => p.exercises.map((e) => e.id));
      expect(new Set(instanceIds).size).toBe(instanceIds.length);
    }
  });

  it("fills metadata: role, level, equipment, tags, metrics, coach message", () => {
    const w = gen({ role: "wing", secondaryRole: "cutter", equipment: ["cones", "ladder"] });
    expect(w.source).toBe("engine");
    expect(w.targetRole).toBe("wing");
    expect(w.secondaryRole).toBe("cutter");
    expect(w.level).toBe("intermediate");
    expect(w.participants).toBe("solo");
    expect(w.tags).toContain("wing");
    expect(w.tags).toContain("solo");
    expect(w.requiredEquipment.every((e) => ["cones", "ladder"].includes(e))).toBe(true);
    expect(w.expectedMetrics.length).toBeGreaterThan(0);
    expect(w.coachMessage.he.length).toBeGreaterThan(10);
    expect(w.title.he.length).toBeGreaterThan(0);
    expect(w.createdAt).toBe(NOW);
  });
});

describe("generateWorkout – eligibility", () => {
  it("solo workouts never contain pair/group-only drills", () => {
    for (const role of ROLES) {
      for (const equipment of [[], FULL_EQUIPMENT] as Equipment[][]) {
        const w = gen({ role, participants: "solo", equipment, seed: `solo-${role}` });
        for (const e of realExercises(w)) {
          expect(e.participants, `${e.id} in ${role}`).toContain("solo");
          if (e.exerciseId) expect(MANIFEST_EXERCISE_MAP[e.exerciseId].participants).toContain("solo");
        }
      }
    }
  });

  it("substitutes the solo alternative drill when the user trains alone", () => {
    const pairOnly: Exercise = { ...MANIFEST_EXERCISE_MAP["ct-pressure-catch"], participants: ["pair", "group"], soloAlternativeId: "ct-self-toss", phases: ["throwing"] };
    const catalog = CATALOG.map((e) => (e.id === pairOnly.id ? pairOnly : e));
    const w = gen({ participants: "solo", primaryGoal: "catch_pressure", seed: "solo-alt" }, catalog);
    const ids = realExercises(w).map((e) => e.exerciseId);
    expect(ids).not.toContain("ct-pressure-catch");
    for (const e of realExercises(w)) expect(e.participants).toContain("solo");
  });

  it("never uses equipment the user does not have (disc is always available)", () => {
    const none = gen({ equipment: [], participants: "pair" });
    for (const e of realExercises(none)) expect(e.equipment.filter((x) => x !== "disc")).toEqual([]);
    expect(none.requiredEquipment).toEqual([]);

    const conesOnly = gen({ equipment: ["cones"], participants: "group", role: "runner" });
    for (const e of realExercises(conesOnly)) for (const eq of e.equipment) expect(["disc", "cones"]).toContain(eq);
    expect(conesOnly.requiredEquipment.every((e) => e === "cones")).toBe(true);
  });

  it("respects the level (beginner never gets intermediate/advanced-only drills)", () => {
    for (const level of ["beginner", "intermediate", "advanced"] as Level[]) {
      const w = gen({ level, equipment: FULL_EQUIPMENT, seed: `level-${level}` });
      for (const c of catalogOf(w)) expect(c.levels, c.id).toContain(level);
    }
  });

  it("drops calm-only drills in wind and wind-focus drills in calm weather", () => {
    const calmOnly: Exercise = { ...MANIFEST_EXERCISE_MAP["bh-short-gate"], wind: "calm_only" };
    const windFocus: Exercise = { ...MANIFEST_EXERCISE_MAP["th-wind-throws"], wind: "wind_focus" };
    const catalog = CATALOG.map((e) => (e.id === calmOnly.id ? calmOnly : e.id === windFocus.id ? windFocus : e));
    for (const seed of ["w1", "w2", "w3"]) {
      const windy = gen({ wind: "strong", primaryGoal: "backhand", seed }, catalog);
      expect(realExercises(windy).map((e) => e.exerciseId)).not.toContain("bh-short-gate");
      const calm = gen({ wind: "none", seed }, catalog);
      expect(realExercises(calm).map((e) => e.exerciseId)).not.toContain("th-wind-throws");
    }
    expect(gen({ wind: "strong" }, catalog).tags).toContain("wind");
  });

  it("drops drills whose primary skill is excluded", () => {
    const w = gen({ excludedSkills: ["speed", "hammer"], equipment: FULL_EQUIPMENT, role: "runner" });
    for (const c of catalogOf(w)) expect(["speed", "hammer"]).not.toContain(c.skills[0]);
  });

  it("caps intensity at medium when energy is low", () => {
    for (const role of ["handler", "runner", "defender"] as Role[]) {
      const w = gen({ energy: 1, equipment: FULL_EQUIPMENT, role, participants: "group", seed: `low-${role}` });
      for (const c of catalogOf(w)) expect(c.intensity, c.id).not.toBe("high");
      expect(w.intensity).not.toBe("high");
    }
  });

  it("lowers reps by ~20% when energy is low", () => {
    const normal = gen({ energy: 3, seed: "reps" });
    const tired = gen({ energy: 1, seed: "reps" });
    const n = normal.phases.find((p) => p.type === "throwing")!.exercises[0];
    const t = tired.phases.find((p) => p.type === "throwing")!.exercises.find((e) => e.exerciseId === n.exerciseId);
    if (t) expect(t.reps).toBeLessThan(n.reps);
    expect(tired.coachMessage.he).toContain("האנרגיה נמוכה");
  });

  it("skips fitness / endurance-only drills when includeFitness is false", () => {
    const w = gen({ includeFitness: false, equipment: FULL_EQUIPMENT, role: "wing", participants: "group" });
    expect(w.includesFitness).toBe(false);
    for (const c of catalogOf(w)) {
      expect(c.category).not.toBe("fitness");
      expect(c.skills[0]).not.toBe("endurance");
    }
  });

  it("includeChallenge=false removes the challenge phase and keeps the total exact", () => {
    for (const durationMinutes of DURATIONS) {
      const w = gen({ includeChallenge: false, durationMinutes });
      expect(w.includesChallenge).toBe(false);
      expect(w.phases.some((p) => p.type === "challenge")).toBe(false);
      expectExactSums(w);
      const withChallenge = gen({ includeChallenge: true, durationMinutes });
      const game = (x: Workout) => x.phases.find((p) => p.type === "game")!.durationMinutes;
      const cooldown = (x: Workout) => x.phases.find((p) => p.type === "cooldown")!.durationMinutes;
      expect(game(w)).toBe(game(withChallenge) + 3);
      expect(cooldown(w)).toBe(cooldown(withChallenge) + 2);
      expect(validateWorkout(w, { expectedDuration: durationMinutes }).ok).toBe(true);
    }
  });

  it("role phase uses drills for the role and gives the secondary role a slot", () => {
    let secondaryHits = 0;
    for (const seed of ["s1", "s2", "s3", "s4", "s5"]) {
      const w = gen({ role: "handler", secondaryRole: "cutter", equipment: FULL_EQUIPMENT, participants: "pair", seed });
      const role = w.phases.find((p) => p.type === "role")!;
      const cats = role.exercises.map((e) => MANIFEST_EXERCISE_MAP[e.exerciseId!]).filter(Boolean);
      expect(cats.some((c) => c.roles.includes("handler") || c.roles.length === 0)).toBe(true);
      if (cats.some((c) => c.roles.includes("cutter"))) secondaryHits += 1;
    }
    expect(secondaryHits).toBeGreaterThanOrEqual(3);
  });

  it("hybrid / all-round players get a mix of role families in the role phase", () => {
    const w = gen({ role: "hybrid", equipment: FULL_EQUIPMENT, participants: "group", durationMinutes: 120, seed: "mix" });
    const role = w.phases.find((p) => p.type === "role")!;
    const families = new Set<string>();
    for (const e of role.exercises) {
      const c = MANIFEST_EXERCISE_MAP[e.exerciseId!];
      for (const r of c.roles) if (["handler", "cutter", "defender"].includes(r)) families.add(r);
    }
    expect(families.size).toBeGreaterThanOrEqual(2);
  });

  it("adapts loads for kids and seniors", () => {
    const kid = gen({ ageGroup: "kid", equipment: FULL_EQUIPMENT });
    for (const e of realExercises(kid)) {
      expect(e.sets).toBeLessThanOrEqual(2);
      const c = e.exerciseId ? MANIFEST_EXERCISE_MAP[e.exerciseId] : undefined;
      if (c) {
        expect(e.reps).toBe(Math.max(1, Math.round(c.reps * 0.7)));
        if (c.restSeconds > 0) expect(e.restSeconds).toBe(c.restSeconds + 15);
      }
    }
    const senior = gen({ ageGroup: "senior" });
    for (const e of realExercises(senior)) {
      const c = e.exerciseId ? MANIFEST_EXERCISE_MAP[e.exerciseId] : undefined;
      if (c && c.restSeconds > 0) expect(e.restSeconds).toBe(c.restSeconds + 15);
    }
  });

  it("keeps the same drill when the request is identical – but different catalogs still work", () => {
    const tiny = CATALOG.filter((e) => e.category === "warmup" || e.category === "cooldown");
    const w = gen({}, tiny);
    expectExactSums(w);
    expect(validateWorkout(w, { expectedDuration: 90 }).ok).toBe(true);
    const empty = gen({}, []);
    expectExactSums(empty);
    expect(validateWorkout(empty, { participants: "solo", equipment: [], expectedDuration: 90 }).ok).toBe(true);
  });
});

describe("generateWorkout – determinism", () => {
  it("is deterministic for the same seed and varies across seeds", () => {
    const a = gen({ seed: "same" });
    const b = gen({ seed: "same" });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.id).toBe(b.id);

    const sequences = new Set(["v1", "v2", "v3", "v4", "v5"].map((seed) => realExercises(gen({ seed, equipment: FULL_EQUIPMENT })).map((e) => e.exerciseId).join(",")));
    expect(sequences.size).toBeGreaterThanOrEqual(2);
  });

  it("generates a random seed when none is given", () => {
    const req = baseRequest();
    delete req.seed;
    const w = generateWorkout(req, { catalog: CATALOG, now: NOW });
    expectExactSums(w);
    expect(w.id.startsWith("wk_")).toBe(true);
  });
});

describe("fitDurations", () => {
  it("hits the target exactly inside [min,max] and extends the last item when impossible", () => {
    const exact = fitDurations([{ min: 6, max: 12, preferred: 8 }, { min: 6, max: 12, preferred: 8 }, { min: 6, max: 12, preferred: 8 }], 20)!;
    expect(sum(exact)).toBe(20);
    for (const m of exact) {
      expect(m).toBeGreaterThanOrEqual(6);
      expect(m).toBeLessThanOrEqual(12);
    }
    expect(fitDurations([{ min: 2, max: 6, preferred: 4 }, { min: 2, max: 6, preferred: 4 }], 8)).toEqual([4, 4]);
    const stretched = fitDurations([{ min: 1, max: 3, preferred: 2 }, { min: 1, max: 3, preferred: 2 }], 10)!;
    expect(sum(stretched)).toBe(10);
    expect(stretched[1]).toBeGreaterThan(3);
    expect(fitDurations([{ min: 6, max: 8, preferred: 6 }, { min: 6, max: 8, preferred: 6 }], 10)).toBeNull();
    expect(fitDurations([], 0)).toEqual([]);
  });
});

describe("validateWorkout", () => {
  it("accepts engine output", () => {
    const w = gen({ equipment: FULL_EQUIPMENT, participants: "pair" });
    const v = validateWorkout(w, { participants: "pair", equipment: FULL_EQUIPMENT, level: "intermediate", ageGroup: "adult", expectedDuration: 90, catalog: CATALOG });
    expect(v.ok).toBe(true);
    expect(v.errors).toEqual([]);
    expect(v.workout?.id).toBe(w.id);
  });

  it("rejects a wrong phase sum and wrong totals", () => {
    const w = gen();
    const broken: Workout = { ...w, phases: w.phases.map((p, i) => (i === 2 ? { ...p, durationMinutes: p.durationMinutes + 3 } : p)) };
    const v = validateWorkout(broken);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e.includes("phases sum"))).toBe(true);
    expect(v.errors.some((e) => e.includes("exercises sum"))).toBe(true);
    expect(validateWorkout(w, { expectedDuration: 105 }).ok).toBe(false);
  });

  it("rejects duplicates, missing phases, unavailable equipment and incompatible participants", () => {
    const w = gen({ equipment: ["cones"], participants: "group" });
    const throwing = w.phases.find((p) => p.type === "throwing")!;
    const dup: Workout = { ...w, phases: w.phases.map((p) => (p.type === "role" ? { ...p, exercises: [{ ...throwing.exercises[0], id: "dup", durationMinutes: p.durationMinutes }] } : p)) };
    expect(validateWorkout(dup).errors.some((e) => e.includes("appears twice"))).toBe(true);

    const noCooldown: Workout = { ...w, phases: w.phases.filter((p) => p.type !== "cooldown"), totalDurationMinutes: 85 };
    expect(validateWorkout(noCooldown).errors.some((e) => e.includes('missing "cooldown"'))).toBe(true);

    const noChallenge: Workout = { ...w, phases: w.phases.filter((p) => p.type !== "challenge"), totalDurationMinutes: 85 };
    expect(validateWorkout(noChallenge).errors.some((e) => e.includes("challenge"))).toBe(true);
    expect(validateWorkout({ ...noChallenge, includesChallenge: false }).errors.some((e) => e.includes("challenge"))).toBe(false);

    expect(validateWorkout(w, { equipment: [] }).errors.some((e) => e.includes("cones"))).toBe(true);
    const groupOnly = realExercises(w).find((e) => !e.participants.includes("solo"));
    if (groupOnly) expect(validateWorkout(w, { participants: "solo" }).ok).toBe(false);
  });

  it("rejects unsafe instructions in Hebrew and English", () => {
    const w = gen();
    const unsafeEn: Workout = JSON.parse(JSON.stringify(w));
    unsafeEn.phases[2].exercises[0].instructions.push({ he: "רוצו קדימה", en: "Tackle the defender to the ground" });
    expect(validateWorkout(unsafeEn).errors.some((e) => e.includes("unsafe"))).toBe(true);
    const unsafeHe: Workout = JSON.parse(JSON.stringify(w));
    unsafeHe.phases[2].exercises[0].cues.push({ he: "מותר להפיל את היריב", en: "run" });
    expect(validateWorkout(unsafeHe).ok).toBe(false);
    const safe: Workout = JSON.parse(JSON.stringify(w));
    safe.phases[2].exercises[0].instructions.push({ he: "אל תפילו את הדיסק, פגעו במטרה.", en: "Hit the target without dropping the disc." });
    expect(validateWorkout(safe).ok).toBe(true);
  });

  it("returns structural errors for garbage input and warns on level mismatches", () => {
    const v = validateWorkout({ id: "x" });
    expect(v.ok).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
    const w = gen({ level: "advanced", equipment: FULL_EQUIPMENT });
    const r = validateWorkout(w, { level: "beginner", catalog: CATALOG });
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe("repairWorkoutDurations", () => {
  it("fixes an off-by-3 workout and is idempotent", () => {
    const w = gen();
    const broken: Workout = JSON.parse(JSON.stringify(w));
    const throwing = broken.phases.find((p) => p.type === "throwing")!;
    throwing.exercises[0].durationMinutes += 3;
    throwing.durationMinutes += 3;
    expect(validateWorkout(broken).ok).toBe(false);

    const fixed = repairWorkoutDurations(broken);
    expect(fixed.totalDurationMinutes).toBe(90);
    expectExactSums(fixed);
    expect(validateWorkout(fixed, { expectedDuration: 90 }).ok).toBe(true);
    expect(repairWorkoutDurations(fixed)).toEqual(fixed);
    expect(repairWorkoutDurations(w)).toEqual(w);
  });

  it("handles phases whose exercises do not add up", () => {
    const w = gen();
    const broken: Workout = JSON.parse(JSON.stringify(w));
    broken.phases[3].exercises[0].durationMinutes += 2;
    broken.phases[4].durationMinutes -= 1;
    const fixed = repairWorkoutDurations(broken);
    expectExactSums(fixed);
    expect(fixed.totalDurationMinutes).toBe(90);
  });
});

describe("replaceExercise", () => {
  const ctx = { participants: "pair" as Participants, equipment: FULL_EQUIPMENT, level: "intermediate" as Level, ageGroup: "adult" as const, catalog: CATALOG, now: NOW };

  it("keeps the duration, changes the drill and logs the swap", () => {
    const w = gen({ equipment: FULL_EQUIPMENT, participants: "pair" });
    const phase = w.phases.find((p) => p.type === "throwing")!;
    const target = phase.exercises[0];
    const { workout, replacement, log } = replaceExercise(w, phase.id, target.id, "too_hard", ctx);
    expect(replacement).not.toBeNull();
    expect(replacement!.durationMinutes).toBe(target.durationMinutes);
    expect(replacement!.exerciseId).not.toBe(target.exerciseId);
    expect(replacement!.id).not.toBe(target.id);
    expect(log).toMatchObject({ phaseId: phase.id, fromExerciseId: target.exerciseId, toExerciseId: replacement!.exerciseId, reason: "too_hard", at: NOW });
    expectExactSums(workout);
    expect(validateWorkout(workout, { participants: "pair", equipment: FULL_EQUIPMENT, expectedDuration: 90 }).ok).toBe(true);
    expect(workout.updatedAt).toBe(NOW);
    expect(w.phases.find((p) => p.type === "throwing")!.exercises[0].id).toBe(target.id);
  });

  it("too_easy prefers a harder drill or harder numbers, too_hard lowers the load", () => {
    const w = gen({ equipment: FULL_EQUIPMENT, participants: "pair", level: "intermediate" });
    const phase = w.phases.find((p) => p.type === "movement")!;
    const target = phase.exercises[0];
    const easy = replaceExercise(w, phase.id, target.id, "too_easy", ctx).replacement!;
    const hard = replaceExercise(w, phase.id, target.id, "too_hard", ctx).replacement!;
    const easyCat = MANIFEST_EXERCISE_MAP[easy.exerciseId!];
    const hardCat = MANIFEST_EXERCISE_MAP[hard.exerciseId!];
    const targetCat = MANIFEST_EXERCISE_MAP[target.exerciseId!];
    const rank = { low: 0, medium: 1, high: 2 } as const;
    expect(rank[easyCat.intensity] > rank[targetCat.intensity] || easy.reps > easyCat.reps || easy.sets > easyCat.sets).toBe(true);
    expect(rank[hardCat.intensity] <= rank[targetCat.intensity] || hard.reps < hardCat.reps).toBe(true);
    expect(hard.sets).toBeLessThanOrEqual(hardCat.sets);
  });

  it("no_equipment picks a drill without the missing gear", () => {
    const w = gen({ equipment: FULL_EQUIPMENT, participants: "pair" });
    const phase = w.phases.find((p) => p.type === "throwing")!;
    const withCones = phase.exercises.find((e) => e.equipment.includes("cones")) ?? phase.exercises[0];
    const { replacement } = replaceExercise(w, phase.id, withCones.id, "no_equipment", ctx);
    expect(replacement).not.toBeNull();
    for (const eq of withCones.equipment) expect(replacement!.equipment).not.toContain(eq);
  });

  it("alone picks a solo-capable drill", () => {
    const w = gen({ equipment: FULL_EQUIPMENT, participants: "group" });
    const phase = w.phases.find((p) => p.type === "game")!;
    const target = phase.exercises[0];
    const { replacement } = replaceExercise(w, phase.id, target.id, "alone", { ...ctx, participants: "group" });
    expect(replacement).not.toBeNull();
    expect(replacement!.participants).toContain("solo");
  });

  it("pain picks a low-intensity drill (never a sprint) and attaches a safety note", () => {
    const w = gen({ equipment: FULL_EQUIPMENT, participants: "pair", role: "runner" });
    const phase = w.phases.find((p) => p.type === "movement")!;
    const target = phase.exercises[0];
    const { replacement } = replaceExercise(w, phase.id, target.id, "pain", ctx);
    expect(replacement).not.toBeNull();
    const cat = MANIFEST_EXERCISE_MAP[replacement!.exerciseId!];
    expect(cat.intensity).not.toBe("high");
    expect(["speed", "acceleration", "endurance"]).not.toContain(cat.skills[0]);
    expect(replacement!.safetyNotes[0].he).toContain("כאב");
    expect(replacement!.safetyNotes[0].en.toLowerCase()).toContain("pain");
  });

  it("returns nulls for unknown ids", () => {
    const w = gen();
    const r = replaceExercise(w, "nope", "nope", "other", ctx);
    expect(r.replacement).toBeNull();
    expect(r.log).toBeNull();
    expect(r.workout).toBe(w);
  });
});

describe("findAlternatives / totals / focus", () => {
  it("finds up to 3 eligible alternatives that are not the drill itself", () => {
    const w = gen({ equipment: FULL_EQUIPMENT });
    const ex = w.phases.find((p) => p.type === "throwing")!.exercises[0];
    const alts = findAlternatives(ex, { participants: "solo", equipment: [], level: "intermediate", ageGroup: "adult", catalog: CATALOG });
    expect(alts.length).toBeLessThanOrEqual(3);
    expect(alts.length).toBeGreaterThan(0);
    for (const a of alts) {
      expect(a.id).not.toBe(ex.exerciseId);
      expect(a.participants).toContain("solo");
      expect(a.equipment).toEqual([]);
    }
    const fromCatalog = findAlternatives(MANIFEST_EXERCISE_MAP["fh-short-gate"], { participants: "pair", equipment: FULL_EQUIPMENT, level: "beginner", ageGroup: "teen", catalog: CATALOG }, 2);
    expect(fromCatalog.length).toBe(2);
    expect(fromCatalog[0].skills).toContain("forehand");
  });

  it("computes totals and a focus sentence", () => {
    const w = gen({ equipment: FULL_EQUIPMENT });
    const t = workoutTotals(w);
    expect(t.minutes).toBe(90);
    expect(t.phases).toBe(8);
    expect(t.exercises).toBe(realExercises(w).length);
    expect(t.estimatedThrows).toBeGreaterThan(0);
    expect(t.estimatedCatches).toBeGreaterThanOrEqual(0);
    expect(t.equipment.every((e) => FULL_EQUIPMENT.includes(e))).toBe(true);
    expect(describeWorkoutFocus(w, "he").startsWith("היום מתמקדים ב")).toBe(true);
    expect(describeWorkoutFocus(w, "en").startsWith("Today's focus:")).toBe(true);
  });
});

describe("toWorkoutExercise", () => {
  const ex = MANIFEST_EXERCISE_MAP["fh-short-gate"];

  it("copies the localized fields and alternatives", () => {
    const we = toWorkoutExercise(ex, 8);
    expect(we.exerciseId).toBe(ex.id);
    expect(we.name).toEqual(ex.name);
    expect(we.durationMinutes).toBe(8);
    expect(we.easierAlternative).toEqual(ex.easierVersion);
    expect(we.harderAlternative).toEqual(ex.harderVersion);
    expect(we.soloAlternative).toEqual(ex.soloAlternative);
    expect(we.safetyNotes).toEqual(ex.safetyNotes);
    expect(we.skills).toEqual(ex.skills);
    expect(we.sets).toBe(ex.sets);
    expect(we.reps).toBe(ex.reps);
    we.instructions.push({ he: "x", en: "x" });
    expect(ex.instructions.length).toBe(2);
  });

  it("adapts kids, seniors, beginners and advanced players", () => {
    const kid = toWorkoutExercise(ex, 8, { ageGroup: "kid" });
    expect(kid.sets).toBe(2);
    expect(kid.reps).toBe(7);
    expect(kid.restSeconds).toBe(ex.restSeconds + 15);
    const senior = toWorkoutExercise(ex, 8, { ageGroup: "senior" });
    expect(senior.restSeconds).toBe(ex.restSeconds + 15);
    const beginner = toWorkoutExercise(ex, 8, { level: "beginner" });
    expect(beginner.restSeconds).toBeGreaterThan(ex.restSeconds);
    const advancedLong = toWorkoutExercise(ex, 14, { level: "advanced" });
    expect(advancedLong.sets).toBe(ex.sets + 1);
    const advancedShort = toWorkoutExercise(ex, 6, { level: "advanced" });
    expect(advancedShort.sets).toBe(ex.sets);
    const tired = toWorkoutExercise(ex, 8, { energy: 2 });
    expect(tired.reps).toBe(8);
  });
});

describe("default catalog guard", () => {
  afterEach(() => setDefaultCatalog(null));

  it("throws a clear error when no catalog is loaded and honours setDefaultCatalog", () => {
    setDefaultCatalog(null);
    if (!isDefaultCatalogLoaded()) {
      expect(() => getDefaultCatalog()).toThrow(/catalog not loaded/);
      expect(() => generateWorkout(baseRequest())).toThrow(/catalog not loaded/);
    }
    setDefaultCatalog(CATALOG);
    expect(isDefaultCatalogLoaded()).toBe(true);
    const w = generateWorkout(baseRequest(), { now: NOW });
    expectExactSums(w);
  });
});
