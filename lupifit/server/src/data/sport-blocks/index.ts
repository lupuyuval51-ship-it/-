import type { SportBlockSeed } from '@shared/content';
import { blocks as teamSports } from './team_sports';
import { blocks as enduranceSports } from './endurance_sports';
import { blocks as combatClimbing } from './combat_climbing';
import { blocks as otherSports } from './other_sports';

/** The sport blocks by authoring file (used by the tooling to check one file at a time). */
export const SPORT_BUCKETS: Record<string, SportBlockSeed[]> = {
  teamSports: teamSports,
  enduranceSports: enduranceSports,
  combatClimbing: combatClimbing,
  otherSports: otherSports,
};

/** Every 10-minute sport finisher block. */
export const SPORT_BLOCKS: SportBlockSeed[] = Object.values(SPORT_BUCKETS).flat();
