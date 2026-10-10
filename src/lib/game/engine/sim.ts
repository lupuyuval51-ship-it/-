/**
 * Headless character simulation: movement, collision, jumping, moving platforms, gates, hazards, void.
 * No DOM, no three.js — it runs in the browser's render loop and in plain Node tests alike.
 *
 * Coordinates: x east, y up, z south. Yaw 0 faces −z; forward = (−sin yaw, −cos yaw).
 */
import type { WorldBox, WorldModel } from "../world/types";
import {
  GRAVITY, JUMP_VELOCITY, PLAYER_HEIGHT, PLAYER_RADIUS, SPRINT_SPEED, STEP_UP, SUPPORT_MARGIN, TERMINAL_VELOCITY, WALK_SPEED,
} from "./constants";

export interface SimInput {
  /** −1 (left) … 1 (right), relative to the camera. */
  moveX: number;
  /** −1 (back) … 1 (forward), relative to the camera. */
  moveY: number;
  jump: boolean;
  sprint: boolean;
}

export interface PlayerState {
  x: number; y: number; z: number;
  vy: number;
  /** Facing direction of the avatar. */
  yaw: number;
  grounded: boolean;
  standingOn: string | null;
  speed: number;
}

export interface StepEvents {
  jumped: boolean;
  landed: boolean;
  respawned: null | "fell" | "hazard";
}

export interface SimOptions {
  jumpEnabled: boolean;
  gateOpen: (gateId: string) => boolean;
}

const SUBSTEP = 1 / 90;

export class WorldSim {
  readonly world: WorldModel;
  player: PlayerState;
  time = 0;
  private opts: SimOptions;
  private live: WorldBox[];
  private liveMovers: { base: WorldBox; box: WorldBox }[] = [];
  private checkpoint: { x: number; y: number; z: number } | null = null;

  constructor(world: WorldModel, opts: SimOptions) {
    this.world = world;
    this.opts = opts;
    this.live = world.boxes.map((b) => (b.mover ? { ...b } : b));
    this.liveMovers = world.boxes.flatMap((base, i) => (base.mover ? [{ base, box: this.live[i]! }] : []));
    this.player = this.freshPlayer(world.spawn.x, world.spawn.y, world.spawn.z, world.spawn.yaw);
    this.applyMovers(0);
  }

  private freshPlayer(x: number, y: number, z: number, yaw: number): PlayerState {
    return { x, y, z, vy: 0, yaw, grounded: true, standingOn: null, speed: 0 };
  }

  setOptions(opts: Partial<SimOptions>): void {
    this.opts = { ...this.opts, ...opts };
  }
  setCheckpoint(p: { x: number; y: number; z: number } | null): void {
    this.checkpoint = p;
  }
  teleport(x: number, y: number, z: number): void {
    this.player = { ...this.player, x, y, z, vy: 0, grounded: false, standingOn: null };
  }

  /** Current mover offsets applied to live boxes. */
  private applyMovers(t: number): void {
    for (const { base, box } of this.liveMovers) {
      const m = base.mover!;
      const off = m.amplitude * Math.sin((2 * Math.PI * t) / m.period + m.phase);
      if (m.axis === "x") {
        box.x0 = base.x0 + off;
        box.x1 = base.x1 + off;
      } else {
        box.z0 = base.z0 + off;
        box.z1 = base.z1 + off;
      }
    }
  }
  private moverOffset(id: string, t: number): number {
    const base = this.liveMovers.find((m) => m.base.id === id)?.base;
    if (!base?.mover) return 0;
    return base.mover.amplitude * Math.sin((2 * Math.PI * t) / base.mover.period + base.mover.phase);
  }

  boxes(): readonly WorldBox[] {
    return this.live;
  }

  private blocksHorizontally(b: WorldBox, feetY: number): boolean {
    if (!b.solid) return false;
    if (b.kind === "gate" && b.gateId && this.opts.gateOpen(b.gateId)) return false;
    return b.y1 > feetY + STEP_UP && b.y0 < feetY + PLAYER_HEIGHT;
  }

  /** Highest walkable surface under (x, z) that is no higher than maxTop; null when there is none. */
  supportHeight(x: number, z: number, maxTop: number): { top: number; id: string } | null {
    let best: { top: number; id: string } | null = null;
    for (const b of this.live) {
      if (!b.walkable) continue;
      if (b.kind === "gate" && b.gateId && !this.opts.gateOpen(b.gateId)) continue;
      if (x < b.x0 - SUPPORT_MARGIN || x > b.x1 + SUPPORT_MARGIN || z < b.z0 - SUPPORT_MARGIN || z > b.z1 + SUPPORT_MARGIN) continue;
      if (b.y1 > maxTop) continue;
      if (!best || b.y1 > best.top) best = { top: b.y1, id: b.id };
    }
    return best;
  }

