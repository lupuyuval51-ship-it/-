/**
 * Dynamic quality fallback. When frame time stays high the renderer steps down a fixed ladder (cheapest, least
 * visible savings first) instead of only shrinking the resolution. Pure and deterministic: the governor consumes
 * frame times, `degradeProfile` maps a level to a profile that is never better than the tier it started from.
 * The ladder only goes down during a session; the server-granted tier is the ceiling and is never exceeded.
 */
import type { RenderProfile } from "@/config/graphics";

export const MAX_QUALITY_LEVEL = 4;

/** Multiplier on the pixel ratio per level (the Loop clamps the result to the profile's own pixel ratio). */
export const DPR_SCALE: readonly number[] = [1, 0.85, 0.75, 0.7, 0.6];
export const MIN_DPR = 0.6;

const min = (a: number, b: number) => Math.min(a, b);

/**
 * The profile to render at a fallback level. Level 0 is the profile itself. Every field of the result is less than or
 * equal to the input (booleans only switch off, counts only shrink), which the unit tests assert for every tier.
 */
export function degradeProfile(base: RenderProfile, level: number): RenderProfile {
  const l = Math.max(0, Math.min(MAX_QUALITY_LEVEL, Math.floor(level)));
  if (l === 0) return base;
  const p: RenderProfile = {
    ...base,
    shadows: { ...base.shadows },
    particles: { ...base.particles },
    limits: { ...base.limits },
  };
  // 1: effects that cost fill-rate and per-frame work but carry little information
  p.glow = false;
  p.particles.trails = false;
  p.particles.ambient = Math.floor(base.particles.ambient * 0.5);
  p.particles.burst = Math.ceil(base.particles.burst * 0.5);
  if (l >= 2) {
    // 2: lighting. Shadow pass and per-accent point lights are the heaviest fragment cost after resolution.
    p.shadows = { enabled: false, type: "none", mapSize: 0, casters: 0 };
    p.accentLights = 0;
  }
  if (l >= 3) {
    // 3: scenery that is not solid (no collision, no gameplay meaning) and the water layers
    p.environmentDetail = 0;
    p.limits.looseDecor = 0;
    p.limits.skylineMin = min(base.limits.skylineMin, 0.2);
    p.limits.skylinePieces = min(base.limits.skylinePieces, 12);
    p.limits.lifeScale = min(base.limits.lifeScale, 0.34);
    p.limits.water = 0;
    p.particles.ambient = 0;
  }
  if (l >= 4) {
    // 4: last resort: no ambient life, minimum skyline, tiny burst pool (never larger than the previous level)
    p.limits.lifeScale = 0;
    p.limits.skylinePieces = min(base.limits.skylinePieces, 6);
    p.particles.burst = min(p.particles.burst, 2);
  }
  return p;
}

/** The pixel ratio the governor chose for one canvas (identified by `key`, so a new canvas starts from its own default). */
export interface GovernedDpr {
  key: string;
  dpr: number;
}

/**
 * The pixel ratio to hand to the canvas as a plain number, or null to use the profile's own range.
 * react-three-fiber re-applies the `dpr` prop every time the canvas re-renders; when the prop is still the profile's
 * range, the first toast or score change after a step-down would silently put the full resolution back, and the
 * governor (which never steps up) would not notice. Handing the chosen number back keeps the step-down.
 */
export function governedDprFor(governed: GovernedDpr | null, key: string): number | null {
  return governed !== null && governed.key === key && Number.isFinite(governed.dpr) && governed.dpr > 0 ? governed.dpr : null;
}

/** The pixel ratio for a fallback level: the profile's ratio on this screen scaled by the level's step, never below `MIN_DPR`. */
export function dprForLevel(base: number, level: number): number {
  return Math.max(MIN_DPR, base * (DPR_SCALE[level] ?? 1));
}

/**
 * The lowest quality level each tier has been pushed to in this app session. Every canvas starts from it (another area builds a
 * new canvas, and so does a replay or the next game), so a slow phone does not climb the ladder again: with a 1.5 s warm-up and
 * 2 s windows, every step is 3 to 6 seconds of poor frames. The ladder still only goes down, and on a device that holds the
 * frame rate the level stays 0. Kept per tier, because the ceiling (and so the cost of a level) differs between tiers.
 */
const reachedLevel = new Map<string, number>();

export function rememberedLevel(tier: string): number {
  return reachedLevel.get(tier) ?? 0;
}

/** Remember that `tier` had to step down to `level`. Never raises quality: a lower level than the remembered one is ignored. */
export function rememberLevel(tier: string, level: number): void {
  const l = Math.min(MAX_QUALITY_LEVEL, Math.floor(level));
  if (l > rememberedLevel(tier)) reachedLevel.set(tier, l);
}

/** Forget everything remembered (tests). */
export function forgetRememberedLevels(): void {
  reachedLevel.clear();
}

export interface GovernorOptions {
  /** Seconds ignored after start and after each step (shader compiles, buffer rebuilds, first paint). */
  warmup?: number;
  /** Seconds per measurement window. */
  window?: number;
  /** Mean frame time (s) above which a window counts as slow (default 1/28 s, i.e. below 28 fps). */
  slow?: number;
  /** Mean frame time (s) that steps down after a single window (default 1/15 s). */
  critical?: number;
  /** Consecutive slow windows required before stepping down. */
  windowsToStep?: number;
  /** Frames longer than this (tab switch, GC, debugger) are not counted. */
  ignoreAbove?: number;
  startLevel?: number;
}

/**
 * Feed it every frame's delta time. `push` returns the new level when it steps down, otherwise null.
 * It never steps up: flapping between levels costs more (rebuilds) than it helps, and a device that was slow once
 * in a session will be slow again.
 */
export class FrameGovernor {
  level: number;
  private readonly warmup: number;
  private readonly window: number;
  private readonly slow: number;
  private readonly critical: number;
  private readonly windowsToStep: number;
  private readonly ignoreAbove: number;
  private skip: number;
  private t = 0;
  private n = 0;
  private slowRun = 0;

  constructor(opts: GovernorOptions = {}) {
    this.warmup = opts.warmup ?? 1.5;
    this.window = opts.window ?? 2;
    this.slow = opts.slow ?? 1 / 28;
    this.critical = opts.critical ?? 1 / 15;
    this.windowsToStep = opts.windowsToStep ?? 2;
    this.ignoreAbove = opts.ignoreAbove ?? 0.25;
    this.level = Math.max(0, Math.min(MAX_QUALITY_LEVEL, opts.startLevel ?? 0));
    this.skip = this.warmup;
  }

  push(dt: number): number | null {
    if (!(dt > 0) || dt > this.ignoreAbove) return null;
    if (this.skip > 0) {
      this.skip -= dt;
      return null;
    }
    this.t += dt;
    this.n += 1;
    if (this.t < this.window) return null;
    const mean = this.t / this.n;
    this.t = 0;
    this.n = 0;
    if (mean > this.slow) this.slowRun += 1;
    else this.slowRun = 0;
    const step = this.level < MAX_QUALITY_LEVEL && (mean > this.critical || this.slowRun >= this.windowsToStep);
    if (!step) return null;
    this.level += 1;
    this.slowRun = 0;
    this.skip = this.warmup;
    return this.level;
  }
}
