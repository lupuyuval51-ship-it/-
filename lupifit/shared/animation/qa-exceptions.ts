import type { QaException } from './qa';

/**
 * Documented per-exercise QA exceptions. Each one names the issue key, the highest value that is
 * still accepted (anything beyond it fails again) and the anatomical / geometric reason.
 * The thresholds themselves (shared/animation/qa.ts) are not relaxed for anyone else.
 */
const EXPLOSIVE = 'Ballistic movement: the take-off / swing is smooth but legitimately several times faster than the median step of that joint.';

export const QA_EXCEPTIONS: Record<string, QaException[]> = {
  negative_pull_up: [
    { key: 'pop', limit: 5.5, reason: 'Deliberately a ~4 s eccentric followed by a ~1 s step back up: the step-up is smooth but several times faster than the median (slow) lowering step.' },
  ],
  wall_handstand_push_up: [
    { key: 'rom.shoulder.flex', limit: 185, reason: 'A handstand is defined by full shoulder flexion (arms overhead, ~180 degrees).' },
  ],
  superman: [
    { key: 'rom.shoulder.flex', limit: 181, reason: 'Prone with the arms stretched overhead on the floor is ~180 degrees of shoulder flexion by definition.' },
  ],
  pistol_squat: [
    { key: 'rom.knee.flex', limit: 156, reason: 'Full-depth single-leg squat (ass-to-grass) needs about 150 degrees of knee flexion.' },
    { key: 'rom.hip.flex', limit: 168, reason: 'Full-depth single-leg squat needs about 150-165 degrees of hip flexion with the torso counterbalancing.' },
  ],
  jump_squat: [{ key: 'pop', limit: 10, reason: EXPLOSIVE }],
  box_jump: [{ key: 'pop', limit: 10, reason: EXPLOSIVE }],
  broad_jump: [{ key: 'pop', limit: 13, reason: EXPLOSIVE }],
  lateral_bound: [{ key: 'pop', limit: 22, reason: 'Airborne flight phase between the two landings is much faster than the (nearly static) hip steps during the holds.' }],
  nordic_hamstring_curl: [{ key: 'pop', limit: 8, reason: 'The catch-and-push-back-up at the end of the slow lowering is intentionally quick.' }],
  burpee: [
    { key: 'pop', limit: 18, reason: 'Explosive jump-in of the feet and jump at the end: smooth but several times faster than the median step.' },
    { key: 'rom.hip.flex', limit: 150, reason: 'Crouch with the hands on the floor before the kick-back is a deep hip fold (~150 degrees).' },
    { key: 'rom.knee.flex', limit: 145, reason: 'Same crouch: the knees are folded to ~145 degrees with the heels down.' },
  ],
  medicine_ball_slam: [
    { key: 'pop', limit: 10, reason: EXPLOSIVE },
    { key: 'rom.hip.flex', limit: 147, reason: 'The ball is slammed to the floor, which requires a deep hip fold (~145 degrees).' },
  ],
};
