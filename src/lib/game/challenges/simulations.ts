/** Deterministic physics for the "simulation" challenge. Pure functions shared by grader, validator and UI. */
import type { SimulationChallenge } from "../spec/schema";

export type ProjectileSim = Extract<SimulationChallenge["sim"], { kind: "projectile" }>;
export type LeverSim = Extract<SimulationChallenge["sim"], { kind: "lever" }>;

export const ANGLE_RANGE = { min: 5, max: 85 } as const;

/** Horizontal range (m) of a projectile launched from ground level. */
export function projectileRange(speed: number, angleDeg: number, gravity: number): number {
  const a = (angleDeg * Math.PI) / 180;
  return (speed * speed * Math.sin(2 * a)) / gravity;
}

/** Sampled trajectory for drawing the arc. */
export function projectilePath(speed: number, angleDeg: number, gravity: number, samples = 40): { x: number; y: number }[] {
  const a = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(a);
  const vy = speed * Math.sin(a);
  const flight = (2 * vy) / gravity;
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (flight * i) / samples;
    return { x: vx * t, y: vy * t - 0.5 * gravity * t * t };
  });
}

export function projectileSolvable(sim: ProjectileSim): boolean {
  return projectileRange(sim.maxSpeed, 45, sim.gravity) + sim.tolerance >= sim.targetDistance;
}
/** A reference solution: 45° launch with exactly the speed that lands on the target. */
export function projectileSolution(sim: ProjectileSim): { angle: number; speed: number } {
  return { angle: 45, speed: Math.round(Math.sqrt(sim.targetDistance * sim.gravity) * 100) / 100 };
}

/** Distance from the pivot at which the right weight balances the lever. */
export function leverBalanceDistance(sim: LeverSim): number {
  return (sim.leftWeight * sim.leftDistance) / sim.rightWeight;
}
/** Where the player's slider starts (SimulationPanel): it cannot be set any closer to the pivot than this. */
export const LEVER_SLIDER_MIN = 0.5;
export function leverSolvable(sim: LeverSim): boolean {
  const d = leverBalanceDistance(sim);
  // the slider must also be able to get within the tolerance of the balance point (the same test the grader applies)
  return d >= 0.2 && d <= sim.maxDistance && (d >= LEVER_SLIDER_MIN || LEVER_SLIDER_MIN - d <= sim.tolerance);
}
/** Net torque (left − right); sign drives the seesaw tilt in the UI. */
export function leverTorque(sim: LeverSim, rightDistance: number): number {
  return sim.leftWeight * sim.leftDistance - sim.rightWeight * rightDistance;
}
