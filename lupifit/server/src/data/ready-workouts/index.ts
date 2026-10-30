import type { ReadyWorkoutSeed } from '@shared/content';
import { workouts as gymUpper } from './gym_upper';
import { workouts as gymLowerCore } from './gym_lower_core';
import { workouts as gymFullCardio } from './gym_full_cardio';
import { workouts as bodyweightUpper } from './bodyweight_upper';
import { workouts as bodyweightLower } from './bodyweight_lower';
import { workouts as bodyweightCoreFull } from './bodyweight_core_full';
import { workouts as cardioHome } from './cardio_home';
import { workouts as dumbbellUpper } from './dumbbell_upper';
import { workouts as dumbbellLowerCore } from './dumbbell_lower_core';
import { workouts as dumbbellFullCardio } from './dumbbell_full_cardio';
import { workouts as park } from './park';
import { workouts as bandsKettlebell } from './bands_kettlebell';

/** The ready workouts by authoring file (used by the tooling to check one file at a time). */
export const READY_BUCKETS: Record<string, ReadyWorkoutSeed[]> = {
  gym_upper: gymUpper,
  gym_lower_core: gymLowerCore,
  gym_full_cardio: gymFullCardio,
  bodyweight_upper: bodyweightUpper,
  bodyweight_lower: bodyweightLower,
  bodyweight_core_full: bodyweightCoreFull,
  cardio_home: cardioHome,
  dumbbell_upper: dumbbellUpper,
  dumbbell_lower_core: dumbbellLowerCore,
  dumbbell_full_cardio: dumbbellFullCardio,
  park: park,
  bands_kettlebell: bandsKettlebell,
};

/** Every ready-made workout. */
export const READY_WORKOUTS: ReadyWorkoutSeed[] = Object.values(READY_BUCKETS).flat();