  private resolveHorizontal(): void {
    const p = this.player;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const b of this.live) {
        if (!this.blocksHorizontally(b, p.y)) continue;
        const nx = Math.max(b.x0, Math.min(p.x, b.x1));
        const nz = Math.max(b.z0, Math.min(p.z, b.z1));
        let dx = p.x - nx;
        let dz = p.z - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= PLAYER_RADIUS * PLAYER_RADIUS) continue;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          const push = PLAYER_RADIUS - d;
          dx /= d;
          dz /= d;
          p.x += dx * push;
          p.z += dz * push;
        } else {
          // Centre is inside the box: leave through the nearest face.
          const l = p.x - b.x0, r = b.x1 - p.x, t = p.z - b.z0, bt = b.z1 - p.z;
          const m = Math.min(l, r, t, bt);
          if (m === l) p.x = b.x0 - PLAYER_RADIUS;
          else if (m === r) p.x = b.x1 + PLAYER_RADIUS;
          else if (m === t) p.z = b.z0 - PLAYER_RADIUS;
          else p.z = b.z1 + PLAYER_RADIUS;
        }
        moved = true;
      }
      if (!moved) break;
    }
  }

  respawn(reason: "fell" | "hazard"): StepEvents["respawned"] {
    const c = this.checkpoint;
    const s = this.world.spawn;
    this.player = this.freshPlayer(c?.x ?? s.x, c?.y ?? s.y, c?.z ?? s.z, this.player.yaw);
    return reason;
  }

  step(dt: number, input: SimInput, camYaw: number): StepEvents {
    const events: StepEvents = { jumped: false, landed: false, respawned: null };
    let remaining = Math.min(dt, 0.1);
    let jumpRequest = input.jump;
    while (remaining > 1e-6) {
      const h = Math.min(SUBSTEP, remaining);
      remaining -= h;
      this.substep(h, input, camYaw, jumpRequest, events);
      jumpRequest = false;
      if (events.respawned) break;
    }
    return events;
  }

  private substep(h: number, input: SimInput, camYaw: number, jump: boolean, events: StepEvents): void {
    const p = this.player;
    const prevT = this.time;
    this.time += h;
    // Carry the player with the moving platform they stand on.
    if (p.standingOn && this.liveMovers.some((m) => m.base.id === p.standingOn)) {
      const base = this.liveMovers.find((m) => m.base.id === p.standingOn)!.base;
      const delta = this.moverOffset(base.id, this.time) - this.moverOffset(base.id, prevT);
      if (base.mover!.axis === "x") p.x += delta;
      else p.z += delta;
    }
    this.applyMovers(this.time);

    // Horizontal intent (camera-relative), arcade-style instant response.
    let ix = input.moveX;
    let iy = input.moveY;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }
    const base = input.sprint ? SPRINT_SPEED : WALK_SPEED;
    const fx = -Math.sin(camYaw);
    const fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw);
    const rz = -Math.sin(camYaw);
    // (ix, iy) has magnitude ≤ 1, so analog sticks give proportional speed and keyboards give full speed.
    const vx = (fx * iy + rx * ix) * base;
    const vz = (fz * iy + rz * ix) * base;
    p.speed = Math.hypot(vx, vz);
    if (p.speed > 0.2) {
      const target = Math.atan2(-vx, -vz);
      let diff = target - p.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.yaw += diff * Math.min(1, h * 14);
    }

    if (jump && p.grounded && this.opts.jumpEnabled) {
      p.vy = JUMP_VELOCITY;
      p.grounded = false;
      p.standingOn = null;
      events.jumped = true;
    }

    p.x += vx * h;
    p.z += vz * h;
    this.resolveHorizontal();

    // Vertical motion.
    p.vy = Math.max(TERMINAL_VELOCITY, p.vy - GRAVITY * h);
    const prevY = p.y;
    let ny = p.y + p.vy * h;
    const wasGrounded = p.grounded;
    const support = this.supportHeight(p.x, p.z, prevY + STEP_UP);
    if (p.vy <= 0 && support && ny <= support.top + 1e-4) {
      ny = support.top;
      if (!wasGrounded && p.vy < -4) events.landed = true;
      p.vy = 0;
      p.grounded = true;
      p.standingOn = support.id;
    } else {
      // Head bump against a ceiling/underside of a platform.
      if (p.vy > 0) {
        for (const b of this.live) {
          if (!b.solid || b.kind === "bounds") continue;
          if (p.x < b.x0 - PLAYER_RADIUS * 0.5 || p.x > b.x1 + PLAYER_RADIUS * 0.5 || p.z < b.z0 - PLAYER_RADIUS * 0.5 || p.z > b.z1 + PLAYER_RADIUS * 0.5) continue;
          if (b.y0 >= prevY + PLAYER_HEIGHT - 1e-4 && b.y0 < ny + PLAYER_HEIGHT) {
            ny = b.y0 - PLAYER_HEIGHT;
            p.vy = 0;
            break;
          }
        }
      }
      p.grounded = false;
      p.standingOn = null;
    }
    p.y = ny;

    // Keep inside the playable bounds (the void layout simply has generous bounds).
    const bd = this.world.bounds;
    p.x = Math.max(bd.x0 + PLAYER_RADIUS, Math.min(bd.x1 - PLAYER_RADIUS, p.x));
    p.z = Math.max(bd.z0 + PLAYER_RADIUS, Math.min(bd.z1 - PLAYER_RADIUS, p.z));

    for (const hz of this.world.hazards) {
      if (p.x > hz.x0 - PLAYER_RADIUS * 0.6 && p.x < hz.x1 + PLAYER_RADIUS * 0.6 && p.z > hz.z0 - PLAYER_RADIUS * 0.6 && p.z < hz.z1 + PLAYER_RADIUS * 0.6 && p.y < hz.y + 0.35) {
        events.respawned = this.respawn("hazard");
        return;
      }
    }
    if (p.y < this.world.killY) events.respawned = this.respawn("fell");
  }
}
