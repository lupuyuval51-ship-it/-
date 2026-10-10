/**
 * GameRuntime: headless orchestration of one area — world + physics + interactions + pickups + checkpoints.
 * The React/three.js layer only renders it and forwards input; all rules live here (and are unit-tested).
 */
import { mechanicsForArea } from "../spec/mechanics";
import type { PublicSpec } from "../spec/public";
import { portalOpen, stationActive, stationDone, type ClientState } from "../state/progress";
import { buildWorld } from "../world/build";
import type { WorldModel } from "../world/types";
import { INTERACT_RADIUS, PICKUP_RADIUS } from "./constants";
import { WorldSim, type SimInput } from "./sim";

export type Interactable =
  | { kind: "station"; id: string; label: string; stationKind: "challenge" | "lore"; status: "active" | "locked" | "done"; x: number; z: number }
  | { kind: "npc"; id: string; label: string; x: number; z: number }
  | { kind: "portal"; id: string; label: string; open: boolean; x: number; z: number };

export interface RuntimeCallbacks {
  onNearbyChange?(target: Interactable | null): void;
  onCollect?(itemId: string): void;
  onCheckpoint?(id: string, pos: { x: number; y: number; z: number; yaw: number }): void;
  onRespawn?(reason: "fell" | "hazard"): void;
  onJump?(): void;
  onLand?(): void;
}

const NO_INPUT: SimInput = { moveX: 0, moveY: 0, jump: false, sprint: false };

export class GameRuntime {
  readonly spec: PublicSpec;
  readonly areaId: string;
  readonly world: WorldModel;
  readonly sim: WorldSim;
  client: ClientState;
  nearby: Interactable | null = null;
  paused = false;
  private cb: RuntimeCallbacks;
  private pendingCollect = new Set<string>();
  private currentCheckpoint: string | null = null;
  readonly jumpEnabled: boolean;

  constructor(spec: PublicSpec, areaId: string, client: ClientState, cb: RuntimeCallbacks = {}) {
    this.spec = spec;
    this.areaId = areaId;
    this.client = client;
    this.cb = cb;
    this.world = buildWorld(spec, areaId);
    const mech = mechanicsForArea(spec, areaId);
    // Platformer worlds always need jumping; elsewhere it is an opt-in mechanic.
    this.jumpEnabled = mech.has("jump") || this.world.hasVoid;
    this.sim = new WorldSim(this.world, { jumpEnabled: this.jumpEnabled, gateOpen: (id) => this.gateOpen(id) });
    const saved = client.areaId === areaId ? client.position : null;
    if (saved) {
      this.sim.teleport(saved.x, saved.y, saved.z);
      this.sim.player.yaw = saved.yaw;
      this.sim.player.grounded = false;
    }
    const cp = client.checkpoint && client.checkpoint.areaId === areaId ? client.checkpoint : null;
    if (cp) {
      this.sim.setCheckpoint({ x: cp.x, y: cp.y, z: cp.z });
      this.currentCheckpoint = cp.id;
    }
  }

  setClientState(client: ClientState): void {
    this.client = client;
    for (const id of client.collected) this.pendingCollect.delete(id);
  }

  gateOpen(gateId: string): boolean {
    const gate = this.world.gates.find((g) => g.id === gateId);
    if (!gate) return true;
    return gate.opensWhenStationsDone.every((sid) => stationDone(this.client, sid));
  }

  isCollected(itemId: string): boolean {
    return this.client.collected.includes(itemId) || this.pendingCollect.has(itemId);
  }

  private computeNearby(): Interactable | null {
    const p = this.sim.player;
    let best: { d: number; t: Interactable } | null = null;
    const consider = (d: number, dy: number, t: Interactable) => {
      if (d > INTERACT_RADIUS || Math.abs(dy) > 2.6) return;
      if (!best || d < best.d) best = { d, t };
    };
    const area = this.spec.areas.find((a) => a.id === this.areaId)!;
    for (const s of this.world.stations) {
      const def = area.stations.find((x) => x.id === s.stationId)!;
      const done = stationDone(this.client, s.stationId);
      const status = done ? "done" : stationActive(this.spec, this.client, def) ? "active" : "locked";
      consider(Math.hypot(p.x - s.x, p.z - s.z), p.y - s.y, { kind: "station", id: s.stationId, label: s.label, stationKind: s.kind, status, x: s.x, z: s.z });
    }
    for (const n of this.world.npcs) consider(Math.hypot(p.x - n.x, p.z - n.z), p.y - n.y, { kind: "npc", id: n.npcId, label: n.name, x: n.x, z: n.z });
    const portal = this.world.portal;
    if (portal) {
      consider(Math.hypot(p.x - portal.x, p.z - portal.z), p.y - portal.y, {
        kind: "portal", id: portal.toAreaId, label: portal.label, open: portalOpen(this.spec, this.client, area), x: portal.x, z: portal.z,
      });
    }
    return best ? (best as { d: number; t: Interactable }).t : null;
  }

  update(dt: number, input: SimInput = NO_INPUT, camYaw = 0): void {
    if (this.paused) return;
    const ev = this.sim.step(dt, input, camYaw);
    if (ev.jumped) this.cb.onJump?.();
    if (ev.landed) this.cb.onLand?.();
    if (ev.respawned) this.cb.onRespawn?.(ev.respawned);
    const p = this.sim.player;

    for (const c of this.world.collectibles) {
      if (this.isCollected(c.itemId)) continue;
      if (Math.hypot(p.x - c.x, p.z - c.z) <= PICKUP_RADIUS && Math.abs(p.y + 0.8 - c.y) <= 1.7) {
        this.pendingCollect.add(c.itemId);
        this.cb.onCollect?.(c.itemId);
      }
    }
    for (const cp of this.world.checkpoints) {
      if (cp.checkpointId === this.currentCheckpoint) continue;
      if (Math.hypot(p.x - cp.x, p.z - cp.z) <= 2.2 && Math.abs(p.y - cp.y) <= 1.5) {
        this.currentCheckpoint = cp.checkpointId;
        this.sim.setCheckpoint({ x: cp.x, y: cp.y, z: cp.z });
        this.cb.onCheckpoint?.(cp.checkpointId, { x: cp.x, y: cp.y, z: cp.z, yaw: p.yaw });
      }
    }

    const next = this.computeNearby();
    const changed = next?.kind !== this.nearby?.kind || next?.id !== this.nearby?.id || (next?.kind === "station" && this.nearby?.kind === "station" && next.status !== this.nearby.status);
    this.nearby = next;
    if (changed) this.cb.onNearbyChange?.(next);
  }

  /** Re-evaluate what is in reach after state changed (e.g. a station became done). */
  refreshNearby(): void {
    const next = this.computeNearby();
    this.nearby = next;
    this.cb.onNearbyChange?.(next);
  }

  /** Position snapshot for autosave / resume. */
  snapshot(): { x: number; y: number; z: number; yaw: number } {
    const p = this.sim.player;
    return { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
  }
}
