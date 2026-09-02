type Point = { x: number; z: number };
type Cover = Point & { width: number; depth: number };

/** A shot locks its direction during the warning, giving a real opportunity to dodge. */
export type AttackWindup = { remaining: number; duration: number; direction: Point; distance: number };

export function createAttackWindup(from: Point, target: Point, duration = .82): AttackWindup {
  const distance = Math.hypot(target.x - from.x, target.z - from.z);
  return {
    remaining: duration,
    duration,
    direction: distance > 0 ? { x: (target.x - from.x) / distance, z: (target.z - from.z) / distance } : { x: 0, z: -1 },
    distance,
  };
}

export function advanceAttackWindup(windup: AttackWindup, delta: number): { next: AttackWindup; fire: boolean; progress: number } {
  const remaining = Math.max(0, windup.remaining - Math.max(0, delta));
  return { next: { ...windup, remaining }, fire: windup.remaining > 0 && remaining === 0, progress: Math.min(1, 1 - remaining / windup.duration) };
}

/** First expanded cover boundary on a segment; also used to stop the visible aiming guide. */
export function firstCoverImpact(from: Point, to: Point, covers: Cover[], padding = .13): Point | null {
  let nearest = Infinity;
  const dx = to.x - from.x, dz = to.z - from.z;
  for (const cover of covers) {
    let enter = 0, leave = 1;
    for (const [origin, direction, center, half] of [
      [from.x, dx, cover.x, cover.width / 2 + padding],
      [from.z, dz, cover.z, cover.depth / 2 + padding],
    ]) {
      if (Math.abs(direction) < 1e-9) {
        if (origin < center - half || origin > center + half) { leave = -1; break; }
      } else {
        const a = (center - half - origin) / direction, b = (center + half - origin) / direction;
        enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
      }
    }
    if (enter <= leave && leave >= 0 && enter <= 1) nearest = Math.min(nearest, enter);
  }
  return Number.isFinite(nearest) ? { x: from.x + dx * nearest, z: from.z + dz * nearest } : null;
}

export function turnToward(current: number, target: number, smoothing: number): number {
  const shortest = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + shortest * Math.max(0, Math.min(1, smoothing));
}
