import type { ReadyWorkoutSeed } from '@shared/content';
import { workouts as chest } from './chest';
import { workouts as back } from './back';
import { workouts as shoulders } from './shoulders';
import { workouts as arms } from './arms';
import { workouts as core } from './core';
import { workouts as glutes } from './glutes';
import { workouts as quadsHamstrings } from './quads_hamstrings';
import { workouts as legs } from './legs';
import { workouts as upperBody } from './upper_body';
import { workouts as fullBody } from './full_body';
import { workouts as cardio } from './cardio';
import { workouts as park } from './park';
import { workouts as bandsKettlebell } from './bands_kettlebell';
import { workouts as gymClassics } from './gym_classics';

/** The ready workouts by authoring file (used by the tooling to check one file at a time). */
export const READY_BUCKETS: Record<string, ReadyWorkoutSeed[]> = {
  chest: chest,
  back: back,
  shoulders: shoulders,
  arms: arms,
  core: core,
  glutes: glutes,
  quadsHamstrings: quadsHamstrings,
  legs: legs,
  upperBody: upperBody,
  fullBody: fullBody,
  cardio: cardio,
  park: park,
  bandsKettlebell: bandsKettlebell,
  gymClassics: gymClassics,
};

/** Every ready-made workout. */
export const READY_WORKOUTS: ReadyWorkoutSeed[] = Object.values(READY_BUCKETS).flat();
