/**
 * Exercise catalog assembly. Parts are authored separately (see manifest.ts for the id list).
 * NOTE: parts C1, C2, D1, D2 are added here as soon as they are complete.
 */
import type { Exercise, PhaseType } from "@/lib/types";
import { PHASE_TYPES } from "@/lib/types";
import { EXERCISE_MANIFEST } from "@/content/manifest";
import { partA } from "./partA";
import { partB } from "./partB";

const parts: Exercise[][] = [partA, partB];

const byId = new Map<string, Exercise>();
for (const part of parts) for (const ex of part) if (!byId.has(ex.id)) byId.set(ex.id, ex);

/** All exercises in manifest order (only ids that have been authored). */
export const EXERCISES: Exercise[] = EXERCISE_MANIFEST.map((m) => byId.get(m.id)).filter((e): e is Exercise => Boolean(e));

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_MAP[id];
}

export const EXERCISES_BY_PHASE: Record<PhaseType, Exercise[]> = Object.fromEntries(
  PHASE_TYPES.map((p) => [p, EXERCISES.filter((e) => e.phases.includes(p))]),
) as Record<PhaseType, Exercise[]>;
